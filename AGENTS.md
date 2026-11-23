# AGENTS.md

Workspace instructions for AI agents and contributors working in `nodejs-fullstack-starter`.

## Required Reading

- [docs/guides/style-guide.md](./docs/guides/style-guide.md): Function parameter rules, TypeScript and Oxc lint rules, frontend state hierarchy, and low-mock testing standards.
- [DESIGN.md](./DESIGN.md): Starter Stone visual design system, `@starter/ui` token bridge, and email/web component conventions.
- [GLOSSARY.md](./GLOSSARY.md): Canonical domain terms (**Store**, **Merchant**, **Customer**, **Book**, **Order**, **Subscription**).
- [docs/adr/](./docs/adr/): Architecture Decision Records (do not contradict without explicit approval).
- App-specific guides: [apps/api/AGENTS.md](./apps/api/AGENTS.md), [apps/web/AGENTS.md](./apps/web/AGENTS.md), [apps/worker/AGENTS.md](./apps/worker/AGENTS.md).

## Toolchain and Commands

- **Runtime and package manager:** Node.js 26 and pnpm 12 (pinned in `mise.toml`), unified under **Vite+** (`vite-plus` / `vp`, docs at `node_modules/vite-plus/docs/`).
- **Format, lint, and typecheck (cached via Vite Task):**
  - `pnpm run check:fix` (`vp check --fix` — formats and checks)
  - `pnpm run check` (`vp run task:check` — cached `vp check`)
  - `pnpm run fmt` / `pnpm run fmt:check` (`vp fmt` / `vp fmt --check`)
  - `pnpm run lint` (`vp run task:lint` — cached `vp lint` with `typeAware` & `typeCheck`)
  - `pnpm run typecheck` (`vp run task:typecheck` — cached `vp check --no-fmt --no-lint`)
  - `pnpm run cache:clean` (`vp cache clean`)
- **Build & Scripts:**
  - `pnpm run build` (`vp run --cache -r build` — cached topological workspace build)
  - `pnpm exec vpx <file.ts>` (run TypeScript scripts directly; never add `tsx` or `ts-node`)
- **Environment schema, codegen, and secret scanning (Varlock):**
  - `pnpm run env:codegen` (`varlock codegen` — regenerates `env.d.ts` from `.env.schema`)
  - `pnpm exec varlock load --agent` (validates config with `@sensitive` values redacted)
  - `pnpm run env:scan` (`varlock scan` — scans for leaked secrets)
- **Tests:** `pnpm run test` (`vp test run`) and `pnpm run test:cov` (`vp test run --coverage`)
- **Git hooks:** Managed by Vite+ in `.vite-hooks/` (`vp hooks status`, `vp staged`).
- **Web build (regenerates `apps/web/src/routeTree.gen.ts`):** Run `pnpm --filter @starter/web build` BEFORE `vp check` whenever adding or renaming files under `apps/web/src/routes/`.

## Critical Guardrails Observed in This Repository

1. **Function parameters:** Keep exported functions at 3 parameters or fewer (`max-params: 3`). Use a single named parameter interface when a function takes 3 or more inputs.
2. **Promise timers:** Use `import { setTimeout as delay } from 'node:timers/promises'` instead of `new Promise((resolve) => setTimeout(resolve, ms))`.
3. **Oxlint strict rules:** Top-level `import type`, no `instanceof`, no `import * as`, no `Record<string, unknown>`, no conditional empty-object spreads, no explicit anonymous return types that widen known values.
4. **PostgreSQL RLS and `pg-boss`:** Runtime connections use `app_user` (`NOSUPERUSER NOBYPASSRLS`) and execute tenant queries inside `withStoreContext(db, storeId, ...)`. `app_user` needs `GRANT CONNECT, CREATE ON DATABASE` and `CREATE SCHEMA IF NOT EXISTS pgboss AUTHORIZATION app_user;` so `pg-boss` can manage its own schema while RLS stays enforced on `public`.
5. **Sequential `pg-boss` queue creation:** Call `boss.createQueue(...)` sequentially during startup, never in parallel via `Promise.all`, to avoid PostgreSQL partition-attach deadlocks.
6. **Stripe `emulate@0.14.0`:** Checkout Sessions require `line_items: [{ price: priceId, quantity }]` rather than inline `price_data` without `price`.
7. **Low-mock testing:** Prefer real seams (`createMemoryStorage`, `createBirdEmulator`, `createInlineJobQueue`, `createMemoryPaymentGateway`, real TanStack Router memory history) over `vi.mock`.
8. **Varlock environment & secret hygiene:** This project has only two environments: `local` and `prod` (`APP_ENV` in `.env.schema` and `.env.prod`). Never read gitignored `.env` or `.env*.local` files directly; use `pnpm exec varlock load --agent` to inspect/validate configuration and mark all credentials/keys with `# @sensitive`.
9. **Cross-repository transactions:** Use `withStoreTransaction(db, storeId, async (repos) => ...)` or `withTransaction(db, async (repos) => ...)` from `@starter/db` when an operation spans multiple repository calls or multiple repositories.
