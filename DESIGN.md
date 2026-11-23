---
version: 'alpha'
name: 'Starter Stone'
description: 'Editorial monochrome stone and ink design system for multi-tenant bookstore storefronts, merchant consoles, and transactional email.'
colors:
  background: '#FAFAFA'
  surface: '#FFFFFF'
  primary: '#171717'
  secondary: '#4D4D4D'
  accent: '#297A3A'
  border: '#EBEBEB'
typography:
  heading:
    fontFamily: 'Montserrat, Figtree, sans-serif'
    fontSize: '24px'
    fontWeight: '600'
    lineHeight: '1.38'
  body:
    fontFamily: 'Figtree, sans-serif'
    fontSize: '14px'
    fontWeight: '400'
    lineHeight: '1.5'
  mono:
    fontFamily: 'JetBrains Mono, SF Mono, monospace'
    fontSize: '14px'
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: '4px'
  md: '8px'
  lg: '12px'
  full: '9999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
  xl: '32px'
---

# Starter Stone Design System

## Overview

Starter Stone pairs Meta Astryx's Stone theme (`@astryxdesign/theme-stone`) with a crisp monochrome editorial palette (`#FAFAFA` canvas, `#FFFFFF` card surfaces, `#171717` ink primary/accent, and `#297A3A` forest-green positive accents).

### Token Architecture

Design tokens live in [`packages/ui`](./packages/ui/package.json) (`@starter/ui`) rather than a separate `@starter/tokens` package:

