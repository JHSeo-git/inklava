# Cloudflare deployment

[Getting started](../README.md) · [Development](development.md)

```sh
bun run build
bun run preview:cloudflare    # Local Wrangler server: http://localhost:8787
```

`wrangler.jsonc` serves `dist/` through Workers Static Assets. There is no Worker server code. Locally, verify the root page, reloads, the client-side message for `/missing`, and responses for actual JavaScript and CSS assets.

Cloudflare's `single-page-application` setting returns `index.html` for every unmatched path. Local Wrangler verification also confirmed that **a nonexistent `/assets/missing.js` returns HTML with status 200**. This is a limitation of the current assets-only deployment. Returning 404 for missing assets would require separate Worker routing. See the [official SPA routing documentation](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/).

When deployment is requested, authenticate the Cloudflare account, confirm the Worker name and domain, and run `bun run deploy`. This command builds the app and deploys it externally. Only local verification has been completed; the project has not been deployed to Cloudflare.
