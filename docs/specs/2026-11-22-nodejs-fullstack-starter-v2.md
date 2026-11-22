---
date: 2026-11-22
status: Accepted
intent: 2026-11-22-nodejs-fullstack-starter-v2.md
linear_project: https://linear.app/danielfs/project/nodejs-fullstack-starter-v2-78f64cb3eb01
scope: Full-stack TypeScript monorepo starter for a multi-tenant bookstore platform with opt-in modules, emulators, observability, tests, and Terraform deployment
---

# Specification: nodejs-fullstack-starter v2

## Problem statement

Developers who clone `express-rest-boilerplate` today inherit a 2017 single-package Express 4 and MongoDB JavaScript codebase with outdated authentication, testing, container, and observability tooling. Starting a modern full-stack TypeScript project requires replacing the runtime, database, frontend, bundler, linter, test stack, and deployment pipeline before building product code.

## Solution

Replace the `v2` branch with `nodejs-fullstack-starter`, a full-stack TypeScript monorepo implementing a multi-tenant bookstore platform (canonical domain terms live in [GLOSSARY.md](../../GLOSSARY.md)).

From a user's point of view:

- **Storefront browsing and checkout.** A customer visits `/s/:storeSlug`, browses published books with search, filtering, and pagination in English or Portuguese (`en` or `pt-BR`), views book covers served from object storage, places an order, completes payment through Stripe Checkout (when billing is enabled), receives a localized order receipt email rendered with React Email and sent via Bird.com, and watches order status transitions (`pending_payment`, `paid`, `fulfilled`) update live over WebSockets.
- **Merchant store operations.** A merchant signs up or signs in via `better-auth`, creates or switches between stores, manages books, stock counts, and cover uploads, upgrades the store subscription plan (`free` to `pro`), marks orders as fulfilled or cancelled, triggers asynchronous CSV catalog exports, and receives live order alerts and low-stock email notifications.
- **Local-first developer and agent workflow.** A developer or coding agent installs tools via `mise`, installs workspace packages with `pnpm`, starts backing services with `portless compose up`, and runs `apps/api`, `apps/web`, and `apps/worker` directly on the host at collision-free `.localhost` URLs across parallel `worktrunk` worktrees. External services (S3 and R2 storage, Stripe, Bird.com email) run against local emulators (Floci and `vercel-labs/emulate`) with zero live third-party accounts required.
- **Opt-in modularity and runtime portability.** Multi-tenancy, billing, WebSockets, background jobs, and internationalization are each isolated in dedicated modules gated by environment flags so adopters can disable or delete any optional capability without breaking authentication or core bookstore CRUD. Runtime-specific code lives exclusively in `packages/runtime` so switching from Node.js 26 LTS to Bun requires changing only the entrypoint runtime.
- **Live public demo.** Terraform provisions and GitHub Actions deploys a live Always Free demo on a subdomain of the author's Cloudflare DNS zone.

## Implementation decisions

### Monorepo structure and unified Oxc toolchain

Follow [ADR-0001](../adr/0001-unified-oxc-toolchain.md) for the Vite+ (`vp`), `pnpm`, `tsrs`, and `@cloudflare/oxlint-config` toolchain.

Workspace layout under `pnpm-workspace.yaml`:

	apps/
		api/        # @starter/api - Hono REST and WebSocket API organized by features
		web/        # @starter/web - TanStack Start React 19 storefront and merchant console
		worker/     # @starter/worker - Standalone pg-boss background job processor entrypoint
	packages/
		contracts/  # @starter/contracts - Shared Zod schemas, OpenAPI types, typed API client
		db/         # @starter/db - Drizzle ORM 1.0 beta schema, RQBv2 relations, RLS helpers, migrations
		email/      # @starter/email - React Email templates and Bird.com delivery port
		i18n/       # @starter/i18n - Paraglide JS compiled messages (en, pt-BR)
		runtime/    # @starter/runtime - Node.js and Bun isolated runtime adapters
	infra/
		terraform/  # Render, Cloudflare (DNS, Workers, R2), and Neon infrastructure definitions
	docs/
		intents/    # Intent documents
		adr/        # Architecture decision records
		specs/      # Build-ready specifications

Fixed tooling parameters:

