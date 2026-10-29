# Mermaid code editor research

Checked on 2026-10-29 using Pele Playground's public source, official editor documentation and repositories, and the npm registry. This document records the adoption proposal; the research itself did not change app code, dependencies, or existing ADR statuses. Subsequent decisions are recorded in ADR 003.

## Recommendation

Use **CodeMirror 6 with `@uiw/react-codemirror`** for Inklava. It provides a React component, line numbers, active-line highlighting, undo/redo, search, and bracket matching. Replace `SourceEditor`'s textarea while keeping the surrounding panels, buttons, and colors in the shadcn system. `@uiw/react-codemirror` is a community wrapper maintained by uiw, not an official React package from CodeMirror. [React wrapper](https://github.com/uiwjs/react-codemirror), [Basic extensions](https://github.com/uiwjs/react-codemirror/blob/master/extensions/basic-setup/README.md)

Pele Playground also uses CodeMirror 6, providing the same foundation as the requested editing experience. It avoids the need to configure Monaco models, loaders, and Workers or build line numbers and scroll synchronization around a textarea. This recommendation is specific to editing one Mermaid document at a time.

## How Pele Playground works

Pele's Astro website creates CodeMirror directly. Its editor combines `EditorView`, `EditorState`, `lineNumbers`, `drawSelection`, `history`, default keymaps, and `indentWithTab`. It also uses a `Compartment` for wrapping configuration, a tab size of two, and `selectDiagnostic` to move selection to an error's line and column. Pele does not distribute this as a ready-made React editor. [Editor implementation](https://github.com/obsidianmd/pele/blob/main/website/src/scripts/playground-editor.ts), [Website dependencies](https://github.com/obsidianmd/pele/blob/main/website/package.json)

Syntax colors connect a custom `highlightLine` tokenizer to `StreamLanguage.define` and `HighlightStyle`. Separate autocomplete code combines `@codemirror/autocomplete`, custom `mermaidCompletions`, and Pele's `detectType`. Installing CodeMirror alone does not reproduce all of Playground's Mermaid colors and suggestions. Editor behavior, highlighting, autocomplete, and rendering are distinct responsibilities. [Highlighter](https://github.com/obsidianmd/pele/blob/main/website/src/lib/editor-highlighting.ts), [Autocomplete](https://github.com/obsidianmd/pele/blob/main/website/src/scripts/playground-autocomplete.ts)

## Alternatives

| Candidate                                | React integration                                         | Fit for this app                                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CodeMirror 6 + `@uiw/react-codemirror`   | Community React component                                 | Recommended: basic editing and configurable extensions on the same foundation as Pele. Mermaid features need separate integration.                     |
| Direct CodeMirror 6 integration          | React manages `EditorView` creation, updates, and cleanup | Feasible, but requires owning value synchronization, lifecycle, and development remount handling. Little benefit while the wrapper meets requirements. |
| Monaco + `@monaco-editor/react`          | Community React wrapper around Microsoft's editor         | Useful for multiple files, models, diffs, and language services; adds more configuration than this app needs.                                          |
| `react-simple-code-editor` + highlighter | React component                                           | Suits short snippets but requires substantial work for line numbers, search, and folding.                                                              |
| shadcn Code Block                        | React display component                                   | Supports code display, line numbers, copying, and diffs; does not replace editable input.                                                              |

The Monaco wrapper supports React 19 and provides a Vite example. Bundling the npm package involves `loader.config({ monaco })` and the necessary Workers. Mermaid highlighting, completion, and diagnostics remain additional work. Without a concrete IDE requirement, it has more configuration to maintain than CodeMirror. [Monaco React documentation](https://github.com/suren-atoyan/monaco-react#loaderconfig)

`react-simple-code-editor` overlays a textarea and highlighted `pre`. It supports external highlighting, indentation, and custom undo, but mismatched fonts or line heights can break alignment. Its README also documents large-document performance limits. [Official README](https://github.com/react-simple-code-editor/react-simple-code-editor)

shadcn Code Block's line numbers and syntax colors serve reading. Use CodeMirror for editing and map its background, text, borders, and selection to shadcn CSS variables. [shadcn Code Block](https://ui.shadcn.com/docs/components/base/code-block)

This research did not measure final app bundle sizes. Package download sizes and README figures should not be presented as the app's final transfer size.

## Versions and maintenance

The table records npm `latest` and the associated release dates, not installed versions. Recheck during adoption and pin selected versions in the lockfile.

| Package                    | Latest version | Release date (UTC) |
| -------------------------- | -------------- | ------------------ |
| `codemirror`               | 6.0.2          | 2025-06-19         |
| `@codemirror/view`         | 6.43.15        | 2026-10-19         |
| `@uiw/react-codemirror`    | 4.25.12        | 2026-09-24         |
| `monaco-editor`            | 0.57.0         | 2026-09-24         |
| `@monaco-editor/react`     | 4.7.0          | 2025-02-13         |
| `react-simple-code-editor` | 0.14.1         | 2024-07-04         |
| `codemirror-lang-mermaid`  | 0.5.0          | 2023-09-14         |

Sources: [codemirror](https://registry.npmjs.org/codemirror), [CodeMirror view](https://registry.npmjs.org/@codemirror/view), [uiw React wrapper](https://registry.npmjs.org/@uiw/react-codemirror), [Monaco](https://registry.npmjs.org/monaco-editor), [Monaco React wrapper](https://registry.npmjs.org/@monaco-editor/react), [simple editor](https://registry.npmjs.org/react-simple-code-editor), [Mermaid language package](https://registry.npmjs.org/codemirror-lang-mermaid).

CodeMirror releases packages independently. The age of the `codemirror` convenience package does not establish that the entire project is stale; `@codemirror/view` had a release that month. The uiw wrapper had a 2026-09-24 release and a mainline commit on the same day. Repository figures were roughly 2,300 stars for uiw and 4,800 for the Monaco wrapper. These support maintenance and adoption assessment but do not guarantee compatibility. [uiw repository](https://github.com/uiwjs/react-codemirror), [uiw commits](https://github.com/uiwjs/react-codemirror/commits/master), [Monaco wrapper repository](https://github.com/suren-atoyan/monaco-react)

The uiw wrapper's React peer range is `>=17.0.0`; the Monaco wrapper also includes React 19. This project's React version falls within the declared ranges, but TypeScript checks and browser input testing are still required. These ranges were verified through the registry metadata above.

## Mermaid highlighting and validation boundaries

`@codemirror/lang-mermaid` and `@mermaid-js/codemirror-mermaid` returned 404 from npm at the research date. Do not recommend installing those names. The existing community package is `codemirror-lang-mermaid`. [First package lookup](https://registry.npmjs.org/@codemirror/lang-mermaid), [Second package lookup](https://registry.npmjs.org/@mermaid-js/codemirror-mermaid), [Existing package repository](https://github.com/inspirnathan/codemirror-lang-mermaid)

However, both its most recent release and its last main-branch commit were dated 2023-09-14. The README lists seven supported types: mindmap, pie, flowchart, sequence, journey, requirement, and gantt. It has an indentation-based folding extension, but does not guarantee full syntax coverage, autocomplete, or semantic validation for everything Pele supports. **Do not adopt it as an initial dependency.** [Supported diagrams and folding](https://github.com/inspirnathan/codemirror-lang-mermaid#supported-diagrams), [Commit history](https://github.com/inspirnathan/codemirror-lang-mermaid/commits/main)

Delegate basic editing to CodeMirror and keep Mermaid validation and SVG rendering in Pele. A small local `StreamLanguage` extension can color the needed tokens, following Pele Playground's approach. Treat autocomplete as a separate step, starting with specific keywords and examples when needed. If copying Playground source, check its license and attribution requirements and document responsibility for maintaining the copied code.

## Proposed adoption scope

The initial proposal includes line numbers, active-line and gutter highlighting, undo/redo, bracket matching, search shortcuts, two-space indentation, and internal scrolling. Most are controlled by `basicSetup`. Meaningful folding needs language support that understands structure, so do not promise it initially. Enable automatic bracket closing only after testing whether it helps with Mermaid node syntax and Korean input. Subsequent requests for minimal styling are recorded in ADR 003. [Basic setup options](https://github.com/uiwjs/react-codemirror/blob/master/extensions/basic-setup/README.md)

One input component is a sufficient implementation boundary. Replace its input first and extract highlighting when needed. Do not introduce interchangeable-editor interfaces or a general editor service. The subsequent folder reorganization in [ADR 002](../adr/002-shadcn-ui-and-source-structure.md) places editor composition in `src/components/source-editor.tsx` and highlighting in `src/lib/mermaid-language.ts`. Reserve `components/ui/` for shadcn primitives.

Update React state immediately and keep the existing 200ms delay only for preview rendering. Recreating the editor on every input can lose the cursor, selection, and undo history, so keep configuration objects and extensions stable. Preserve the existing localStorage draft, last-successful-SVG behavior, and preview pan and zoom.

Korean IME handling requires more than copying textarea event handlers. CodeMirror exposes `EditorView.composing` and `compositionStarted`, with different meanings: the former also requires at least one document change during the current composition. Verify composition start/end and final document update order, including both deferred rendering and the final result. [CodeMirror IME state API](https://codemirror.net/docs/ref/#view.EditorView.composing)

For accessibility, account for the difference between CodeMirror core and uiw defaults. Core allows Tab to leave the editor, while the wrapper's `indentWithTab` defaults to `true`. Set it explicitly. If Tab indents, document Escape followed by Tab as the focus escape in documentation or contextual help. Do not restore the removed persistent help row. Pass the accessible name and error relationship to the actual editable element. [CodeMirror Tab guidance](https://codemirror.net/examples/tab/), [uiw defaults](https://github.com/uiwjs/react-codemirror/blob/master/core/src/useCodeMirror.ts)

Error highlighting can follow later. `renderError` currently combines Pele's line and column into a string passed to `SourceEditor.error`. Navigation or underlines would need structured line and column values, mapped to CodeMirror positions and associated with the source that produced the error. Prevent stale locations or out-of-range positions after edits. Colors and suggestions must not substitute for Mermaid validation.

Adapt textarea tests to the new editor and focus on composition completion, preview updates after undo/redo, line-number and scroll alignment, search and Tab navigation, and SVG preservation during error recovery. Compare actual Vite output before and after adoption to measure bundle growth. This research did not perform installation, browser compatibility checks, or bundle measurement.
