# 更新日誌

本檔案記錄 sharing-aug 專案所有可見的版本變更。
格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，
版本遵循 [Semantic Versioning](https://semver.org/lang/zh-TW/)。

English version: [CHANGELOG.md](./CHANGELOG.md)

## [未發佈] · Unreleased

### 新增
- 即時游標共享：管理員與學員可即時看到彼此的滑鼠游標
- 互動選擇題與即時統計：管理員後台可看到每題的作答分布與個人答對／答錯
- 迷你金字塔節點同步點燈：管理員亮燈 → 全體學員同步看到對應節點亮起
- 「方法一：由上而下」步驟顯示完整 5 步（定主題／設想問題的核心／寫下答案／SCQA 開場／Key Line）

### 修改
- 第五張簡報步驟二標題由「設想讀者的問題」改為「設想問題的核心」
- `app/admin/dashboard/[roomId]/page.tsx` 將 `<>...</>` 改為帶 key 的 `<Fragment>`，消除 React 列表 key 警告
- 學員頁右下角「BY 918 VINAS, 以TENIX ENGINE 製作」精簡為「BY 918 VINAS WU」

### 修復
- 修正 AdminDashboardPage 出現的 `Each child in a list should have a unique "key" prop` 警告

## [0.1.0] · 2026-08-26

### 新增
- 初始版本釋出
- Next.js 16.3.3 + React 19.2.8 + TypeScript 5 開發環境建立（App Router + Turbopack）
- Firebase Realtime Database 整合（`lib/firebase.ts`、`lib/hooks.ts`）
- 學員首頁（`app/page.tsx`）：輸入名字與房間碼
- 學員簡報頁（`app/presenter/[roomId]/page.tsx`）：以 SlideViewer 呈現簡報，可自由切頁
- 管理員登入頁（`app/admin/page.tsx`）與 API（`app/api/admin/auth/route.ts`）
- 管理員控制台（`app/admin/dashboard/[roomId]/page.tsx`）：
  - 大尺寸簡報預覽
  - 上線使用者列表 + 所在頁
  - 一鍵強制切頁
  - 每位使用者點擊次數即時統計
- 簡報內容資料（`lib/slides-data.ts`）：以《金字塔原理》第3章為主題，含開場、方法論步驟、插播故事、總結
- 共用元件：`SlideViewer`、`Navigation`、`CursorOverlay`、`BubbleEffect`
- 共用 TypeScript 類型（`lib/types.ts`）

### 環境
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_ADMIN_PASSWORD`／`ADMIN_PASSWORD`

[未發佈]: https://github.com/vinaswu/sharing-aug/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/vinaswu/sharing-aug/releases/tag/v0.1.0
