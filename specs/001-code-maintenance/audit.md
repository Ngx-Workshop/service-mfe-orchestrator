# Code Maintenance audit

Inspected 2026-11-22, HEAD `b5cbebb`. Initial worktree contains only untracked
workflow/context setup files; preserve them. Parent entry points named by the
workspace instruction are absent; the checkout's AGENTS.md and specs index apply.

## T001 baseline

- Local Node `24.9.0`, npm `11.6.0`; deployment targets Node 22 (no upgrade planned).
- `npm test -- --runInBand`: 2 suites, 18 tests pass.
- `npm run build`: passes, including source-generated OpenAPI postbuild.
- `npx --no-install eslint "{src,apps,libs,test}/**/*.ts"`: 22 errors,
  4 warnings. Existing unsafe Mongoose update/error types, async-without-await
  factories/stubs, cookie-parser typing, Swagger error typing and domain-test mocks.
- `npx --no-install prettier --check "src/**/*.ts" "test/**/*.ts"`: passes.
- `npm run test:e2e -- --runInBand`: obsolete scaffold expects `/` to return
  Hello World, receives 404; leaves application handles open. Stopped after failure.
  Replace this fixture with isolated real-route characterization before refactoring.
- No live Mongo/auth/Grafana verification is authorized or claimed.

## T002 dependency and ownership map

- `src/app.module.ts`: composition root; intentional global ConfigModule,
  async Mongo connection (5-second selection timeout), MfeRemoteModule and
  ObservabilityModule. OpenAPI bypasses Mongo via GENERATE_OPENAPI.
- `src/mfe-remote/mfe-remote.module.ts`: owns controller, service and only the
  MfeRemote collection. No exports. Also installs application-global guards
  using useClass despite imported NgxAuthClientModule already providing them.
- `src/mfe-remote/mfe-remote.controller.ts`: thin transport/Swagger/DTO adapter.
  Public GETs; Admin-only mutations. Archived query accepts true/false and ignores
  other strings. Domain uses ParseEnumPipe. Status endpoint accepts raw status.
- `src/mfe-remote/mfe-remote.service.ts`: cohesive collection use cases; preserves
  duplicate-key -> 409, missing -> 404, other persistence errors propagate.
  Archive/unarchive/status delegate update; no upstream calls here.
- `src/mfe-remote/schemas/mfe-remote.schema.ts`: defaults, enums, structural
  metadata, and version increment on update queries. Explicit empty domains differ
  from omitted legacy membership. No foreign collection ownership.
- DTO validation uses whitelist/forbidNonWhitelisted at bootstrap; structural
  override object is not nested-validated. Preserve that existing contract.
- Auth-client owns token validation HTTP calls. Do not log its payloads or modify
  its installed implementation.
- ObservabilityModule owns public Terminus liveness. Middleware owns JSON access
  events but does not propagate context into async services.
- Dependencies are acyclic. No god service, extra repository abstraction,
  async migration, DTO/schema or route rewrite is justified.

## Findings and selected scope (before runtime edits)

1. **P1** Global guard setup belongs in AppModule, not the remote feature. Move
   auth import/APP_GUARD registration there and reuse existing guard providers.
   Characterize actual public/admin behavior using real guards and an auth double.
2. **P1** Mutation outcomes are not logged/correlated. Add one bounded event per
   create/update/delete (archive/status already delegate update), UUID operation ID,
   local request AsyncLocalStorage context, durations and safe failure categories.
   Do not export IDs, names, status/body text or raw errors. Keep read access logs
   and avoid noisy per-record events; there is no owned upstream adapter to log.
3. **P1** Missing hooks/CI gates. Pin Node-22-compatible Husky/lint-staged, use
   self-contained guarded prepare for package-only installs, exclude generated
   assets, and verify with disposable Git/install fixtures.
4. **P2** Existing lint drift must not be hidden by a weakened gate. Fix errors
   in touched service/module/test paths; unrelated main/schema/Swagger lint errors
   remain documented baseline debt. CI formatting must pass; lint remains strict.