- **Web (`apps/web`)**: Consumes Astryx semantic CSS custom properties (`--color-*`, `--spacing-*`, `--radius-*`, `--font-family-*`, `--text-*`) compiled from `starterTheme` via `<StarterThemeProvider>`.
- **Transactional Email (`packages/email`)**: Consumes concrete resolved values from `@starter/ui/tokens` (`starterLightTokens`, produced by Astryx's React-free `resolveThemeToken(starterTheme, ...)`), ensuring 100% visual parity across web and email clients without duplicating hex or px literals.

## Colors

All color pairs satisfy WCAG AA contrast (`>= 4.5:1` for body text, `>= 3:1` for borders/UI controls) in both light and dark modes.

| Role            | Astryx Token                 | Light     | Dark      | Usage                                             |
| --------------- | ---------------------------- | --------- | --------- | ------------------------------------------------- |
| Canvas          | `--color-background-body`    | `#FAFAFA` | `#111110` | Page background and email body backdrop           |
| Surface         | `--color-background-surface` | `#FFFFFF` | `#191918` | Cards, popovers, email content container          |
| Muted Surface   | `--color-background-muted`   | `#F3F3F2` | `#262624` | Summary boxes, secondary panels                   |
| Primary Ink     | `--color-text-primary`       | `#171717` | `#F5F5F4` | Headings, body copy, strong labels                |
| Secondary Ink   | `--color-text-secondary`     | `#4D4D4D` | `#B5B5B0` | Descriptions, metadata, subtitles                 |
| Muted Ink       | `--color-text-disabled`      | `#7D7D7D` | `#787873` | Captions, eyebrow labels, footers                 |
| Primary Accent  | `--color-accent`             | `#171717` | `#F5F5F4` | Primary buttons, focus rings, active indicators   |
| On Accent       | `--color-on-accent`          | `#FFFFFF` | `#171717` | Text and icons placed on `--color-accent`         |
| Hairline Border | `--color-border`             | `#EBEBEB` | `#2E2E2B` | Card outlines, dividers, table separators         |
| Strong Border   | `--color-border-emphasized`  | `#C9C9C9` | `#454540` | Interactive input borders, total separators       |
| Success         | `--color-success`            | `#297A3A` | `#4ADE80` | Published status, fulfilled orders, confirmations |
| Success Surface | `--color-background-green`   | `#EAF5EC` | `#14331C` | Positive callouts                                 |
| Warning         | `--color-warning`            | `#B45309` | `#FBBF24` | Low-stock alerts, impersonation banners           |
| Warning Surface | `--color-background-yellow`  | `#FEF6E7` | `#33250B` | Warning callouts                                  |
| Error           | `--color-error`              | `#C81E1E` | `#F87171` | Destructive actions, validation errors            |
| Error Surface   | `--color-background-red`     | `#FEECEC` | `#361414` | Error banners                                     |

## Typography

- **Headings**: `Montserrat`, `"Figtree"`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `Helvetica`, `Arial`, `sans-serif`
- **Body**: `Figtree`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `Helvetica`, `Arial`, `sans-serif`
- **Code / Monospace**: `"JetBrains Mono"`, `"SF Mono"`, `Monaco`, `Consolas`, `monospace`

| Role       | Token                 | Size               | Weight           | Line Height |
| ---------- | --------------------- | ------------------ | ---------------- | ----------- |
| Heading 1  | `--text-heading-1-*`  | `1.5rem` (24px)    | `600` (Semibold) | `1.3793`    |
| Heading 2  | `--text-heading-2-*`  | `1.25rem` (20px)   | `600` (Semibold) | `1.3333`    |
| Heading 3  | `--text-heading-3-*`  | `1.0625rem` (17px) | `700` (Bold)     | `1.4`       |
| Body       | `--text-body-*`       | `0.875rem` (14px)  | `400` (Normal)   | `1.5`       |
| Label      | `--text-label-*`      | `0.875rem` (14px)  | `500` (Medium)   | `1.5`       |
| Supporting | `--text-supporting-*` | `0.75rem` (12px)   | `400` (Normal)   | `1.5385`    |

## Layout

- **Base spacing unit**: `4px` (`--spacing-1: 4px`, `--spacing-2: 8px`, `--spacing-3: 12px`, `--spacing-4: 16px`, `--spacing-6: 24px`, `--spacing-8: 32px`).
- **Web Page Frame**: `PageShell` applies `padding="lg"` and `gap="lg"` with a single top header bar (`HStack justify="between"`) and vertical section stack.
- **Email Frame**: Centered `560px` max-width `<Container>` inside a `#FAFAFA` `<Body>` with `32px` card padding and `16px` mobile gutter.

## Elevation & Depth

Starter Stone uses a **flat, hairline-bordered surface hierarchy** rather than heavy drop shadows:

- Resting cards and sections sit on `#FFFFFF` (`--color-background-card`) over a `#FAFAFA` (`--color-background-body`) canvas, separated by `1px solid #EBEBEB` (`--color-border`).
- Transient overlays (popovers, dialogs, dropdowns) use Astryx `--shadow-low` and `--shadow-med` tokens on `--color-background-popover`.
- Email containers rely exclusively on `1px solid` borders (`starterLightTokens.colors.border`) since email clients strip `box-shadow`.

## Shapes

All corner radii come from Astryx's radius scale:

- **Inner elements** (`--radius-inner`): `4px` — badges, inline tags, small controls
- **Interactive elements** (`--radius-element`): `8px` — buttons, inputs, email callouts, email CTAs
- **Containers** (`--radius-container`): `12px` — cards, sections, email card container
- **Pill / Full** (`--radius-full`): `9999px` — status dots, circular avatars

## Components

### Web UI Kit (`@starter/ui`)

- `StarterThemeProvider`: Applies `starterTheme` (Astryx Stone + monochrome overrides) and system/light/dark color mode.
- `PageShell`: Top-level page container with optional warning/info banner, title, subtitle, and right-aligned action bar.
- `SectionCard`: Bordered card with optional header (`title`, `description`, `headerActions`) and `<Divider />`.
- `DataRow`: Horizontal entity row (`title`, `subtitle`, `status`, `actions`) for book catalogs and order lists.
- `StatusPill`: Accessible status indicator combining `<StatusDot>` and visible text (`neutral`, `info`, `success`, `warning`, `error`).
- `EmptyNotice`: Standardized empty-state placeholder built on Astryx `<EmptyState>`.

### Transactional Email (`@starter/email`)

Built with prebuilt `@react-email/components` (`Html`, `Head`, `Font`, `Preview`, `Body`, `Container`, `Section`, `Row`, `Column`, `Heading`, `Text`, `Button`, `Hr`, `Link`) and styled exclusively with `starterLightTokens`:

- `EmailLayout`: Shared stone-bordered card layout with Figtree webfont + Helvetica fallback, brand eyebrow, `h1` heading, divider, and footer.
- `WelcomeEmail`, `PasswordResetEmail`, `OrderReceiptEmail`, `LowStockAlertEmail`: Localized (`en`, `pt-BR`) templates compiled into Bird Liquid templates.

## Do's and Don'ts

- **Do** import UI primitives and kit components from `@starter/ui` in `apps/web` and resolved tokens from `@starter/ui/tokens` in `packages/email`.
- **Do** use Astryx layout components (`VStack`, `HStack`, `Card`, `Section`, `Divider`) instead of raw `<div>` elements or ad-hoc CSS files.
- **Do** pair `StatusDot` with visible text via `StatusPill` so status never relies on color alone.
- **Don't** hardcode hex colors or pixel radii in `apps/web` or `packages/email` templates; always reference Astryx tokens or `starterLightTokens`.
- **Don't** introduce a separate `@starter/tokens` package or CSS-in-JS runtime in `packages/email`; keep `resolveStarterTokens` as the single bridge from `starterTheme`.
