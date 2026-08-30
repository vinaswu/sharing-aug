'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SlideBuilder from '@/components/SlideBuilder';
import { useCustomSlides } from '@/lib/hooks';
import { saveCustomSlides } from '@/lib/customSlides';
import { SLIDES } from '@/lib/slides-data';
import type { Slide } from '@/lib/types';

export default function BuilderPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = params?.roomId || 'pyramid-ch3';

  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth check on mount (same pattern as the dashboard).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const password = sessionStorage.getItem('pyr_admin_password') || '';
    if (!password) {
      router.replace('/admin');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        if (cancelled) return;
        if (!res.ok) {
          sessionStorage.removeItem('pyr_admin_password');
          router.replace('/admin');
          return;
        }
        setAuthenticated(true);
        setAuthChecked(true);
      } catch {
        if (cancelled) return;
        router.replace('/admin');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const customSlides = useCustomSlides(authChecked ? roomId : null);
  const slides: Slide[] = customSlides ?? SLIDES;

  const handleSave = useCallback(
    async (next: Slide[]) => {
      await saveCustomSlides(roomId, next);
    },
    [roomId]
  );

  if (!authChecked) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>載入中…</div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header with back button */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 18px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--card)',
          flexShrink: 0,
          zIndex: 50,
        }}
      >
        <Link
          href={`/admin/dashboard/${roomId}`}
          style={{
            color: 'var(--ink)',
            fontSize: '0.85rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid var(--line)',
            background: 'var(--bg)',
            transition: 'all 0.15s',
          }}
        >
          ← 返回控制台
        </Link>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>房間：{roomId}</span>
      </header>

      <div style={{ flex: 1, minHeight: 0 }}>
        <SlideBuilder roomId={roomId} slides={slides} onSave={handleSave} />
      </div>
    </div>
  );
}
