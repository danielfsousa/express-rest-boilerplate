# Worker Agent Instructions (`apps/worker`)

See [../../docs/guides/style-guide.md](../../docs/guides/style-guide.md) and [../../AGENTS.md](../../AGENTS.md) for workspace-wide rules.

## Key Conventions

- **Shared job definitions:** All job names, payload types, `JobQueue` adapters (`createPgBossJobQueue`, `createCloudflareJobQueue` via `@starter/jobs/cloudflare`, `createInlineJobQueue`), and handlers live in `@starter/jobs` (`packages/jobs`).
- **Inline mode:** `apps/api` can execute the exact same handlers in-process when `WORKER_INLINE=true` or `FEATURE_JOBS_ENABLED=false`. Keep handlers idempotent and stateless.
- **`pg-boss` constraints:**
  - `pollingIntervalSeconds` must be `>= 0.5` (`pg-boss` enforces a 500 ms floor).
  - Create queues sequentially on startup to avoid PostgreSQL partition-attach deadlocks.
  - Database role `app_user` must own the `pgboss` schema (`CREATE SCHEMA IF NOT EXISTS pgboss AUTHORIZATION app_user;`) and have `GRANT CONNECT, CREATE ON DATABASE`.
- **Environment alignment:** All environment variables and defaults are defined in root `.env.schema` (loaded via Varlock). Keep `ENV.*` usage aligned across `@starter/api` and `@starter/worker`.
