// Core data types for the presentation app

export interface User {
  id: string;
  name: string;
  color: string;
  slideIndex: number;
  clickCount: number;
  lastSeen: number;
  /** Cursor position as fractions of the viewport (0..1 on each axis) */
  cursor?: { x: number; y: number };
  joinedAt: number;
}

export interface QuizAnswer {
  userId: string;
  userName: string;
  idx: number;
  correct: boolean;
  at: number;
}

/**
 * Each content-bearing field on a slide is a pair of `front` (audience-facing
 * text) and `back` (presenter/admin-facing notes). The two share the SAME
 * structural type so they stay in lock-step — only the wording differs.
 */
export interface Sided<T> {
  front: T;
  back: T;
}

export interface Slide {
  id: string;
  kicker?: Sided<string>;
  title: Sided<string>;
  type: SlideType;
  story?: Sided<string>;
  table?: Sided<TableData>;
  steps?: Sided<StepData[]>;
  pyramid?: Sided<TierData[]>;
  quiz?: Sided<QuizData>;
  takeaway?: Sided<string>;
  /**
   * Optional presenter script. Renders as a sticky/scrollable side panel on
   * the right of the slide content when `mode === 'back'`. Front (audience)
   * view ignores it. Supports plain text + blank lines as paragraph breaks.
   */
  script?: Sided<string>;
}

export type SlideType =
  | 'cover'
  | 'story'
  | 'table'
  | 'steps'
  | 'pyramid'
  | 'quiz'
  | 'takeaway';

export interface TableData {
  headers: string[];
  rows: (string | { text: string; span?: number; style?: string })[][];
  afterTableHtml?: string;
}

export interface StepData {
  title: string;
  /** Audience-facing one-liner, displayed under the title. */
  description: string;
  /**
   * Optional presenter-only content. Rendered ONLY when `mode === 'back'`
   * (admin/presenter view), as a second column next to `description`.
   * Supports three formats:
   *  - `noteLines`     → rendered as a vertical list of full lines (back only).
   *                      Best when each line is a complete note like "S｜Situation 情境：…".
   *  - `noteRows`      → rendered as a compact key/value table (back only).
   *  - `note` (plain)  → rendered as a short paragraph with a left accent bar (back only).
   * Front (audience) view ignores all three.
   */
  note?: string;
  noteRows?: { label: string; detail: string }[];
  noteLines?: string[];
}

export interface TierData {
  label: string;
  cssClass: string;  // t1, t2, t3
  message: string;   // Message shown when clicked
}

export interface QuizData {
  question: string;
  options: { text: string; correct: boolean }[];
  correctMessage: string;
  wrongMessage: string;
}

export interface Room {
  currentSlide: number;
  users: Record<string, User>;
  quizAnswers: QuizAnswer[];
  updatedAt: number;
  /** Tier indexes that the admin has lit on the pyramid slide (admin-driven) */
  pyramidLit?: number[];
  /**
   * Admin-controlled visibility flag for front-end cursor positions.
   * When `false`:
   *  - presenter / audience clients stop broadcasting their cursor position
   *  - admin's CursorOverlay stops rendering
   * Defaults to `true` when the field is missing.
   */
  cursorVisible?: boolean;
}

export interface CursorPosition {
  x: number;
  y: number;
  lastUpdate: number;
}

export const COLORS = [
  '#f5b942', // accent yellow
  '#6fcf97', // green
  '#7eb8ff', // blue
  '#ff8fa3', // pink
  '#c792ea', // purple
  '#ffd166', // light yellow
  '#4ecdc4', // teal
];
