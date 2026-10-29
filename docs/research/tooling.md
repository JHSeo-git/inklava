# React, Bun, and Oxc tooling research

Checked on 2026-10-29 using official documentation, npm `latest` metadata, and release timestamps. Installation, type checking, linting, and building were verified with the combination below. Exact dependencies are recorded in `package.json` and `bun.lock`.

## Recommended combination

For this React SPA, use **Bun + Vite 8 + `@vitejs/plugin-react` 6 + Oxlint + Oxfmt**. Vite 8 uses Rolldown and Oxc by default, and the React plugin uses Oxc for Fast Refresh. There is no need to assemble a separate Oxc build-plugin pipeline. Do not use the deprecated `@vitejs/plugin-react-oxc`. [Vite 8 announcement](https://vite.dev/blog/announcing-vite8), [Previous React Oxc plugin guidance](https://v7.vite.dev/guide/rolldown)

Vite+ was also considered. It integrates builds, tests, linting, formatting, and runtime management, and supports Bun as a package manager. This app has no monorepo or task-runner requirement, so independent tools connected through Bun scripts are easier to understand and adjust initially. This choice keeps configuration proportional to the current needs. [Vite+](https://viteplus.dev/), [Package manager support](https://viteplus.dev/guide/package-management)

## Versions checked

These values describe the research date. npm metadata was checked again during implementation and selected versions were pinned. Keep Bun at the development environment's verified 1.4.0 rather than silently upgrading to the then-latest 1.4.4.

| Package                      | `latest`            | Release date (UTC) |
| ---------------------------- | ------------------- | ------------------ |
| `vite`                       | 8.3.5               | 2026-10-21         |
| `@vitejs/plugin-react`       | 6.1.2               | 2026-10-05         |
| `typescript`                 | 7.0.2               | 2026-07-08         |
| `tsrs` (evaluated, deferred) | 0.20.1-ts7.1.0-beta | 2026-10-28         |
| `oxlint`                     | 1.90.0              | 2026-10-27         |
| `oxlint-tsgolint`            | 7.0.2005            | 2026-10-22         |
| `oxfmt`                      | 0.75.0              | 2026-10-27         |
| `bun`                        | 1.4.4               | 2026-10-22         |
| `vite-plus`                  | 1.4.0               | 2026-10-23         |

Sources are the packages' npm registry metadata: [Vite](https://registry.npmjs.org/vite), [React plugin](https://registry.npmjs.org/@vitejs/plugin-react), [TypeScript](https://registry.npmjs.org/typescript), [tsrs](https://registry.npmjs.org/tsrs), [Oxlint](https://registry.npmjs.org/oxlint), [tsgolint](https://registry.npmjs.org/oxlint-tsgolint), [Oxfmt](https://registry.npmjs.org/oxfmt), [Bun](https://registry.npmjs.org/bun), [Vite+](https://registry.npmjs.org/vite-plus).

Vite, the React plugin, and Oxc tools had recent releases. This indicates maintenance activity, not app compatibility. The implementation installed React 19.3.1, Pele 1.12.0, and TanStack Router 1.170.46 together and verified Pele rendering, native type checking, type-aware linting, and a static build. Playwright 1.64.1 and Wrangler 4.155.0 are used for verification.

## Tool responsibilities

| Role                                | Tool                     | Boundary                                                                            |
| ----------------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| Dependency installation and scripts | Bun                      | Use `bun install --frozen-lockfile` for reproducible CI installation.               |
| Dev server and bundling             | Vite 8                   | Use its internal Rolldown/Oxc pipeline, without a separate `bun build` path.        |
| React Fast Refresh                  | `@vitejs/plugin-react` 6 | Start without React Compiler configuration.                                         |
| Code correctness and React rules    | Oxlint                   | Use built-in rules; consider additional tools only when a required rule is missing. |
| Type-aware linting                  | `oxlint-tsgolint`        | Enable with `--type-aware`.                                                         |
| TypeScript checking                 | TypeScript 7 `tsc`       | Use `--noEmit`; Vite owns bundle output.                                            |
| Formatting                          | Oxfmt                    | Keep default formatting and exclude generated files.                                |
| Mermaid parsing                     | Pele                     | This is not the Oxc parser's responsibility.                                        |

Vite transforms TypeScript syntax to JavaScript but does not check types. A successful `vite build` therefore does not establish type correctness. [Vite TypeScript support](https://vite.dev/guide/features#typescript)

Oxc's parser handles JavaScript, TypeScript, JSX, and TSX. Inklava does not need an AST transformation tool, so it should not depend directly on `oxc-parser`. Its use inside Vite and Oxlint is sufficient. [Oxc Parser](https://oxc.rs/docs/guide/usage/parser)

## tsrs evaluation: choose Go-based TypeScript 7

The evaluated `tsrs` is the Rust port of TypeScript developed by Cloudflare and VoidZero under the Oxc project. The official 2026-10-20 announcement describes the release as experimental. The README also lists a stable release with 100% TypeScript 7.1 compatibility as a future goal. At the research date, the latest version was `0.20.1-ts7.1.0-beta`. Active releases do not make it stable. [Cloudflare announcement](https://blog.cloudflare.com/typescript-rust-port), [tsrs README](https://github.com/oxc-project/tsrs), [0.20.1 release](https://github.com/oxc-project/tsrs/releases/tag/v0.20.1)

The official compatibility document reports many passing upstream baseline tests but also diagnostic differences and execution failures in public-repository comparisons. Optional `--fast` mode can change diagnostics and exit codes for some programs; Windows watch and some language-server features remain unsupported. The app does not need every one of these features, but the user explicitly requested the Go port if tsrs was not stable enough. **Do not adopt tsrs for the initial type-checking path.** This new app has no measured type-checking bottleneck, so there is no need for a parallel experimental checker. [Compatibility and verification results](https://github.com/oxc-project/tsrs/blob/main/docs/COMPATIBILITY.md)

Choose **Microsoft's stable Go-based TypeScript 7** instead. This is the released form of the tsgo family requested as the fallback; since 2026-07-08, the standard `typescript` package exposes it through `tsc`. Use `typescript` 7.0.2 and `tsc --noEmit`, without adding the older `@typescript/native-preview` package. Revisit tsrs after a stable release and compatibility evidence, then require matching diagnostics and a measured speed improvement in this app. [TypeScript 7 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), [Earlier development repository command guidance](https://github.com/microsoft/typescript-go)

TypeScript 7.0 does not include the previous JavaScript Compiler API. If a future tool calls that API directly, check its support first. The current CLI checking and Oxc transform/lint setup is a reasonable fit for the native compiler. This is a design rationale, not proof that an arbitrary dependency combination works. [Official API limitations](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)

## Oxlint and Oxfmt configuration

Start with one root `.oxlintrc.json`. Add React and accessibility rules to the default correctness rules and explicitly check Hooks coverage. Setting `plugins` replaces the default list, so include required defaults as well. Avoid enabling every rule at once or running ESLint alongside Oxlint without a concrete need. [Built-in plugin configuration](https://oxc.rs/docs/guide/usage/linter/plugins)

Install `oxlint-tsgolint` as a development dependency and use `oxlint --type-aware` for rules requiring type information, such as Promise handling. That option alone does not check ordinary TypeScript errors. Adding `--type-check` can integrate type checking; the official documentation presents it as an alternative to a separate `tsc --noEmit`. Initially keep `lint` and `typecheck` separate so failures are easy to identify. Combine them only if duplicate checking becomes a measured cost. [Type-aware linting and type checking](https://oxc.rs/docs/guide/usage/linter/type-aware)

Oxfmt was still at 0.x and officially in beta at the research date. Adopt it as requested for the new project, pin its exact version, and review formatting differences on upgrades. It supports the needed TSX, JSON, CSS, and Markdown formats. Do not also install Prettier initially. [Oxfmt beta](https://oxc.rs/blog/2026-02-24-oxfmt-beta), [Supported formats](https://oxc.rs/docs/guide/usage/formatter)

Keep only the schema and generated-file exclusions in `.oxfmtrc.json`. Use default indentation and quotes, without arbitrarily enabling import or Tailwind sorting. Exclude reproducible output such as `dist`, caches, and test reports. Use the official Oxc editor extension so format-on-save agrees with CLI results. [Oxfmt configuration](https://oxc.rs/docs/guide/usage/formatter/config), [Oxc editor extension](https://github.com/oxc-project/oxc-vscode)

The following scripts describe the initial setup. See `package.json` and the [development guide](../development.md) for the complete current commands.

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "oxlint --type-aware",
    "lint:fix": "oxlint --type-aware --fix",
    "typecheck": "tsc --noEmit",
    "fmt": "oxfmt",
    "fmt:check": "oxfmt --check"
  }
}
```

In CI, run formatting, linting, type checking, relevant tests, and the build after installation. The initial single-app `tsconfig` uses `strict`, `noEmit`, `moduleResolution: "bundler"`, and `jsx: "react-jsx"`. If configuration files become a separate project, update `typecheck` to cover both at that point.

## Bun and deployment runtimes

Choosing Bun does not mean browser code or Cloudflare Workers execute in Bun. Use it for installation and script entry points; send Vite's static output to browsers. Bun's official guide also documents Vite usage. [Bun and Vite](https://bun.sh/guides/ecosystem/vite)

Workers have their own runtime, with a separate scope and configuration for Node.js compatibility APIs. Future server code should therefore not assume `Bun.*` APIs. The current static SPA needs no server runtime code. [Cloudflare runtime compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

Vite 8 and Oxc package metadata require Node `^20.19.0 || >=22.12.0`. This repository uses the verified Node 24.18.0 and Bun 1.4.0 combination, with Node 24.x types. Bun is the package manager and script entry point, while tools with Node shebangs and Wrangler execute with Node. Do not force `--bun` on every tool.
