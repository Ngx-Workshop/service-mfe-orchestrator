# Development — service-mfe-orchestrator

Baseline: `b5cbebb`; maintenance verified locally on 2026-11-22. Use `package-lock.json` and `npm ci`; inspect the
Dockerfile and CI for the supported Node runtime. Do not upgrade NestJS/Node as
an incidental maintenance change.

## Existing npm scripts

| Script                           | Command                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `build`                          | `nest build`                                                                                           |
| `format`                         | `prettier --write "src/**/*.ts" "test/**/*.ts"`                                                        |
| `start`                          | `nest start`                                                                                           |
| `start:dev`                      | `nest start --watch`                                                                                   |
| `start:debug`                    | `nest start --debug --watch`                                                                           |
| `start:prod`                     | `node dist/main`                                                                                       |
| `lint`                           | `eslint "{src,apps,libs,test}/**/*.ts" --fix`                                                          |
| `test`                           | `jest`                                                                                                 |
| `test:watch`                     | `jest --watch`                                                                                         |
| `test:cov`                       | `jest --coverage`                                                                                      |
| `test:debug`                     | `node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand` |
| `test:e2e`                       | `jest --config ./test/jest-e2e.json`                                                                   |
| `openapi`                        | `node dist/swagger.js`                                                                                 |
| `postbuild`                      | `node dist/swagger.js`                                                                                 |
| `contracts:orchestrator:gen`     | `npm --prefix ./contracts/orchestrator run gen`                                                        |
| `contracts:orchestrator:build`   | `npm --prefix ./contracts/orchestrator run build`                                                      |
| `contracts:orchestrator:publish` | `npm --prefix ./contracts/orchestrator publish --access public`                                        |

`lint` and `format` mutate files; use these non-mutating checks:

```sh
npm ci
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
npm run format:check
npm run lint:check
npm run check:workflow
```

Husky `9.1.7` and lint-staged `15.5.2` are pinned. Developer `npm ci` enables
`.husky/pre-commit`, which invokes the local lint-staged binary (no commit-time
download). Prettier formats supported staged TS/JS/JSON/YAML/Markdown files only.
lint-staged's default stash/hide behavior preserves partially staged and unrelated
unstaged edits; do not disable it. Formatting failures block commit.

The manifest's self-contained prepare skips CI, `HUSKY=0`, production/no-dev and
no-Git installs. Docker's package-only install ordering needs no extra copied script.
The auth client keeps its exact version but is now a runtime dependency.
`check:workflow` performs actual clean developer/CI/package-only/production installs
and Git hook/partial-staging/negative-check tests in disposable temporary fixtures.
It commits only inside those fixtures, removes them on exit and requires npm
registry/cache access. Production verification also loads the auth client.

`format:check` gates existing-clean runtime/test TypeScript and explicitly named
tooling files, not every historical document/asset. Staged formatting additionally
supports documentation and YAML. `.prettierignore` excludes generated contracts,
OpenAPI, lockfiles, outputs, vendored assets and private configuration. No blanket
source/document formatting baseline rewrite was performed.

The new `checks.yml` runs non-mutating gates, unit/isolated HTTP tests, build and
workflow verification on PRs/main. It does not change the existing deployment
workflow or branch protection. Lint stays strict: remaining baseline errors make
this job red, rather than being silently allowed. Repository owners should resolve
that debt before requiring a green check in branch protection.

## Runtime and verification

Inspect configuration reads in `src/`, Docker and workflow files for required
environment variables; never print or commit `.env` credentials. Use existing
local-development documentation and isolated data where available. Read
[observability.md](observability.md), existing security/deployment docs and previous
feature specs before touching runtime behavior.

Local Node `24.9.0`/npm `11.6.0` verified 18 unit tests and 17 isolated application
HTTP/domain tests, build/OpenAPI (unchanged output), formatting and four clean
install modes. Docker/CI still target Node 22; actual container execution is blocked
because the Docker daemon is unavailable. The replaced e2e scaffold previously
expected a nonexistent Hello World route and leaked handles; the current suite uses
the real module/guard graph with model/auth doubles and closes the application.

Full `lint:check` retains 16 baseline errors and 4 warnings (down from 22 errors),
in the existing Mongo factory, bootstrap, schema hooks, Swagger catch and domain
test mocks. Changed service/module/observability/e2e paths pass targeted lint.
See [handoff](../specs/001-code-maintenance/handoff.md) for exact commands and limits.
No live Mongo/auth/Grafana ingestion, paid provider calls or production writes were
used as tests.

Deployment and npm publication now follow [deployment-workflows](deployment-workflows.md).
