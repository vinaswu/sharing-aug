'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/lib/types';
import { sendChatMessage } from '@/lib/firebase';

interface Props {
  roomId: string;
  userId: string;
  userName: string;
  userColor: string;
  messages: ChatMessage[];
}

export default function ChatInput({ roomId, userId, userName, userColor, messages }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for "/" key to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in an input/textarea that isn't our chat box
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === '/') {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape') {
        setOpen(false);
        setText('');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-focus when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || !userId) {
      setText('');
      setOpen(false);
      return;
    }
    await sendChatMessage(roomId, {
      userId,
      userName,
      userColor,
      text: trimmed,
      at: Date.now(),
    });
    setText('');
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      setText('');
      setOpen(false);
    }
  };

  // Show latest message count badge when panel is closed
  const recent = messages.slice(-1)[0];

  return (
    <>
      {/* Collapsed indicator — a small bubble in the top-right corner */}
      {!open && (
        <div
          onClick={() => setOpen(true)}
          title="按 / 鍵發送訊息"
          style={{
            position: 'fixed',
            top: 14,
            right: 14,
            zIndex: 97,
            background: 'rgba(10, 10, 15, 0.82)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(245, 185, 66, 0.25)',
            borderRadius: 999,
            padding: '6px 14px',
            cursor: 'pointer',
            pointerEvents: 'auto',
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'inherit',
            userSelect: 'none',
          }}
        >
          💬 訊息
          {recent && (
            <span
              style={{
                marginLeft: 8,
                color: recent.userColor,
                fontWeight: 700,
              }}
            >
              {recent.userName}：{recent.text.length > 20 ? recent.text.slice(0, 20) + '…' : recent.text}
            </span>
          )}
        </div>
      )}

      {/* Input panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 72, // above navigation bar
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99,
            width: 'min(480px, 92vw)',
          }}
        >
          <div
            style={{
              background: 'rgba(10, 10, 15, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(245, 185, 66, 0.4)',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {/* User color dot */}
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: userColor,
                flexShrink: 0,
              }}
            />

            {/* Input */}
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="輸入訊息，按 Enter 發送…"
              maxLength={200}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                caretColor: 'var(--accent, #f5b942)',
              }}
            />

            {/* Char count */}
            {text.length > 160 && (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: text.length > 190 ? '#ff6b6b' : 'rgba(255,255,255,0.3)',
                  flexShrink: 0,
                }}
              >
                {text.length}
              </span>
            )}

            {/* Send button */}
            <button
              onClick={submit}
              disabled={!text.trim()}
              style={{
                background: text.trim() ? 'var(--accent, #f5b942)' : 'transparent',
                border: 'none',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#1a1205',
                cursor: text.trim() ? 'pointer' : 'default',
                opacity: text.trim() ? 1 : 0.35,
                flexShrink: 0,
                fontFamily: 'inherit',
                transition: 'opacity .15s',
              }}
            >
              送出
            </button>

            {/* Cancel */}
            <button
              onClick={() => { setText(''); setOpen(false); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                padding: '5px 6px',
                flexShrink: 0,
                fontFamily: 'inherit',
              }}
              title="取消 (Esc)"
            >
              ✕
            </button>
          </div>
          <div
            style={{
              textAlign: 'center',
              marginTop: 6,
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.04em',
            }}
          >
            Enter 送出 · Esc 取消
          </div>
        </div>
      )}
    </>
  );
}
