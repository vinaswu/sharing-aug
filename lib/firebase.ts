// Firebase initialization and helpers
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, push, remove, off } from 'firebase/database';
import type { Database } from 'firebase/database';
import type { Room, User, QuizAnswer } from './types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const database: Database = getDatabase(app);

export { database, ref, onValue, set, update, push, remove, off };

// Helper: get room reference
export function getRoomRef(roomId: string) {
  return ref(database, `rooms/${roomId}`);
}

// Helper: get user reference within a room
export function getUserRef(roomId: string, userId: string) {
  return ref(database, `rooms/${roomId}/users/${userId}`);
}

// Helper: get admin auth reference
export function getAdminRef(roomId: string) {
  return ref(database, `admins/${roomId}`);
}

// Initialize a room if it doesn't exist
export async function ensureRoom(roomId: string) {
  const roomRef = getRoomRef(roomId);
  const snapshot = await new Promise<any>((resolve) => {
    onValue(roomRef, (snap) => resolve(snap), { onlyOnce: true });
  });
  if (!snapshot.exists()) {
    await set(roomRef, {
      currentSlide: 0,
      users: {},
      quizAnswers: [],
      updatedAt: Date.now(),
    });
  }
}

// Update current slide for the room
export async function updateCurrentSlide(roomId: string, slideIndex: number) {
  const slideRef = ref(database, `rooms/${roomId}/currentSlide`);
  await set(slideRef, slideIndex);
  await set(ref(database, `rooms/${roomId}/updatedAt`), Date.now());
}

// Register a user joining the room
export async function joinRoom(
  roomId: string,
  user: Omit<User, 'lastSeen' | 'joinedAt' | 'slideIndex' | 'clickCount' | 'cursor'>
) {
  await ensureRoom(roomId);
  const userRef = getUserRef(roomId, user.id);
  const now = Date.now();
  await set(userRef, {
    ...user,
    slideIndex: 0,
    clickCount: 0,
    lastSeen: now,
    joinedAt: now,
  });
}

// Update user state (slideIndex, cursor, etc.)
export async function updateUserState(
  roomId: string,
  userId: string,
  updates: Partial<User>
) {
  const userRef = getUserRef(roomId, userId);
  await update(userRef, {
    ...updates,
    lastSeen: Date.now(),
  });
}

// Increment user's click count
export async function incrementClickCount(roomId: string, userId: string) {
  const clickRef = ref(database, `rooms/${roomId}/users/${userId}/clickCount`);
  const snap = await new Promise<any>((resolve) => {
    onValue(clickRef, (s) => resolve(s), { onlyOnce: true });
  });
  const current = snap.val() || 0;
  await set(clickRef, current + 1);
}

// Remove user when they leave
export async function leaveRoom(roomId: string, userId: string) {
  const userRef = getUserRef(roomId, userId);
  await remove(userRef);
}

// Record quiz answer
export async function recordQuizAnswer(roomId: string, answer: QuizAnswer) {
  const answerRef = ref(database, `rooms/${roomId}/quizAnswers`);
  await push(answerRef, answer);
}

// Update the lit pyramid tier indexes (admin-driven)
export async function setPyramidLit(roomId: string, lit: number[]) {
  const litRef = ref(database, `rooms/${roomId}/pyramidLit`);
  await set(litRef, lit);
}

// Verify admin password
export async function verifyAdminPassword(roomId: string, password: string): Promise<boolean> {
  const expectedPassword = process.env.ADMIN_PASSWORD || 'pyramid2026';
  return password === expectedPassword;
}

// Check if Firebase config is properly set
export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  );
}