- **Host runtimes (`mise.toml`):** Pin Node.js `26` (latest Active LTS), `pnpm` latest v10+, and `terraform` `>= 1.9`. Configure `.npmrc` to use `pnpm`'s global content-addressable store (`manage-package-manager-versions=true`, `auto-install-peers=true`).
- **TypeScript (`tsconfig.base.json`):** `target: "ES2024"`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`, `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `noImplicitOverride: true`, `verbatimModuleSyntax: true`, `noEmit: true`. Run CLI and CI type checks with `tsrs --noEmit --fast`.
- **Linting and formatting:** Root `oxlint.config.ts` extends `@cloudflare/oxlint-config` and adds a restricted-imports rule forbidding `node:*` imports inside `apps/api/src/**` (enforcing [ADR-0005](../adr/0005-runtime-adapter-isolation.md)). Run type-aware linting with `TSRS_FAST=1 oxlint --type-aware --type-check` and formatting with `vp check`.
- **Git hooks (`lefthook.yml`):** `pre-commit` runs `vp check` on staged files; `pre-push` runs `tsrs --noEmit --fast`.
- **Worktrees (`.config/wt.toml`):** Configure `worktrunk` post-create hooks to run `pnpm install --frozen-lockfile` and copy `.env.example` to `.env` if absent.

### Database schema, Drizzle ORM 1.0 beta, and multi-tenancy

Follow [ADR-0003](../adr/0003-row-level-multi-tenancy-with-rls.md) for row-level `storeId` isolation, PostgreSQL Row-Level Security, and slug routing.

- **ORM and migrations:** Use `drizzle-orm` `v1.0.0-beta.2` (or newer 1.0 beta) with `drizzle-kit` Folders v3 migrations under `packages/db/drizzle/` and centralized RQBv2 relations (`defineRelations` and `defineRelationsPart`) in `packages/db/src/relations.ts`.
- **Better Auth tables (generated via `better-auth` CLI for Drizzle Postgres):**
	- Core: `user`, `session`, `account`, `verification`.
	- Organization plugin (maps to `Store` and `Merchant`): `organization` (unique `slug`, `name`, `logo`, `metadata` JSON holding `lowStockThreshold` defaulting to `5`), `member` (`organizationId`, `userId`, `role` of `owner` or `staff`), `invitation`.
	- Stripe plugin (opt-in `billing`): `subscription` (`plan` of `free` or `pro`, `referenceId` referencing `organization.id`, `stripeCustomerId`, `stripeSubscriptionId`, `status`, `periodStart`, `periodEnd`, `cancelAtPeriodEnd`, `seats`).
- **Bookstore domain tables (every table carries non-null `store_id` referencing `organization.id` with `ON DELETE CASCADE` and an enabled PostgreSQL RLS policy checking `store_id = current_setting('app.current_store_id', true)`):**
	- `books`: `id` (UUID v7), `store_id`, `sku` (unique per `(store_id, sku)`), `title`, `author`, `description`, `price_cents` (integer `>= 0`), `currency` (3-letter ISO code, default `USD`), `stock` (integer `>= 0`), `cover_key` (nullable text), `published` (boolean, default `false`), `created_at`, `updated_at`.
	- `customers`: `id` (UUID v7), `store_id`, `user_id` (nullable FK to `user.id`), `email` (unique per `(store_id, email)`), `name`, `locale` (`en` or `pt-BR`, default `en`), `created_at`.
	- `orders`: `id` (UUID v7), `store_id`, `customer_id` (FK to `customers.id`), `status` (`pending_payment`, `paid`, `fulfilled`, `cancelled`, `refunded`), `total_cents` (integer `>= 0`), `currency`, `stripe_checkout_session_id` (nullable unique text), `created_at`, `updated_at`.
	- `order_items`: `id` (UUID v7), `store_id`, `order_id` (FK to `orders.id`), `book_id` (FK to `books.id`), `quantity` (integer `> 0`), `unit_price_cents` (integer `>= 0`).
	- `store_exports`: `id` (UUID v7), `store_id`, `requested_by_user_id` (FK to `user.id`), `status` (`queued`, `completed`, `failed`), `file_key` (nullable text), `created_at`, `completed_at`.
