---
name: verify-project
description: 'Verify nodejs-fullstack-starter across static checks, coverage tests, production builds, Docker targets, Terraform validation, and live HTTP and database probes. Use before opening a PR or cutting a release.'
---

# Verify nodejs-fullstack-starter

Climb the verification ladder for `nodejs-fullstack-starter` and record every rung in `<scratch>/verify/nodejs-fullstack-starter-local/notes.md` with the current git commit SHA.

## Rung 1: Static checks and test suite with coverage

Run the web route generator build, Vite+ format and lint check, type-aware Oxlint, TypeScript native preview (`tsrs`), and the Vitest unit, component, and Testcontainers PostgreSQL RLS integration suite with the 80% V8 coverage gate.

```bash
PATH="$HOME/.orbstack/bin:$PATH" pnpm --filter @starter/web build \
  && pnpm run check \
  && pnpm run lint \
  && pnpm run typecheck \
  && PATH="$HOME/.orbstack/bin:$PATH" pnpm run test:cov
```

Completion criterion: zero warnings, zero errors, all test files pass, and line coverage is at or above 80%.

## Rung 2: Artifacts, container images, and Terraform configuration

Build all workspace packages, validate the HCP Terraform configuration, and build both `platformatic/node-caged:26-slim` container targets (`api` and `worker`).

```bash
pnpm run build \
  && terraform fmt -check -recursive infra/terraform \
  && (cd infra/terraform && terraform init -backend=false -reconfigure && terraform validate) \
  && PATH="$HOME/.orbstack/bin:$PATH" docker build --target api -t bookstore-api:verify . \
  && PATH="$HOME/.orbstack/bin:$PATH" docker build --target worker -t bookstore-worker:verify .
```

Completion criterion: `apps/web/dist`, `bookstore-api:verify`, and `bookstore-worker:verify` build cleanly and `terraform validate` reports `Success! The configuration is valid.`

## Rung 3: Drive the live API, RLS database, and SaaS Admin surface

Boot a disposable PostgreSQL container (or local Compose database) with the `app_user` (`NOSUPERUSER NOBYPASSRLS`) role, start the real `apps/api` HTTP server on an ephemeral port, and drive the real HTTP endpoints:

1. Probe `GET /health/live`, `GET /health/ready`, and `GET /openapi.json`.
2. Sign up a merchant via `POST /api/auth/sign-up/email`, create a store via `POST /api/v1/stores`, publish a book via `POST /api/v1/stores/:storeSlug/books`, and place a customer order via `POST /api/v1/stores/:storeSlug/orders`.
3. Verify the side effects: `books.stock` decremented in PostgreSQL and the order status is `paid`.
4. Stop the server and container cleanly by PID and container ID.

Completion criterion: every live HTTP probe returns the expected status and payload, and the database side effects match.
