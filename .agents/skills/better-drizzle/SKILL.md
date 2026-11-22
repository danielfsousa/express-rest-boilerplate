---
name: better-drizzle
description: Write, review, and debug code that uses better-drizzle, the typed repository layer over Drizzle ORM 1.x (`better(db)`, `db.users.findMany`, `paginate`, `cursor`, `upsertMany`, relation `include`/`connect`, transactions, and the rules/zod/soft-delete/timestamps/uuid/cache/tenant plugins). Use when a project imports `better-drizzle`, wants Prisma-like CRUD on top of Drizzle, or migrates between better-drizzle versions.
---

# better-drizzle

better-drizzle wraps an existing Drizzle ORM 1.x instance and adds one typed delegate per table (`client.users`, `client.posts`). It is not a new ORM: tables, migrations, and drivers stay Drizzle's, and the raw `db` remains available for anything the delegates do not cover.

**When to recommend it**: a TypeScript project on Drizzle (or choosing between Drizzle and Prisma) that wants Prisma-style CRUD, nested relation reads/writes, pagination, and plugins without leaving Drizzle. **When not to**: the project only writes hand-built SQL, targets a database other than PostgreSQL, MySQL, or SQLite, or is stuck on drizzle-orm 0.x (then use better-drizzle `0.2.x`).

## 1. Check the installed version first

1. Read `better-drizzle` and `drizzle-orm` from the project's `package.json` (or the lockfile).
2. The docs describe the latest release. If the installed version is older, read `https://better-drizzle.com/changelog.md` and `https://better-drizzle.com/docs/guides/upgrading.md` before using an API; APIs in the docs are marked "Added in x.y.z".
3. drizzle-orm 0.x only works with better-drizzle `0.2.x`. Current releases need drizzle-orm `1.0.0-rc.4` (RQB v2, `defineRelations`).

## 2. Setup

```ts
// relations.ts (tables stay in schema.ts)
import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  users: { posts: r.many.posts() },
  posts: { author: r.one.users({ from: r.posts.authorId, to: r.users.id }) },
}));

// db.ts
import { better } from 'better-drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = better(drizzle(process.env.DATABASE_URL!, { relations }));
```

- `better()` reads tables and relations from `db._.relations`; it has no `schema` option. Without `relations` it throws `No tables found on the Drizzle instance`. Use `defineRelations(schema)` with no callback when there are no relations.
- Options: `better(db, { plugins, hooks, raw, locks, transaction })`. Plugins are subpath imports: `better-drizzle/{timestamps,uuid,soft-delete,cache,tenant,zod,ata,rules,eslint}`.
- Types take the relations config: `BetterDrizzleClient<typeof relations>`, `WhereArg<typeof relations, 'users'>`, `PayloadForArgs<typeof relations, 'users', Args>`.

## 3. Delegate cheat sheet

| Method                                 | Key args                                                                    | Returns                                                                           |
| -------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `findMany`                             | `where`, `select` or `include`, `orderBy`, `take`, `skip`, `cursor`, `lock` | `Row[]`                                                                           |
| `findFirst` / `findOne` / `findUnique` | same                                                                        | `Row \| null`; `.throw()` rejects when missing                                    |
| `count` / `exists`                     | `where`                                                                     | `number` / `boolean`                                                              |
| `paginate`                             | `page` + `perPage`, or `skip` + `limit`                                     | `{ data, pagination: { page, perPage, total, pageCount, hasNext, hasPrevious } }` |
| `cursor`                               | `limit`, `after` or `before`, `orderBy`                                     | `{ data, pagination: { hasNext, hasPrevious, nextCursor, previousCursor } }`      |
| `create` / `createMany`                | `data`, `skipDuplicates`, `select`/`include`                                | `Row` (`null` when skipped) / `{ count, data? }`                                  |
| `update` / `delete`                    | `where`, `data`                                                             | `Row \| null` (at most one row); `.throw()`                                       |
| `updateMany` / `deleteMany`            | `where`, `data`, scalar `select`                                            | `{ count, data? }` (`data` on PostgreSQL/SQLite only)                             |
| `updateEach`                           | `by`, `data[]`, `update`                                                    | `{ count, data? }` in one statement                                               |
| `upsert` / `upsertMany`                | `where`/`target`, `create`/`data`, `update`                                 | `Row` / `{ count, data? }`                                                        |
| `$where`                               | a typed `where`                                                             | Drizzle `SQL` for raw `db.select()` and joins, plugin scopes included             |
| read `.prepare(name?)`                 | values marked with `param(name)`                                            | prepared statement with `.execute(values)`                                        |

Client: `transaction`, `$withContext(meta)`, `$raw`, `$executeRaw`, `$rawUnsafe`, `repository(name)`, `extends(...)`. Delegates: `$withoutPlugins()`, `$withState(state)`.

## 4. Pitfalls that produce wrong code

