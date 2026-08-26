'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import SlideViewer from '@/components/SlideViewer';
import Navigation from '@/components/Navigation';
import CursorOverlay from '@/components/CursorOverlay';
import BubbleEffect from '@/components/BubbleEffect';
import { SLIDES } from '@/lib/slides-data';
import { useRoom, useRoomPresence, useUserSlideIndex, useCursorBroadcast, useGlobalClickTracker, useQuizAnswer, useHeartbeat, usePyramidReset, useLocalSlideChangeNotifier } from '@/lib/hooks';
import type { User, QuizAnswer } from '@/lib/types';
import Link from 'next/link';

export default function PresenterPage() {
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();
  const roomId = params?.roomId || 'pyramid-ch3';
  const queryName = searchParams.get('name') || '';

  const [user, setUser] = useState<User | null>(null);
  const [localSlide, setLocalSlide] = useState(0);

  // Read from sessionStorage (or query)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = sessionStorage.getItem('pyr_id') || '';
    const name = sessionStorage.getItem('pyr_name') || queryName || '';
    const color = sessionStorage.getItem('pyr_color') || '#f5b942';

    if (id && name) {
      setUser({ id, name, color, slideIndex: 0, clickCount: 0, lastSeen: 0, joinedAt: 0 });
    } else if (queryName) {
      // Fallback: generate new id
      const newId = 'u_' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem('pyr_id', newId);
      sessionStorage.setItem('pyr_name', queryName);
      sessionStorage.setItem('pyr_color', color);
      setUser({ id: newId, name: queryName, color, slideIndex: 0, clickCount: 0, lastSeen: 0, joinedAt: 0 });
    }
  }, [queryName]);

  // Join room
  useRoomPresence(roomId, user);

  // Subscribe to room state
  const { room } = useRoom(roomId);

  // Sync local slide with room's current slide (admin-controlled)
  useEffect(() => {
    if (room) {
      setLocalSlide(room.currentSlide);
    }
  }, [room?.currentSlide]);

  // Broadcast user slide index
  useUserSlideIndex(roomId, user?.id || '', localSlide);

  // Broadcast cursor
  useCursorBroadcast(roomId, user?.id || '', Boolean(user));

  // Heartbeat
  useHeartbeat(roomId, user?.id || '', Boolean(user));

  // Track every click anywhere on the page
  useGlobalClickTracker(roomId, user?.id || '', Boolean(user));

  // Reset pyramid lit state on user-initiated navigation into the pyramid slide
  usePyramidReset(roomId);

  const recordAnswer = useQuizAnswer(roomId);

  // Wrap setLocalSlide so local navigation (Prev/Next/Page picker) emits a
  // `app:slidechange` event. The remote sync effect above intentionally uses
  // the unwrapped setter so it never triggers a reset.
  const goTo = useLocalSlideChangeNotifier(setLocalSlide);

  const goPrev = useCallback(() => {
    if (localSlide > 0) goTo(localSlide - 1);
  }, [localSlide, goTo]);

  const goNext = useCallback(() => {
    if (localSlide < SLIDES.length - 1) goTo(localSlide + 1);
  }, [localSlide, goTo]);

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  // Quiz handler
  const handleQuizSelect = useCallback(
    (idx: number, correct: boolean) => {
      if (!user) return;
      const answer: QuizAnswer = {
        userId: user.id,
        userName: user.name,
        idx,
        correct,
        at: Date.now(),
      };
      recordAnswer(answer);
    },
    [user, recordAnswer]
  );

  // Always normalize slide index (admin could change total)
  const currentSlide = SLIDES[localSlide] || SLIDES[0];
  const onlineCount = useMemo(() => Object.keys(room?.users || {}).length, [room]);

  if (!user) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
        連線中…
        <div style={{ marginTop: 16 }}>
          <Link href="/" style={{ color: 'var(--accent)' }}>← 返回首頁</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Online count badge */}
      <div
        style={{
          position: 'fixed',
          left: 16,
          top: 14,
          zIndex: 95,
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 999,
          padding: '6px 14px',
          fontSize: '0.82rem',
          color: 'var(--muted)',
        }}
      >
        👥 線上 <b style={{ color: 'var(--accent)' }}>{onlineCount}</b> 人
      </div>

      <BubbleEffect enabled />

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 32px 56px',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SlideViewer
            slide={currentSlide}
            slideNumber={localSlide}
            totalSlides={SLIDES.length}
            onQuizSelect={handleQuizSelect}
            pyramidLit={room?.pyramidLit}
          />
        </div>
      </div>

      <Navigation
        currentIndex={localSlide}
        total={SLIDES.length}
        canPrev={localSlide > 0}
        canNext={localSlide < SLIDES.length - 1}
        onPrev={goPrev}
        onNext={goNext}
        onJump={(i) => goTo(i)}
      />

      {/* Cursors overlay */}
      <CursorOverlay
        cursors={Object.values(room?.users || {})
          .filter((u) => u.id !== user.id && u.cursor != null)
          .map((u) => ({
            id: u.id,
            name: u.name,
            color: u.color,
            x: u.cursor!.x,
            y: u.cursor!.y,
          }))}
      />
      <div
        style={{
          position: 'fixed',
          right: 14,
          bottom: 12,
          color: 'var(--muted)',
          fontSize: '0.72rem',
          letterSpacing: '0.06em',
          fontWeight: 700,
          textTransform: 'uppercase',
          zIndex: 95,
          pointerEvents: 'none',
        }}
      >
        BY 918 VINAS WU
      </div>
    </div>
  );
}
