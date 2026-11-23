---
name: vite-plus
description: >-
  Unified Vite+ (`vp`) toolchain, Vite Task (`vp run`) caching, `vpx` TypeScript runner,
  single-root `vite.config.ts`, and `.vite-hooks` / `vp staged` workflows in nodejs-fullstack-starter.
  Use when running builds, checks, tests, TypeScript scripts, or modifying workspace tasks.
---

# Vite+ (`vp`) Skill (`nodejs-fullstack-starter`)

This repository is standardized on **Vite+** (`vite-plus`), which unifies Vite, Vitest, Rolldown/tsdown (`vp pack`), Oxlint, Oxfmt, `tsrs`, and Vite Task (`vp run`) behind `vp`, `vpr`, and `vpx`.

Local reference docs live at [`node_modules/vite-plus/docs/`](../../node_modules/vite-plus/docs/index.md).

## Built-in Commands vs `vp run`

- `vp <cmd>` runs a **built-in** Vite+ command:
  - `vp check` / `vp check --fix`: runs Oxfmt + Oxlint + type-aware `tsrs` checking in one pass
  - `vp check --no-fmt --no-lint`: runs `tsrs` type-checking only
  - `vp lint` / `vp fmt`: standalone lint or format
  - `vp test run` / `vp test run --coverage`: runs Vitest
  - `vp dev` / `vp build` / `vp preview`: runs Vite for `apps/web` (`defaultPackage: './apps/web'`)
  - `vp pack`: bundles libraries (used by `@starter/email` for React JSX templates)
  - `vp staged`: runs `staged` checks on Git-staged files
  - `vp hooks status|enable|disable`: manages `.vite-hooks/_`
  - `vp cache clean`: clears `node_modules/.vite/task-cache`
  - `vp toolchain`: prints pinned Vite+ tool versions
- `vp run <task>` (or `vpr <task>`) runs a `package.json` script or a `vite.config.ts` `run.tasks` entry with dependency ordering and Vite Task caching.

## Caching & Task Rules

1. **Never duplicate task names** between `vite.config.ts#run.tasks` and root `package.json#scripts` (Vite Task rejects overlapping names). Root `vite.config.ts` defines `task:check`, `task:lint`, and `task:typecheck`, and `package.json` scripts (`check`, `lint`, `typecheck`) invoke `vp run task:*`.
2. **Cached workspace builds:** `pnpm run build` runs `vp run --cache -r build`, building `@starter/i18n`, `@starter/email`, and `@starter/web` in topological order with automatic input/output caching.
3. **Clean task environments:** `vp run` strips unlisted environment variables by default. Add any build-time env var to `cache.env` (invalidates cache) or `cache.untrackedEnv` (does not invalidate cache) if a cached task needs it.

## Running TypeScript Scripts (`vpx`)

- Run one-off `.ts`/`.tsx` scripts with `pnpm exec vpx <file>` (or `vpx --watch <file>`). Never add `tsx` or `ts-node`.

## Single Root Config & IDE Alignment

- All Oxlint (`lint`), Oxfmt (`fmt`), Vitest (`test`), staged (`staged`), and Vite Task (`run`) settings live in root [`vite.config.ts`](../../vite.config.ts). Do not re-add `oxlint.config.ts` or `.oxlintrc.json`.
- Editor configs in [`.zed/settings.json`](../../.zed/settings.json) and [`.vscode/settings.json`](../../.vscode/settings.json) point `oxlint` and `oxfmt` at root `vite.config.ts` with nested configs disabled.
