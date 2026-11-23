---
name: varlock
description: >-
  Secure environment variable management with Varlock in nodejs-fullstack-starter.
  Use when handling secrets, API keys, credentials, or any environment configuration (.env.schema, .env.prod, env.d.ts).
  Ensures secrets are never exposed in terminal, logs, or LLM context.
---

# Varlock Skill (`nodejs-fullstack-starter`)

This repository uses [Varlock](https://varlock.dev) (`@env-spec`) to define, validate, type, and secure environment variables across the monorepo.

## Project Setup

- **Single source of truth:** Root [`.env.schema`](../../.env.schema) defines all environment variables, types, defaults, and `# @sensitive` secret decorators.
- **Two environments only (`local` and `prod`):**
  - Controlled by `APP_ENV` (`# @currentEnv=$APP_ENV`, `# @type=enum(local, prod)`).
  - Do **not** introduce `dev` or `staging` environments.
  - Tracked production overrides live in [`.env.prod`](../../.env.prod).
- **TypeScript code generation:**
  - `# @generateTsTypes(path=./env.d.ts)` generates root [`env.d.ts`](../../env.d.ts) with typed `ENV` (`varlock/env`) and `process.env` declarations.
  - Run `pnpm run env:codegen` (`pnpm exec varlock codegen`) after modifying `.env.schema`.
- **Monorepo workspace resolution:**
  - `apps/api/package.json`, `apps/worker/package.json`, and `apps/web/package.json` configure `"varlock": { "loadPath": "../../" }` so Varlock loads the root `.env.schema` and `.env.[APP_ENV]` from any package directory.

## Critical Security Rules for AI Agents

1. **Never expose secrets in agent context:**
   ```bash
   # NEVER run these:
   cat .env
   cat .env.local
   cat .env.prod.local
   printenv

   # ALWAYS use Varlock's redacted agent mode:
   pnpm exec varlock load --agent
   pnpm run env:check
   pnpm run env:scan
   ```
2. **Allowed vs. forbidden files:**
   - **Safe to read and edit:** `.env.schema`, `.env.prod`, `env.d.ts` (generated via `pnpm run env:codegen`).
   - **Forbidden to read or edit:** `.env`, `.env.local`, `.env.local.local`, `.env.prod.local`, or any gitignored override file.
3. **Marking secrets:**
   - Every credential, connection string with password, signing secret, API key, or webhook secret must carry `# @sensitive`.
   - Local placeholder values for `# @sensitive` items in `.env.schema` must be at least 12 characters long so Varlock's secret scanner and redactor can track them without short-secret warnings.
4. **Pre-commit leak scanning:**
   - `lefthook.yml` runs `pnpm exec varlock scan --staged` before every commit.
