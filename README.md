# Pyramid Principle · Chapter 3 — Realtime Interactive Presentation

> A multi-user, real-time interactive presentation app: the host controls page transitions from an admin dashboard and every participant follows along instantly.
> Built around Chapter 3 "Top-Down" of *The Pyramid Principle*.

English documentation · 繁體中文請見 [README.zh-TW.md](./README.zh-TW.md)

## Features

- **Participant view** — enter a name + room code to join; freely navigate slides and see other participants' cursors in real time
- **Admin dashboard** — log in at `/admin`, control the room at `/admin/dashboard/[roomId]`
  - Large preview of the current slide
  - Sidebar listing every online participant and their current slide
  - One-click controls to force everyone to a specific slide
  - Live click-count statistics per participant at the bottom
  - **Shared cursor** — every participant's mouse cursor streams live to other participants and the admin
- **Real-time sync** — Firebase Realtime Database powers presence, slides, click counts, cursors, and quiz answers
- **Live quizzes** — multiple-choice slides collect each participant's answer; the admin dashboard shows the live distribution and per-user correctness

## Tech Stack

| Layer | Tech |
|------|------|
| Framework | [Next.js](https://nextjs.org/) 16.3.3 (App Router + Turbopack) |
| UI | React 19.2.8 |
| Styling | Plain CSS (CSS variable theming) |
| Realtime DB | [Firebase Realtime Database](https://firebase.google.com/products/realtime-database) |
| Animation | [animate.css](https://animatecss.com/) |
| Language | TypeScript 5 |

## Quick Start (5 minutes)

### 0. Prerequisites

- Node.js ≥ 20
- A Firebase account (the free Spark plan is enough)

### 1. Get the code

```bash
git clone https://github.com/vinaswu/sharing-aug.git
cd sharing-aug/sharing-presentation
npm install
```

### 2. Create a Firebase project

1. Open the [Firebase Console](https://console.firebase.google.com/) → **Add project**
2. Sidebar → Build → **Realtime Database** → Create database
   - Start in **test mode** (tighten the rules later)
3. Sidebar → Project Settings (gear) → General → Your apps → `</>` (Web) → register the app
4. Copy the values from the generated `firebaseConfig`

### 3. Configure `.env.local`

Create `.env.local` inside `sharing-presentation/`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc

# Admin dashboard password (change this!)
NEXT_PUBLIC_ADMIN_PASSWORD=change-me
ADMIN_PASSWORD=change-me
```

> `.env.local` is already in `.gitignore` and won't be committed.

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000 to start.

## Routes

| Path | Purpose | Access |
|------|---------|--------|
| `/` | Participant home (name + room code entry) | Direct |
| `/presenter/[roomId]` | Participant slide view (everyone in the same room syncs) | Auto-routed from `/` |
| `/admin` | Admin login | Direct |
| `/admin/dashboard/[roomId]` | Admin dashboard | After login |

Default room ID is `pyramid-ch3`, configurable from the home page.

## Multi-User Testing

Open two browser windows (or one normal + one incognito):

1. One window → `/admin` → enter password → land on `/admin/dashboard/pyramid-ch3`
2. Second window → `/` → enter a name → enter the presentation
3. In the admin window, click "Next page" → the participant window jumps immediately

Open a third or fourth window to add more participants — everyone stays in sync.

## Deployment

Vercel is the easiest path:

```bash
npm i -g vercel
vercel
```

Copy every key from `.env.local` into the Vercel project's Environment Variables.

Lock down your Firebase RTDB security rules before going live — test mode is world-readable and world-writable.

## Project Layout

```
sharing-presentation/
├── app/
│   ├── layout.tsx                       # Root layout (html lang=zh-Hant)
│   ├── page.tsx                         # Participant home (name + room code)
│   ├── globals.css                      # Global theme (CSS variables)
│   ├── admin/
│   │   ├── page.tsx                     # Admin login page
│   │   └── dashboard/[roomId]/page.tsx  # Admin control panel
│   ├── api/admin/auth/                  # Admin auth API route
│   └── presenter/[roomId]/page.tsx      # Participant slide page
├── components/
│   ├── SlideViewer.tsx                  # Slide rendering core
│   ├── Navigation.tsx                   # Prev/next + progress
│   ├── CursorOverlay.tsx                # Shared cursor layer
│   └── BubbleEffect.tsx                 # Click feedback effect
├── lib/
│   ├── firebase.ts                      # Firebase initialization
│   ├── hooks.ts                         # useRoom, useAdminSlideControl, ...
│   ├── slides-data.ts                   # Slide content (Chapter 3 of Pyramid Principle)
│   └── types.ts                         # Shared TS types
├── .env.local.example                   # Environment variable template
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Presentation Content (`slides-data.ts`)

The deck covers *The Pyramid Principle*, Chapter 3:

- What is the Pyramid Principle?
- **Top-down in 5 steps**: Subject → Question → Answer → SCQA opening → Key Lines
- A short "two baristas" story illustrating the contrast
- Interactive multiple-choice questions with live tallies
- A "mini pyramid" with synchronized lighting (the admin lights up a node and every participant sees it glow at the same time)
- Wrap-up

Edit `lib/slides-data.ts` to change slides or quiz prompts.

## Common Commands

```bash
npm run dev      # Dev server  (http://localhost:3000, --host 0.0.0.0)
npm run build    # Production build (Turbopack)
npm start        # Start production server
```

## Security Notes

- Always replace the admin password in `.env.local` with your own
- Mirror the same value in Vercel's environment variables when deploying
- The Firebase RTDB test-mode rules allow anyone to read/write — harden the rules before going public

## License

UNLICENSED · Private sharing project
