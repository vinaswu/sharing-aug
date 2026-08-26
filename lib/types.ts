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

export interface Slide {
  id: string;
  kicker?: string;
  title: string;
  type: SlideType;
  // For different slide types
  story?: string;          // HTML string for story slides
  table?: TableData;       // For table slides
  steps?: StepData[];      // For steps slides
  pyramid?: TierData[];    // For pyramid slide
  quiz?: QuizData;         // For quiz slide
  takeaway?: string;       // For takeaway slide
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
  description: string;
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
