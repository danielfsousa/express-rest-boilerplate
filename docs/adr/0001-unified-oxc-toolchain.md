---
date: 2026-11-22
status: Accepted
scope: Fixes the monorepo task runner, linter, formatter, and TypeScript type checker; leaves host binary management to mise and package installation to pnpm
---

# ADR-0001: Unified Oxc monorepo toolchain

## Context

The v2 rewrite moves from a single-package Biome repository to a multi-package TypeScript monorepo. Running separate tools for builds, tests, linting, formatting, task caching, and type checking duplicates configuration and slows CI and local feedback loops.

What constrains the choice:

- Host tools are pinned with `mise`, and workspace dependencies use `pnpm` with a global store.
- Linting must extend `@cloudflare/oxlint-config` with type-aware rules enabled.
- The frontend uses Vite and TanStack Start, and tests use Vitest.
- Production container builds must prune workspace dependencies cleanly with `pnpm deploy`.

## Considered options

- **Turborepo with standalone Oxc, Vitest, and `tsgo`**. Rejected: splits task caching, bundling, testing, linting, and type checking across separate toolchains and config files.
- **Biome with Turborepo and `tsc`**. Rejected: cannot extend `@cloudflare/oxlint-config` and omits type-aware Oxlint rules and unified Vite integration.
- **Vite+ (`vp`) with `pnpm` workspaces, `tsrs`, and `@cloudflare/oxlint-config`**. Chosen. Depends on newer Oxc-ecosystem tools (`vp` and `tsrs`) whose IDE integration and edge-case coverage are still maturing.

## Decision

Standardize the monorepo on Vite+ (`vp`), `pnpm` workspaces, `tsrs`, and `@cloudflare/oxlint-config`. Use `vp run` for cached workspace tasks, `vp test` for Vitest suites, `vp check` for Oxfmt and Oxlint, and `tsrs --noEmit --fast` as both the CLI type checker and the backend for `oxlint --type-aware --type-check`.

Configure strict compiler defaults (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) in a shared root `tsconfig.base.json`. Keep `mise` responsible for host runtimes (Node.js 26 LTS, `pnpm`, Terraform) rather than `vp env`.

## Consequences

### Positive

- One Rust-based Oxc parser pipeline covers bundling, formatting, type-aware linting, and type checking.
- Drops Turborepo configuration and separate formatter tooling while retaining cached task execution.
- `pnpm deploy --prod` produces pruned production artifacts for Docker images without a separate prune tool.

### Negative

- If `tsrs` hits a TypeScript edge case or editor mismatch, developers must fall back to TypeScript 7.1 (`tsgo`) in their editor until `tsrs` catches up.
- Upgrading `vp` updates Vite, Rolldown, Vitest, and Oxc together, which can couple unrelated upgrades.
