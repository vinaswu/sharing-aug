# 更新日誌

本檔案記錄 sharing-aug 專案所有可見的版本變更。
格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，
版本遵循 [Semantic Versioning](https://semver.org/lang/zh-TW/)。

English version: [CHANGELOG.md](./CHANGELOG.md)

## [未發佈] · Unreleased

### 新增
- Slide Builder 視覺化投影片編輯器：管理員後台一鍵開啟（`/admin/builder/[roomId]`），Elementor 式元素編輯，支援文字／HTML／圖片三種區塊，每個區塊皆有「前台／後台」兩面內容，並可設定每頁背景色、背景圖與覆蓋色（`components/SlideBuilder.tsx`、`app/admin/builder/[roomId]/page.tsx`）
- Builder 自由拖動畫布：元素可設為「自由定位」（absolute），在畫布上以滑鼠直接拖曳擺放，自動吸附邊界／中心（±2%），即時顯示座標標籤；絕對位置以百分比儲存，任何螢幕尺寸下版面一致（`layout`／`pos` 欄位，`EditCanvas` 元件）
- Builder 完整元素控制列：每個元素可調 X／Y／寬／高、層級（z-index）、不透明度、圓角、邊框、背景色、陰影、內距、字體大小／粗細／顏色／行高／字距／對齊，以及圖片 object-fit；背景面板新增背景圖 size／position／repeat、圓角與內距（`style2`／`BlockControls` 元件）
- 自訂投影片即時同步：Builder 產出的投影片存於 RTDB `rooms/{roomId}/customSlides`，前台學員與後台即時接收並取代內建簡報；刪除該節點即恢復內建投影片（`lib/customSlides.ts`、`useCustomSlides` hook）
- 舊版投影片一鍵轉換：既有 type-based 投影片可轉為 blocks 元素式編輯，轉換後仍保留原有版式相容性（`SlideViewer` 偵測 `blocks` 時改用元素渲染）
- 所有簡報頁添加 storytelling 風格的講者講稿：每頁包含開場提示、停頓指示、互動點建議（`lib/slides-data.ts`）
- 即時游標共享：管理員與學員可即時看到彼此的滑鼠游標
- 互動選擇題與即時統計：管理員後台可看到每題的作答分布與個人答對／答錯
- 迷你金字塔節點同步點燈：管理員亮燈 → 全體學員同步看到對應節點亮起
- 「方法一：由上而下」步驟顯示完整 5 步（定主題／設想問題的核心／寫下答案／SCQA 開場／Key Line）
- 後台「顯示滑鼠／隱藏滑鼠」toggle：管理員可一鍵控制前端用戶是否廣播滑鼠位置，以及後台是否繪製游標 overlay（同步經由 RTDB `cursorVisible`，預設為顯示中）
- 後台 sticky 講者讀稿面板：當某頁 `script.back` 有內容時，於後台視圖右側顯示可滾動的讀稿欄（前台完全不可見）

### 修改
- Navigation 元件佈局優化：鍵盤快捷鍵提示移至左側，上下頁按鈕與頁碼點居中顯示
- SlideViewer 講稿面板增強格式化：支援標題高亮、箭頭要點、數字列表樣式（`components/SlideViewer.tsx`）
- 管理員控制台與學員頁改為動態簡報來源：`customSlides ?? SLIDES`，總頁數、切頁邊界與頁碼導覽皆跟隨實際投影片數量
- 第五張簡報步驟二標題由「設想讀者的問題」改為「設想問題的核心」
- `app/admin/dashboard/[roomId]/page.tsx` 將 `<>...</>` 改為帶 key 的 `<Fragment>`，消除 React 列表 key 警告
- 學員頁右下角「BY 918 VINAS, 以TENIX ENGINE 製作」精簡為「BY 918 VINAS WU」
- 「使用 SCQA 時的 4 個重點」講者讀稿由完整 PDF 內容簡化為 13 行重點速覽（保留自檢句、公式、數據、例示）

### 修復
- 修正 Builder 中間畫布對內建（legacy）投影片顯示全黑的問題：無 `blocks` 的頁面改為以 SlideViewer 唯讀預覽實際內容，並顯示「內建頁面 · 唯讀預覽」提示（`EditCanvas` 元件）
- 修正 AdminDashboardPage 出現的 `Each child in a list should have a unique "key" prop` 警告
- 修正被踢出偵測（`useKickDetection`）的誤判登出：初始快照尚未寫入時不再觸發登出，只有在用戶曾上線後節點消失才判定為被踢

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