5. **P2** E2E scaffold is neither isolated nor representative. Replace it with
   contract tests using the real module graph, model doubles and auth guard double.
6. **P1** The runtime-imported auth client is currently a devDependency. Move the
   exact existing version to dependencies so the required no-dev install can resolve
   application guard imports. This changes packaging only, not access policy.
7. **P1** Failure characterization exposes Nest's default ExceptionsHandler raw
   exception serialization in addition to safe domain/access events. At the HTTP
   boundary, delegate HttpExceptions unchanged and translate unknown failures into
   the same existing response body before delegating to BaseExceptionFilter.
   This prevents raw stacks/content and redundant exception logs, without changing
   thrown service errors or public error/status semantics.

## Compatibility / constitution

All six principles apply. No deviation: retain ownership, thin controllers,
minimal exports, persisted representation, public reads, guarded writes,
HTTP/health behavior and collection failure/concurrency semantics. Logging context
is local only; ignore incoming request IDs rather than trusting arbitrary headers.
No framework upgrade, migration, publication, deployment or sibling source needed.
Live ingestion and real Mongo/auth checks remain external-owner acceptance.

## Recorded implementation and final evidence

T003 ran the 13-case isolated real-module HTTP characterization successfully
**before** moving guard wiring. Final HTTP/domain suite has 17 cases, including
native JSON capture, concurrent context, canary failures and HTTP error equivalence.
No service/controller/schema/API behavior was intentionally broadened.

Verified commands on 2026-11-22:

| Command                                                                                                                                                    | Actual result                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `npm test -- --runInBand`                                                                                                                                  | 2 suites, 18 tests pass                                         |
| `npm run test:e2e -- --runInBand`                                                                                                                          | 1 isolated suite, 17 tests pass; closes app                     |
| `npm run build`                                                                                                                                            | passes; postbuild regenerates OpenAPI                           |
| `npm run format:check`                                                                                                                                     | passes; no source-wide rewrite                                  |
| `npx --no-install eslint src/mfe-remote/mfe-remote.service.ts src/mfe-remote/mfe-remote.module.ts src/observability/observability.ts test/app.e2e-spec.ts` | passes                                                          |
| `npm run lint:check`                                                                                                                                       | fails with 16 existing errors, 4 warnings                       |
| `npm run check:workflow`                                                                                                                                   | passes twice; final run includes production auth-client loading |
| `git diff --exit-code -- openapi.json`                                                                                                                     | passes; generated API unchanged                                 |
| `git diff --exit-code -- openapi.json src/mfe-remote/dto src/mfe-remote/schemas src/mfe-remote/mfe-remote.controller.ts`                                   | passes; definitions/access metadata unchanged                   |
| `git diff --check`                                                                                                                                         | passes                                                          |
| `docker version --format '{{.Server.Version}}'`                                                                                                            | blocked: daemon unavailable                                     |

`check:workflow` uses real npm ci in four temporary directories: developer with
Git/hooks, CI with Git/no hooks, Docker-style package-only/no Git, production
`--omit=dev` with Git/no Husky. It runs the real pre-commit hook, verifies formatted
committed content with preserved partial/other unstaged edits, verifies hook failure
does not advance HEAD, verifies the CI formatting command rejects an unformatted
file without changing bytes, and checks generated-file exclusion. Fixtures and their
commits are removed on exit. Target checkout hooks are enabled via core.hooksPath.

Full lint debt remains in untouched logic: app.module Mongo factory (1 error),
main cookie-parser (1), existing domain mock (1), schema hooks (12), Swagger catch
(1); four existing warnings remain. No new errors in changed runtime/test logic.
The CI job intentionally does not mask this baseline and will fail until resolved.
Local Node 24 checks are not Node-22/container execution or a GitHub Actions run.
No live Mongo/auth/Grafana check, contract publication or deployment was performed.
