'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'pyr_admin_password';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [roomId, setRoomId] = useState('pyramid-ch3');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setPassword(saved);
    }
  }, []);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!password.trim() || !roomId.trim()) {
      setError('請填寫密碼和房間代碼');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError('密碼錯誤，請重新輸入');
        setSubmitting(false);
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, password);
      sessionStorage.setItem('pyr_admin_room', roomId);
      router.push(`/admin/dashboard/${roomId}`);
    } catch {
      setError('驗證失敗，請檢查網路後再試');
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <form
        onSubmit={go}
        style={{
          width: 'min(380px, 90vw)',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: '1.6rem', textAlign: 'center' }}>
          🛡️ 管理員登入
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center' }}>
          輸入管理員密碼和房間代碼
        </p>

        <input
          type="password"
          placeholder="管理員密碼"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: '1rem',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />

        <input
          placeholder="房間代碼（例如 pyramid-ch3）"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: '1rem',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />

        {error && (
          <p style={{ color: 'var(--bad)', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: 'var(--accent)',
            color: '#1a1205',
            border: 'none',
            borderRadius: 8,
            padding: '12px',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {submitting ? '驗證中…' : '進入控制台 →'}
        </button>
      </form>
    </div>
  );
}
