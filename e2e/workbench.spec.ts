import { expect, test, type Page } from "@playwright/test";

const editor = (page: Page) => page.getByRole("textbox", { name: "Mermaid 소스" });
const surface = (page: Page) => page.getByRole("region", { name: "다이어그램 탐색" });
const svg = (page: Page) => page.locator(".diagram-content svg");
const camera = (page: Page) =>
  page.locator(".diagram-content").evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return { x: matrix.e, y: matrix.f, scale: matrix.a };
  });
const flowchart = "flowchart LR\n A[Hello] --> B[World]";

async function compositionInput(page: Page, source: string) {
  await editor(page).evaluate((element, source) => {
    element.replaceChildren(
      ...source.split("\n").map((text) => {
        const line = document.createElement("div");
        line.className = "cm-line";
        line.textContent = text;
        return line;
      }),
    );
    const selection = document.getSelection()!;
    selection.selectAllChildren(element.lastChild!);
    selection.collapseToEnd();
    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertCompositionText",
        isComposing: true,
        data: source,
      }),
    );
  }, source);
}

test("renders supported diagrams, keeps last good SVG on errors, and clears empty input", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("header")).toHaveText("Inklava");
  await expect(svg(page)).toBeVisible();
  await editor(page).fill(flowchart);
  await expect(svg(page)).toContainText("Hello");
  const good = await svg(page).evaluate((element) => element.outerHTML);
  await editor(page).fill("not a diagram <script>alert('x')</script>");
  await expect(page.locator(".stale-indicator")).toBeVisible();
  await expect(page.locator(".source-feedback .error")).toBeVisible();
  expect(await svg(page).evaluate((element) => element.outerHTML)).toBe(good);
  await editor(page).fill("sequenceDiagram\n Alice->>Bob: Hello there");
  await expect(svg(page)).toContainText("Hello there");
  await expect(page.locator(".stale-indicator")).toHaveCount(0);
  await editor(page).fill("erDiagram\n CUSTOMER ||--o{ ORDER : places");
  await expect(svg(page)).toContainText("CUSTOMER");
  await editor(page).fill("");
  await expect(svg(page)).toHaveCount(0);
  await expect(page.getByText("Mermaid 소스를 입력해 보세요.")).toBeVisible();
});

test("restores an explicitly empty draft and saves the latest edit on pagehide", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("inklava:source", ""));
  await page.goto("/");
  await expect(editor(page).locator(".cm-placeholder")).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("inklava:source"))).toBe("");
  await expect(svg(page)).toHaveCount(0);
  await editor(page).fill(flowchart);
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  expect(await page.evaluate(() => localStorage.getItem("inklava:source"))).toBe(flowchart);
});

test("restores a saved nonempty draft on reload", async ({ page }) => {
  await page.goto("/");
  await editor(page).fill(flowchart);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("inklava:source")))
    .toBe(flowchart);
  await page.reload();
  await expect(editor(page)).toHaveText(flowchart);
  await expect(svg(page)).toContainText("Hello");
});

test("storage denial leaves editing and rendering available", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page.goto("/");
  await expect(page.getByText(/초안을 브라우저에 저장할 수 없습니다/)).toBeVisible();
  await editor(page).fill(flowchart);
  await expect(svg(page)).toContainText("Hello");
});

test("composition cancels an earlier render and waits for compositionend", async ({ page }) => {
  await page.goto("/");
  await expect(svg(page)).toBeVisible();
  await editor(page).fill(flowchart);
  await editor(page).dispatchEvent("compositionstart");
  await compositionInput(page, "flowchart LR\n A[한글 입력] --> B[완료]");
  await page.waitForTimeout(350);
  await expect(svg(page)).not.toContainText("한글 입력");
  await expect(svg(page)).not.toContainText("Hello");
  await editor(page).dispatchEvent("compositionend");
  await expect(svg(page)).toContainText("한글 입력");
});

test("a final composition mutation after compositionend reaches preview and storage", async ({
  page,
}) => {
  await page.goto("/");
  await expect(svg(page)).toBeVisible();
  await editor(page).dispatchEvent("compositionstart");
  await compositionInput(page, "flowchart LR\n A[조합 중] --> B[대기]");
  await editor(page).dispatchEvent("compositionend");
  const finalSource = "flowchart LR\n A[조합 완료] --> B[최종]";
  await editor(page).fill(finalSource);
  await expect(svg(page)).toContainText("조합 완료");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("inklava:source")))
    .toBe(finalSource);
});

