# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"황총무의 실험실" (Hwang Chongmu's Lab) — a Korean-language personal utility web app built with Next.js (App Router). It bundles multiple mini-services: meeting scheduler, split-bill calculator, overtime calculator, account book, habit tracker, daily journal, diet/weight tracker, game room, work schedule/kanban, and a developer portfolio page.

## Commands

- **Dev server:** `npm run dev` (runs on localhost:3000)
- **Build:** `npm run build` (uses `next build --webpack`)
- **Lint:** `npm run lint` (ESLint with next/core-web-vitals + typescript configs)
- **Start prod:** `npm run start`

No test framework is configured.

## Architecture

### Monorepo with Workspaces

Uses npm workspaces (`packages/*`). The internal package `@hwangchongmu/ui` (`packages/ui/`) provides shared UI primitives (Button, Input, Typography), a theme (`colors`, `uiTheme`), GlobalStyle, and UiProvider. It is transpiled via `next.config.ts` `transpilePackages`.

### Styling

**Dual styling system:**
- **styled-components** — primary styling approach. SSR support via `lib/registry.tsx` (StyledComponentsRegistry wrapping `UiProvider`). The styled-components compiler is enabled in `next.config.ts`.
- **Tailwind CSS** — also available (configured in `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`).

Theme tokens are defined in `packages/ui/src/theme.ts` and re-exported from `styles/theme.ts`. Access via `${({ theme }) => theme.colors.xxx}` in styled-components.

### Path Aliases

- `@/*` maps to project root (`./`)
- `@hwangchongmu/ui` and `@hwangchongmu/ui/*` map to `packages/ui/src/`

### Data Layer

Supabase is the backend (`lib/supabase.js`). Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables.

### App Structure

Each service lives under `app/<service>/` with its own `page.tsx` and colocated components. Dynamic routes use `[id]` segments. Shared UI components are in `components/common/`. Custom hooks are in `hooks/`, types in `types/`, and utility functions in `utils/`.

### Key Patterns

- Root layout (`app/layout.tsx`) wraps everything in `StyledComponentsRegistry` > `ModalProvider` > `GlobalHeader`.
- Pages are predominantly client components (`"use client"`) due to styled-components usage.
- The `ModalProvider` (`components/common/ModalProvider.tsx`) provides app-wide modal context.
- Korean language throughout — UI text, comments, and variable naming conventions mix Korean comments with English code identifiers.
