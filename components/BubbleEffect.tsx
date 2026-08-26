'use client';

import { useEffect, useState } from 'react';

export interface Bubble {
  id: string;
  x: number;
  y: number;
  emoji: string;
}

const EMOJIS = ['😂', '❤️', '⭐', '📖', '🤔'];

export default function BubbleEffect({ enabled, onSpawn }: { enabled: boolean; onSpawn?: (b: Omit<Bubble, 'id'>) => void }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    if (!enabled) return;

    function handle(e: MouseEvent) {
      const bubble: Bubble = {
        id: Math.random().toString(36).slice(2),
        x: e.clientX,
        y: e.clientY,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      };
      setBubbles((prev) => [...prev, bubble]);
      onSpawn?.({ x: bubble.x, y: bubble.y, emoji: bubble.emoji });

      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
      }, 1700);
    }

    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [enabled, onSpawn]);

  return (
    <>
      {bubbles.map((b) => (
        <div
          key={b.id}
          style={
            {
              position: 'fixed',
              left: b.x,
              top: b.y,
              zIndex: 89,
              pointerEvents: 'none',
              fontSize: '1.7rem',
              animation: 'bub 1.6s ease forwards',
              '--dx': `${Math.random() * 120 - 60}px`,
              '--rot': `${Math.random() * 50 - 25}deg`,
            } as React.CSSProperties
          }
        >
          {b.emoji}
        </div>
      ))}
    </>
  );
}