- **Store context transaction helper:** `withStoreContext(db, storeId, fn)` opens a transaction, runs `SELECT set_config('app.current_store_id', $1, true)`, and executes `fn(tx)`. The application connects using a non-superuser PostgreSQL role (`app_user`) so RLS is always enforced; migrations run under the database owner role.

### Feature-organized Hono API and runtime isolation

Follow [ADR-0005](../adr/0005-runtime-adapter-isolation.md) to isolate runtime-specific code inside `packages/runtime`.

- **API feature layout (`apps/api/src/features/`):** Each feature owns its Zod OpenAPI route definitions (`*.routes.ts`), handlers (`*.handlers.ts`), domain service (`*.service.ts`), and colocated unit tests (`*.test.ts`). Features are `health`, `auth`, `stores`, `books`, `orders`, `billing`, `realtime`, and `exports`.
- **Validation and OpenAPI:** Register routes with `@hono/zod-openapi` and Zod schemas shared from `@starter/contracts`. Serve the generated OpenAPI 3.1 JSON at `GET /openapi.json` and interactive Scalar API documentation at `GET /docs`.
- **Core endpoints:**
	- `GET /health/live` returns `200` when the process responds. `GET /health/ready` runs `SELECT 1` with a `2000 ms` timeout and returns `200` or `503`.
	- `ALL /api/auth/*` mounts `better-auth` (email and password auth, password reset via React Email and Bird.com, organization endpoints, and `@better-auth/stripe` subscription endpoints when enabled).
	- `GET /api/v1/stores`, `POST /api/v1/stores`, `GET /api/v1/stores/:storeSlug`, `PATCH /api/v1/stores/:storeSlug` (merchant owner role required for mutations).
	- `GET /api/v1/stores/:storeSlug/books` (search `q`, `published` filter, pagination with default `limit=20` and max `limit=100`), `POST`, `GET /:bookId`, `PATCH /:bookId`, `DELETE /:bookId`, and `POST /:bookId/cover` (accepts `image/jpeg`, `image/png`, `image/webp` up to `5 MB`, stored in R2 or local Floci).
	- `POST /api/v1/stores/:storeSlug/orders` (atomically verifies and decrements `books.stock` inside `withStoreContext`, creates order and items, creates a Stripe Checkout Session when billing is enabled or marks `paid` directly when disabled), `GET /api/v1/stores/:storeSlug/orders`, `GET /:orderId`, `PATCH /:orderId/status` (merchant marks `fulfilled` or `cancelled`, restoring stock on cancellation).
- **Runtime adapter (`packages/runtime`):** Exposes `createServer`, `createWebSocketAdapter` (`@hono/node-ws` on Node.js, `hono/bun` on Bun), `createDbClient` (`postgres` TCP client for local and Render, `@neondatabase/serverless` or pooled TCP for Neon, `Bun.sql` option for Bun), `onShutdown` (`10000 ms` drain deadline on `SIGTERM` and `SIGINT`), and `initTelemetry`. Package `exports` declares `"node"` and `"bun"` conditions so entrypoints select the right implementation automatically.

### Opt-in feature modules and toggles

Every optional capability ships wired and enabled by default in `.env.example`, is gated by a boolean environment variable parsed at startup, and lives in an isolated directory that adopters can delete cleanly:

| Flag | Default | Disabled behaviour | Isolated module locations |
| --- | --- | --- | --- |
| `FEATURE_MULTI_TENANCY_ENABLED` | `true` | Routes all requests to one seeded default store (`default`) and hides store creation and switcher UI | `apps/api/src/features/stores`, `apps/web/src/features/stores` |
| `FEATURE_BILLING_ENABLED` | `true` | Skips Stripe Checkout (orders transition directly to `paid`), skips plan book-count limits, omits Stripe plugin and webhook routes | `apps/api/src/features/billing`, `apps/web/src/features/billing` |
| `FEATURE_JOBS_ENABLED` | `true` | Replaces `pg-boss` adapter with an inline synchronous `JobQueue` implementation | `apps/worker`, `apps/api/src/features/exports`, `packages/runtime/src/jobs` |
| `FEATURE_REALTIME_ENABLED` | `true` | Omits `GET /api/v1/stores/:storeSlug/ws` and binds `RealtimeBroker` to a no-op publisher | `apps/api/src/features/realtime`, `apps/web/src/features/realtime` |
| `FEATURE_I18N_ENABLED` | `true` | Fixes UI and email locale to `en` and hides the locale switcher | `packages/i18n`, `apps/web/src/features/i18n` |

