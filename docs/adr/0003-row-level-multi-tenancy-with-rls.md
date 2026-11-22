---
date: 2026-11-22
status: Accepted
scope: Fixes tenant data isolation and storefront URL routing; leaves authentication session management to better-auth
---

# ADR-0003: Row-level multi-tenancy with PostgreSQL RLS and slug routing

## Context

The v2 bookstore platform hosts independent stores managed by merchants and browsed by customers. Every tenant-owned record (books, inventory, orders, customer store profiles, and billing metadata) must stay isolated between stores in both local development and Neon production hosting.

What constrains the choice:

- Production runs on PostgreSQL (Neon Free tier) using Drizzle ORM 1.0 beta (`v1.0.0-beta.2` or newer).
- `better-auth` provides store membership and roles through its `organization` plugin in the same PostgreSQL database.
- Local development runs under `.localhost` via `portless` across parallel `worktrunk` worktrees, and live demo hosting runs on free-tier DNS without wildcard TLS provisioning.

## Considered options

- **Database-per-store on Neon branches**. Rejected: Neon Free limits branch count and requires fanning Drizzle migrations out to every store database.
- **Schema-per-store in one PostgreSQL database**. Rejected: complicates Drizzle schema generation, connection pooling, and cross-store admin queries as store count grows.
- **Subdomain-only tenant routing (`<store>.domain`)**. Rejected: requires wildcard DNS and wildcard TLS certificates on free-tier hosts and complicates `portless` worktree URLs.
- **Shared tables with `storeId`, PostgreSQL Row-Level Security, and slug paths (`/s/:storeSlug`)**. Chosen. Requires every tenant-scoped database operation to run through a transaction helper that sets the PostgreSQL session store context.

## Decision

Isolate tenant data using a non-null `storeId` foreign key on every store-owned table, backed by PostgreSQL Row-Level Security policies matching `current_setting('app.current_store_id', true)`. Wrap tenant-scoped queries in a `withStoreContext(storeId, fn)` helper that sets `SET LOCAL app.current_store_id` inside a transaction before running Drizzle queries.

Route storefronts under `/s/:storeSlug` and tenant API endpoints under `/api/v1/stores/:storeSlug`, with an optional middleware resolver that reads a custom `X-Store-Slug` header or host mapping when custom domains are added later.

## Consequences

### Positive

- Database-enforced RLS prevents cross-store data leaks even when an application query forgets a `WHERE store_id = ...` filter.
- One Drizzle schema and one migration path serve all stores without Neon branch limits.
- Slug paths work identically under `portless`, Playwright tests, and single-domain free-tier deployments.

### Negative

- Background workers and platform-level queries must explicitly bypass or set `app.current_store_id` using a dedicated role or transaction helper.
- Adding custom merchant domains later requires enabling the host-header lookup middleware and edge TLS routing.
