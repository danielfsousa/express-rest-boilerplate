---
date: 2026-11-22
status: Accepted
author: Daniel Sousa
linear_project: https://linear.app/danielfs/project/nodejs-fullstack-starter-v2-78f64cb3eb01
scope: Rewrite express-rest-boilerplate on v2 into nodejs-fullstack-starter, a full-stack TypeScript monorepo starter
---

# Intent: Rewrite the starter into nodejs-fullstack-starter v2

## Problem

`express-rest-boilerplate` started in 2017 as an opinionated REST API template (now at 2,354 stars on GitHub). Its codebase still relies on outdated packages and patterns: Express 4, plain JavaScript with JSDoc, Mongoose and MongoDB, Passport, a single-package layout, older OpenTelemetry and Grafana container images, and an ad-hoc Render deploy hook. Developers who clone the template today, and the author starting new projects, must replace most of the stack before writing product code.

## Proposed outcome

Rewrite the `v2` branch from scratch as `nodejs-fullstack-starter`, an opinionated full-stack TypeScript monorepo starter with a working real-world example application, local-first development, full test coverage, local and hosted observability, and infrastructure as code.

The outcome is reached when every check below holds:

- A developer installs host tools with `mise`, installs dependencies with `pnpm`, and starts the API and web application locally on the host with `.localhost` URLs through `portless`.
- Multiple `worktrunk` (`wt`) git worktrees run side by side without port collisions for host apps, Docker Compose services, or integration test containers.
- Local development and tests emulate external dependencies with tools such as Floci and `vercel-labs/emulate`, so developers and coding agents run and verify the full application without live third-party accounts.
- Integration tests run database and backing service dependencies inside containers (via Testcontainers or Docker Compose) with collision-free ports.
- The repository ships a real-world example application built with React 19, a feature-organized Hono API, PostgreSQL (Neon in production) with Drizzle ORM 1.0 beta, `better-auth` authentication and authorization, React Email templates delivered through Bird.com, and cleanly isolated, toggleable opt-in modules for payments and billing, WebSockets, multi-tenancy, background jobs, and internationalization.
- Platform-specific runtime code lives in isolated adapter modules so a team can swap Node.js for another runtime such as Bun.
- Unit, integration, component, and end-to-end tests pass in Vitest and Playwright in CI alongside Oxc linting, Oxc formatting, and strict TypeScript type checking.
- Docker Compose runs an opt-in local observability profile routed through `portless`, and production API containers build from `platformatic/node-caged`.
- Infrastructure as code provisions and deploys a live public demo on a subdomain managed by the author's Cloudflare DNS zone, updated by GitHub Actions CI and CD.
- `README.md` and repository documentation explain setup, architecture, testing, observability, removing optional modules, and deployment.

## Affected users and systems

- Developers using the public GitHub template (`danielfsousa/express-rest-boilerplate`, to be renamed to `nodejs-fullstack-starter` at release) and the author starting new full-stack projects.
- The `v2` branch of this repository, which replaces the v1 codebase while v1 stays frozen on a `v1` branch or tag.
- GitHub Actions workflows for CI, container image builds, and deployment.
- External accounts and services: Neon for hosted PostgreSQL, Bird.com for transactional email, the author's Cloudflare DNS zone, and the chosen cloud host, payment provider, and observability backend.

## Constraints

- Clean-slate rewrite on the `v2` branch with no backward compatibility or migration path from v1 Express and MongoDB APIs.
- Preserve v1 on a `v1` branch or tag; cut over `main` and rename the GitHub repository to `nodejs-fullstack-starter` once v2 ships.
- Run application processes locally on the host by default so developers and coding agents can drive them directly.
- Keep first-time host prerequisites minimal (`mise` and Docker).
- Keep the local observability stack behind an opt-in Docker Compose profile so default local startup stays fast.
- Keep payments and billing, WebSockets, multi-tenancy, background jobs, and internationalization as isolated, config-toggleable modules that a user can disable or delete without breaking core authentication and CRUD.
- Isolate Node.js-specific runtime APIs into separate adapter modules to support switching to another runtime such as Bun.
- Keep live demo hosting within provider Always Free tiers where possible.
- Settled technology choices: latest Node.js LTS, strict TypeScript (7.1 or `tsrs`), `mise`, `pnpm` with global store, `worktrunk`, Hono, PostgreSQL (Neon for production), Drizzle ORM 1.0 beta (`v1.0.0-beta.2` or newer), Oxc for linting and formatting, Lefthook, `better-auth`, React 19, `bulletproof-react`-inspired frontend structure, feature-based API organization, React Email with Bird.com delivery, Vitest, Playwright, Docker Compose with `portless`, `platformatic/node-caged` production image, Floci and `vercel-labs/emulate` for third-party emulation, and Cloudflare DNS.
- Not in scope for v2.0: native mobile applications, GraphQL or gRPC APIs, microservice splits beyond one API app, one web app, and an optional background worker in the monorepo, and an interactive CLI project generator.

## Open questions

- Example domain: RealWorld (Conduit), bookstore, or another domain that exercises multi-tenancy, billing, WebSockets, and background jobs.
- Monorepo and build tooling: Vite+ (`vp`) or Turborepo.
- Type checker: official TypeScript 7.1 (`tsgo`) or `tsrs`.
- Frontend components and styling: Meta Astryx with `@stylexjs/stylex`, Base UI with Tailwind CSS, or a combination.
- Frontend routing and data layer: TanStack Start and TanStack Query, or `fate` (`fate.technology`) with TanStack Router.
- Queue or broker backing service for background jobs, plus Testcontainers versus Docker Compose for integration tests.
- Payment provider, billing model, and local emulation setup.
- WebSocket transport and multi-tenancy isolation strategy.
- Local and hosted observability stack: Grafana stack or a lighter plugin observability service.
- Cloud hosting provider (AWS within Always Free tier, Render, Cloudflare, Vercel, or DigitalOcean) and infrastructure-as-code tool (Terraform or Pulumi).
