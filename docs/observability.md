# Service logging and heartbeat

This service uses native NestJS 11 `ConsoleLogger` JSON output to stdout/stderr, with `Logger` context for application events. No Angular logger or application-held Grafana credential is used. HTTP logs contain generated request ID, method, route template, status and duration; bodies, cookies, authorization headers, concrete identifiers and query strings are not logged by the middleware. Health polling is excluded from access logs. Avoid embedding secrets or personal search text in domain log messages.

`GET /health` and HEAD return the anonymous operational Terminus heartbeat with `status: ok` and `heartbeat: up`, plus `Cache-Control: no-store`. This is liveness only; it does not claim MongoDB or upstream readiness. Existing business-route authentication remains enforced. The gateway's exact read-only heartbeat is the only exception to its normalized proxy-envelope requirement. The operational endpoint is excluded from business Swagger/contracts where that service generates them.

Docker probes `/health` every 30 seconds. Deployments bound each container's local JSON log files to 10 MiB × 3. Host Alloy discovers active service names and ships logs and private HTTP heartbeat probe metrics to Grafana Cloud stack `ivorytoffee195`. Collector configuration/dashboard lives in infrastructure owner `nginx-ngx-workshop.io/ops/grafana`; its ingestion token remains host-owned, scoped to logs/metrics write, and requires account authorization before activation. No production credential belongs in this repository.

Validation on 2026-11-21: the isolated observability HTTP suite passed (5 scenarios), build passed, Linux-targeted lockfile dry run passed. Guarded services additionally passed the anonymous-heartbeat/protected-business-route HTTP test. Gateway production ingress e2e passed (51 scenarios), including exact-path/method heartbeat boundaries. Gateway and publisher lint passed. Full existing unit suites passed except Backstage's unchanged Octokit ESM test-loader failure, reproduced on its pre-change HEAD. Uploader tests pass under its documented `npm test` command; its 10 optional cases remain skipped. Publisher persistence e2e cases require the isolated Mongo URI and remain skipped when unavailable. These are local checks, not evidence of Grafana ingestion or live deployment.

Live rollout correction (2026-11-21): health is explicitly public through the auth-client AuthType.None decorator where global authentication guards apply. The BFF legacy text /health handler is removed so only the Terminus JSON route owns that path. Regression HTTP tests include real authentication/role guards or the actual BFF controller.

## Orchestrator domain maintenance (2026-11-22)

The existing middleware still generates UUID request IDs, sets `X-Request-ID`,
logs route templates and excludes GET/HEAD health. It now runs downstream work
inside local AsyncLocalStorage. All incoming request IDs are ignored, even valid
ones; untrusted headers are not copied into domain events. Concurrent asynchronous
requests remain isolated. No cross-service propagation or distributed tracing is
claimed. Work explicitly invoked outside request context has no requestId; async
work spawned inside a request inherits its context even after the response.

MfeRemoteService emits one `mfe_remote_mutation` event per create/update/remove,
with a fresh UUID operationId, optional local requestId, outcome and elapsed
durationMs. Archive/unarchive/status delegate update and do not duplicate events.
Reads retain HTTP access logging without per-record/domain success noise. Success
uses `log`; existing not-found/conflict uses `warn`; storage failures use `error`
and bounded `storage_error` classification. No remote IDs, names, status text,
URLs, overrides, DTOs, raw errors or upstream credentials are logged.

A transport-only BaseExceptionFilter adapter preserves established HttpException,
http-errors-style and generic 500 bodies while avoiding Nest's raw unknown-error
serialization. HTTP failures remain visible through access status/level and the
mutation's safe outcome event; direct service failures retain original identity.
There is no extra duplicate ExceptionsHandler stack/content event.

Native Nest `ConsoleLogger` JSON places structured fields under `message`, with
`context` and `level` at the top level. A representative payload is:

```json
{
  "level": "log",
  "context": "MfeRemoteService",
  "message": {
    "event": "mfe_remote_mutation",
    "operation": "update",
    "operationId": "00000000-0000-4000-8000-000000000001",
    "requestId": "00000000-0000-4000-8000-000000000002",
    "outcome": "success",
    "durationMs": 12
  }
}
```

Native records also carry timestamp/pid. UUIDs are payload fields, not Loki labels.
In Grafana Explore use the infrastructure-owned stream selector, then parse nested
fields, for example:

```text
<existing stream selector>
| json event="message.event", outcome="message.outcome", requestId="message.requestId"
| event="mfe_remote_mutation"
| outcome="failure"
```

Use `requestId="<returned UUID>"` to correlate access and mutation records. This
query structure follows locally captured JSON, not a verified live collector query.
The isolated HTTP suite confirms parseable success/failure records, concurrent
correlation, operation-ID separation, ignored incoming IDs, canary exclusion across
all failure logs, unchanged error bodies and quiet health polls. Existing six
observability unit scenarios still pass.

**External-owner acceptance remains pending:** the infrastructure/Grafana owner
must authorize collector activation, confirm receipt from a disposable successful
and failed mutation, validate nested parsing with the actual stream selector and
confirm heartbeat metrics without health access noise. Mongo/auth live integration
and Node-22 container execution are separate checks. No token, collector replacement
or direct ingestion was added, and no live receipt is claimed.
