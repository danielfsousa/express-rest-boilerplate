# Contributing to better-drizzle itself

Only for changes inside the better-drizzle repository. `AGENTS.md` at the repo root is the source of truth. This file is the short version.

## Layout

- `src/shared/client/operations.ts`, `src/shared/query/compiler.ts`, and `src/shared/client/context.ts` are the hot paths. Keep them free of new helpers, object spreads, and extra allocations unless a benchmark shows the gain.
- `src/types/*`: the public type surface.
- `src/plugins/*`: official plugins, published as `better-drizzle/<name>` subpaths.
- `tests/core/*.test.ts` run on SQLite. `*.pg.test.ts` needs `DATABASE_URL` and `*.mysql.test.ts` needs `MYSQL_URL`. Without them, those suites skip.
- `apps/web/content/docs`: the docs site. `README.md` must stay in sync with user-facing changes.

## Rules

- Throw `BetterDrizzleError` with a `BetterDrizzleErrorCode`, and normalize driver errors with `BetterDrizzleError.from(...)`.
- Unsupported dialect/feature combinations fail fast with a specific code. Never fall back to slow userland loops.
- Benchmarks compare API parity: the raw Drizzle side must do the same work and return the same shape. After hot-path changes, run `bun run bench`, `bun run bench:verify`, and `bun run bench:memory`, and report ratios, not microseconds.
- `bunx tsc --noEmit` can pass while declaration builds fail. Run `bun run build` for exported plugin types.
- Style: tabs, single quotes, trailing commas, sparse comments, `Object.create(null)` for internal maps.
