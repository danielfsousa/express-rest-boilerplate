---
name: design-system
description: >-
  Starter Stone design system (`DESIGN.md`), `@starter/ui` (`@starter/ui/web`, `@starter/ui/email`,
  `@starter/ui/tokens`), Storybook + Storybook MCP, and `@starter/email` layouts & templates.
  Use when building or styling web UI in `apps/web`, `packages/ui`, or email templates in `packages/email`.
---

# Starter Stone Design System Skill (`ts-blueprint`)

This repository implements the **Starter Stone** design system documented in [`DESIGN.md`](../../DESIGN.md) and implemented in [`packages/ui`](../../packages/ui/package.json) (`@starter/ui`).

## Package & Token Architecture

- **No separate `@starter/tokens` package:** `@starter/ui` owns the Astryx theme, web UI kit, email UI kit, and resolved token bridge:
  - `@starter/ui` & `@starter/ui/web` (`packages/ui/src/web/index.ts`): exports `<StarterThemeProvider>`, kit components (`PageShell`, `SectionCard`, `DataRow`, `StatusPill`, `EmptyNotice`), and curated Astryx primitives (`Banner`, `Button`, `Card`, `Divider`, `Heading`, `HStack`, `Spinner`, `Switch`, `Text`, `TextInput`, `VStack`, etc.).
  - `@starter/ui/email` (`packages/ui/src/email/index.ts`): exports tokenized React Email primitives (`Document`, `Card`, `Eyebrow`, `Heading`, `Text`, `Button`, `Link`, `Divider`, `Callout`, `Section`, `Row`, `Column`).
  - `@starter/ui/theme` (`packages/ui/src/theme.ts`): `starterTheme` extending `@astryxdesign/theme-stone` via `defineTheme` with monochrome `#FAFAFA` / `#FFFFFF` / `#171717` / `#EBEBEB` / `#297A3A` tokens.
  - `@starter/ui/tokens` (`packages/ui/src/tokens.ts`): pure TypeScript, React-free `resolveStarterTokens(mode)` / `starterLightTokens` / `starterDarkTokens` backed by `@astryxdesign/core/theme/tokens` (`resolveThemeToken`).
  - `@starter/ui/styles.css` (`packages/ui/src/styles.css`): Astryx CSS layers + `@astryxdesign/theme-stone/fonts.css` (Montserrat, Figtree, JetBrains Mono).

## Web (`apps/web`) Guardrails

1. Import UI components and Astryx primitives from `@starter/ui` (or `@starter/ui/web`), never directly from `@astryxdesign/core/*`.
2. Never use raw `<div>` elements or hardcoded hex/px values in components; use Astryx layout primitives (`VStack`, `HStack`, `Section`, `Card`, `Divider`) and semantic tokens.
3. Pair `StatusDot` with visible text via `<StatusPill>` so status never relies on color alone.

## Email (`packages/email`) Guardrails

1. Layouts live in `packages/email/src/layouts/` (`EmailLayout.tsx`), and `packages/email/src/templates/` contains only `.tsx` email templates, each calling `defineTemplate` (`packages/email/src/define-template.ts`) to self-register metadata and component rendering.
2. Compose every layout and template from `@starter/ui/email` components rather than writing raw inline `style={{ ... }}` objects or hardcoded hex/px literals.
3. Keep `packages/email/src/index.ts` free of `.tsx` imports so Node.js callers do not require a JSX loader at runtime; bundle `.tsx` templates via `vp pack` (`pnpm --filter @starter/email build`).

## Storybook & Storybook MCP

- Run `pnpm run storybook` (`http://localhost:6006`) or `pnpm run storybook:build`.
- `@storybook/addon-mcp` serves component manifests and story docs at `http://localhost:6006/mcp` (registered in `.mcp.json` and `.agents/mcp_config.json`).