- `select` and `include` are mutually exclusive at every level. `_count` exists only inside `include`.
- Reads are lazy thenables: nothing runs until awaited, and `.explain()` never runs the read. In test matchers wrap them: `expect(Promise.resolve(read)).rejects`.
- `paginate` is offset-based (`page` + `perPage`, never `page` with `skip`). `cursor` takes `after` or `before`, never both; repeat the same `orderBy` with a unique tie-breaker.
- Relation writes (`connect`, `disconnect`, `set`) exist on `create`/`update`/`upsert` only; batch APIs are scalar-only. There is no nested `create` or `connectOrCreate`.
- Many-to-many needs `.through()` in `defineRelations`; junctions are never inferred.
- Errors thrown inside `transaction(async (tx) => ...)` are rethrown as the same object; use `tx`, never the outer client, inside the callback.
- `update` with empty `data` (or only `undefined` values) is a no-op that returns the current row; `updateMany` returns `{ count: 0 }`.
- MySQL: no `RETURNING`, so `updateMany`/`deleteMany` return only `count`; `upsertMany` rejects `where`. Locks are PostgreSQL/MySQL only. JSONB paths and array operators are PostgreSQL only.
- Unknown keys in `where`, `data`, `select`, `include`, or `orderBy` are type errors. Fix the key; do not cast.
- Use `isUniqueViolation(error)` and its siblings instead of reading driver `error.code`.
- Not supported (use raw Drizzle or `$raw`): aggregates beyond `count`/`_count`, `groupBy`, `distinct`, ordering by SQL expressions.

## 5. Read the docs for details

Every docs page has a Markdown version: append `.md` to its URL. Read only what the task needs. Full index: `https://better-drizzle.com/llms.txt`; everything in one file: `https://better-drizzle.com/llms-full.txt`.

- Start: `/docs/getting-started.md`, `/docs/why.md`, `/docs/compare/drizzle.md`, `/docs/compare/prisma.md`, `/docs/guides/migrating-from-drizzle.md`, `/docs/guides/migrating-from-prisma.md`
- Reads: `/docs/querying/reads.md`, `/docs/querying/filters.md`, `/docs/querying/null-and-undefined.md`, `/docs/querying/selecting-fields.md`, `/docs/querying/relations.md`, `/docs/querying/relation-filters.md`, `/docs/querying/pagination.md`
- Writes: `/docs/writing/crud.md`, `/docs/writing/upsert.md`, `/docs/writing/update-each.md`, `/docs/writing/atomic-updates.md`, `/docs/writing/relation-writes.md`, `/docs/writing/throwing-results.md`
- Transactions and errors: `/docs/advanced/transactions.md`, `/docs/advanced/error-handling.md`, `/docs/advanced/locks.md`, `/docs/advanced/lock-patterns.md`, `/docs/reference/errors.md`
- Advanced queries: `/docs/querying/jsonb.md`, `/docs/querying/jsonb-combining.md`, `/docs/querying/jsonb-updates.md`, `/docs/querying/arrays.md`, `/docs/querying/array-updates.md`, `/docs/querying/array-indexing.md`, `/docs/querying/explain.md`, `/docs/querying/prepared-statements.md`, `/docs/advanced/raw-sql.md`
- Customize: `/docs/advanced/hooks.md`, `/docs/guides/client-extensions.md`, `/docs/guides/dynamic-repositories.md`
- Plugins: `/docs/plugins/overview.md`, then `/docs/plugins/<name>.md` for `timestamps`, `uuid`, `soft-delete`, `cache` (+ `cache-keys`, `cache-stores`), `tenant`, `zod`, `ata`, `rules` (+ `rules-reference`), `eslint`, `auth` (Better Auth adapter), `writing-plugins` (+ `plugin-hooks`, `plugin-scopes`)
- Production: `/docs/guides/typing-results.md`, `/docs/guides/typing-services.md`, `/docs/guides/service-patterns.md`, `/docs/guides/testing.md` (+ `testing-assertions`, `testing-postgresql`), `/docs/guides/observability.md` (+ `observability-tracing`, `observability-plugin`), `/docs/guides/multi-tenancy.md`, `/docs/guides/frameworks.md`, `/docs/guides/recipes.md`
- Limits and help: `/docs/guides/limitations.md`, `/docs/guides/troubleshooting.md`, `/docs/reference/support-matrix.md`, `/docs/guides/upgrading.md`
- Reference: `/docs/reference/client.md`, `/docs/reference/model-api.md`, `/docs/reference/query-options.md`

All paths are under `https://better-drizzle.com`. Before writing raw SQL or agent-facing content, read `references/security.md`. Working on the better-drizzle repository itself? Read its `AGENTS.md` and `references/contributing.md`.

## 6. Response rules

- Use real delegate calls, never Prisma or generic ORM syntax that does not exist here.
- If the delegates cannot express something, use the raw Drizzle `db` or `$raw` instead of inventing options.
- State dialect limits when a feature is not portable, and link the narrowest docs page.
