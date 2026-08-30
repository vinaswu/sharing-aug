# Changelog

All notable changes to the **sharing-aug** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

繁體中文版：[CHANGELOG.zh-TW.md](./CHANGELOG.zh-TW.md)

## [Unreleased]

### Added
- Slide Builder: "匯入內建簡報" button to convert the built-in `SLIDES` into editable block structure (`legacyToBlocks()` in `components/SlideBuilder.tsx`)
  - Imported blocks now carry the same look as the original cover/story layout (kicker styled like an eyebrow, title scaled to 2.8rem for cover / 2.4rem otherwise, cover & takeaway boxes centered with max-width), so the imported deck reads identically to the source
  - `importBuiltIn()` uses `cloneBuiltInDeck()` so the global `SLIDES` constant stays immutable
- Slide Builder: "清空" button to clear all slides in the deck
- Slide Builder: `hasUserEdited` ref + `markDirty()` helper so RTDB echoes don't clobber local edits (`components/SlideBuilder.tsx`)
- BlockStyle type: optional `maxWidth` / `margin` fields, used by legacy-to-blocks for cover/takeaway centering (`lib/types.ts`, `components/BlockRenderer.tsx`)
- Cursor rule documenting the project root path (`.cursor/rules/project-root.md`):
  - Declares `sharing-presentation/` as the project root
  - Reminds the assistant to use `sharing-presentation/` as the base path for file operations, commands, and code search — not the surrounding `Sharing_AUG2026/` workspace
  - Lists canonical file locations (rules, `package.json`, `next.config.ts`, `tsconfig.json`, `.env.local.example`)

### Changed
- Slide Viewer: removed the back-mode-only left border + padding (`borderLeft: '3px solid var(--accent)'`, `paddingLeft: 14`) so the admin preview no longer differs visually from the front-end (`components/SlideViewer.tsx`)
- Slide Viewer + Block Flow Renderer: slides are now vertically centered (`display: flex; justifyContent: center`, `minHeight: 'min(560px, 70vh)'`) on both admin preview and front-end; the Builder `EditCanvas` matches the same canvas height (`components/SlideViewer.tsx`, `components/BlockRenderer.tsx`, `components/SlideBuilder.tsx`)
- Slide Builder: `useEffect` no longer overwrites the user's local edits when the RTDB echoes back the same deck — guarded by a `hasUserEdited` flag (`components/SlideBuilder.tsx`)
- Slide Builder: drag-move on absolute blocks and any block-level mutation also flag the deck as user-edited (`components/SlideBuilder.tsx`)

### Fixed
- TypeScript build errors: `'lib/types'` → `'@/lib/types'` in `components/BlockRenderer.tsx`; added missing `SlideBlock` import in `lib/customSlides.ts`

### Changed
- Slide Builder "內建頁面 · 唯讀預覽" badge moved to page bottom (centered), no longer obscuring slide content (`components/SlideBuilder.tsx`)

### Added
- Cursor workflow rules (`.cursor/rules/strict-instructions.md`):
  - Pre-work Grill (audit) mechanism
  - Post-work Code Review + self-testing acceptance workflow
  - Adversarial UX Review standards
  - "Summary" trigger to auto-update CHANGELOG / README

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