test("wheel pan is normalized, modifier zoom anchors the pointer, and edits keep the camera", async ({
  page,
}) => {
  await page.goto("/");
  await expect(svg(page)).toBeVisible();
  await expect.poll(async () => (await camera(page)).x).not.toBe(0);
  const before = await camera(page);
  await surface(page).dispatchEvent("wheel", { deltaX: 2, deltaY: 3, deltaMode: 1 });
  await expect.poll(async () => (await camera(page)).x).toBeCloseTo(before.x - 32);
  const panned = await camera(page);
  expect(panned.y).toBeCloseTo(before.y - 48);
  const box = (await surface(page).boundingBox())!;
  const client = {
    x: Math.round(box.x + box.width * 0.3),
    y: Math.round(box.y + box.height * 0.4),
  };
  const pointer = { x: client.x - box.x, y: client.y - box.y };
  await surface(page).dispatchEvent("wheel", {
    deltaY: -35,
    ctrlKey: true,
    clientX: client.x,
    clientY: client.y,
  });
  await expect.poll(async () => (await camera(page)).scale).toBeGreaterThan(panned.scale);
  const zoomed = await camera(page);
  expect((pointer.x - zoomed.x) / zoomed.scale).toBeCloseTo(
    (pointer.x - panned.x) / panned.scale,
    3,
  );
  expect((pointer.y - zoomed.y) / zoomed.scale).toBeCloseTo(
    (pointer.y - panned.y) / panned.scale,
    3,
  );
  await editor(page).fill(flowchart);
  await expect(svg(page)).toContainText("Hello");
  expect(await camera(page)).toEqual(zoomed);
  await editor(page).dispatchEvent("wheel", { deltaY: 150, ctrlKey: true });
  expect(await camera(page)).toEqual(zoomed);
  await page.getByRole("button", { name: "100%", exact: true }).click();
  await expect.poll(async () => (await camera(page)).scale).toBe(1);
  const dimensions = await svg(page).evaluate((element) => ({
    expectedWidth: Number(element.getAttribute("width")),
    expectedHeight: Number(element.getAttribute("height")),
    width: element.getBoundingClientRect().width,
    height: element.getBoundingClientRect().height,
  }));
  expect(dimensions.width).toBeCloseTo(dimensions.expectedWidth, 2);
  expect(dimensions.height).toBeCloseTo(dimensions.expectedHeight, 2);
});

test("pointer capture, cancellation, keyboard and fit recover freely moved diagrams", async ({
  page,
}) => {
  await page.goto("/");
  await expect(svg(page)).toBeVisible();
  await expect.poll(async () => (await camera(page)).x).not.toBe(0);
  const box = (await surface(page).boundingBox())!;
  const before = await camera(page);
  await page.mouse.move(box.x + 120, box.y + 140);
  await page.mouse.down();
  await page.mouse.move(box.x + 220, box.y + 200);
  await page.mouse.up();
  await expect.poll(async () => (await camera(page)).x).toBeCloseTo(before.x + 100);
  expect((await camera(page)).y).toBeCloseTo(before.y + 60);
  await surface(page).press("ArrowRight");
  await expect.poll(async () => (await camera(page)).x).toBeCloseTo(before.x + 60);
  await surface(page).press("+");
  await expect.poll(async () => (await camera(page)).scale).toBeGreaterThan(before.scale);
  await surface(page).press("0");
  await expect.poll(() => camera(page)).toEqual(before);
  await page.mouse.down();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  const cancelled = await camera(page);
  await page.mouse.move(box.x + 350, box.y + 260);
  await page.mouse.up();
  expect(await camera(page)).toEqual(cancelled);
});

test("Safari gesture uses one zoom path and ignores simultaneous wheel", async ({ page }) => {
  await page.goto("/");
  await expect(svg(page)).toBeVisible();
  await page.getByRole("button", { name: "100%", exact: true }).click();
  await surface(page).evaluate((element) => {
    element.dispatchEvent(new Event("gesturestart", { cancelable: true }));
    const change = new Event("gesturechange", { cancelable: true });
    const box = element.getBoundingClientRect();
    Object.assign(change, { scale: 1.5, clientX: box.x + 100, clientY: box.y + 100 });
    element.dispatchEvent(change);
    element.dispatchEvent(
      new WheelEvent("wheel", { deltaY: -100, ctrlKey: true, cancelable: true }),
    );
    element.dispatchEvent(new Event("gestureend", { cancelable: true }));
  });
  await expect.poll(async () => (await camera(page)).scale).toBe(1.5);
});

