# 金字塔原理 · 第三章 ─ 即時互報互動簡報系統

> 多人即時互動的簡報應用：主持人用管理員控制台遙控切頁，所有學員會即時跟著翻頁。
> 主題為《金字塔原理》第3章「由上而下」。

繁體中文版說明文件 · 英文版請見 [README.md](./README.md)

## 功能特色

- **學員端** — 輸入名字與房間碼進入，可在簡報中自由翻頁、看到彼此的游標
- **管理員控制台** — `/admin` 登入後可在 `/admin/dashboard/[roomId]` 控制全體
  - 大尺寸預覽目前的頁面
  - 左側列出所有上線中的學員及其所在頁
  - 一鍵強制讓全體跳到指定頁
  - 底部即時顯示每個學員的點擊次數
  - **滑鼠游標共享** — 學員的游標會即時呈現在其他學員與管理員畫面上
- **即時同步** — 使用 Firebase Realtime Database，所有狀態（人、頁、計數、游標、答題）即時同步
- **問答互動** — 簡報中的選擇題可蒐集每位學員的作答，後台即時看到分布與答錯／答對

## 技術棧

| 類別 | 技術 |
|------|------|
| 框架 | [Next.js](https://nextjs.org/) 16.3.3 (App Router + Turbopack) |
| UI | React 19.2.8 |
| 樣式 | 原生 CSS（CSS 變數主題） |
| 即時資料庫 | [Firebase Realtime Database](https://firebase.google.com/products/realtime-database) |
| 動畫 | [animate.css](https://animatecss.com/) |
| 語言 | TypeScript 5 |

## 開始使用（5 分鐘）

### 0. 環境需求

- Node.js ≥ 20
- 一個 Firebase 帳號（免費 spark plan 即可）

### 1. 取得程式碼

```bash
git clone https://github.com/vinaswu/sharing-aug.git
cd sharing-aug/sharing-presentation
npm install
```

### 2. 建立 Firebase 專案

1. 開啟 [Firebase Console](https://console.firebase.google.com/) → **新增專案**
2. 左側 → Build → **Realtime Database** → 建立資料庫
   - 選「測試模式」起步（之後可改規則）
3. 左側「專案設定」（齒輪）→ 一般 → 您的應用程式 → `</>`（Web）→ 註冊應用程式
4. 複製 `firebaseConfig` 內以下欄位的值

### 3. 設定 `.env.local`

在 `sharing-presentation/` 下建立 `.env.local`，貼上你的設定：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc

# 管理員後台登入密碼（請改成你自己的）
NEXT_PUBLIC_ADMIN_PASSWORD=change-me
ADMIN_PASSWORD=change-me
```

> `.env.local` 已在 `.gitignore` 中，不會被 commit。

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟 http://localhost:3000 開始使用。

## 路由

| 路徑 | 用途 | 進入方式 |
|------|------|----------|
| `/` | 學員首頁（輸入名字與房間碼） | 直接訪問 |
| `/presenter/[roomId]` | 學員簡報頁（同一房間內所有人同步） | 從首頁輸入名字後自動跳轉 |
| `/admin` | 管理員登入頁 | 直接訪問 |
| `/admin/dashboard/[roomId]` | 管理員控制台 | 登入後跳轉 |

預設房間 ID 為 `pyramid-ch3`，可在首頁自由填寫。

## 多人測試方式

開兩個瀏覽器（或無痕模式）：

1. 一個打開 `/admin` → 輸入密碼 → 進入 `/admin/dashboard/pyramid-ch3`
2. 另一個打開 `/` → 輸入名字 → 進入簡報
3. 在管理員頁按「下一頁」→ 學員頁會即時跳到下一頁

可開第三、四個瀏覽器扮演更多學員；所有人都會即時同步。

## 部署

最方便的是 Vercel：

```bash
npm i -g vercel
vercel
```

過程中記得把 `.env.local` 內所有變數也加到 Vercel 專案的 Environment Variables。

Firebase 端記得設 Database Rules 至少限制寫入路徑（不要長期使用「公開 true/false」測試模式）。

## 專案結構

```
sharing-presentation/
├── app/
│   ├── layout.tsx              # 根 layout（html lang=zh-Hant）
│   ├── page.tsx                # 學員首頁（輸入名字 + 房間碼）
│   ├── globals.css             # 全域主題（CSS 變數）
│   ├── admin/
│   │   ├── page.tsx            # 登入頁
│   │   └── dashboard/[roomId]/
│   │       └── page.tsx        # 管理員控制台
│   ├── api/
│   │   └── admin/auth/         # 管理員驗證 API route
│   └── presenter/[roomId]/
│       └── page.tsx            # 學員簡報頁
├── components/
│   ├── SlideViewer.tsx         # 簡報渲染核心
│   ├── Navigation.tsx          # 上下頁 + 進度
│   ├── CursorOverlay.tsx       # 游標共享層
│   └── BubbleEffect.tsx        # 點擊回饋特效
├── lib/
│   ├── firebase.ts             # Firebase 初始化
│   ├── hooks.ts                # useRoom / useAdminSlideControl 等
│   ├── slides-data.ts          # 簡報內容資料（金字塔原理第三章）
│   └── types.ts                # 共用 TypeScript 類型
├── .env.local.example          # 環境變數範本
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 簡報內容（slides-data.ts）

簡報圍繞「金字塔原理」第3章，包含：

- **金字塔原理是什麼？**
- **由上而下（Top-Down）五步**：定主題 → 設想問題的核心 → 寫下答案 → 用 SCQA 檢查開場 → 往下長出 Key Line
- **兩位店員的故事** ─ 一個東西的兩種報告方式
- **互動選擇題** ─ 讓學員投票，管理員後台即時看到分布
- **迷你金字塔**（連動燈光，讓全體同時點亮一顆金字塔節點）
- **總結**

編輯 `lib/slides-data.ts` 可改簡報內容與題目。

## 開發常用指令

```bash
npm run dev      # 開發模式（http://localhost:3000，--host 0.0.0.0）
npm run build    # 生產建置（Turbopack）
npm start        # 啟動生產 server
```

## 安全提醒

- 請務必把 `.env.local` 的 admin 密碼改成自己的
- 部署到 Vercel 後請同步設定相同密碼為 env var
- Firebase RTDB 預設測試模式對讀寫都是公開，**正式上線前請改 Rules**

## 授權

UNLICENSED · 私人分享專案
