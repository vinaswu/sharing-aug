# Changelog

All notable changes to the **sharing-aug** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

繁體中文版：[CHANGELOG.zh-TW.md](./CHANGELOG.zh-TW.md)

## [Unreleased]

### Added
- 所有幻灯片添加 storytelling 风格的讲者讲稿：每页包含开场提示、停顿指示、互动点建议（`lib/slides-data.ts`）

### Changed
- Navigation 组件布局优化：键盘快捷键提示移至左侧，上下页按钮与页码点居中显示
- SlideViewer 讲稿面板增强格式化：支持标题高亮、箭头要点、数字列表样式（`components/SlideViewer.tsx`）

### Added
- Real-time cursor sharing: admins and participants see each other's mouse cursors live
- Interactive multiple-choice questions with live tallying: the admin dashboard shows per-question answer distribution and per-user correctness
- Mini-pyramid synchronized node lighting: when the admin lights a node, every participant sees the matching node light up at the same instant
- "Method 1: Top-Down" now shows the complete 5 steps (Subject → Question → Answer → SCQA opening → Key Lines)
- Admin "Show / Hide Cursors" toggle: admins can globally switch off front-end cursor broadcasting and cursor overlay rendering with a single pill switch in the dashboard header (synced via RTDB `cursorVisible`, defaults to visible)
- Sticky presenter script panel on the dashboard: when a slide has a `script.back`, a scrollable teleprompter card sticks to the right of the slide on the back view only (audience never sees it)

### Changed
- Slide 5, step 2 title changed from "設想讀者的問題" to "設想問題的核心"
- Replaced `<>...</>` with a keyed `<Fragment>` in `app/admin/dashboard/[roomId]/page.tsx` to silence the React list-key warning
- Participant bottom-right watermark trimmed from "BY 918 VINAS, 以TENIX ENGINE 製作" to "BY 918 VINAS WU"
- Presenter script for "4 Key Points When Using SCQA" condensed from the full PDF body to a 13-line cheat sheet (kept self-checks, formulas, the single numeric example)

### Fixed
- `Each child in a list should have a unique "key" prop` warning emitted by AdminDashboardPage

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