test("resize keeps the world point at center and a hidden initial panel eventually fits", async ({
  page,
}) => {
  await page.route("http://127.0.0.1:5173/", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      "</head>",
      '<style id="hide-preview">.preview-panel { display: none !important; }</style></head>',
    );
    await route.fulfill({ response, body });
  });
  await page.goto("/");
  await expect(svg(page)).toHaveCount(1);
  expect(await camera(page)).toEqual({ x: 0, y: 0, scale: 1 });
  await page.locator("#hide-preview").evaluate((element) => element.remove());
  await expect(svg(page)).toBeVisible();
  await expect.poll(async () => (await camera(page)).x).not.toBe(0);
  const before = await camera(page);
  const firstBox = (await surface(page).boundingBox())!;
  await page.setViewportSize({ width: 1000, height: 800 });
  await expect
    .poll(async () => (await surface(page).boundingBox())?.width)
    .not.toBe(firstBox.width);
  const afterBox = (await surface(page).boundingBox())!;
  await expect
    .poll(async () => (await camera(page)).x)
    .toBeCloseTo(before.x + (afterBox.width - firstBox.width) / 2, 2);
  const after = await camera(page);
  expect(after.scale).toBe(before.scale);
  expect((afterBox.height / 2 - after.y) / after.scale).toBeCloseTo(
    (firstBox.height / 2 - before.y) / before.scale,
    2,
  );
});

test("unknown routes show a way back and the mobile layout stays usable", async ({ page }) => {
  await page.goto("/missing");
  await expect(page.getByText("페이지를 찾을 수 없습니다.")).toBeVisible();
  await page.getByRole("link", { name: "작업 화면으로 돌아가기" }).click();
  await expect(svg(page)).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "화면에 맞춤" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await editor(page).fill(flowchart);
  await expect(svg(page)).toContainText("Hello");
  const panelHeight = (await page.locator(".source-panel").boundingBox())!.height;
  const longSource = [flowchart, ...Array.from({ length: 120 }, () => "%% extra source line")].join(
    "\n",
  );
  await editor(page).fill(longSource);
  await expect
    .poll(async () => (await page.locator(".source-panel").boundingBox())!.height)
    .toBe(panelHeight);
  expect(
    await page
      .locator(".cm-scroller")
      .evaluate((element) => element.scrollHeight > element.clientHeight),
  ).toBe(true);
});

test("code editing keeps history, indents two spaces, searches and escapes Tab capture", async ({
  page,
}) => {
  await page.goto("/");
  await editor(page).fill(flowchart);
  await expect(svg(page)).toContainText("Hello");
  await expect(page.locator(".cm-lineNumbers")).toContainText("2");
  await editor(page).press("ControlOrMeta+End");
  await editor(page).press("Home");
  await editor(page).press("Tab");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("inklava:source")))
    .toBe("flowchart LR\n   A[Hello] --> B[World]");
  await editor(page).press("Shift+Tab");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("inklava:source")))
    .toBe(flowchart);
  await editor(page).press("ControlOrMeta+End");
  await editor(page).press("Shift+Home");
  await editor(page).pressSequentially("  A[Changed] --> B[Again]");
  await expect(svg(page)).toContainText("Changed");
  await editor(page).press("ControlOrMeta+z");
  await expect(svg(page)).toContainText("Hello");
  await editor(page).press("ControlOrMeta+Shift+z");
  await expect(svg(page)).toContainText("Changed");
  await editor(page).press("ControlOrMeta+f");
  const search = page.getByRole("textbox", { name: "Find", exact: true });
  await expect(search).toBeFocused();
  await search.pressSequentially("Changed");
  await search.press("Enter");
  await expect(page.locator(".cm-searchMatch-selected")).toHaveText("Changed");
  await search.press("Escape");
  await expect(editor(page)).toBeFocused();
  await editor(page).press("Escape");
  await editor(page).press("Tab");
  await expect(page.getByRole("separator", { name: "소스와 미리보기 너비 조절" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "축소" })).toBeFocused();
});

