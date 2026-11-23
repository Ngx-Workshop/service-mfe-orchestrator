# Architecture — service-mfe-orchestrator

Baseline inspected: `b5cbebb`; maintenance locally verified on 2026-11-22.

## Ownership

Micro-frontend remote configuration and composition metadata. Keep remote registration, domain filtering, structural overrides, archive and state semantics coherent. Preserve public reads and guarded mutation policies as actually implemented.

## Source map

- `src/app.module.ts`
- `src/main.ts`
- `src/mfe-remote`
- `src/observability`
- `src/swagger.ts`

`src/app.module.ts` is the application composition root. It imports the intentional
global ConfigModule, Mongo connection, auth-client, remote and observability modules.
Application-wide AuthenticationGuard and RolesGuard reuse imported providers via
`useExisting`, in that order. They are no longer registered by the remote feature.

`MfeRemoteModule` owns only its controller, service and MfeRemote collection
registration; it exports nothing. The controller adapts HTTP/Swagger/validation;
the cohesive service owns registration, lookups and mutations. Archive/unarchive/
status delegate update. The schema retains version increments, structural metadata,
defaults and explicit-versus-legacy domain membership. No foreign collections,
circular dependencies, repository layer or async-pattern migration were added.

OpenAPI generation skips Mongo and injects an inert model token. No real or fake
successful persistence operation may run during generation. Auth guards are not
bypassed; schema generation does not execute request handlers.

`src/observability/` provides structured HTTP logging and heartbeat support;
[observability.md](observability.md) records the collector contract and limits.
Stateless observability helpers provide local AsyncLocalStorage request context,
not an injected global module. The transport-only exception filter preserves
HttpException/http-errors/generic failure bodies, suppressing raw duplicate error
serialization. Domain service errors still propagate unchanged (except the existing
create/update duplicate-key mapping).

## External boundaries

Use installed dependencies in `package.json` and actual source imports as the
baseline for HTTP clients, auth and persistence. Inspect source, DTOs and existing
specs for current access/error policy. `test/`, when present, contains integration
configuration; generated artifacts are outputs, not the contract source.

Public remote reads and anonymous GET/HEAD liveness remain public. All six remote
mutation routes retain Admin policy. Whitelist validation, archived query parsing,
domain enum rejection, status-body behavior and persisted schemas are unchanged.
The exact existing auth-client version now belongs to runtime dependencies.

See the source-backed [audit](../specs/001-code-maintenance/audit.md) and
[handoff](../specs/001-code-maintenance/handoff.md) for regressions, baseline lint
debt and external acceptance. This is a targeted maintenance audit, not a full
security audit or evidence of live Mongo/auth/Grafana integration.

Generated deployment orchestration is centrally managed by the Node CLI; see [deployment-workflows](deployment-workflows.md).
