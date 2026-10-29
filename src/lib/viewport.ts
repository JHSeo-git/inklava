export interface Size {
  width: number;
  height: number;
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export function fitCamera(view: Size, diagram: Size): Camera | null {
  if (view.width <= 0 || view.height <= 0 || diagram.width <= 0 || diagram.height <= 0) {
    return null;
  }
  const scale = Math.min(
    Math.max(1, view.width - 64) / diagram.width,
    Math.max(1, view.height - 64) / diagram.height,
    1,
  );
  return {
    x: (view.width - diagram.width * scale) / 2,
    y: (view.height - diagram.height * scale) / 2,
    scale,
  };
}

export function zoomCamera(
  camera: Camera,
  point: { x: number; y: number },
  scale: number,
  minimum = 0.05,
): Camera {
  const nextScale = Math.min(8, Math.max(minimum, scale));
  return {
    x: point.x - ((point.x - camera.x) / camera.scale) * nextScale,
    y: point.y - ((point.y - camera.y) / camera.scale) * nextScale,
    scale: nextScale,
  };
}

export function resizeCamera(camera: Camera, before: Size, after: Size): Camera {
  return {
    ...camera,
    x: camera.x + (after.width - before.width) / 2,
    y: camera.y + (after.height - before.height) / 2,
  };
}

export function wheelPixels(delta: number, mode: number, page: number): number {
  return delta * (mode === 1 ? 16 : mode === 2 ? page : 1);
}
