# Development

[Getting started](../README.md) · [User guide](usage.md) · [Cloudflare deployment](deployment.md)

## Environment and checks

Use Bun **1.4.0** and Node.js **24.18.0 or later**. The baseline versions are recorded in `.bun-version`, `.node-version`, and `package.json`. Dependencies use exact versions and `bun.lock`. Keep `@types/node` on the latest Node 24 release to match the development and CI runtime.

```sh
bun run check                 # Formatting, type-aware lint, types, unit tests, and build
bunx playwright install chromium firefox webkit
bun run test:e2e              # Chromium, Firefox, and WebKit; starts the dev server as needed
bun run fmt                   # Apply Oxfmt's default style
bun run preview               # Preview the Vite build
```

Type checking uses TypeScript 7 through `tsc --noEmit`. Oxlint provides type-aware linting, Oxfmt handles formatting, and Vite builds the app. See the [tooling research](research/tooling.md) for the rationale.

## UI and source structure

The UI uses shadcn/ui's Base UI Nova style with Tailwind CSS 4, CodeMirror for editing, and `react-resizable-panels` for panel resizing.

The theme lives in `src/styles/globals.css` and CLI configuration in `components.json`. Geist Variable is self-hosted for the app UI; Pele diagrams retain their default styles and fonts. To add a component, run the pinned CLI with `bunx shadcn add <component>`, pin any new dependency versions, and verify the result. See the [official Vite guide](https://ui.shadcn.com/docs/installation/vite).

The entry point is `src/app/main.tsx`. The `@/*` alias maps to `src/*`.

```text
src/
  app/                  # Entry point and router
  components/           # Workbench, source editor, and diagram preview
    ui/                 # shadcn primitives
  hooks/                # React hooks, including use-viewport
  lib/                  # Rendering, downloads, syntax colors, coordinates, and unit tests
  styles/               # Tailwind and shadcn theme
```

Use kebab-case source filenames such as `source-editor.tsx`, `render-diagram.ts`, and `use-viewport.ts`. Put app components directly under `components/`; do not create a `features/` layer. Component and function identifiers keep the usual React and TypeScript conventions.

## Test coverage and limits

Unit tests cover coordinate calculations and Mermaid token handling. Playwright tests in Chromium, Firefox, and WebKit cover editing, input composition, error recovery, draft storage, keyboard navigation, pan and zoom, panel resizing, mobile layout, and PNG exports.

Composition tests use synthetic events to check event ordering and rendering delays. They do not replace testing with a real OS input method, including Korean IMEs. Trackpad sensitivity and inertial scrolling in macOS Safari also need physical-device testing.

The full Pele entry point, CodeMirror, and panel resizing produce an initial JavaScript bundle of about **1.50MB, or 519KB gzip**, triggering Vite's large-chunk warning. Code splitting and Web Workers have not been introduced. Large inputs can temporarily block the main thread; measure rendering latency on real devices before deciding on further optimization.

## Design and research

- [ADR 001: React and Pele diagram workbench](adr/001-react-pele-workbench.md): initial technology choices, editing and rendering flow, and pan and zoom behavior
- [ADR 002: shadcn/ui and source organization](adr/002-shadcn-ui-and-source-structure.md): UI tooling and source layout
- [ADR 003: CodeMirror Mermaid source editor](adr/003-codemirror-source-editor.md): editing features, highlighting, state preservation, and verification scope
- [Code editor research](research/code-editor.md): CodeMirror, Monaco, and Mermaid language support
- [Tooling research](research/tooling.md): Bun, Vite, Oxc, and TypeScript support and selection rationale

## References

- [Pele documentation](https://pele.run/)
- [Pele source](https://github.com/obsidianmd/pele)
