# Engineering Style Guide

This guide documents the house coding, architecture, and testing standards for `nodejs-fullstack-starter`. Every new module and refactor follows these rules.

## 1. Domain Vocabulary

Use the canonical terms from [GLOSSARY.md](../../GLOSSARY.md) in code, routes, schemas, and documentation:

- **Store** (never tenant, shop, workspace, or organization in domain code)
- **Merchant** (never admin, seller, or operator)
- **Customer** (never buyer, client, or shopper)
- **Book** (never product, item, or listing)
- **Order** (never purchase, cart, or checkout)
- **Subscription** (never membership, tier, or package)

## 2. Function Signatures (Deno Style Guide)

Follow the Deno Style Guide rule for function parameters:

- Allow at most **2 required positional arguments** plus an optional options object (maximum **3 parameters** total).
- For service and domain functions that accept 3 or more inputs, prefer a **single named parameter interface** (for example `createOrderForStore(params: CreateOrderParams)`).
- Oxlint enforces `'max-params': ['error', { max: 3 }]` across the repository.

## 3. TypeScript and Oxc Conventions

- **Formatting and linting:** Vite+ (`vp check`) with Oxfmt, Oxlint (`@cloudflare/oxlint-config`), and `tsrs` (`tsrs --noEmit --fast`).
- **Type imports:** Always use top-level `import type` statements (`import/consistent-type-specifier-style`).
- **No `instanceof`:** Use structural type guards or Zod schemas (`@nkzw/no-instanceof`).
- **No namespace imports:** Avoid `import * as ns` (`import/no-namespace`).
- **No `Record<string, unknown>`:** Model payloads with Zod schemas or named interfaces (`quality/no-unsafe-dictionary-type`).
- **No conditional empty-object spreads:** Avoid `...(cond ? { key: value } : {})`; pass optional properties directly (`quality/no-conditional-empty-object-spread`).
- **Avoid widening anonymous return types:** Let TypeScript infer or return a named contract type (`quality/no-known-value-widening`).
- **Promise timers:** Import `{ setTimeout as delay } from 'node:timers/promises'` instead of wrapping `setTimeout` in `new Promise(...)`.
- **Runtime adapter isolation (ADR-0005):** Never import `node:*` inside `apps/api/src/**`. Keep runtime-specific primitives in `packages/runtime` and background queue internals in `packages/jobs`.

## 4. Deep Modules and Seams

Design deep modules: hide complex logic behind small, stable interfaces placed at clear seams.

- **One adapter is a hypothetical seam; two adapters make a real seam.** Only introduce an interface port when at least two concrete adapters exist (for example S3 and in-memory `ObjectStorage`, `pg-boss` and inline `JobQueue`, Stripe and in-memory `PaymentGateway`).
- **Keep invariants local.** Every Order state transition goes through the Order lifecycle module so webhooks and HTTP handlers enforce the same rules.
- **Keep handlers thin.** Authenticate Merchants and resolve Stores once at the Hono middleware seam rather than repeating session and membership checks in every route handler.

## 5. Frontend State and Forms (`apps/web`)

Choose the right state tool in this order:

1. **Server state:** TanStack Query (`useQuery`, `useMutation`) for all API data.
2. **URL state:** TanStack Router `validateSearch` with Zod schemas for search terms, filters, and pagination so links remain shareable and survive refresh.
3. **Form state:** `@tanstack/react-form` (`useForm`) for all forms. Never manage multi-field forms with a cluster of `useState` hooks.
4. **Shared client state:** `@tanstack/react-store` (`Store` and `useStore`) for global client preferences such as active locale or realtime connection status.
5. **Local UI state:** Use `useReducer` whenever a single feature coordinates multiple UI states. Reserve `useState` for a single isolated toggle or transient value.
6. **Event handlers:** Wrap async form and button handlers cleanly (`onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }}`) to satisfy `no-misused-promises`.
7. **Design system:** Follow [apps/web/AGENTS.md](../../apps/web/AGENTS.md) for Astryx components (no raw `<div>` layout wrappers, no `padding` prop on `Card`, pass `label` to `Button` and `Badge`).

## 6. Testing Without Heavy Mocks

Prefer testing through real interfaces and local adapters over module mocking:

- **Backend integration tests:** Run against real Testcontainers PostgreSQL with the `app_user` (`NOBYPASSRLS`) role so Row-Level Security policies are exercised on every query. Use the shared Postgres fixture in `packages/db`.
- **External services:** Use in-process adapters (`createMemoryStorage`, `createBirdEmulator`, `createInlineJobQueue`, `createMemoryPaymentGateway`) for fast unit and service tests, and run focused adapter integration tests against Floci and `vercel-labs/emulate`.
- **Frontend tests:** Render through a shared test harness backed by real TanStack Router `createMemoryHistory()` and an injectable `ApiClient` (or MSW). Avoid `vi.mock('@tanstack/react-router')`. Always call `cleanup()` in `afterEach`.

## 7. Prose and Documentation

Write docs, ADRs, commit messages, and PR descriptions in plain, active English:

- State actions directly in active voice.
- Avoid em dashes, en dashes, curly quotes, and slash pairs like `read/write`.
- Keep summaries short and link directly to the source files.
