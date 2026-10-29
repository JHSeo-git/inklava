import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { DiagramPreview } from "./DiagramPreview";
import { SourceEditor } from "./SourceEditor";
import { renderDiagram, renderError, type Diagram } from "./renderDiagram";

const example = `flowchart LR
    A[아이디어] --> B[소스 편집]
    B --> C[다이어그램]
    C --> D[새로운 생각]
    D --> A`;
const draftKey = "inklava:source";

function readDraft() {
  try {
    return { source: localStorage.getItem(draftKey) ?? example, failed: false };
  } catch {
    return { source: example, failed: true };
  }
}

export function Workbench() {
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 768px)").matches);
  const [draft] = useState(readDraft);
  const [source, setSource] = useState(draft.source);
  const [composing, setComposing] = useState(false);
  const [result, setResult] = useState<{ diagram: Diagram; source: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storageFailed, setStorageFailed] = useState(draft.failed);
  const latestSource = useRef(source);
  useLayoutEffect(() => {
    latestSource.current = source;
  }, [source]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (composing) return;
    const timer = window.setTimeout(() => {
      if (!source.trim()) {
        setResult(null);
        setError(null);
        return;
      }
      try {
        setResult({ diagram: renderDiagram(source), source });
        setError(null);
      } catch (cause) {
        setError(renderError(cause));
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [source, composing]);

  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(draftKey, latestSource.current);
        setStorageFailed(false);
      } catch {
        setStorageFailed(true);
      }
    };
    const timer = window.setTimeout(save, 300);
    window.addEventListener("pagehide", save);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", save);
    };
  }, [source]);

  return (
    <main className="flex h-dvh min-h-180 flex-col bg-background text-foreground md:min-h-120">
      <header className="flex h-14 shrink-0 items-center border-b px-4 md:px-6">
        <h1 className="text-lg font-semibold tracking-tight">Inklava</h1>
      </header>
      <ResizablePanelGroup
        className="min-h-0 flex-1"
        orientation={desktop ? "horizontal" : "vertical"}
        disabled={!desktop}
        resizeTargetMinimumSize={{ fine: 9, coarse: 24 }}
      >
        <ResizablePanel
          id="source-panel"
          defaultSize={desktop ? "35%" : "40%"}
          minSize={desktop ? 240 : 230}
        >
          <SourceEditor
            source={source}
            onChange={setSource}
            onCompositionChange={setComposing}
            error={error}
            storageFailed={storageFailed}
          />
        </ResizablePanel>
        <ResizableHandle
          className="z-10 hidden after:w-6 pointer-fine:after:w-[9px] md:flex"
          disabled={!desktop}
          aria-label="소스와 미리보기 너비 조절"
        />
        <ResizablePanel
          id="preview-panel"
          defaultSize={desktop ? "65%" : "60%"}
          minSize={desktop ? 360 : 300}
        >
          <DiagramPreview
            diagram={result?.diagram ?? null}
            stale={result !== null && result.source !== source}
            error={error !== null}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
