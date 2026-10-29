import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { search } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useMemo, useRef } from "react";
import { mermaidLanguage } from "@/lib/mermaid-language";

const basicSetup = {
  tabSize: 2,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
  highlightSelectionMatches: false,
  bracketMatching: false,
  foldGutter: false,
  foldKeymap: false,
  closeBrackets: false,
  closeBracketsKeymap: false,
  autocompletion: false,
  completionKeymap: false,
  lintKeymap: false,
};

const theme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--card)",
    color: "var(--foreground)",
    colorScheme: "light",
  },
  ".dark &": { colorScheme: "dark" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { overflow: "auto", fontFamily: "var(--font-mono)", lineHeight: "2" },
  ".cm-content": { padding: "16px 0", caretColor: "var(--foreground)" },
  ".cm-line": { padding: "0 16px" },
  ".cm-gutters": {
    backgroundColor: "var(--card)",
    color: "var(--muted-foreground)",
    border: "0",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--foreground)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "color-mix(in oklch, var(--ring) 30%, transparent)",
  },
  ".cm-searchMatch": {
    backgroundColor: "color-mix(in oklch, var(--ring) 25%, transparent)",
  },
  ".cm-searchMatch-selected": { outline: "1px solid var(--ring)" },
  ".cm-panels": { backgroundColor: "var(--muted)", color: "var(--foreground)" },
  ".cm-panels-top": { borderBottomColor: "var(--border)" },
  ".cm-textfield": {
    background: "var(--background)",
    color: "var(--foreground)",
    border: "1px solid var(--input)",
    borderRadius: "var(--radius-sm)",
  },
  ".cm-button": {
    background: "var(--secondary)",
    color: "var(--secondary-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
  },
});

const highlighting = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: "light-dark(#7c3aed, #c4b5fd)" },
    { tag: tags.comment, color: "var(--muted-foreground)", fontStyle: "italic" },
    { tag: tags.string, color: "light-dark(#047857, #6ee7b7)" },
    { tag: tags.operator, color: "light-dark(#0369a1, #7dd3fc)" },
  ]),
);

interface Props {
  source: string;
  onChange: (source: string) => void;
  onCompositionChange: (composing: boolean) => void;
  error: string | null;
  storageFailed: boolean;
}

export function SourceEditor({
  source,
  onChange,
  onCompositionChange,
  error,
  storageFailed,
}: Props) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const extensions = useMemo(
    () => [
      // Keep search state when feedback attributes reconfigure the editor.
      search(),
      mermaidLanguage,
      highlighting,
      EditorState.tabSize.of(2),
      EditorView.contentAttributes.of({
        id: "source",
        "aria-labelledby": "source-title",
        "aria-multiline": "true",
        "aria-invalid": String(error !== null),
        ...(error || storageFailed ? { "aria-describedby": "source-feedback" } : {}),
        spellcheck: "false",
        autocapitalize: "off",
        autocorrect: "off",
      }),
      EditorView.domEventObservers({
        keydown: (event, view) => {
          // Escape can be consumed by selection collapse before CodeMirror's fallback runs.
          if (event.key === "Escape") view.setTabFocusMode(2000);
        },
        compositionstart: () => onCompositionChange(true),
        compositionend: (_event, view) => {
          // A final DOM mutation may follow this event; onChange also catches that update.
          onChange(view.state.doc.toString());
          onCompositionChange(false);
        },
      }),
    ],
    [error, storageFailed, onChange, onCompositionChange],
  );

  return (
    <section
      className="source-panel flex h-full min-h-0 w-full min-w-0 flex-col border-b bg-card md:border-b-0"
      aria-labelledby="source-title"
    >
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4">
        <Label id="source-title" onClick={() => editorRef.current?.view?.focus()}>
          Mermaid source
        </Label>
        <Badge variant="secondary">Pele</Badge>
      </div>
      <CodeMirror
        ref={editorRef}
        className="h-0 min-h-0 min-w-0 flex-1 font-mono text-sm"
        value={source}
        onChange={onChange}
        theme={theme}
        basicSetup={basicSetup}
        extensions={extensions}
        indentWithTab={true}
        placeholder={"flowchart LR\n    A --> B"}
      />
      {(error || storageFailed) && (
        <div
          id="source-feedback"
          className="source-feedback max-h-[30%] shrink-0 overflow-auto border-t px-4 py-3 text-xs text-destructive"
          aria-live="polite"
        >
          {error && (
            <pre className="error font-sans whitespace-pre-wrap wrap-anywhere">{error}</pre>
          )}
          {storageFailed && (
            <p className="error">
              Unable to save your draft in this browser. You can continue editing.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
