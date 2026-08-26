'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const COLORS = [
  '#f5b942',
  '#6fcf97',
  '#7eb8ff',
  '#ff8fa3',
  '#c792ea',
  '#ffd166',
  '#4ecdc4',
];

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('pyramid-ch3');

  useEffect(() => {
    // Pre-fill name if saved
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('pyr_name');
      if (saved) setName(saved);
    }
  }, []);

  function enter(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const id = 'u_' + Math.random().toString(36).slice(2, 9);

    sessionStorage.setItem('pyr_name', trimmed);
    sessionStorage.setItem('pyr_id', id);
    sessionStorage.setItem('pyr_color', color);

    router.push(`/presenter/${roomId || 'pyramid-ch3'}?name=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 22,
        textAlign: 'center',
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: '2.2rem', lineHeight: 1.4 }}>
        金字塔原理 · 第三章
        <br />
        <span style={{ color: 'var(--accent)' }}>如何搭起一座金字塔</span>
      </h1>
      <p style={{ color: 'var(--muted)' }}>先告訴我們你是誰和房間代碼，一起進來玩 👇</p>

      <form
        onSubmit={enter}
        style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}
      >
        <input
          required
          maxLength={12}
          placeholder="打入你的名字…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: 10,
            padding: '14px 20px',
            fontSize: '1.15rem',
            width: 'min(320px, 80vw)',
            textAlign: 'center',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <input
          required
          placeholder="房間代碼（例如 pyramid-ch3）"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: 10,
            padding: '14px 20px',
            fontSize: '1rem',
            width: 'min(320px, 80vw)',
            textAlign: 'center',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            background: 'var(--accent)',
            color: '#1a1205',
            border: 'none',
            borderRadius: 10,
            padding: '13px 40px',
            fontSize: '1.1rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          進入簡報 →
        </button>
      </form>
    </div>
  );
}
