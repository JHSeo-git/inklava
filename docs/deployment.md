# Cloudflare deployment

[Getting started](../README.md) · [Development](development.md)

## Live deployment

The app is available at [inklava.seo-edge.workers.dev](https://inklava.seo-edge.workers.dev). It was first deployed on 2026-10-29 from commit `27e7f06` as the `inklava` Worker using Workers Static Assets.

Production checks verified that HTML, JavaScript, and CSS match the local build, and that rendering, PNG downloads, draft restoration after reload, and client-side routing work in Chromium.

## Local preview

```sh
bun run build
bun run preview:cloudflare    # Local Wrangler server: http://localhost:8787
```

`wrangler.jsonc` serves `dist/` through Workers Static Assets. There is no Worker server code. Locally, verify the root page, reloads, the client-side message for `/missing`, and responses for actual JavaScript and CSS assets.

Cloudflare's `single-page-application` setting returns `index.html` for every unmatched path. Local Wrangler verification also confirmed that **a nonexistent `/assets/missing.js` returns HTML with status 200**. This is a limitation of the current assets-only deployment. Returning 404 for missing assets would require separate Worker routing. See the [official SPA routing documentation](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/).

## Deploying updates

This project uses Wrangler and `wrangler.jsonc`. The separate `cf` CLI can inspect account resources, but its OAuth login does not authenticate Wrangler. Use the project's pinned Wrangler through Bun:

```sh
bunx wrangler whoami
bunx wrangler login           # Only if Wrangler is not authenticated
bun run deploy               # Build and deploy to the configured Worker
bunx wrangler deployments status
```

Confirm the account and the `inklava` Worker before deploying. `bun run deploy` publishes the current build to the live site. Verify the returned URL after deployment. A custom domain and Git-triggered automatic deployments have not been configured. See [using cf alongside Wrangler](https://developers.cloudflare.com/cf/wrangler/#use-cf-alongside-a-wrangler-project).
