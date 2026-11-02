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

## Automatic deployment

[Deploy to Cloudflare](../.github/workflows/deploy.yml) runs on every push to `main`. It installs the versions from `.node-version` and `.bun-version`, installs dependencies with `bun install --frozen-lockfile`, and runs `bun run check`. Only a successful check and build can reach the deployment step.

The workflow uses Cloudflare's official `wrangler-action` with Bun and the Wrangler version already installed from `package.json` and `bun.lock`. Actions are pinned to full commit SHAs. Production deployments share one concurrency group and running deployments are allowed to finish. After deployment, the workflow fetches the live HTML and compares it with this run's `dist/index.html`, retrying briefly for propagation. A verification failure means the deployment needs investigation; it does not automatically roll back the Worker.

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

Runs dispatched from other branches are skipped. Check the exact run's commit and logs before rerunning a failed deployment. The workflow does not configure custom domains or Cloudflare's separate Workers Builds Git integration. Keep one automatic deployment pipeline for this Worker. See the [deployment research](research/github-actions-deployment.md) for alternatives and official sources.

## Deploying manually

This project uses Wrangler and `wrangler.jsonc`. The separate `cf` CLI can inspect account resources, but its OAuth login does not authenticate Wrangler. Use the project's pinned Wrangler through Bun:

```sh
bunx wrangler whoami
bunx wrangler login           # Only if Wrangler is not authenticated
bun run deploy               # Build and deploy to the configured Worker
bunx wrangler deployments status
```

Confirm the account and the `inklava` Worker before deploying. `bun run deploy` publishes the current build to the live site. Verify the returned URL after deployment. A custom domain has not been configured. See [using cf alongside Wrangler](https://developers.cloudflare.com/cf/wrangler/#use-cf-alongside-a-wrangler-project).
