# nodejs-fullstack-starter

![CI](https://github.com/danielfsousa/nodejs-fullstack-starter/actions/workflows/ci.yaml/badge.svg?branch=main)
![Release](https://github.com/danielfsousa/nodejs-fullstack-starter/actions/workflows/release.yaml/badge.svg?branch=main)

`nodejs-fullstack-starter` is a full-stack TypeScript monorepo starter built around a multi-tenant bookstore domain (`Store`, `Merchant`, `Customer`, `Book`, `Order`, `Subscription`). Every subsystem outside the core catalog and checkout loop is gated behind an environment flag and lives in its own directory so you can disable or delete what your application does not use.

## Stack overview

- **Runtime and package manager.** Node.js 26 (native TypeScript execution) or Bun via `@starter/runtime` conditional exports, managed by `mise` and `pnpm` 12 workspaces.
- **Toolchain.** Vite+ (`vp`), Oxlint (`--type-aware --type-check` with `@cloudflare/oxlint-config`), Oxfmt, TypeScript 7 native preview (`tsrs`), and Lefthook.
- **API (`apps/api`).** Hono with `@hono/zod-openapi` and Scalar API Reference at `/docs`, `better-auth` (Organization plugin for multi-tenant stores and Stripe plugin for billing), Pino structured logging, and OpenTelemetry OTLP export.
- **Web (`apps/web`).** React 19, TanStack Start, TanStack Router, TanStack Query, TanStack Form, TanStack Store, Tailwind CSS v4, Astryx editorial components, and Paraglide JS (`en` and `pt`).
- **Worker (`apps/worker`).** Standalone `pg-boss` background job consumer for transactional emails, Stripe webhook processing, and S3 or R2 CSV exports.
- **Database (`packages/db`).** PostgreSQL 18, Drizzle ORM 1.0, `better-drizzle`, and database-enforced Row-Level Security (RLS) on tenant tables (`books`, `orders`, `order_items`, `subscriptions`).
- **Cloud and emulators.** Floci (local S3 and Cloudflare R2 emulator), `vercel-labs/emulate` (local Stripe API and webhook emulator), and a built-in Bird.com HTTP email emulator.

## Repository layout

```text
├── apps
│   ├── api          # Hono OpenAPI server, better-auth, WebSockets, and feature slices
│   ├── web          # TanStack Start frontend, Astryx UI primitives, and Paraglide i18n
│   └── worker       # Standalone pg-boss consumer for email, webhooks, and CSV exports
├── packages
│   ├── contracts    # Shared Zod schemas, feature flags, and typed API client
│   ├── db           # Drizzle ORM 1.0 schema, PostgreSQL RLS helper, migrations, and seed
│   ├── email        # React Email templates, Bird.com client, and local email emulator
│   ├── i18n         # Paraglide JS message catalogs (en, pt) and compiler output
│   ├── jobs         # JobQueue interface, pg-boss adapter, and inline test queue
│   └── runtime      # Node.js 26, Bun, and Cloudflare free-tier runtime adapters
├── infra
│   └── terraform    # HCP Terraform configuration for Neon, Cloudflare R2 and Workers, and Render
├── docs
│   ├── adr          # Architecture Decision Records (ADR-0001 through ADR-0009)
│   ├── guides       # Style guide, module removal guide, and deployment cutover runbook
│   ├── intents      # Project intent
│   └── specs        # Full v2 build specification
├── e2e              # Playwright browser suite
├── scripts          # Local Stripe and Bird.com emulator runner
├── compose.yaml     # Local Postgres 18, Floci S3 emulator, and opt-in grafana/otel-lgtm
└── Dockerfile       # Multi-stage platformatic/node-caged:26-slim build for api and worker
```

## Quickstart

1. Install the pinned Node.js 26 and `pnpm` 12 toolchain with `mise`, then install dependencies.

```bash
mise install
pnpm install
cp .env.example .env
```

2. Start PostgreSQL 18 and the Floci S3 emulator.

```bash
docker compose up -d
```

3. Apply the Drizzle schema and seed the demo store (`acme-books`), sample books, and demo accounts.

```bash
pnpm --filter @starter/db db:push
pnpm --filter @starter/db db:seed
```

4. Start the local Stripe and Bird.com emulators in one terminal, and run the API, Web, and Worker apps in another.

```bash
pnpm run dev:emulators
```

```bash
pnpm run dev:api
pnpm run dev:web
pnpm run dev:worker
```

If you use `portless`, start the entire stack under named `.localhost` subdomains instead:

```bash
portless compose up -d
pnpm run dev
```

Once running, open these endpoints:

- Storefront and Merchant dashboard: `http://127.0.0.1:3000`
- Scalar OpenAPI documentation: `http://127.0.0.1:3001/docs`
- OpenAPI 3.1 JSON specification: `http://127.0.0.1:3001/openapi.json`
- Bird.com email emulator inbox: `http://127.0.0.1:4010/messages`
- Stripe emulator server: `http://127.0.0.1:4009`

## Local observability (`--profile o11y`)

To inspect distributed traces, metrics, and trace-correlated Pino logs locally, enable OpenTelemetry in `.env` and start the `o11y` Compose profile (`grafana/otel-lgtm`).

```bash
OTEL_ENABLED=true
LOG_FORMAT=json
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318
```

```bash
docker compose --profile o11y up -d
```

Open Grafana at `http://127.0.0.1:3005` (`admin` and `admin`) to query Loki logs, Tempo traces, and Prometheus metrics.

## Scripts

| Command                  | Description                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| `pnpm run dev`           | Start development processes through `portless`                         |
| `pnpm run dev:api`       | Start the Hono API server (`apps/api`) in watch mode                   |
| `pnpm run dev:web`       | Start the TanStack Start web app (`apps/web`) on port `3000`           |
| `pnpm run dev:worker`    | Start the `pg-boss` worker (`apps/worker`) in watch mode               |
| `pnpm run dev:emulators` | Start the local Stripe (`:4009`) and Bird.com (`:4010`) emulators      |
| `pnpm run build`         | Build every workspace package and application                          |
| `pnpm run check`         | Run Vite+ format, lint, and type verification (`vp check`)             |
| `pnpm run check:fix`     | Format and autofix workspace files (`vp check --fix`)                  |
| `pnpm run lint`          | Run type-aware Oxlint (`TSRS_FAST=1 oxlint --type-aware --type-check`) |
| `pnpm run typecheck`     | Run TypeScript native preview checker (`tsrs --noEmit --fast`)         |
| `pnpm run test`          | Run unit, component, and Testcontainers Postgres RLS integration tests |
| `pnpm run test:cov`      | Run the test suite and enforce the 80% V8 coverage threshold           |
| `pnpm run test:e2e`      | Run the Playwright end-to-end browser suite                            |

## Environment variables

| Variable                        | Default                                            | Description                                                                              |
| ------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `NODE_ENV`                      | `development`                                      | Runtime environment (`development`, `test`, or `production`)                             |
| `HOST`                          | `127.0.0.1`                                        | Bind address for the API HTTP and WebSocket server                                       |
| `PORT`                          | `3001`                                             | Listen port for the API server                                                           |
| `LOG_LEVEL`                     | `info`                                             | Pino minimum log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`)              |
| `LOG_FORMAT`                    | `pretty`                                           | Log output format (`pretty` or `json`)                                                   |
| `OTEL_ENABLED`                  | `false`                                            | Export OpenTelemetry traces and metrics to `OTEL_EXPORTER_OTLP_ENDPOINT`                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`   | `http://127.0.0.1:4318`                            | Base URL for the OTLP HTTP collector (`otel-lgtm` or Grafana Cloud)                      |
| `OTEL_EXPORTER_OTLP_HEADERS`    | empty                                              | Optional comma-separated `key=value` headers for Grafana Cloud OTLP auth                 |
| `DATABASE_URL`                  | `postgres://app_user:...@127.0.0.1:5432/bookstore` | Application connection string (`NOSUPERUSER NOBYPASSRLS`)                                |
| `DATABASE_DIRECT_URL`           | `postgres://app_user:...@127.0.0.1:5432/bookstore` | Non-pooled connection string for PostgreSQL `LISTEN` and `NOTIFY`                        |
| `DATABASE_ADMIN_URL`            | `postgres://postgres:...@127.0.0.1:5432/bookstore` | Schema owner connection string for Drizzle migrations                                    |
| `WORKER_INLINE`                 | `false`                                            | Run background jobs in-process inside the API instead of a separate worker               |
| `BETTER_AUTH_SECRET`            | dev secret                                         | Signing secret for `better-auth` sessions (minimum 32 characters)                        |
| `BETTER_AUTH_URL`               | `http://127.0.0.1:3001`                            | Public base URL of the authentication server                                             |
| `WEB_ORIGIN`                    | `http://127.0.0.1:3000`                            | Allowed CORS origin and redirect target for the web app                                  |
| `S3_ENDPOINT`                   | `http://127.0.0.1:4566`                            | S3 or Cloudflare R2 endpoint URL (Floci locally)                                         |
| `S3_REGION`                     | `us-east-1`                                        | S3 region (`auto` on Cloudflare R2)                                                      |
| `S3_ACCESS_KEY_ID`              | `test`                                             | S3 or R2 access key ID                                                                   |
| `S3_SECRET_ACCESS_KEY`          | `test`                                             | S3 or R2 secret access key                                                               |
| `S3_BUCKET`                     | `bookstore-media`                                  | Bucket name for book cover uploads and CSV exports                                       |
| `BIRD_API_BASE_URL`             | `http://127.0.0.1:4010`                            | Bird.com API base URL (points to local emulator in development)                          |
| `BIRD_API_KEY`                  | `local-bird-dev-key`                               | Bird.com API bearer token                                                                |
| `BIRD_FROM_EMAIL`               | `noreply@bookstore.local`                          | Sender address for transactional emails                                                  |
| `STRIPE_SECRET_KEY`             | `sk_test_local_emulate`                            | Stripe secret key                                                                        |
| `STRIPE_WEBHOOK_SECRET`         | `whsec_local_emulate`                              | Stripe webhook signing secret                                                            |
| `STRIPE_API_HOST`               | `127.0.0.1`                                        | Optional Stripe API host override for `vercel-labs/emulate`                              |
| `STRIPE_API_PORT`               | `4009`                                             | Optional Stripe API port override for `vercel-labs/emulate`                              |
| `STRIPE_API_PROTOCOL`           | `http`                                             | Protocol for the Stripe API host (`http` or `https`)                                     |
| `STRIPE_PRO_PRICE_ID`           | `price_pro_monthly`                                | Stripe recurring Price ID for the Pro store subscription plan                            |
| `FEATURE_MULTI_TENANCY_ENABLED` | `true`                                             | Enable multi-store creation and store switching                                          |
| `FEATURE_ADMIN_ENABLED`         | `true`                                             | Enable the SaaS platform admin API, store plan overrides, and user impersonation         |
| `FEATURE_BILLING_ENABLED`       | `true`                                             | Enable Stripe checkout sessions, subscriptions, and webhooks                             |
| `FEATURE_JOBS_ENABLED`          | `true`                                             | Enable `pg-boss` queues and `/api/stores/:storeId/exports` endpoints                     |
| `FEATURE_REALTIME_ENABLED`      | `true`                                             | Enable `/ws` WebSocket push notifications for stock and order state                      |
| `REALTIME_BROKER`               | `memory`                                           | Realtime event broker (`memory` or `pg-notify` for multi-instance `LISTEN` and `NOTIFY`) |
| `FEATURE_I18N_ENABLED`          | `true`                                             | Enable Paraglide locale switching (`en` and `pt`)                                        |

## Guides and architecture documentation

- [Domain glossary](./GLOSSARY.md)
- [Engineering style guide](./docs/guides/style-guide.md)
- [How to swap runtimes and remove opt-in modules](./docs/guides/architecture-and-modules.md)
- [How to deploy with Terraform and cut over from v1](./docs/guides/deployment-and-cutover.md)
- [Architecture Decision Records](./docs/adr/)
