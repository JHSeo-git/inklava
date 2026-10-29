---
status: accepted
date: 2026-10-29
---

# ADR 003: CodeMirror Mermaid source editor

Replace `SourceEditor`'s textarea with **CodeMirror 6 and `@uiw/react-codemirror`** to provide line numbers and basic code editing, as in Pele Playground. The React wrapper owns editor creation, cleanup, and value synchronization; the app configures only the extensions it needs. Pele Playground also uses CodeMirror. This suits a single-document editor better than managing Monaco models, loaders, and Workers or building line numbers and scroll synchronization around a textarea. This decision replaces the input component choices in ADR 001 and ADR 002 while retaining React, Pele, shadcn, and Bun. [Research](../research/code-editor.md), [React wrapper](https://github.com/uiwjs/react-codemirror), [Pele editor](https://github.com/obsidianmd/pele/blob/main/website/src/scripts/playground-editor.ts)

## Editing experience

Provide line numbers, undo/redo, search, two-space indentation, and horizontal and vertical scrolling inside the panel. A subsequent UI request disables line wrapping so long source lines scroll horizontally. Tab and Shift+Tab indent and outdent; Escape followed by Tab moves focus out of the editor. Document search and focus navigation in the [user guide](../usage.md), without restoring the previously removed persistent help row. Automatic bracket insertion, folding, and autocomplete are outside this scope. [CodeMirror Tab accessibility](https://codemirror.net/examples/tab/)

A subsequent UI request disables the initial active-line and gutter backgrounds, bracket matching, and matching-word highlights. Following Pele Playground, also remove source and preview focus outlines and the gutter border. Preserve direct text selection, search results, and basic syntax colors. Buttons and search inputs retain their existing shadcn and editor focus indicators. [Pele editor styles](https://github.com/obsidianmd/pele/blob/main/website/src/styles/playground.scss)

Add basic colors for Mermaid keywords, comments, strings, and connection operators with a small local `StreamLanguage` extension. Do not adopt the community Mermaid language package because of its outdated coverage. Highlighting helps readability; Pele rendering remains the source of syntax validation. Do not implement precise parsing for every diagram type or semantic autocomplete. Use Pele's approach as a reference and write only the token handling needed here. [Pele highlighter](https://github.com/obsidianmd/pele/blob/main/website/src/lib/editor-highlighting.ts)

## Implementation boundaries and state

Use the official shadcn Resizable component and `react-resizable-panels` 4.15.1 for panel widths. That version was released on 2026-10-28 and supports React 19. Show a horizontal resize divider at widths of 768px or more, with a 240px source minimum and a 360px preview minimum. On narrower screens, preserve the editor instance, switch to a vertical layout, and hide the divider. Place the divider's extended hit area above the preview so resizing does not also start panning the diagram. Do not add panel-ratio persistence. [shadcn Resizable](https://ui.shadcn.com/docs/components/base/resizable), [Package](https://github.com/bvaughn/react-resizable-panels)

Keep editor composition in `src/components/source-editor.tsx` and Mermaid highlighting in `src/lib/mermaid-language.ts`. Do not add an interchangeable-editor interface or service layer. Delete the unused shadcn Textarea source. Keep the existing shadcn panel, label, and badge components, and map editor backgrounds, text, borders, selection, and search UI to existing CSS variables. Use a monospace font for code and leave Pele diagram styles unchanged.

Update React source state immediately and retain the existing 200ms rendering delay and draft storage. Do not recreate the editor on every document change. Keep extensions and theme configuration stable to preserve the cursor, selection, scrolling, and undo history. When IME composition starts, cancel the scheduled preview; defer rendering during composition and schedule it again with the final input afterward. Verify the ordering of CodeMirror DOM events and document updates so the final input is not lost.

On errors, show the message and location and preserve the last successful SVG. Empty input clears the preview, and edits do not reset the camera. Error navigation and underlines are deferred. Adding them would require replacing string errors with structured values containing line, column, and the source that produced the error. Attach an accessible name, multiline semantics, and error state to the editable element. Show errors and storage failures only when needed.

## Dependencies and verification

At the time of research, `@uiw/react-codemirror` was 4.25.12 and `@codemirror/view` was 6.43.15. Recheck official documentation and npm metadata during implementation, and pin every directly imported package with an exact version and `bun.lock`. Do not rely on transitive dependencies for imports. UIW is a community wrapper, and its declared React peer range includes React 19. A recent release does not establish runtime compatibility.

Adapt the textarea E2E tests to the new input mechanism and verify draft restoration, error recovery, empty input, camera preservation, and composition events in Chromium, Firefox, and WebKit. Also check line numbers, internal scrolling, indentation, undo/redo, search, and Escape-then-Tab focus navigation. Test the local token handling with cases where comments, strings, and connection operators could be confused. Run formatting, type-aware linting, type checking, unit tests, and the production build, and record JavaScript size before and after introducing the editor. Distinguish synthetic event tests from verification with a real OS Korean input method.