Module contracts:

- **Billing (`billing`):** Enforces a `25` published-book cap on `free` stores and unlimited books on `pro` stores. Handles `@better-auth/stripe` subscription webhooks under `/api/auth/stripe/webhook` and order Checkout webhooks under `POST /api/v1/webhooks/stripe` using Stripe HMAC signature verification.
- **Background jobs (`jobs`):** Follow [ADR-0004](../adr/0004-postgres-native-jobs-and-realtime.md). `pg-boss` runs in schema `pgboss` with `3` retry attempts and exponential backoff starting at `30 s`. Registered job types: `email.order-receipt`, `email.low-stock-alert` (triggered when `books.stock <= store.lowStockThreshold`), and `export.store-books-csv` (writes CSV to R2 or Floci and updates `store_exports`). On the Render Free demo, `apps/api` starts the `pg-boss` worker in-process when `WORKER_INLINE=true`; paid or multi-container setups run `apps/worker` as a dedicated container.
- **Realtime (`realtime`):** Follow [ADR-0004](../adr/0004-postgres-native-jobs-and-realtime.md). Mounts `GET /api/v1/stores/:storeSlug/ws` using Hono's WebSocket helper via `packages/runtime`. Publishes `order.created` and `order.status_changed` events to `store:<storeId>:orders` (merchants) and `order:<orderId>` (customer order tracking page). Uses the in-memory `RealtimeBroker` when `REALTIME_BROKER=memory` (local dev) and PostgreSQL `LISTEN/NOTIFY` over a dedicated non-pooled `DATABASE_DIRECT_URL` when `REALTIME_BROKER=postgres`.
- **Email (`packages/email`):** Renders HTML and plain-text templates (`WelcomeEmail`, `PasswordResetEmail`, `OrderReceiptEmail`, `LowStockAlertEmail`) with React Email and `@starter/i18n`. Delivers through a `Mailer` port whose production adapter posts to Bird.com (`POST https://api.bird.com/v1/email/messages` with `BIRD_API_KEY` and `BIRD_FROM_EMAIL`), and whose local and test adapter posts to the local Bird HTTP emulator endpoint (`BIRD_API_BASE_URL`).
- **Internationalization (`packages/i18n`):** Uses Paraglide JS (`@inlang/paraglide-js`) with `messages/en.json` and `messages/pt-BR.json`, compiling type-safe functions imported by both `apps/web` and `packages/email`.

### Frontend architecture (React 19, Astryx, TanStack Start)

Follow [ADR-0002](../adr/0002-astryx-stylex-and-tanstack-start.md) for Meta Astryx, `@stylexjs/stylex`, TanStack Start, and TanStack Query.

- **Directory organization (`bulletproof-react`-inspired under `apps/web/src/`):**
	- `app/`: root router, QueryClient provider, Astryx `<Theme value={neutralTheme}>` provider, global CSS layer imports (`reset`, `astryx-base`, `astryx-theme`, `components`, `utilities`).
	- `routes/`: thin TanStack Router file-based routes delegating to feature screens: `/` (platform landing and store directory), `/auth/*` (sign-in, sign-up, password reset), `/s/$storeSlug` (storefront catalog), `/s/$storeSlug/books/$bookId` (book detail and checkout), `/s/$storeSlug/orders/$orderId` (live customer order tracker), `/dashboard/$storeSlug/*` (merchant catalog, cover upload, orders, CSV exports, billing, store settings).
	- `features/`: self-contained feature folders (`auth`, `stores`, `books`, `orders`, `billing`, `realtime`, `exports`, `i18n`), each with `api/`, `components/`, `hooks/`, and `types/` plus a public `index.ts` barrel enforced by Oxlint import rules so features do not reach into another feature's internals.
	- `components/`: shared UI shells and Astryx wrappers (`AppLayout`, `StorefrontLayout`, `ErrorBoundary`, `LocaleSwitcher`).
	- `lib/`: typed API client built from `@starter/contracts`, `better-auth` React client, and WebSocket hook.
