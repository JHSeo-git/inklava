# Inklava

A web app that renders Mermaid source with [Pele](https://pele.run/). It includes an editor with line numbers and syntax highlighting, resizable panels, free pan and zoom, and PNG downloads. Drafts are saved in your browser.

Built with React, TypeScript, Vite, shadcn/ui, and CodeMirror. The interface and project documentation are in English.

[Open Inklava](https://inklava.seo-edge.workers.dev)

## Getting started

Requires Bun **1.4.0** and Node.js **24.18.0 or later**.

```sh
bun install --frozen-lockfile
bun run dev
```

Open the local URL printed in your terminal.

## Documentation

- [User guide](docs/usage.md): editing, shortcuts, preview controls, and PNG downloads
- [Development](docs/development.md): tooling, source structure, verification, and design decisions
- [Cloudflare deployment](docs/deployment.md): static asset configuration and local preview
- [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE)
