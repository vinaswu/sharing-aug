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

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
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

export interface SlideBackground {
  /** CSS color, e.g. '#0f1115' or 'var(--bg)' */
  color?: string;
  /** Image URL (absolute http(s) or relative /public path) */
  image?: string;
  /**
   * Overlay color drawn on top of the image to tint/dim it.
   * Use an rgba() value for transparency, e.g. 'rgba(15,17,21,0.6)'.
   */
  overlay?: string;
  /** Background-size CSS, used when `image` is set (default 'cover'). */
  size?: string;
  /** Background-position CSS, e.g. 'center top' (default 'center'). */
  position?: string;
  /** Repeat CSS for the background image (default 'no-repeat'). */
  repeat?: string;
  /** Optional rounded corners, e.g. '12px'. */
  radius?: string;
  /** Inner padding, e.g. '28px 32px'. */
  padding?: string;
}

/**
 * Absolute positioning for a block on the canvas. Percentages are relative to
 * the slide surface; pixels are absolute. When `layout === 'flow'` (or x/y are
 * absent) blocks stack vertically like before.
 */
export interface BlockPosition {
  x: number;
  y: number;
  /** 'percent' (default) = % of slide width/height; 'px' = pixels. */
  unit?: 'percent' | 'px';
}

/** Typography + box styling shared by text/html/image blocks. */
export interface BlockStyle {
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: 'italic';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: 'uppercase' | 'capitalize';
  /** text-shadow value, e.g. '0 2px 8px rgba(0,0,0,.8)'. */
  textShadow?: string;
  background?: string;
  border?: string;
  borderRadius?: string;
  padding?: string;
  boxShadow?: string;
  opacity?: number;
  /** CSS transform, e.g. 'rotate(-3deg)'. */
  transform?: string;
}

/**
 * A single editable element on a slide (Elementor-style).
 * Each block has front/back content so the audience and presenter can see
 * different things. `type` controls how the content is rendered:
 *  - 'text'  → plain text (whiteSpace pre-wrap)
 *  - 'html'  → raw HTML (dangerouslySetInnerHTML)
 *  - 'image' → <img> with src / alt / width
 */
export interface SlideBlock {
  id: string;
  type: 'text' | 'html' | 'image';
  /** For image blocks: the src URL. Ignored for text/html. */
  src?: string;
  /** For image blocks: alt text. */
  alt?: string;
  /** For image blocks: CSS width, e.g. '320px' or '50%'. */
  width?: string;
  /** CSS height (absolute layout), e.g. '200px' or '40%'. */
  height?: string;
  /** Extra inline CSS appended to the rendered element. */
  style?: string;
  /** 'absolute' = free placement on the slide (Builder); default = 'flow'. */
  layout?: 'flow' | 'absolute';
  /** Absolute position (used when layout === 'absolute'). */
  pos?: BlockPosition;
  /** Stacking order among blocks. */
  zIndex?: number;
  /** Typography/box styling applied to the rendered element. */
  style2?: BlockStyle;
  front: string;
  back: string;
}

export interface Slide {
  id: string;
  /**
   * Position in the deck. Only meaningful for custom (admin-built) slides,
   * which are stored in RTDB as an unordered map keyed by id. The built-in
   * SLIDES array relies on array order and leaves this unset.
   */
  order?: number;
  /** Slide background (color / image / overlay). Optional — defaults to transparent. */
  background?: SlideBackground;
  /**
   * Element-style blocks. When present, SlideViewer renders these instead of
   * the legacy type-specific layout. This is what the Builder edits.
   */
  blocks?: SlideBlock[];
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
