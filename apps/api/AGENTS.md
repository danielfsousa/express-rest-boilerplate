# API Agent Instructions (`apps/api`)

See [../../docs/guides/style-guide.md](../../docs/guides/style-guide.md) and [../../AGENTS.md](../../AGENTS.md) for workspace-wide rules.

## Key Conventions

- **No `node:*` imports in `apps/api/src/**`:** Enforced by Oxlint per ADR-0005. Route all server, logger, database, storage, and timer primitives through `@starter/runtime` or `@starter/jobs`.
- **Store context and Merchant authorization:** Resolve Store context and Merchant sessions through the Store-context middleware (`src/middleware/store-context.ts`). Never import `resolveStoreContext` across feature boundaries or duplicate `getSessionUser` guards in handlers.
- **RLS isolation:** Wrap every query against Store-scoped tables (`books`, `customers`, `orders`, `order_items`, `store_exports`) in `withStoreContext(db, storeId, ...)`.
- **Order lifecycle invariants:** Route all Order state transitions (including Stripe webhook payment settlement) through `src/features/orders/orders.service.ts` so `canTransitionOrderStatus` and receipt enqueueing stay in one place.
- **Parameter objects:** Pass a single named params interface to service functions with 3 or more inputs.
- **OpenAPI contracts:** Define Zod request and response schemas in `@starter/contracts` and mount routes with `@hono/zod-openapi`. Only declare HTTP status codes that the handler actually returns.
