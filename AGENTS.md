# Agent entry point — service-mfe-orchestrator

This repository owns micro-frontend remote configuration and composition metadata. Work from this checkout; sibling source is
not required.

Read [.specify/memory/constitution.md](.specify/memory/constitution.md),
[architecture](docs/architecture.md), [development](docs/development.md),
[workflow](.specify/README.md) and the [feature index](specs/README.md) before edits.

- Inspect source and git status; preserve unrelated work and historical specs.
- Keep feature spec, plan, tasks and handoff aligned; mark complete with evidence.
- Preserve public contracts and access policies. Generate contracts from source.
- Keep controllers thin, providers cohesive and module exports intentional.
- Use owner-service APIs; do not couple to another service's collections.
- Keep remote registration, domain filtering, structural overrides, archive and state semantics coherent. Preserve public reads and guarded mutation policies as actually implemented.
- Reuse existing structured logging; read [observability](docs/observability.md).
- Verify changed behavior and distinguish local tests from live integration.
- Resolve routine choices; ask only for consequential missing decisions.

This is a Spec Kit-inspired Markdown setup, not an installed Spec Kit CLI.

## Selected work: Code Maintenance

The selected work is [Code Maintenance](specs/001-code-maintenance/spec.md)
(implemented and locally verified; baseline lint/external checks pending).
Read its [plan](specs/001-code-maintenance/plan.md), [tasks](specs/001-code-maintenance/tasks.md) and
[handoff](specs/001-code-maintenance/handoff.md). Review recorded evidence and owner
actions; retain older unfinished feature records without treating them as the next
task. The completed implementation covers
NestJS module/domain boundaries, thin controllers, cohesive services, Prettier
with Husky/lint-staged, CI checks and safe domain logging through existing
observability. Full lint debt and live/Node-22 container acceptance remain explicit
limits. No next feature has been selected; do not restart completed tasks blindly.

Current deployment policy: [deployment-workflows](docs/deployment-workflows.md). Automatic main delivery verifies/deploys; npm publication is manual only. This supersedes older automatic-publishing instructions.
