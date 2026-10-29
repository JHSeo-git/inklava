import { useCallback, useLayoutEffect, useRef } from "react";
import {
  fitCamera,
  resizeCamera,
  wheelPixels,
  zoomCamera,
  type Camera,
  type Size,
} from "./viewport";

interface SafariGesture extends Event {
  scale: number;
  clientX: number;
  clientY: number;
}

export function useViewport(diagram: Size | null) {
  const surfaceRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const zoomLabelRef = useRef<HTMLOutputElement>(null);
  const camera = useRef<Camera>({ x: 0, y: 0, scale: 1 });
  const view = useRef<Size>({ width: 0, height: 0 });
  const naturalSize = useRef(diagram);
  const fitted = useRef(false);
  const frame = useRef<number | null>(null);

  const paint = useCallback(() => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const { x, y, scale } = camera.current;
      if (contentRef.current) {
        contentRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      }
      if (zoomLabelRef.current) zoomLabelRef.current.value = `${Math.round(scale * 100)}%`;
    });
  }, []);

  const fit = useCallback(() => {
    const next = naturalSize.current && fitCamera(view.current, naturalSize.current);
    if (next) {
      camera.current = next;
      fitted.current = true;
      paint();
    }
  }, [paint]);

  const zoom = useCallback(
    (scale: number, point = { x: view.current.width / 2, y: view.current.height / 2 }) => {
      const fitScale = naturalSize.current && fitCamera(view.current, naturalSize.current)?.scale;
      camera.current = zoomCamera(camera.current, point, scale, Math.min(0.05, fitScale ?? 0.05));
      paint();
    },
    [paint],
  );

  const zoomBy = useCallback((factor: number) => zoom(camera.current.scale * factor), [zoom]);
  const actualSize = useCallback(() => zoom(1), [zoom]);

  useLayoutEffect(() => {
    naturalSize.current = diagram;
    if (!fitted.current) fit();
  }, [diagram, fit]);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    let drag: { id: number; x: number; y: number } | null = null;
    let gestureScale: number | null = null;
    const localPoint = (x: number, y: number) => {
      const rect = surface.getBoundingClientRect();
      return { x: x - rect.left, y: y - rect.top };
    };
    const pan = (x: number, y: number) => {
      camera.current = { ...camera.current, x: camera.current.x + x, y: camera.current.y + y };
      paint();
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      if (gestureScale !== null) return;
      const x = wheelPixels(event.deltaX, event.deltaMode, view.current.width);
      const y = wheelPixels(event.deltaY, event.deltaMode, view.current.height);
      if (event.ctrlKey || event.metaKey) {
        zoom(camera.current.scale * Math.exp(-y * 0.01), localPoint(event.clientX, event.clientY));
      } else if (event.shiftKey && x === 0) {
        pan(-y, 0);
      } else {
        pan(-x, -y);
      }
    };
    const stopDrag = () => {
      const active = drag;
      drag = null;
      surface.classList.remove("dragging");
      if (active && surface.hasPointerCapture(active.id)) surface.releasePointerCapture(active.id);
    };
    const pointerDown = (event: PointerEvent) => {
      if (drag || (event.button !== 0 && event.button !== 1) || !event.isPrimary) return;
      event.preventDefault();
      surface.focus({ preventScroll: true });
      surface.setPointerCapture(event.pointerId);
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      surface.classList.add("dragging");
    };
    const pointerMove = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      pan(event.clientX - drag.x, event.clientY - drag.y);
      drag = { id: drag.id, x: event.clientX, y: event.clientY };
    };
    const pointerEnd = (event: PointerEvent) => {
      if (drag?.id === event.pointerId) stopDrag();
    };
    const gestureStart = (event: Event) => {
      event.preventDefault();
      stopDrag();
      gestureScale = camera.current.scale;
    };
    const gestureChange = (event: Event) => {
      event.preventDefault();
      const gesture = event as SafariGesture;
      if (gestureScale !== null && Number.isFinite(gesture.scale) && gesture.scale > 0) {
        zoom(gestureScale * gesture.scale, localPoint(gesture.clientX, gesture.clientY));
      }
    };
    const gestureEnd = (event: Event) => {
      event.preventDefault();
      gestureScale = null;
    };
    const blur = () => {
      stopDrag();
      gestureScale = null;
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      switch (event.key) {
        case "+":
        case "=":
          zoomBy(1.2);
          break;
        case "-":
          zoomBy(1 / 1.2);
          break;
        case "0":
          fit();
          break;
        case "ArrowLeft":
          pan(40, 0);
          break;
        case "ArrowRight":
          pan(-40, 0);
          break;
        case "ArrowUp":
          pan(0, 40);
          break;
        case "ArrowDown":
          pan(0, -40);
          break;
        default:
          return;
      }
      event.preventDefault();
    };
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const next = { width: entry.contentRect.width, height: entry.contentRect.height };
      if (next.width <= 0 || next.height <= 0) return;
      if (view.current.width > 0 && view.current.height > 0) {
        camera.current = resizeCamera(camera.current, view.current, next);
      }
      view.current = next;
      if (!fitted.current) fit();
      paint();
    });
    observer.observe(surface);
    surface.addEventListener("wheel", wheel, { passive: false });
    surface.addEventListener("pointerdown", pointerDown);
    surface.addEventListener("pointermove", pointerMove);
    surface.addEventListener("pointerup", pointerEnd);
    surface.addEventListener("pointercancel", pointerEnd);
    surface.addEventListener("lostpointercapture", pointerEnd);
    surface.addEventListener("keydown", keyDown);
    surface.addEventListener("gesturestart", gestureStart, { passive: false });
    surface.addEventListener("gesturechange", gestureChange, { passive: false });
    surface.addEventListener("gestureend", gestureEnd, { passive: false });
    window.addEventListener("blur", blur);
    paint();
    return () => {
      stopDrag();
      observer.disconnect();
      surface.removeEventListener("wheel", wheel);
      surface.removeEventListener("pointerdown", pointerDown);
      surface.removeEventListener("pointermove", pointerMove);
      surface.removeEventListener("pointerup", pointerEnd);
      surface.removeEventListener("pointercancel", pointerEnd);
      surface.removeEventListener("lostpointercapture", pointerEnd);
      surface.removeEventListener("keydown", keyDown);
      surface.removeEventListener("gesturestart", gestureStart);
      surface.removeEventListener("gesturechange", gestureChange);
      surface.removeEventListener("gestureend", gestureEnd);
      window.removeEventListener("blur", blur);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [fit, paint, zoom, zoomBy]);

  return { surfaceRef, contentRef, zoomLabelRef, fit, zoomBy, actualSize };
}
