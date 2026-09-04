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
- **Slide Builder 投影片編輯器** — `/admin/builder/[roomId]` 視覺化編輯：文字／HTML／圖片區塊，前台與後台內容分開設定，可調每頁背景，編輯結果即時同步到所有人（刪除 RTDB `customSlides` 節點即恢復內建簡報）
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

## 部署方式

本專案同時支援本地開發與雲端托管。推薦使用 **Vercel**（對接 GitHub 之後自動部署）。

---

### 方式一 — 部署到 Vercel（推薦）

只要推送程式碼到 GitHub `main` 分支，Vercel 就會自動建置並上線。

#### 1. 將程式碼上傳到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create               # 或直接到 github.com 建立
git push -u origin main
```

#### 2. 匯入 Vercel

1. 前往 [vercel.com/new](https://vercel.com/new)
2. 點 **Import Git Repository** → 選你的 repo
3. Vercel 會自動偵測到 Next.js，直接點 **Deploy**
4. 建置完成後，在專案設定中加入環境變數：

| 變數名 | 取得方式 |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → 專案設定 → 一般 → 你的應用程式 → Web 的 `firebaseConfig.apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `firebaseConfig.authDomain` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | `firebaseConfig.databaseURL` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `firebaseConfig.projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `firebaseConfig.storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `firebaseConfig.messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `firebaseConfig.appId` |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | 你設定的管理員密碼 |
| `ADMIN_PASSWORD` | 與 `NEXT_PUBLIC_ADMIN_PASSWORD` 相同 |

事後補加：Vercel Dashboard → 你的專案 → **Settings** → **Environment Variables**。

#### 3. Firebase 安全規則（正式上線前必做！）

1. Firebase Console → Build → **Realtime Database** → **Rules**
2. 改成類似這樣：

```json
{
  "rules": {
    ".read": true,
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": false
      }
    }
  }
}
```

> 上面規則讓所有人可讀房間，但只有伺服器能寫入。請依需求調整。

完成！你的應用程式就會上線在 `https://your-project.vercel.app`。

---

### 方式二 — 本地運行

```bash
# 1. Clone 專案
git clone https://github.com/vinaswu/sharing-aug.git
cd sharing-aug/sharing-presentation

# 2. 安裝依賴
npm install

# 3. 建立 .env.local
#    （從上方 Firebase 設定取得值，見「環境變數」說明）
cp env.example .env.local
# 編輯 .env.local，填入 Firebase 設定和管理員密碼

# 4. 啟動開發伺服器
npm run dev
# → http://localhost:3000
```

若需要本機 HTTPS（部分瀏覽器功能需要），可用 tunnel：

```bash
npx cloudflared tunnel --url http://localhost:3000
```

> 提示：`npm run dev` 預設監聽 `0.0.0.0`，同一區域網路內的其他裝置也可以用你機器的 LAN IP 存取。

---

### 本地版與雲端版切換

| 情境 | 處理方式 |
|---|---|
| 本地已設定好 `.env.local` | 把同樣的值加到 Vercel 的 Environment Variables 即可 |
| 要發布新版本 | 推送到 `main` → Vercel 自動建置部署 |
| 想預覽某個分支 | Vercel 會自動為每個 PR 產生預覽網址 |

> **一個 Firebase 專案可以同時服務本地與雲端。** 只要 `firebaseConfig` 相同，無論是 `localhost:3000` 還是 Vercel 的網址，學員都可以加入同一個房間。

## 專案結構

```
sharing-presentation/
├── app/
│   ├── layout.tsx              # 根 layout（html lang=zh-Hant）
│   ├── page.tsx                # 學員首頁（輸入名字 + 房間碼）
│   ├── globals.css             # 全域主題（CSS 變數）
│   ├── admin/
│   │   ├── page.tsx            # 登入頁
│   │   ├── builder/[roomId]/
│   │   │   └── page.tsx        # Slide Builder 視覺化編輯器
│   │   └── dashboard/[roomId]/
│   │       └── page.tsx        # 管理員控制台
│   ├── api/admin/auth/
│   │   └── route.ts            # 管理員驗證 API route
│   └── presenter/[roomId]/
│       └── page.tsx            # 學員簡報頁
├── components/
│   ├── SlideViewer.tsx         # 簡報渲染核心
│   ├── BlockRenderer.tsx       # HTML 內容區塊渲染器
│   ├── SlideBuilder.tsx        # Slide Builder 編輯器 UI
│   ├── ElementToolbar.tsx      # 編輯器工具列
│   ├── HTMLEditor.tsx         # 富文字 HTML 編輯器
│   ├── Navigation.tsx          # 上下頁 + 進度
│   ├── CursorOverlay.tsx       # 游標共享層
│   ├── BubbleEffect.tsx        # 點擊回饋特效
│   ├── ChatInput.tsx           # 訊息輸入框（按 / 喚出）
│   ├── ChatMessagePanel.tsx    # 浮動訊息面板
│   └── LikeLeaderboard.tsx     # 浮動點擊排行榜
├── lib/
│   ├── firebase.ts             # Firebase 初始化
│   ├── hooks.ts                # useRoom / useAdminSlideControl 等
│   ├── slides-data.ts          # 簡報內容資料（金字塔原理第三章）
│   ├── customSlides.ts         # 自訂投影片覆寫
│   └── types.ts                # 共用 TypeScript 類型
├── env.example          # 環境變數範本（copy 成 .env.local）
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

MIT License · 詳見 [LICENSE](./LICENSE) 檔

Copyright © 2026 918 VINAS WU
