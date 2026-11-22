---
date: 2026-11-22
status: Accepted
scope: Fixes where Node.js and Bun runtime-specific APIs live in the monorepo; leaves application features on Web Standards
---

# ADR-0005: Isolated runtime adapter package for Node.js and Bun portability

## Context

The starter targets Node.js 26 LTS by default, but teams adopting the template often switch to Bun or another JavaScript runtime. When Node-specific APIs (`node:http`, `@hono/node-server`, `@hono/node-ws`, `process.on`, or driver-specific pools) are imported directly inside API routes and services, switching runtimes turns into a codebase-wide refactor.

What constrains the choice:

- Hono, `better-auth`, Drizzle ORM, and modern Node.js 26 all support standard Web APIs (`fetch`, `Request`, `Response`, `URL`, `Web Crypto`, `ReadableStream`).
- Production API and worker containers run on `platformatic/node-caged:26-slim`.
- WebSocket upgrades, HTTP server bootstrap, graceful shutdown, and PostgreSQL driver initialization differ between Node.js and Bun.

## Considered options

- **Direct Node.js imports inside `apps/api`**. Rejected: scatters Node-only modules across feature code and prevents swapping runtimes without editing core app files.
- **Custom wrapper abstractions over every Web API**. Rejected: duplicates Web Standards already shared by Node.js 26 and Bun and increases reader load.
- **Dedicated `packages/runtime` adapter package with conditional `node` and `bun` exports**. Chosen. Adds one thin boundary package that entrypoint binaries import to boot the server and wire drivers.

## Decision

Create a workspace package `packages/runtime` that exposes a minimal runtime adapter interface for HTTP server start and graceful stop, WebSocket upgrade wiring (`@hono/node-ws` for Node.js, `hono/bun` for Bun), PostgreSQL client factory, and environment loading. Publish conditional `package.json` exports for `"node"` and `"bun"` so entrypoints select the runtime implementation automatically.

Keep `apps/api` restricted to Web Standard APIs and enforce this boundary with an Oxlint restricted-imports rule blocking direct `node:*` imports outside `packages/runtime` and test helpers.

## Consequences

### Positive

- Running `apps/api` on Bun requires switching the entrypoint runtime without modifying feature routes, services, or schemas.
- `app.fetch(request)` works identically in Vitest integration tests, Node.js, and Bun.

### Negative

- Adding a new host capability (such as filesystem access or custom TLS sockets) requires extending the `packages/runtime` interface first.

### Neutral

- OpenTelemetry SDK auto-instrumentation remains wired in the Node.js entrypoint inside `packages/runtime` so non-Node runtimes can provide their own telemetry bootstrap.
