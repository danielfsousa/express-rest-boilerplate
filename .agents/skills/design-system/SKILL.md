---
name: design-system
description: >-
  Starter Stone design system (`DESIGN.md`), `@starter/ui` (Astryx Stone theme, kit components,
  and resolved tokens), and `@starter/email` token-styled React Email templates.
  Use when building or styling web UI in `apps/web`, `packages/ui`, or email templates in `packages/email`.
---

# Starter Stone Design System Skill

This repository implements the **Starter Stone** design system documented in [`DESIGN.md`](../../DESIGN.md) and implemented in [`packages/ui`](../../packages/ui/package.json) (`@starter/ui`).

## Package & Token Architecture

- **No separate `@starter/tokens` package:** `@starter/ui` owns both the Astryx theme/components and the resolved token bridge:
  - `@starter/ui` (`packages/ui/src/index.ts`): exports `<StarterThemeProvider>`, kit components (`PageShell`, `SectionCard`, `DataRow`, `StatusPill`, `EmptyNotice`), and curated Astryx primitives.
  - `@starter/ui/theme` (`packages/ui/src/theme.ts`): `starterTheme` extending `@astryxdesign/theme-stone` via `defineTheme` with monochrome `#FAFAFA` / `#FFFFFF` / `#171717` / `#EBEBEB` / `#297A3A` tokens.
  - `@starter/ui/tokens` (`packages/ui/src/tokens.ts`): pure TypeScript, React-free `resolveStarterTokens(mode)` / `starterLightTokens` / `starterDarkTokens` backed by `@astryxdesign/core/theme/tokens` (`resolveThemeToken`).
  - `@starter/ui/styles.css` (`packages/ui/src/styles.css`): Astryx CSS layers + `@astryxdesign/theme-stone/fonts.css` (Montserrat, Figtree, JetBrains Mono).

## Web (`apps/web`) Guardrails

1. Import UI components and Astryx primitives from `@starter/ui`.
2. Never use raw `<div>` elements or hardcoded hex/px values in components; use Astryx layout primitives (`VStack`, `HStack`, `Section`, `Card`, `Divider`) and semantic tokens.
3. Pair `StatusDot` with visible text via `<StatusPill>` so status never relies on color alone.

## Email (`packages/email`) Guardrails

1. Email clients strip external stylesheets, StyleX classes, and CSS `var(--*)` / `light-dark()`.
2. Compose every template inside `<EmailLayout>` (`packages/email/src/templates/EmailLayout.tsx`) using prebuilt `@react-email/components` (`Html`, `Head`, `Font`, `Preview`, `Body`, `Container`, `Section`, `Row`, `Column`, `Heading`, `Text`, `Button`, `Hr`, `Link`).
3. Style exclusively with `starterLightTokens` from `@starter/ui/tokens` — never hardcode hex colors.
4. Keep `packages/email/src/index.ts` free of `.tsx` imports so Node.js callers do not require a JSX loader at runtime; bundle `.tsx` templates via `vp pack` (`pnpm --filter @starter/email build`).
