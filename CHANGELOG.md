# Changelog

All notable changes to the **sharing-aug** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

繁體中文版：[CHANGELOG.zh-TW.md](./CHANGELOG.zh-TW.md)

## [Unreleased]

### Added
- Slide Builder: visual slide editor opened from the admin dashboard (`/admin/builder/[roomId]`) — Elementor-style editing with text / HTML / image blocks, each block carrying separate front (audience) and back (presenter) content, plus per-slide background color, image, and tint overlay (`components/SlideBuilder.tsx`, `app/admin/builder/[roomId]/page.tsx`)
- Builder free-drag canvas: any block can switch to "absolute" placement and be dragged directly on the canvas with edge/center snapping (±2%) and a live coordinate badge; positions persist as percentages so layouts hold at any screen size (`layout`/`pos` fields, `EditCanvas` component)
- Builder full element controls: every block gets X/Y/width/height, z-index, opacity, border radius, border, background, shadow, padding, font size/weight/color/line-height/letter-spacing/alignment, and image object-fit; background panel gains image size/position/repeat plus radius/padding (`style2` / `BlockControls` component)
- Real-time custom slides: Builder output is stored under RTDB `rooms/{roomId}/customSlides`; participants and the dashboard receive it live and it replaces the built-in deck. Deleting the node reverts to the built-in slides (`lib/customSlides.ts`, `useCustomSlides` hook)
- One-click legacy conversion: existing type-based slides can be converted into element-style blocks for editing, while SlideViewer keeps full backward compatibility with the legacy layout (renders `blocks` when present)
- Storytelling-style presenter scripts on every slide: opening cues, pause markers, and interaction suggestions per page (`lib/slides-data.ts`)
- Real-time cursor sharing: admins and participants see each other's mouse cursors live
- Interactive multiple-choice questions with live tallying: the admin dashboard shows per-question answer distribution and per-user correctness
- Mini-pyramid synchronized node lighting: when the admin lights a node, every participant sees the matching node light up at the same instant
- "Method 1: Top-Down" now shows the complete 5 steps (Subject → Question → Answer → SCQA opening → Key Lines)
- Admin "Show / Hide Cursors" toggle: admins can globally switch off front-end cursor broadcasting and cursor overlay rendering with a single pill switch in the dashboard header (synced via RTDB `cursorVisible`, defaults to visible)
- Sticky presenter script panel on the dashboard: when a slide has a `script.back`, a scrollable teleprompter card sticks to the right of the slide on the back view only (audience never sees it)

### Changed
- Navigation component layout: keyboard shortcut hints moved to the left, prev/next buttons and page dots centered
- SlideViewer script panel formatting enhanced: heading highlights, arrow bullets, and numbered-list styling (`components/SlideViewer.tsx`)
- Dashboard and participant page now resolve slides dynamically via `customSlides ?? SLIDES` — total page count, navigation bounds, and page dots all follow the active deck
- Slide 5, step 2 title changed from "設想讀者的問題" to "設想問題的核心"
- Replaced `<>...</>` with a keyed `<Fragment>` in `app/admin/dashboard/[roomId]/page.tsx` to silence the React list-key warning
- Participant bottom-right watermark trimmed from "BY 918 VINAS, 以TENIX ENGINE 製作" to "BY 918 VINAS WU"
- Presenter script for "4 Key Points When Using SCQA" condensed from the full PDF body to a 13-line cheat sheet (kept self-checks, formulas, the single numeric example)

### Fixed
- `Each child in a list should have a unique "key" prop` warning emitted by AdminDashboardPage
- Kick detection (`useKickDetection`) no longer logs users out on a transient initial-null snapshot; the kick now only fires when a user who was present disappears from RTDB

## [0.1.0] · 2026-08-26

### Added
- Initial release
- Next.js 16.3.3 + React 19.2.8 + TypeScript 5 scaffold (App Router + Turbopack)
- Firebase Realtime Database integration (`lib/firebase.ts`, `lib/hooks.ts`)
- Participant home page (`app/page.tsx`): enter name and room code
- Participant slide page (`app/presenter/[roomId]/page.tsx`): SlideViewer with free navigation
- Admin login page (`app/admin/page.tsx`) and API route (`app/api/admin/auth/route.ts`)
- Admin dashboard (`app/admin/dashboard/[roomId]/page.tsx`):
  - Large slide preview
  - Online participant list with current slide per person
  - One-click controls to force everyone to a specific slide
  - Live per-participant click-count statistics
- Slide content (`lib/slides-data.ts`): themed around Chapter 3 of *The Pyramid Principle* — opener, methodology steps, an interlude story, wrap-up
- Shared components: `SlideViewer`, `Navigation`, `CursorOverlay`, `BubbleEffect`
- Shared TypeScript types (`lib/types.ts`)

### Environment
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_ADMIN_PASSWORD` / `ADMIN_PASSWORD`

[Unreleased]: https://github.com/vinaswu/sharing-aug/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/vinaswu/sharing-aug/releases/tag/v0.1.0
