# Cloudflare deployment

[Getting started](../README.md) · [Development](development.md)

## Live deployment

The `inklava` Worker serves the app at [inklava.seo-edge.workers.dev](https://inklava.seo-edge.workers.dev) using Workers Static Assets.

## Local preview

```sh
bun run build
bun run preview:cloudflare    # Local Wrangler server: http://localhost:8787
```

`wrangler.jsonc` serves `dist/` through Workers Static Assets. There is no Worker server code. Locally, verify the root page, reloads, the client-side message for `/missing`, and responses for actual JavaScript and CSS assets.

SPA fallback returns `index.html` for unmatched paths, including missing assets such as `/assets/missing.js`, with status 200. Returning 404 for missing assets requires separate Worker routing. See [SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/).

## Automatic deployment

[Deploy to Cloudflare](../.github/workflows/deploy.yml) runs on every push to `main`. It installs the versions from `.node-version` and `.bun-version`, installs dependencies with `bun install --frozen-lockfile`, and runs `bun run check`. Only a successful check and build can reach the deployment step.

The workflow uses Cloudflare's official `wrangler-action` and the installed Wrangler version. Actions are pinned to commit SHAs, and production deployments run one at a time. After deployment, it compares the live HTML with `dist/index.html`. Verification failures do not automatically roll back the Worker.

### One-time authentication setup

Add these [repository secrets](https://github.com/JHSeo-git/inklava/settings/secrets/actions):

| Secret                  | Value                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | An account-owned API token with Workers Editor access scoped to the existing `inklava` Worker. |
| `CLOUDFLARE_ACCOUNT_ID` | The account ID shown by `bunx wrangler whoami`.                                                |

Create the token in Cloudflare's [Account API tokens](https://dash.cloudflare.com/?to=/:account/api-tokens) page. Scope it to the deployment account and the existing Worker. This assets-only deployment does not need KV, R2, Pages, or DNS permissions. See [Workers permissions](https://developers.cloudflare.com/workers/authorization/workers/). Local Wrangler OAuth credentials are not used by GitHub Actions.

Set secret values through the GitHub settings page or the CLI's hidden prompt; do not paste tokens into chat, commands, or committed files:

```sh
gh secret set CLOUDFLARE_API_TOKEN --repo JHSeo-git/inklava
gh secret set CLOUDFLARE_ACCOUNT_ID --repo JHSeo-git/inklava
```

### Manual runs and failures

Use the workflow's **Run workflow** button with `main` selected, or run:

```sh
gh workflow run deploy.yml --ref main
```

Runs dispatched from other branches are skipped. Check the exact run's commit and logs before rerunning a failed deployment. Avoid enabling Cloudflare Workers Builds alongside this workflow to prevent duplicate deployments. See the [deployment research](research/github-actions-deployment.md) for alternatives.

## Deploying manually

Use the project's pinned Wrangler:

```sh
bunx wrangler whoami
bunx wrangler login           # Only if Wrangler is not authenticated
bun run deploy               # Build and deploy to the configured Worker
bunx wrangler deployments status
```

`bun run deploy` publishes to the live site. Confirm the account and Worker before running it, then verify the returned URL.
