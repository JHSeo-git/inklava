# GitHub Actions deployment research

Checked on 2026-11-02 against Cloudflare, GitHub, and Bun documentation and the official action's release and source code.

## Recommendation

Use GitHub Actions with Cloudflare's official `cloudflare/wrangler-action` after the project's existing checks and build pass. Cloudflare documents this exact approach for pushes to `main`. It fits the requested GitHub workflow and preserves the existing Workers Static Assets deployment. The sources establish an official, maintained approach; they do not provide market-share data proving which deployment method is used most. [Cloudflare GitHub Actions guide](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)

## Options considered

| Approach                                   | Fit for Inklava                                                                                                                                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workers Builds with native Git integration | Cloudflare can connect the existing Worker to GitHub and build and deploy on push. It requires configuring the Git integration and its build settings in Cloudflare. A valid alternative, but adds a second deployment system if GitHub Actions also deploys. |
| Official Wrangler GitHub Action            | Cloudflare's documented GitHub Actions integration. Supports Bun and reuses the repository's installed Wrangler. Recommended for this request.                                                                                                                |
| Run pinned Wrangler directly               | A shell step can run the installed CLI with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. This avoids the wrapper action, but the official action provides the requested standard integration and deployment URL output.                                |

Sources: [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [external CI/CD](https://developers.cloudflare.com/workers/ci-cd/external-cicd/), [Wrangler Action README](https://github.com/cloudflare/wrangler-action/blob/v4.1.3/README.md).

## Versions and Bun support

The latest stable action release checked was **v4.1.3**, published **2026-09-24**, resolving to commit `953926a2e2182532811c01a25e53647d93bf07c0`. Its manifest runs on Node 24. The repository was active on 2026-11-01 and had approximately 2,000 stars; these indicate maintenance and adoption, not a deployment-method ranking. [Release](https://github.com/cloudflare/wrangler-action/releases/tag/v4.1.3), [manifest](https://github.com/cloudflare/wrangler-action/blob/v4.1.3/action.yml), [repository](https://github.com/cloudflare/wrangler-action)

The action accepts `packageManager: bun` and recognizes `bun.lock`. After `bun install --frozen-lockfile`, omitting `wranglerVersion` reuses the installed Wrangler, keeping `package.json` and `bun.lock` as the version source of truth. Bun's guide documents `oven-sh/setup-bun` for installing Bun in Actions. Pin action references to full commit SHAs, as GitHub recommends. [Package-manager source](https://github.com/cloudflare/wrangler-action/blob/v4.1.3/src/packageManagers.ts), [Wrangler version resolution](https://github.com/cloudflare/wrangler-action/blob/v4.1.3/src/wranglerAction.ts), [Bun CI guide](https://bun.sh/guides/runtime/cicd), [GitHub secure-use reference](https://docs.github.com/en/actions/reference/security/secure-use)

## Authentication

CI needs an API token and account ID; an interactive local Wrangler OAuth login does not configure a GitHub runner. Store the token in GitHub Actions secrets. The inspected action release and Cloudflare CI guide document token authentication, not a supported GitHub OIDC exchange, so this implementation should use the documented token flow. [Cloudflare CI authentication](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), [action authentication inputs](https://github.com/cloudflare/wrangler-action/blob/v4.1.3/action.yml)

For the existing `inklava` Worker, current granular authorization supports an **account-owned API token with Workers Editor scoped to that Worker**. Creating a new Worker requires product-level Admin; updating an existing Worker does not. Routes or custom-domain changes additionally require the relevant zone's Workers Routes Write permission. Inklava uses an existing `workers.dev` Worker without these route changes, so avoid adding unrelated KV, R2, DNS, or Pages permissions. Legacy Workers Scripts Edit tokens continue to work but grant broader account-level access. [Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/), [granular Wrangler authorization](https://developers.cloudflare.com/workers/authorization/)

## Workflow scope

Deploy only after successful verification on a push to `main`; allow a manual run restricted to `main` for recovery. Preserve the repository's Bun and Node versions, use a frozen lockfile, serialize production deployments, and keep Cloudflare credentials out of validation steps. This is the project-specific application of the documented deployment flow, rather than a claim that every project needs the same pipeline.
