import type { Diagram } from "./render-diagram";

export async function downloadDiagram(diagram: Diagram) {
  const now = new Date();
  const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part) => String(part).padStart(2, "0"))
    .join("");
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join("");
  const scale = Math.min(2, 4096 / Math.max(diagram.width, diagram.height));
  const width = Math.min(4096, Math.max(1, Math.ceil(diagram.width * scale)));
  const height = Math.min(4096, Math.max(1, Math.ceil(diagram.height * scale)));
  const svg = new DOMParser().parseFromString(diagram.svg, "image/svg+xml").documentElement;
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  const svgUrl = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" }),
  );
  const canvas = document.createElement("canvas");
  try {
    const image = new Image();
    image.src = svgUrl;
    await image.decode();
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to create the image. Please try again.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("PNG conversion failed. Please try again."));
      }, "image/png");
    });
    const pngUrl = URL.createObjectURL(png);
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `inklava-${date}-${time}.png`;
    document.body.append(link);
    try {
      link.click();
    } finally {
      link.remove();
      // Let the browser start reading the download before releasing its URL.
      window.setTimeout(() => URL.revokeObjectURL(pngUrl), 60_000);
    }
  } finally {
    URL.revokeObjectURL(svgUrl);
    canvas.width = 0;
    canvas.height = 0;
  }
}
