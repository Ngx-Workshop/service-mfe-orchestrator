# Handoff: Code Maintenance

Status: Implemented and locally verified; baseline lint/external checks pending · Updated: 2026-11-22
[Spec](spec.md) · [Plan](plan.md) · [Tasks](tasks.md)

## Delivered

- Source-backed [audit](audit.md) and dependency map, baseline HEAD `b5cbebb`.
- AppModule owns global auth/role guards via existing providers. Remote module
  remains cohesive/private; controller, DTOs and persisted schema stay unchanged.
- Pinned Husky/lint-staged, guarded package-only-safe prepare, staged Prettier,
  generated/private ignores, non-mutating format/lint scripts and PR/main CI checks.
- Exact existing auth-client version moved into runtime dependencies.
- Local async request IDs and bounded contextual mutation JSON. Safe HTTP exception
  adaptation retains error bodies and service error identity, avoiding raw duplicate
  exception logs. Reads/health/access behavior is preserved.
- Isolated real-module HTTP tests replace the obsolete Hello World scaffold.
- Updated architecture, development, observability and workflow status docs.

## Verification

Local Node `24.9.0`, npm `11.6.0`; Nest common `11.1.3`, Prettier `3.6.2`,
ESLint `9.30.0`, TypeScript `5.8.3`. No framework/runtime upgrade.

- `npm test -- --runInBand`: 18 unit tests pass.
- `npm run test:e2e -- --runInBand`: 17 HTTP/domain cases pass with real application
  module/guard wiring, isolated model and auth doubles. Initial 13 characterization
  cases passed before guard refactoring.
- `npm run build`: passes; OpenAPI postbuild output unchanged.
- `npm run format:check`: passes.
- Targeted ESLint over changed remote service/module, observability and e2e paths:
  passes (exact command in audit).
- `npm run check:workflow`: passes actual clean developer, CI, package-only/no-Git
  and production/no-dev installs, production auth loading, real staged formatting,
  partial/other unstaged preservation, failed-hook blocking and non-mutating
  negative formatting check. Temporary fixtures are cleaned.
- `git diff --check` and public definition/OpenAPI diff checks: pass.

**Baseline failure, not a pass:** full `npm run lint:check` has 16 existing errors
and 4 warnings, down from 22 errors/4 warnings. Remaining debt is the existing
Mongo factory, bootstrap typing/promise, version-hook types, domain-test mocks and
Swagger error typing. These unrelated behaviors were not rewritten or excluded.
The new strict CI job remains red until this debt is addressed.

## Acceptance and external-owner handoffs

- AC-001: local source/guard/DTO/domain/storage-double characterization verified.
  Real Mongo persistence/version/concurrency and live remote auth are not claimed.
- AC-002/003: disposable real hook/install fixtures verified. Actual Docker engine
  is unavailable; Docker-style npm ordering is verified, not an image build.
  Supported Node-22 execution and GitHub-hosted CI are still rollout checks.
- AC-004: native JSON success/failure/redaction, independent request/operation IDs,
  error response equivalence and quiet health verified locally. No distributed
  tracing or live Grafana receipt is claimed.
- AC-005: required checks executed with baseline debt/limits recorded explicitly.

Repository owner: resolve recorded lint debt before expecting green CI; review
the new standalone checks workflow and choose branch-protection requirements.
The existing deploy/publish workflow was not changed or triggered by this task.
With a disposable database and auth fixture, run real persistence and auth
integration and a Node-22 Docker build/heartbeat check before rollout.

Infrastructure/Grafana owner: authorize existing Alloy ingestion, verify a
disposable success/failure event and nested `message` parsing, then confirm heartbeat
metrics/no health log noise. Tokens and collector configuration remain owner-held.
See [observability](../../docs/observability.md) for query guidance and limits.

No API/schema migration or consumer publication is required. No target-repository
commit, push, publish or deployment was performed. Original unrelated setup files
were preserved; no next feature is selected. Review these changes and perform the
explicit external checks above rather than restarting completed tasks blindly.