- **Agent component guidance:** Run `npx --no @astryxdesign/cli init` so generated Astryx component guidelines are committed for coding agents.

### Local development, worktrees, emulators, and observability

- **Host-first execution:** `pnpm dev` runs `portless` from the monorepo root, launching `apps/api`, `apps/web`, and `apps/worker` on the host at `https://api.<worktree>.localhost` and `https://web.<worktree>.localhost` (using `portless.json` and `PORTLESS_PREFIX` derived from the active `worktrunk` branch).
- **Docker Compose backing services (`compose.yml`):** Started via `portless compose up -d` (dynamic host port allocation, isolated compose project name per worktree, zero port collisions):
	- `postgres` (`postgres:17-alpine`) with init script creating the non-superuser `app_user` role for RLS enforcement.
	- `floci` (`floci/floci:latest`) providing local S3-compatible object storage on dynamic port mapping for book covers and CSV exports (auto-bootstraps the `bookstore-media` bucket).
	- `lgtm` (`grafana/otel-lgtm:latest`, behind `profiles: ["o11y"]`) providing Grafana UI, Prometheus, Loki, Tempo, Pyroscope, and OTLP HTTP (`4318`) and gRPC (`4317`) receivers in one container, reachable at `https://grafana.<worktree>.localhost` when started with `portless compose --profile o11y up -d`.
- **Local third-party emulators:** A dev emulator runner (`pnpm dev:emulators`, started automatically by `pnpm dev`) launches `vercel-labs/emulate` for Stripe (checkout sessions, subscriptions, signed webhook dispatch) and a lightweight local Bird.com email capture endpoint (logging and inspecting sent HTML emails locally so developers and agents verify rendered React Email output without a live Bird.com key).
- **Observability instrumentation:** `packages/runtime` initializes OpenTelemetry SDK (`@opentelemetry/sdk-node`, HTTP, PostgreSQL, and Pino instrumentation) when `OTEL_ENABLED=true`, exporting OTLP HTTP traces, metrics, and logs to `OTEL_EXPORTER_OTLP_ENDPOINT` (local `grafana/otel-lgtm` or Grafana Cloud Free tier in production). Pino injects `trace_id` and `span_id` into every JSON log line.

### Production containers, Terraform IaC, and CI and CD

Follow [ADR-0006](../adr/0006-free-tier-hosting-with-terraform.md) for the Always Free hosting topology and Terraform providers.

- **Production Dockerfile (`Dockerfile`):** Multi-stage build using Node 26 + `pnpm deploy --filter=@starter/api --prod /prod/api` (and an optional `worker` target for `@starter/worker`) copied into `platformatic/node-caged:26-slim`. Runs as non-root `node` user with `HEALTHCHECK` calling `/health/live`.
- **Terraform (`infra/terraform/`):**
	- Providers: `render-oss/render` (`~> 1.0`), `cloudflare/cloudflare` (`~> 5.0`), `neondatabase/neon` (`~> 0.19`).
	- Remote state: Cloudflare R2 S3-compatible backend (documented bootstrap step in `infra/terraform/README.md`).
	- Provisioned resources: Neon project, database, and `app_user` role; Cloudflare R2 bucket for book covers and CSV exports; Render Free Docker web service (`apps/api`, `WORKER_INLINE=true`) pulling from GitHub Container Registry (`ghcr.io/danielfsousa/nodejs-fullstack-starter:latest`) with an optional `enable_separate_worker` variable (default `false`); Cloudflare Workers deployment for `apps/web` (TanStack Start); Cloudflare DNS CNAME records for `demo.<domain>` (web) and `api.demo.<domain>` (API).
- **GitHub Actions (`.github/workflows/`):**
	- `ci.yaml`: runs on push and pull requests. Installs tools via `mise` and dependencies via `pnpm`, runs `vp check` (Oxfmt and Oxlint with `@cloudflare/oxlint-config`), `tsrs --noEmit --fast`, unit, component, and Testcontainers integration tests via `vp test` (enforcing `>= 80%` line coverage on `packages/*` and `apps/api/src/features/*`), Playwright E2E tests against live host servers, and `terraform fmt -check` plus `terraform validate`.
	- `release.yaml`: on push to `main` (or `v2` during pre-release), builds and pushes multi-arch `platformatic/node-caged:26-slim` images to GHCR, deploys `apps/web` to Cloudflare Workers, runs Drizzle migrations against Neon, and triggers Render deployment via Render deploy hook or Terraform apply.

