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
      error.line > 0 ? `Location: line ${error.line}, column ${error.column}` : "",
      error.snippet,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return error instanceof Error
    ? `Unable to render the diagram: ${error.message}`
    : "Unable to render the diagram. Please check your source.";
}
