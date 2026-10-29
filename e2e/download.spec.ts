import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

test.use({ timezoneId: "Asia/Seoul" });

const editor = (page: Page) => page.getByRole("textbox", { name: "Mermaid 소스" });
const button = (page: Page) => page.getByRole("button", { name: "PNG 다운로드" });
const svg = (page: Page) => page.locator(".diagram-content svg");
const source = "flowchart LR\n A[한글 아이디어] --> B[이미지 저장]";

async function download(page: Page) {
  const pending = page.waitForEvent("download");
  await button(page).click();
  const file = await pending;
  expect(file.suggestedFilename()).toMatch(/^inklava-\d{8}-\d{6}\.png$/);
  expect(await file.failure()).toBeNull();
  const bytes = await readFile((await file.path())!);
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  return { bytes, file, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("downloads the full PNG independent of the camera and preserves the last good result", async ({
  page,
}, testInfo) => {
  await page.clock.setFixedTime(new Date("2026-10-28T15:03:07Z"));
  await page.goto("/");
  await editor(page).fill(source);
  await expect(svg(page)).toContainText("이미지 저장");
  const dimensions = await svg(page).evaluate((element) => ({
    width: Number(element.getAttribute("width")),
    height: Number(element.getAttribute("height")),
  }));
  const first = await download(page);
  expect(first.file.suggestedFilename()).toBe("inklava-20261029-000307.png");
  expect(first.width).toBe(Math.ceil(dimensions.width * 2));
  expect(first.height).toBe(Math.ceil(dimensions.height * 2));
  await first.file.saveAs(testInfo.outputPath("inklava.png"));
  const pixels = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let ink = 0;
    let transparent = 0;
    for (let index = 0; index < data.length; index += 4) {
      if (data[index] < 220 && data[index + 1] < 220 && data[index + 2] < 220) ink++;
      if (data[index + 3] !== 255) transparent++;
    }
    return { corner: Array.from(data.subarray(0, 4)), ink, transparent };
  }, first.bytes.toString("base64"));
  expect(pixels.corner).toEqual([255, 255, 255, 255]);
  expect(pixels.ink).toBeGreaterThan(100);
  expect(pixels.transparent).toBe(0);

  const surface = page.getByRole("region", { name: "다이어그램 탐색" });
  await surface.dispatchEvent("wheel", { deltaY: -200, ctrlKey: true });
  await surface.dispatchEvent("wheel", { deltaX: 2000, deltaY: 1000 });
  const second = await download(page);
  expect(second.bytes.equals(first.bytes)).toBe(true);
  await editor(page).fill("not a diagram");
  await expect(page.locator(".stale-indicator")).toBeVisible();
  expect((await download(page)).bytes.equals(first.bytes)).toBe(true);
});

test("disables download without a rendered result and keeps the mobile toolbar in bounds", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("inklava:source", ""));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(button(page)).toBeDisabled();
  await editor(page).fill("not a diagram");
  await expect(page.locator(".source-feedback .error")).toBeVisible();
  await expect(button(page)).toBeDisabled();
  await editor(page).fill(source);
  await expect(svg(page)).toBeVisible();
  await expect(button(page)).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const panel = (await page.locator(".preview-panel").boundingBox())!;
  const control = (await button(page).boundingBox())!;
  expect(control.x + control.width).toBeLessThanOrEqual(panel.x + panel.width);
  await download(page);
  await editor(page).fill("");
  await expect(svg(page)).toHaveCount(0);
  await expect(button(page)).toBeDisabled();
});

test("reports encoding failures and allows retry without breaking the preview", async ({
  page,
}) => {
  await page.goto("/");
  await editor(page).fill(source);
  await expect(svg(page)).toContainText("이미지 저장");
  await page.evaluate(() => {
    const original = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "toBlob")!;
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", original);
      callback(null);
    };
  });
  await button(page).click();
  await expect(page.getByRole("alert")).toHaveText(
    "PNG를 저장하지 못했습니다. 다시 시도해 주세요.",
  );
  await expect(button(page)).toBeEnabled();
  await expect(svg(page)).toContainText("이미지 저장");
  await download(page);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("bounds large PNG dimensions while keeping the full diagram aspect ratio", async ({
  page,
}) => {
  await page.goto("/");
  await editor(page).fill(
    `flowchart LR\n${Array.from({ length: 80 }, (_, index) => `N${index} --> N${index + 1}`).join("\n")}`,
  );
  await expect(svg(page)).toContainText("N80");
  const dimensions = await svg(page).evaluate((element) => ({
    width: Number(element.getAttribute("width")),
    height: Number(element.getAttribute("height")),
  }));
  expect(dimensions.width).toBeGreaterThan(4096);
  const png = await download(page);
  expect(png.width).toBe(4096);
  expect(png.height).toBe(Math.ceil((dimensions.height * 4096) / dimensions.width));
});
