# Changelog

## Unreleased

- Use English throughout the interface, accessibility labels, error messages, examples, tests, and project documentation.
- Simplify the README and move detailed usage, development, and Cloudflare deployment guides into `docs/`.

## 0.1.0 - 2026-10-29

- Remove `features/workbench` and move components, hooks, and logic into `components/`, `hooks/`, and `lib/`. Use kebab-case source filenames.
- Include the device's local date and time in PNG filenames (`inklava-YYYYMMDD-HHmmss.png`).
- Add a button to download the entire diagram as a PNG with a white background. Export independently of pan and zoom, limit the longest edge to 4,096px, and allow retrying failed conversions.
- Replace source line wrapping with horizontal scrolling and add a shadcn divider for resizing the desktop source and preview panels with the pointer or keyboard.
- Match Pele Playground's minimal appearance by removing panel focus outlines, active-line backgrounds, bracket and matching-word highlights, and the gutter border. Keep text selection and search highlights.
- Fix search panels losing their query and focus when syntax or storage errors change, and make the `Mermaid source` label focus the editor.
- Replace the Mermaid textarea with CodeMirror 6, adding line numbers, basic syntax colors, two-space indentation, search, undo/redo, bracket matching, line wrapping, internal scrolling, and Escape-then-Tab focus escape. Preserve draft storage, composition-aware rendering, error recovery, and the preview camera. [ADR 003](docs/adr/003-codemirror-source-editor.md)
- Remove persistent help rows beneath the editor and preview; show feedback only when errors occur.
- Simplify the app header to Inklava, organize source files by role, and adopt shadcn/ui and Tailwind.
- Add the React and Pele diagram workbench, free pan and zoom, Korean input handling and draft recovery, Bun and Oxc tooling, browser tests, and Cloudflare static asset configuration.