## Testing decisions

All four outermost seams below were confirmed before writing this specification. Tests assert observable behaviour at boundaries rather than internal mocks.

1. **`apps/api` (HTTP and WebSocket integration seam):**
	- Drives `apps/api` through `app.fetch(request)` and an ephemeral local server for WebSocket upgrade tests (building on v1's Supertest and Testcontainers prior art in `test/integration/`).
	- Starts ephemeral `@testcontainers/postgresql` and Floci containers per test suite (random Docker host ports so parallel `worktrunk` worktrees never collide), runs real Drizzle migrations, and starts programmatic `vercel-labs/emulate` (Stripe) plus a local Bird.com HTTP mock server.
	- Verifies auth and RBAC, PostgreSQL RLS isolation (proving a request scoped to Store A cannot read or mutate Store B's rows), atomic stock decrement and oversell rejection, cover upload to Floci, Stripe webhook signature validation and order state transitions, WebSocket live event delivery, and behaviour when each `FEATURE_*_ENABLED` flag is set to `false`.
2. **`apps/worker` (Background job seam):**
	- Enqueues real jobs through `pg-boss` against containerized PostgreSQL, runs worker handlers, and asserts persisted database updates (`store_exports.status = 'completed'`), CSV file creation in Floci, and localized HTML email payloads delivered to the Bird.com HTTP mock.
3. **`apps/web` (Component and Playwright E2E seams):**
	- **Component tests (Vitest + React Testing Library):** Render interactive Astryx feature components (book form, cart and checkout flow, merchant order table, locale switcher) against mocked HTTP responses at the network boundary (`msw`), asserting user-visible DOM and accessibility roles.
	- **End-to-end tests (Playwright):** Launch Chromium against live host `apps/web` and `apps/api` (routed via `portless` against ephemeral Postgres, Floci, and `emulate` instances) and execute full user journeys: merchant signup, store creation, book creation with cover upload, customer storefront browse and checkout via emulated Stripe, live WebSocket order status update, and CSV export download.
4. **`infra/terraform` (Infrastructure seam):**
	- CI runs `terraform fmt -check -recursive`, `terraform init -backend=false`, and `terraform validate` on every pull request, plus `terraform plan` on deployment branches against live credentials.
5. **Unit tests (Vitest):**
	- Pure domain rules (price calculations, order state machine transitions, Zod contract schemas, React Email template snapshots, and `packages/runtime` adapter contracts verified under Node.js and documented for Bun).

## Further notes

### Repository cutover and rename runbook (executed once v2 is green)

1. Tag current `main` as `v1.0.0-final` and push a frozen `v1` branch so existing v1 users have a permanent reference.
2. Merge `v2` into `main` once all slices pass CI and the live demo is verified.
3. Rename the GitHub repository from `danielfsousa/express-rest-boilerplate` to `danielfsousa/nodejs-fullstack-starter` (GitHub preserves stars and redirects old URLs automatically).
4. Update repository metadata, badges, GHCR image paths, and `README.md` links to `nodejs-fullstack-starter`.

### External credentials owned by the author for live demo deployment

The repository automates provisioning and deployment, while the author supplies these secrets in GitHub Actions and local Terraform `tfvars`:

- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, and the target demo domain name.
- `NEON_API_KEY`.
- `RENDER_API_KEY` and `RENDER_OWNER_ID`.
- `BIRD_API_KEY` and a verified `BIRD_FROM_EMAIL` sender configured in Bird.com.
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (Stripe test mode keys for the public demo).
- Optional `OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS` for Grafana Cloud Free tier.

### Explicitly out of scope for v2.0

- Native mobile applications.
- GraphQL or gRPC API surfaces.
- Microservice splits beyond `apps/api`, `apps/web`, and `apps/worker`.
- Interactive CLI project scaffolding generator (`create-nodejs-fullstack-starter`).
- Backward compatibility or data migration scripts from v1 Express and MongoDB.
