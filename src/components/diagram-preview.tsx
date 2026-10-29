import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Diagram } from "@/lib/render-diagram";
import { useViewport } from "@/hooks/use-viewport";
import { downloadDiagram } from "@/lib/download-diagram";

export const DiagramPreview = memo(function DiagramPreview({
  diagram,
  stale,
  error,
}: {
  diagram: Diagram | null;
  stale: boolean;
  error: boolean;
}) {
  const { surfaceRef, contentRef, zoomLabelRef, fit, zoomBy, actualSize } = useViewport(diagram);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<{ diagram: Diagram; message: string } | null>(
    null,
  );
  const failure = downloadError?.diagram === diagram ? downloadError.message : null;

  async function download() {
    if (!diagram || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadDiagram(diagram);
    } catch {
      setDownloadError({ diagram, message: "Unable to save the PNG. Please try again." });
    } finally {
      setDownloading(false);
    }
  }
  return (
    <section
      className="preview-panel flex h-full min-h-0 w-full min-w-0 flex-col"
      aria-labelledby="preview-title"
    >
      <div className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2 md:px-4">
        <h2 id="preview-title" className="shrink-0 text-sm font-medium">
          Preview
        </h2>
        <div
          className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1"
          aria-label="Preview controls"
        >
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => zoomBy(1 / 1.2)}
            aria-label="Zoom out"
            disabled={!diagram}
          >
            −
          </Button>
          <output
            ref={zoomLabelRef}
            className="min-w-11 text-center text-xs tabular-nums"
            aria-label="Current zoom"
          >
            100%
          </output>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => zoomBy(1.2)}
            aria-label="Zoom in"
            disabled={!diagram}
          >
            +
          </Button>
          <Button variant="outline" size="sm" onClick={actualSize} disabled={!diagram}>
            100%
          </Button>
          <Button variant="outline" size="sm" onClick={fit} disabled={!diagram}>
            Fit to view
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={download}
            disabled={!diagram || downloading}
            aria-label="Download PNG"
            aria-busy={downloading}
            title={downloading ? "Saving PNG…" : "Download PNG"}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4" />
            </svg>
          </Button>
        </div>
      </div>
      {failure && (
        <p role="alert" className="shrink-0 border-b px-4 py-2 text-xs text-destructive">
          {failure}
        </p>
      )}
      <section
        className="diagram-preview relative min-h-0 flex-1 touch-none cursor-grab overflow-hidden bg-muted/30 outline-none select-none"
        ref={surfaceRef}
        // Keyboard pan and zoom require a focusable exploration surface.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-label="Diagram exploration"
      >
        <div
          className="diagram-content pointer-events-none absolute top-0 left-0 origin-top-left will-change-transform"
          ref={contentRef}
          style={{ width: diagram?.width ?? 0, height: diagram?.height ?? 0 }}
          dangerouslySetInnerHTML={{ __html: diagram?.svg ?? "" }}
        />
        {!diagram && (
          <p className="pointer-events-none absolute inset-0 m-6 grid place-content-center text-center text-sm text-muted-foreground">
            {error
              ? "Fix the source to display your diagram here."
              : "Enter Mermaid source to get started."}
          </p>
        )}
        {stale && (
          <output className="stale-indicator pointer-events-none absolute bottom-3 left-4">
            <Badge
              variant="outline"
              className="h-auto rounded-md bg-background px-2.5 py-1.5 text-muted-foreground whitespace-normal"
            >
              Last successful render · Source has changed
            </Badge>
          </output>
        )}
      </section>
    </section>
  );
});
