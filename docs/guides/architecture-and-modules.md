# How to swap runtimes and remove opt-in modules

This guide shows how to switch between Node.js 26 and Bun, wire Cloudflare Free Tier adapters, and disable or delete any opt-in module (`billing`, `jobs`, `realtime`, `i18n`, `multi-tenancy`).

## Swap between Node.js 26 and Bun

Application code in `apps/api` and `apps/worker` never imports `node:http` or `Bun.serve` directly. Instead, `packages/runtime` exports a single runtime contract (`serveHttp`, `createObjectStorage`, `createMemoryStorage`, `hashPassword`, `verifyPassword`, and `readEnv`) and resolves the implementation through `package.json` conditional exports:

```json
{
  "exports": {
    ".": {
      "bun": "./src/bun.ts",
      "node": "./src/node.ts",
      "default": "./src/node.ts"
    },
    "./cloudflare": "./src/cloudflare.ts"
  }
}
```

- To run the API or Worker on Node.js 26 (the default), execute `node --watch src/index.ts`. Node resolves `packages/runtime/src/node.ts`, which uses `@hono/node-server`, `@node-rs/argon2`, and `aws4fetch` over `fetch`.
- To run the API or Worker on Bun, execute `bun --watch src/index.ts`. Bun resolves `packages/runtime/src/bun.ts`, which uses `Bun.serve`, `Bun.password.hash` (Argon2id), and `Bun.S3Client`.

## Use Cloudflare Free Tier adapters

`packages/runtime/src/cloudflare.ts` provides zero-dependency adapters for services included in the Cloudflare Free Tier. None of these adapters require the AWS SDK.

- **Cloudflare R2 via S3 API (from Node.js, Bun, or Render).** Use `createObjectStorage` from `@starter/runtime` with `S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com` and `S3_REGION=auto`.
- **Cloudflare R2 native Workers binding.** When running inside a Cloudflare Worker with an `R2Bucket` binding, call `createCloudflareR2BindingStorage({ bucket: env.MEDIA_BUCKET, publicBaseUrl })` from `@starter/runtime/cloudflare`. It implements the same `ObjectStorage` interface (`putObject`, `getObject`, `deleteObject`, `presignPut`, `presignGet`).
- **Cloudflare Workers KV cache.** Call `createCloudflareKvCache({ kv: env.CACHE_KV })` in production or `createMemoryCache()` in local tests to cache serialized responses behind the `KeyValueCache` interface (`get`, `getJson`, `set`, `setJson`, `delete`).
- **Cloudflare Turnstile bot protection.** Call `createTurnstileVerifier({ secretKey: env.TURNSTILE_SECRET_KEY })` in production or `createNoopBotVerifier()` in local development to validate client Turnstile tokens before account signup or guest checkout.

## Disable or delete opt-in modules

Every opt-in capability can be turned off with an environment variable or deleted by removing its vertical slice directory.

### 1. Billing (`FEATURE_BILLING_ENABLED`)

To disable Stripe checkout and store subscriptions without deleting code, set these variables in `.env`:

```bash
FEATURE_BILLING_ENABLED=false
VITE_FEATURE_BILLING_ENABLED=false
```

When disabled, `/api/stores/:storeId/billing/*` and `/api/webhooks/stripe` return `404 Not Found`, checkout orders skip Stripe session creation, and the web navigation hides the **Billing** tab.

To delete the billing module completely:

1. Delete `apps/api/src/features/billing/`.
2. Delete `apps/web/src/routes/dashboard/billing.tsx`.
3. Remove `billingRouter` from `apps/api/src/app.ts` and remove `paymentGateway` from `apps/api/src/context.ts`.
4. Delete `packages/db/src/schema/subscriptions.ts` and generate a Drizzle migration to drop the `subscriptions` table.
5. Regenerate the web route tree and verify:

```bash
pnpm --filter @starter/web build && pnpm run check && pnpm run test
```

### 2. Background jobs (`FEATURE_JOBS_ENABLED`)

To run jobs inline inside the API process without a separate worker deployment, keep `FEATURE_JOBS_ENABLED=true` and set:

```bash
WORKER_INLINE=true
```

To disable background jobs and CSV catalog exports completely, set:

```bash
FEATURE_JOBS_ENABLED=false
```

To delete the jobs module and standalone worker app:

1. Delete `apps/worker/`, `packages/jobs/`, and `apps/api/src/features/exports/`.
2. Remove `exportsRouter` from `apps/api/src/app.ts` and remove `jobQueue` from `apps/api/src/context.ts`.
3. Run `pnpm install && pnpm run check && pnpm run test`.

### 3. Realtime WebSockets (`FEATURE_REALTIME_ENABLED`)

To disable WebSocket push updates for book stock changes and order status transitions, set:

```bash
FEATURE_REALTIME_ENABLED=false
VITE_FEATURE_REALTIME_ENABLED=false
```

When disabled, the `/ws` endpoint is not mounted and the web storefront uses standard TanStack Query fetches without opening a WebSocket connection.

To scale WebSocket notifications across multiple API instances when enabled, switch the broker from in-memory to PostgreSQL `LISTEN` and `NOTIFY`:

```bash
REALTIME_BROKER=pg-notify
```

To delete the realtime module completely:

1. Delete `apps/api/src/features/realtime/` and `apps/web/src/lib/realtime.ts`.
2. Remove the `/ws` route and `realtimeHub` wiring from `apps/api/src/app.ts` and `apps/api/src/index.ts`.
3. Run `pnpm run check && pnpm run test`.

### 4. Internationalization (`FEATURE_I18N_ENABLED`)

To hide the locale switcher and lock the UI and transactional emails to English (`en`), set:

```bash
FEATURE_I18N_ENABLED=false
VITE_FEATURE_I18N_ENABLED=false
```

To delete the i18n package completely:

1. Delete `packages/i18n/` and remove the locale switcher from `apps/web/src/routes/__root.tsx`.
2. Replace `Locale` imports in `packages/email` with plain English strings.
3. Run `pnpm install && pnpm run check && pnpm run test`.

### 5. Multi-tenancy (`FEATURE_MULTI_TENANCY_ENABLED`)

To run the application as a single-store bookstore, set:

```bash
FEATURE_MULTI_TENANCY_ENABLED=false
VITE_FEATURE_MULTI_TENANCY_ENABLED=false
```

In single-store mode, the API automatically resolves the default seeded store, blocks `POST /api/stores` from creating additional tenants, and hides the store switcher in the dashboard header.

### 6. SaaS platform admin and user impersonation (`FEATURE_ADMIN_ENABLED`)

To disable the platform admin dashboard (`/admin`), cross-tenant store billing overrides, and `better-auth` user impersonation, set:

```bash
FEATURE_ADMIN_ENABLED=false
VITE_FEATURE_ADMIN_ENABLED=false
```

To delete the SaaS admin module completely:

1. Delete `apps/api/src/features/admin/`, `apps/web/src/features/admin/`, and `apps/web/src/routes/admin/`.
2. Remove `createAdminRouter` from `apps/api/src/app.ts`, remove `adminPlugin` from `apps/api/src/features/auth/auth.service.ts`, and remove `adminClient` from `apps/web/src/lib/auth-client.ts`.
3. Regenerate the web route tree and verify:

```bash
pnpm --filter @starter/web build && pnpm run check && pnpm run test
```