test("open search survives syntax errors, changed errors and recovery", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"));
  await page.goto("/");
  await page.clock.runFor(400);
  await expect(svg(page)).toBeVisible();

  await editor(page).fill("not a diagram diagram");
  await editor(page).press("ControlOrMeta+f");
  const find = page.getByRole("textbox", { name: "Find", exact: true });
  await find.pressSequentially("diagram");
  await page.clock.runFor(400);
  await expect(editor(page)).toHaveAttribute("aria-invalid", "true");
  const firstError = await page.locator(".source-feedback").textContent();
  await expectSearchUsable(page);

  await editor(page).fill("flowchart LR\n A[diagram] --> B[diagram");
  await find.focus();
  await page.clock.runFor(400);
  await expect(page.locator(".source-feedback")).not.toHaveText(firstError!);
  await expect(editor(page)).toHaveAttribute("aria-invalid", "true");
  await expectSearchUsable(page);

  await editor(page).fill("flowchart LR\n A[diagram] --> B[diagram]");
  await find.focus();
  await page.clock.runFor(400);
  await expect(editor(page)).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator(".source-feedback")).toHaveCount(0);
  await expect(svg(page)).toContainText("diagram");
  await expectSearchUsable(page);
});

test("open search survives a delayed draft storage failure", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"));
  await page.goto("/");
  await page.clock.runFor(400);
  await expect(svg(page)).toBeVisible();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });

  await editor(page).fill("flowchart LR\n A[diagram] --> B[diagram]");
  await editor(page).press("ControlOrMeta+f");
  await page.getByRole("textbox", { name: "Find", exact: true }).pressSequentially("diagram");
  await expect(page.locator(".source-feedback")).toHaveCount(0);
  await page.clock.runFor(400);
  await expect(page.getByText(/초안을 브라우저에 저장할 수 없습니다/)).toBeVisible();
  await expect(svg(page)).toContainText("diagram");
  await expectSearchUsable(page);
});

async function expectSearchUsable(page: Page) {
  const find = page.getByRole("textbox", { name: "Find", exact: true });
  await expect(page.locator(".cm-search")).toHaveCount(1);
  await expect(find).toHaveValue("diagram");
  await expect(find).toBeFocused();
  await find.press("Enter");
  const selected = page.locator(".cm-searchMatch-selected");
  await expect(selected).toHaveText("diagram");
  const firstMatch = await selected.boundingBox();
  await find.press("Enter");
  await expect(selected).toHaveText("diagram");
  await expect.poll(() => selected.boundingBox()).not.toEqual(firstMatch);
  await expect(find).toBeFocused();
}

test("source label focuses the editor and preserves its document and selection", async ({
  page,
}) => {
  await page.goto("/");
  await editor(page).fill(flowchart);
  await expect(svg(page)).toContainText("Hello");
  await editor(page).press("ControlOrMeta+Home");
  await editor(page).press("Shift+ArrowRight");
  await editor(page).press("Shift+ArrowRight");
  const selection = () =>
    page.evaluate(() => {
      const current = document.getSelection()!;
      return {
        text: current.toString(),
        anchor: current.anchorOffset,
        focus: current.focusOffset,
      };
    });
  const before = await selection();
  expect(before.text).toBe("fl");
  await page.getByRole("button", { name: "축소", exact: true }).focus();
  await expect(editor(page)).not.toBeFocused();
  await page.locator("#source-title").click();
  await expect(editor(page)).toBeFocused();
  expect(await selection()).toEqual(before);
  await expect(editor(page)).toHaveText(flowchart);
  await page.locator("#source-title").click();
  await expect(editor(page)).toBeFocused();
  expect(await selection()).toEqual(before);
});

