'use client';

import { useEffect, useState } from 'react';
import type { ChatMessage as ChatMessageType } from '@/lib/types';

interface Props {
  messages: ChatMessageType[];
  /**
   * "fixed" — floats over the viewport (presenter page, default).
   * "absolute" — positioned within the closest `position: relative` parent
   *               (admin dashboard, so it stays anchored inside the slide area
   *               and never leaks onto the split-pane chrome around it).
   */
  variant?: 'fixed' | 'absolute';
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function ChatMessagePanel({ messages, variant = 'fixed' }: Props) {
  const [visible, setVisible] = useState(true);

  // Auto-hide after 8 seconds, re-show on new messages
  const [hideTimer, setHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // When a new message arrives, show the panel and reset the timer
    if (messages.length === 0) return;
    setVisible(true);
    if (hideTimer) clearTimeout(hideTimer);
    const t = setTimeout(() => setVisible(false), 8000);
    setHideTimer(t);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  if (messages.length === 0) return null;

  // Show latest 5 messages
  const recent = messages.slice(-5);

  return (
    <div
      style={{
        position: variant === 'absolute' ? 'absolute' : 'fixed',
        top: variant === 'absolute' ? 12 : 14,
        right: variant === 'absolute' ? 12 : 14,
        zIndex: 98,
        width: 280,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity .3s',
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
          padding: '0 4px',
        }}
      >
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(245, 185, 66, 0.7)',
          }}
        >
          💬 訊息
        </span>
        <button
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? '隱藏訊息' : '顯示訊息'}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            padding: '0 2px',
            lineHeight: 1,
          }}
        >
          {visible ? '✕' : '▲'}
        </button>
      </div>

      {/* Message list */}
      <div
        style={{
          background: 'rgba(10, 10, 15, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(245, 185, 66, 0.2)',
          borderRadius: 10,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxHeight: 220,
          overflow: 'hidden',
        }}
      >
        {recent.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            {/* Color dot */}
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: msg.userColor,
                flexShrink: 0,
                marginTop: 4,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  marginBottom: 1,
                }}
              >
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: msg.userColor,
                  }}
                >
                  {msg.userName}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.3)',
                  }}
                >
                  {formatTime(msg.at)}
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.88)',
                  wordBreak: 'break-word',
                  lineHeight: 1.4,
                }}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
