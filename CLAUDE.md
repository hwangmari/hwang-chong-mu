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

### Layout: same-row cards match height

When two or more cards/panels sit side by side in the same row (desktop two-column layouts, `StFlexBox`, `StFieldGrid`, dashboard grids), they must end at the same bottom edge. Prefer equal content structure (same number of rows: title → control → hint) over CSS stretching; if content differs, use `align-items: stretch` on the row and let the shorter card fill, never leave a shorter card floating above a taller neighbor. Do not add a field label on one side that the other side lacks (e.g., an input placeholder is enough when the card title already names the field). Check at 1280px before committing.

### Layout & design rules (from the owner's recurring requests, 2026-09)

These come from what the owner repeatedly asked for while reviewing screens. Apply them before showing a screen, not after being told.

- **Anything in a row lines up.** Icons next to buttons, bars in a chart, columns in a table, the caret in a select: same start edge, same baseline. A row of bars uses a fixed-width label/value column (never `auto`) so one longer value doesn't shift its neighbours. Tables use real `<table>` with `table-layout: fixed`, shared cell padding, right-aligned `tabular-nums` amounts. ("정렬 맞춰줘", "테이블 정렬이 안 맞아", "셀렉트 박스 화살표 간격")
- **One border per level.** The card has the border; inside it use spacing, a `semantic.bg` band, or a single hairline divider. Chips/tags are borderless unless selected. Inputs and segmented controls keep their border because they are controls. Count bordered elements before/after when asked to "정리". ("박스 라인이 너무 많아", "불필요한 보더라인 제외")
- **Fixed type scale per page.** Section title 1rem/800, field label 0.78rem/700 `subText`, input 0.95rem, chip 0.82rem/700, running text 0.86–0.9rem at line-height 1.5–1.7, table header 0.78rem / cells 0.85rem. Don't let one block (a rule table, a summary) run larger than the card body around it. ("글자가 크게 느껴져", "폰트 사이즈 조정")
- **Check at the owner's real width.** Verify layouts at 1280, 945 (the owner's usual window) and 390, plus dark mode. Any width cap below the page max (e.g. an old 540px rule under 1024px) is a bug, not a breakpoint. ("좁게 나오는데")
- **Action above explanation.** The primary button (저장 / 기록 저장) sits right after the last input; help text, rule tables, and "총 볼륨" style explainers go below it. ("기록 저장 버튼이 설명 문구보다 위로")
- **Order sections the way they are used.** Input first, reference material (routines, saved lists, guides) last; a lookup that feeds the form stays above the form. Tabs split "enter" from "browse" (입력 | 전체 내역). ("내 루틴을 하단으로", "입력이랑 전체내역이랑 탭으로 분리")
- **Tabs are underlines, not boxes.** Page-level tabs: text + 2px accent underline that slides, count in a small pill; segmented controls only for 2–4 exclusive options inside a form. ("탭 디자인 이쁘게")
- **No collapse for short content.** "더 보기/접기" only when the content can grow unbounded (a month of records); short rule tables and tips stay open. ("더보기 접기는 빼는 게")
- **Skeleton, never an empty box, while loading.** Keep the final layout's shape (title / lines / button) so nothing jumps. ("빈 화면… 스켈레톤으로 영역 유지")
- **Motion: one orchestrated moment, then hold.** Enter animations run once when the row is ≥25% visible; no infinite loops; reduced-motion shows the final frame. Bold in composition, quiet in motion — the owner rejects "정신사나운" screens. Icons/emoji tiles have no border.
- **Wide screens use the width, narrow forms don't.** Two columns only when the right side holds real content (list, map, preview); a form with few fields is 560px centered with a centered title. A date picker is a one-week strip with a "달력" toggle, not a full month by default.
- **Every layout reply carries a measurement.** When reporting a fix, state the before/after numbers (heights, x-positions, border counts) from an automated check, not a visual guess.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
