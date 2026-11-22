---
date: 2026-11-22
status: Accepted
scope: Fixes the web application framework, client data layer, component system, and styling library; leaves the Hono REST API contract independent
---

# ADR-0002: Frontend stack with Meta Astryx, StyleX, and TanStack Start

## Context

v2 adds a full React 19 web application covering multi-tenant storefronts, merchant administration, billing, order tracking, and authentication. The starter needs a complete accessible component library, SSR-capable routing, and type-safe API consumption without locking the backend to a single frontend client.

What constrains the choice:

- The frontend must use React 19 and follow a `bulletproof-react`-inspired feature folder layout.
- The backend is a Hono REST API with OpenAPI documentation usable by external HTTP clients.
- Coding agents should be able to build and verify screens with minimal guesswork on component props and tokens.

## Considered options

- **Base UI with Tailwind CSS v4 and TanStack Start**. Rejected: ships unstyled primitives only, forcing the starter to author and maintain dozens of styled form, table, modal, and layout components before shipping storefront features.
- **Meta Astryx and StyleX with `fate` and TanStack Router**. Rejected: `fate` requires a server-side view resolver (such as tRPC), introducing a second API protocol beside the OpenAPI REST API.
- **Meta Astryx and `@stylexjs/stylex` with TanStack Start and TanStack Query**. Chosen. Adds the `@astryxdesign/build/vite` StyleX plugin and ties UI styling to Astryx CSS layers and design tokens.

## Decision

Build `apps/web` with TanStack Start (TanStack Router with SSR), TanStack Query, Meta Astryx (`@astryxdesign/core` and `@astryxdesign/theme-neutral`), and `@stylexjs/stylex`. Register `astryxStylex()` before `tanstackStart()` and `viteReact()` in Vite configuration, and load Astryx CSS layers in explicit order (`reset`, `astryx-base`, `astryx-theme`, `components`, `utilities`).

Generate local component documentation with `@astryxdesign/cli init` so coding agents read exact component APIs. Connect TanStack Query hooks to `apps/api` through a typed OpenAPI or Hono RPC client so the REST contract remains the single source of truth.

## Consequences

### Positive

- Ships over 150 accessible React 19 components, dark mode, and design tokens on day one.
- Keeps `apps/api` a plain OpenAPI REST service usable by browsers, tests, and third-party consumers.
- Zero-runtime atomic CSS output from StyleX avoids CSS specificity conflicts.

### Negative

- Developers who prefer Tailwind utility classes must replace the styling layer if they adopt the template.
- StyleX compilation requires `@astryxdesign/build/vite` to stay aligned with Vite+ and TanStack Start plugin updates.
