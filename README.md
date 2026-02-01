# Webservice MFE Orchestrator

<p align="center">
<img src="https://github.com/Ngx-Workshop/.github/blob/main/readme-assets/nestjs-logo.webp?raw=true" height="84" alt="Nest Logo" />
</p>
<p align="center">
<img src="https://github.com/Ngx-Workshop/.github/blob/main/readme-assets/mongodb-logo.svg?raw=true" height="84" alt="MongoDB Logo" />
</p>

NestJS service that manages “MFE Remotes” metadata for the NGX Workshop platform. It provides CRUD APIs backed by MongoDB, enforces authentication/authorization for write operations, and generates an OpenAPI contract consumed by the typed contracts package.

## What this service does

- Stores and serves MFE Remote registry entries (remote entry URL, type, structural overrides, status, etc.).
- Exposes a REST API for listing, lookup by ID/name, create/update, archive, and status updates.
- Generates OpenAPI spec at build time and publishes TypeScript contracts in the contracts workspace.

## Tech stack

- NestJS 11
- MongoDB via Mongoose
- Auth via `@tmdjr/ngx-auth-client` (JWT-based guards)
- OpenAPI via `@nestjs/swagger`

## Architecture overview

### High-level flow

1. HTTP requests hit `MfeRemoteController` endpoints under `/mfe-remotes`.
2. Guards from `@tmdjr/ngx-auth-client` enforce auth/roles for mutating routes.
3. `MfeRemoteService` performs CRUD via the Mongoose model.
4. Mongoose schema hooks auto-increment `version` on updates.

### Modules and responsibilities

- `AppModule` initializes configuration, database connection, and feature modules.
- `MfeRemoteModule` wires controller, service, schema, and auth guards.
- `contracts/orchestrator` generates and publishes TypeScript types from OpenAPI.

### Data model

`MfeRemote` (MongoDB collection) includes:

- `name` (unique)
- `remoteEntryUrl`
- `type` (`structural` | `user-journey`)
- `structuralOverrides` (header/nav/footer override modes)
- `structuralSubType` (header/nav/footer)
- `version` (auto-incremented on updates)
- `status`, `description`, `lastUpdated`, `archived`
- `useRoutes`, `requiresAuth`, `isAdmin`

### API surface (summary)

Base path: `/mfe-remotes`

- `GET /mfe-remotes` (public) — list, optional `?archived=true|false`
- `GET /mfe-remotes/:id` (public) — get by id
- `GET /mfe-remotes/name/:name` (public) — get by name
- `POST /mfe-remotes` (admin) — create
- `PATCH /mfe-remotes/:id` (admin) — update
- `DELETE /mfe-remotes/:id` (admin) — delete
- `PATCH /mfe-remotes/:id/archive` (admin) — archive
- `PATCH /mfe-remotes/:id/unarchive` (admin) — unarchive
- `PATCH /mfe-remotes/:id/status` (admin) — update status

## Getting started

### Prerequisites

- Node.js 22+
- MongoDB (local or remote)

### Environment variables

Create a `.env` file in the project root. Example:

```
PORT=3005
MONGODB_URI=mongodb://localhost:27017/workshop-viewer
AUTH_BASE_URL=http://localhost:3005
```

Notes:

- `PORT` defaults to `3001` if not set.
- `MONGODB_URI` is required for normal runtime.

### Install and run

```
npm ci
npm run start:dev
```

### Build and generate OpenAPI

```
npm run build
```

The build runs `postbuild` which generates `openapi.json` via [src/swagger.ts](src/swagger.ts).

### Generate contracts

```
npm run contracts:orchestrator:gen
npm run contracts:orchestrator:build
```

### Docker

```
docker compose -f "docker-compose.yml " up --build
```

Note: the compose file uses an external Docker network named `ngx-net`.

## Project structure

```
src/
	app.module.ts
	main.ts
	swagger.ts
	mfe-remote/
		mfe-remote.controller.ts
		mfe-remote.service.ts
		mfe-remote.module.ts
		dto/
		schemas/
contracts/
	orchestrator/
```

## Development notes

- OpenAPI generation sets `GENERATE_OPENAPI=true` so DB connections and guards are stubbed to avoid external dependencies.
- Validation is enforced globally with `ValidationPipe` (whitelisting and forbidding extra fields).

## License

UNLICENSED
