import { describe, expect, test } from "bun:test";
import { fitCamera, resizeCamera, wheelPixels, zoomCamera } from "./viewport";

describe("viewport coordinates", () => {
  test("zoom keeps the diagram point under the pointer fixed", () => {
    const before = { x: -120, y: 34, scale: 0.6 };
    const pointer = { x: 310, y: 170 };
    const after = zoomCamera(before, pointer, 2.4);
    expect((pointer.x - after.x) / after.scale).toBeCloseTo((pointer.x - before.x) / before.scale);
    expect((pointer.y - after.y) / after.scale).toBeCloseTo((pointer.y - before.y) / before.scale);
  });
  test("zoom clamps both ends, including a very large fitted diagram", () => {
    const camera = { x: 0, y: 0, scale: 1 };
    expect(zoomCamera(camera, camera, 90).scale).toBe(8);
    expect(zoomCamera(camera, camera, 0.001).scale).toBe(0.05);
    expect(zoomCamera(camera, camera, 0.001, 0.002).scale).toBe(0.002);
  });
  test("fit respects padding, aspect ratio, and natural size", () => {
    expect(fitCamera({ width: 864, height: 664 }, { width: 1600, height: 200 })).toEqual({
      x: 32,
      y: 282,
      scale: 0.5,
    });
    expect(fitCamera({ width: 864, height: 664 }, { width: 100, height: 1200 })).toEqual({
      x: 407,
      y: 32,
      scale: 0.5,
    });
    expect(fitCamera({ width: 864, height: 664 }, { width: 100, height: 100 })).toEqual({
      x: 382,
      y: 282,
      scale: 1,
    });
    expect(fitCamera({ width: 0, height: 664 }, { width: 100, height: 100 })).toBeNull();
    expect(fitCamera({ width: 864, height: 664 }, { width: 0, height: 100 })).toBeNull();
  });
  test("resize preserves scale and the world coordinate at the center", () => {
    const camera = { x: -50, y: 90, scale: 2 };
    const after = resizeCamera(camera, { width: 600, height: 400 }, { width: 800, height: 300 });
    expect(after).toEqual({ x: 50, y: 40, scale: 2 });
    expect((400 - after.x) / after.scale).toBe((300 - camera.x) / camera.scale);
    expect((150 - after.y) / after.scale).toBe((200 - camera.y) / camera.scale);
  });
  test("wheel pixel, line, and page units are normalized", () => {
    expect(wheelPixels(2, 0, 500)).toBe(2);
    expect(wheelPixels(2, 1, 500)).toBe(32);
    expect(wheelPixels(-2, 2, 500)).toBe(-1000);
  });
});
