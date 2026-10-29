import { PeleError, render } from "pele";

export function renderDiagram(source: string) {
  return render(source, {
    responsive: false,
    autoDirection: false,
    idPrefix: "inklava-preview-",
    links: false,
    images: false,
  });
}

export type Diagram = ReturnType<typeof renderDiagram>;

export function renderError(error: unknown): string {
  if (error instanceof PeleError) {
    return [
      error.message,
      error.line > 0 ? `위치: ${error.line}행 ${error.column}열` : "",
      error.snippet,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return error instanceof Error
    ? `다이어그램을 표시하지 못했습니다: ${error.message}`
    : "다이어그램을 표시하지 못했습니다. 입력을 확인해 주세요.";
}
