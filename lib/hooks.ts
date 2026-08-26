'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { onValue, ref, off } from 'firebase/database';
import { database } from './firebase';
import type { Room, User, QuizAnswer } from './types';
import { ensureRoom, joinRoom, leaveRoom, updateUserState, updateCurrentSlide, incrementClickCount, recordQuizAnswer, setPyramidLit } from './firebase';

/**
 * Normalize the quizAnswers field from RTDB into a QuizAnswer[].
 * - Initial ensureRoom() writes `quizAnswers: []` (empty array).
 * - recordQuizAnswer() uses `push()`, which appends a child with a random key.
 *   Reading that back yields `Record<string, QuizAnswer>` instead of an array.
 */
function normalizeQuizAnswers(raw: unknown): QuizAnswer[] {
  if (Array.isArray(raw)) return raw as QuizAnswer[];
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, QuizAnswer>);
  }
  return [];
}

/**
 * Subscribe to a room's state (current slide, users, quiz answers)
 */
export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const roomRef = ref(database, `rooms/${roomId}`);
    setLoading(true);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoom({
          currentSlide: data.currentSlide ?? 0,
          users: data.users ?? {},
          // RTDB `push` produces an object keyed by random ids; fall back to []
          // when nothing has been written yet.
          quizAnswers: normalizeQuizAnswers(data.quizAnswers),
          updatedAt: data.updatedAt ?? 0,
          pyramidLit: Array.isArray(data.pyramidLit) ? data.pyramidLit : [],
          cursorVisible: typeof data.cursorVisible === 'boolean' ? data.cursorVisible : true,
        });
      } else {
        setRoom(null);
      }
      setLoading(false);
    });

    return () => off(roomRef);
  }, [roomId]);

  return { room, loading };
}

/**
 * Manage current user's connection to a room
 * - auto-joins on mount
 * - tracks slide changes
 * - tracks click count
 * - removes on unmount
 */
export function useRoomPresence(roomId: string, user: User | null) {
  const [joined, setJoined] = useState(false);

  // Join on mount
  useEffect(() => {
    if (!roomId || !user) return;

    let cancelled = false;
    (async () => {
      try {
        await joinRoom(roomId, {
          id: user.id,
          name: user.name,
          color: user.color,
        });
        if (!cancelled) setJoined(true);
      } catch (err) {
        console.error('Failed to join room:', err);
      }
    })();

    return () => {
      cancelled = true;
      // Best-effort leave
      leaveRoom(roomId, user.id).catch(() => {});
    };
  }, [roomId, user?.id, user?.name, user?.color]);

  return { joined };
}

/**
 * Track and broadcast the current slide index for this user
 */
export function useUserSlideIndex(roomId: string, userId: string, slideIndex: number) {
  const lastSentRef = useRef<number>(-1);

  useEffect(() => {
    if (!roomId || !userId) return;
    if (slideIndex === lastSentRef.current) return;
    lastSentRef.current = slideIndex;
    updateUserState(roomId, userId, { slideIndex }).catch(console.error);
  }, [roomId, userId, slideIndex]);
}

/**
 * Track mouse position and broadcast cursor (throttled)
 * Sends normalized viewport-relative coordinates (0..1 on each axis)
 * so the admin page can render correctly regardless of window size.
 */
export function useCursorBroadcast(roomId: string, userId: string, enabled: boolean) {
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!enabled || !roomId || !userId) return;

    const handleMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSentRef.current < 80) return;
      lastSentRef.current = now;
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const x = Math.min(1, Math.max(0, e.clientX / w));
      const y = Math.min(1, Math.max(0, e.clientY / h));
      updateUserState(roomId, userId, { cursor: { x, y } }).catch(() => {});
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [roomId, userId, enabled]);
}

/**
 * Track every click anywhere in the page and increment the user's clickCount.
 * Runs on the presenter (and audience) clients so admin can see engagement.
 */
export function useGlobalClickTracker(roomId: string, userId: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !roomId || !userId) return;

    const handleClick = () => {
      incrementClickCount(roomId, userId).catch(() => {});
    };

    window.addEventListener('click', handleClick, { passive: true });
    return () => window.removeEventListener('click', handleClick);
  }, [roomId, userId, enabled]);
}

/**
 * Track click count for the current user
 */
export function useClickCounter(roomId: string, userId: string, enabled: boolean) {
  return useCallback(() => {
    if (!enabled || !roomId || !userId) return;
    incrementClickCount(roomId, userId).catch(console.error);
  }, [roomId, userId, enabled]);
}

/**
 * Admin: force-update the room's current slide
 */
export function useAdminSlideControl(roomId: string) {
  return useCallback(
    async (slideIndex: number) => {
      if (!roomId) return;
      await updateCurrentSlide(roomId, slideIndex);
    },
    [roomId]
  );
}

/**
 * Quiz answer recording (shared across all users)
 */
export function useQuizAnswer(roomId: string) {
  return useCallback(
    async (answer: QuizAnswer) => {
      if (!roomId) return;
      await recordQuizAnswer(roomId, answer);
    },
    [roomId]
  );
}

/**
 * Heartbeat: keep user marked as active
 */
export function useHeartbeat(roomId: string, userId: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !roomId || !userId) return;

    const tick = () => {
      updateUserState(roomId, userId, {}).catch(() => {});
    };

    // Ping every 10s to show "online"
    const interval = setInterval(tick, 10000);
    return () => clearInterval(interval);
  }, [roomId, userId, enabled]);
}

/**
 * Reset pyramid lit state when the user explicitly navigates INTO the pyramid
 * slide (Prev/Next/Page picker), so re-entering always starts dark.
 *
 * Mount-time "sync from remote" is NOT treated as a user-initiated navigation,
 * so a presenter who F5-reloads while the admin is mid-demo on the pyramid
 * slide still sees the admin's current lit tiers.
 *
 * Implementation: the presenter/admin components must wrap their slide setter
 * with `wrapSetLocalSlide`, which records the previous index in a ref and only
 * fires the reset effect when the *user* moved INTO the pyramid slide.
 *
 * Fires on both admin and presenter; Firebase writes are idempotent.
 */
export function usePyramidReset(
  roomId: string,
  pyramidSlideIndex = 3
) {
  // Triggered by `wrapSetLocalSlide` via the global event bus.
  useEffect(() => {
    if (!roomId || typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ from: number | null; to: number }>).detail;
      if (!detail) return;
      const wasOnPyramid = detail.from === pyramidSlideIndex;
      const nowOnPyramid = detail.to === pyramidSlideIndex;
      if (!wasOnPyramid && nowOnPyramid) {
        setPyramidLit(roomId, []).catch(() => {});
      }
    };
    window.addEventListener('app:slidechange', handler as EventListener);
    return () => window.removeEventListener('app:slidechange', handler as EventListener);
  }, [roomId, pyramidSlideIndex]);
}

/**
 * Wrap a `setLocalSlide(i)` so that:
 *   1. The new index is stored in the ref.
 *   2. A `app:slidechange` window event is dispatched with `{from, to}` so any
 *      `usePyramidReset` consumer can decide whether to reset state.
 *
 * Sync-from-remote `setLocalSlide` calls should NOT use this wrapper.
 */
export function useLocalSlideChangeNotifier(
  setLocalSlide: (i: number) => void
) {
  const lastIndexRef = useRef<number | null>(null);
  return useCallback(
    (next: number) => {
      const from = lastIndexRef.current;
      lastIndexRef.current = next;
      setLocalSlide(next);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('app:slidechange', { detail: { from, to: next } })
        );
      }
    },
    [setLocalSlide]
  );
}
