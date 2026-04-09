# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"황총무의 실험실" (Hwang Chongmu's Lab) — a Korean-language personal utility web app built with Next.js (App Router). It bundles multiple mini-services: meeting scheduler, split-bill calculator, overtime calculator, account book, habit tracker, daily journal, diet/weight tracker, game room, work schedule/kanban, and a developer portfolio page.

## Commands

- **Dev server:** `npm run dev` (runs on localhost:3000)
- **Build:** `npm run build` (uses `next build --webpack`)
- **Lint:** `npm run lint` (ESLint flat config — `eslint.config.mjs` with next/core-web-vitals + typescript)
- **Start prod:** `npm run start`

No test framework is configured.

### Key Libraries

- **date-fns** — date manipulation (used in calendar/schedule features)
- **framer-motion** — animations
- **tesseract.js** — OCR (used in the overtime calculator for receipt scanning)

## Architecture

### Monorepo with Workspaces

Uses npm workspaces (`packages/*`). The internal package `@hwangchongmu/ui` (`packages/ui/`) provides shared UI primitives (Button, Input, Typography), a theme (`colors`, `uiTheme`), GlobalStyle, and UiProvider. It is transpiled via `next.config.ts` `transpilePackages`.

### Styling

**Dual styling system:**
- **styled-components** — primary styling approach. SSR support via `lib/registry.tsx` (StyledComponentsRegistry wrapping `UiProvider`). The styled-components compiler is enabled in `next.config.ts`.
- **Tailwind CSS** — also available (configured in `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`).

Theme tokens are defined in `packages/ui/src/theme.ts` and re-exported from `styles/theme.ts`. Access via `${({ theme }) => theme.colors.xxx}` in styled-components. The theme has three layers:
- `theme.colors.*` — raw color palette (gray, blue, indigo, yellow, green, teal, rose, amber, orange) using oklch
- `theme.semantic.*` — purpose-mapped tokens: `primary` (blue600), `danger` (rose600), `success` (teal600), `warning` (yellow500), `text` (gray900), `subText` (gray500), `border` (gray200), `bg` (gray50). Prefer semantic tokens over raw colors.
- `theme.layout.*` — `maxWidth: 1025px`, `narrowWidth: 540px`
- `theme.media.*` — `mobile` (max-width 767px), `desktop` (min-width 1024px)

**MUI is icons-only** — `@mui/icons-material` is used for icons, but no MUI components are used for layout or UI. All UI is styled-components-based.

**Styled component naming convention:** prefix with `St` (e.g., `StCard`, `StButton`, `StIconButton`). Service-local styles are colocated in `.styles.ts` files alongside feature components.

### Path Aliases

- `@/*` maps to project root (`./`)
- `@hwangchongmu/ui` and `@hwangchongmu/ui/*` map to `packages/ui/src/`

### Data Layer

Supabase is the backend (`lib/supabase.js`). Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables. The `services/` directory contains data-access modules that encapsulate Supabase queries with type-safe mappers (e.g., `services/schedule.ts`, `services/dinner.ts`).

### API Routes

Server-side API routes live under `app/api/`. Example: `app/api/naver-search/route.ts` proxies to the Naver Local Search API using server-only env vars (`NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`).

### App Structure

Each service lives under `app/<service>/` with its own `page.tsx` and colocated components in a local `components/` subdirectory. Dynamic routes use `[id]` segments. Shared UI components are in `components/common/`. Custom hooks are in `hooks/`, types in `types/`, and utility functions in `utils/`.

### Key Patterns

- Root layout (`app/layout.tsx`) wraps everything in `StyledComponentsRegistry` > `ModalProvider` > `GlobalHeader`.
- Pages are predominantly client components (`"use client"`) due to styled-components usage.
- The `ModalProvider` (`components/common/ModalProvider.tsx`) provides app-wide modal context. Use the `useModal()` hook to get `openAlert(message)` (returns `Promise<void>`) and `openConfirm(message)` (returns `Promise<boolean>`).
- Korean language throughout — UI text, comments, and variable naming conventions mix Korean comments with English code identifiers.