test("long source scrolls on both axes without wrapping or expanding the panel", async ({
  page,
}) => {
  await page.goto("/");
  await editor(page).fill(
    `flowchart LR\n A["${"긴 설명 ".repeat(100)}"] --> B\n${"%% extra line\n".repeat(150)}`,
  );
  await editor(page).press("ControlOrMeta+Home");
  const scroller = page.locator(".cm-scroller");
  await expect
    .poll(() => scroller.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  expect(await scroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
    true,
  );
  // Read both rectangles in one frame while CodeMirror settles its scroll and layout.
  await expect
    .poll(() =>
      scroller.evaluate((element) => {
        const line = element.querySelectorAll(".cm-content .cm-line")[1]?.getBoundingClientRect();
        const number = [...element.querySelectorAll(".cm-lineNumbers .cm-gutterElement")]
          .find((gutter) => gutter.textContent === "2")
          ?.getBoundingClientRect();
        if (!line || !number) return Infinity;
        return Math.max(
          Math.abs(line.height - 28),
          Math.abs(number.y - line.y),
          Math.abs(number.height - line.height),
        );
      }),
    )
    .toBeLessThan(0.5);
  await scroller.evaluate((element) => {
    element.scrollLeft = 300;
  });
  await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1280);
  const panelHeight = (await page.locator(".source-panel").boundingBox())!.height;
  await editor(page).press("ControlOrMeta+End");
  await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect((await page.locator(".source-panel").boundingBox())!.height).toBe(panelHeight);
  await page.setViewportSize({ width: 390, height: 844 });
  await editor(page).press("ControlOrMeta+Home");
  expect(await scroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
    true,
  );
  expect((await page.locator(".cm-content .cm-line").nth(1).boundingBox())!.height).toBeCloseTo(
    28,
    0,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await editor(page).fill("not a diagram");
  await expect(editor(page)).toHaveAttribute("aria-invalid", "true");
  await expect(editor(page)).toHaveAttribute("aria-describedby", "source-feedback");
  await expect(editor(page)).toHaveAttribute("aria-multiline", "true");
  await editor(page).fill(flowchart);
  await expect(editor(page)).toHaveAttribute("aria-invalid", "false");
  await expect(editor(page)).not.toHaveAttribute("aria-describedby");
});

test("panel divider resizes with pointer and keyboard while preserving editing and preview", async ({
  page,
}) => {
  await page.goto("/");
  await editor(page).fill(flowchart);
  await expect(svg(page)).toContainText("Hello");
  await editor(page).press("ControlOrMeta+End");
  await editor(page).pressSequentially("\n%% retained history");
  await page.getByRole("button", { name: "100%", exact: true }).click();
  const before = await camera(page);
  const previewBox = (await surface(page).boundingBox())!;
  const panel = page.locator(".source-panel");
  const originalWidth = (await panel.boundingBox())!.width;
  const divider = page.getByRole("separator", { name: "소스와 미리보기 너비 조절" });
  const box = (await divider.boundingBox())!;
  const startX = box.x + box.width / 2 + 3;
  await page.mouse.move(startX, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(startX + 150, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () => (await panel.boundingBox())!.width)
    .toBeGreaterThan(originalWidth + 100);
  const resizedWidth = (await panel.boundingBox())!.width;
  await expect
    .poll(async () => {
      const current = await camera(page);
      const bounds = (await surface(page).boundingBox())!;
      return (bounds.width / 2 - current.x) / current.scale;
    })
    .toBeCloseTo((previewBox.width / 2 - before.x) / before.scale, 1);
  expect((await camera(page)).scale).toBe(before.scale);
  await expect(editor(page)).toContainText("retained history");
  await editor(page).press("ControlOrMeta+z");
  await expect(editor(page)).not.toContainText("retained history");
  await divider.press("ArrowLeft");
  await expect.poll(async () => (await panel.boundingBox())!.width).toBeLessThan(resizedWidth);
  await divider.press("Home");
  await expect.poll(async () => (await panel.boundingBox())!.width).toBeCloseTo(240, 0);
  await divider.press("End");
  await expect.poll(async () => (await surface(page).boundingBox())!.width).toBeCloseTo(360, 0);
  await divider.dblclick();
  await expect.poll(async () => (await panel.boundingBox())!.width).toBeCloseTo(originalWidth, 0);
  const content = await editor(page).textContent();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(divider).toBeHidden();
  expect((await surface(page).boundingBox())!.y).toBeGreaterThan((await panel.boundingBox())!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(editor(page)).toHaveText(content!);
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(divider).toBeVisible();
  await expect(editor(page)).toHaveText(content!);
  await expect(svg(page)).toContainText("Hello");
});

test("keeps editing and preview minimal without automatic highlights or closing brackets", async ({
  page,
}) => {
  await page.goto("/");
  await editor(page).fill(flowchart);
  await editor(page).press("ControlOrMeta+End");
  await expect(
    page.locator(".cm-matchingBracket, .cm-activeLine, .cm-activeLineGutter"),
  ).toHaveCount(0);
  await expect(page.locator(".cm-editor")).toHaveCSS("outline-style", "none");
  await editor(page).press("ControlOrMeta+Home");
  await editor(page).press("Shift+ArrowRight");
  await expect(page.locator(".cm-selectionMatch")).toHaveCount(0);
  await editor(page).press("ControlOrMeta+End");
  await editor(page).pressSequentially("(");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("inklava:source")))
    .toBe(`${flowchart}(`);
  await expect(page.locator(".cm-tooltip-autocomplete, .cm-foldGutter")).toHaveCount(0);
  await surface(page).focus();
  await expect(surface(page)).toBeFocused();
  await expect(surface(page)).toHaveCSS("outline-style", "none");
});
