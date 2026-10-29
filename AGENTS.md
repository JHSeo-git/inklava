# Project guidelines

- Read `README.md` before working. When changing a design choice, read and update the relevant decision in `docs/adr/`.
- Keep React, TypeScript, Vite, and Bun. Use `package.json` as the source of truth for commands and versions.
- Use kebab-case source filenames. Put app components directly in `src/components/`, shadcn primitives in `components/ui/`, hooks in `hooks/`, and logic with its unit tests in `lib/`. Do not add a `features/` layer.
- Use the existing shadcn components and theme, and preserve Pele's default diagram styles. Keep the editor and preview minimal, without persistent help text or unnecessary highlighting.
- Implement only what the current requirement needs. Prefer readable repetition to premature abstraction.
- Write documentation, code comments, UI copy, error messages, and accessibility labels in English.
- Before adding or updating a dependency, check its official documentation and maintenance status. Pin the exact version and update `bun.lock`.
- Run `bun run check` after code changes. For editing, rendering, zoom, or download changes, also run the relevant Playwright tests. Distinguish synthetic event coverage from testing with a real input method or trackpad.
- Update `README.md` and `CHANGELOG.md` when user-visible behavior changes.
- Use Conventional Commits. `ship` means updating the changelog, making related commits, pushing, and pulling. Publish releases and deploy to Cloudflare only when each is explicitly requested.
