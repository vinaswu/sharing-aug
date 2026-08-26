'use client';

import type { User } from '@/lib/types';

interface CursorData {
  id: string;
  name: string;
  color: string;
  /** Position as a fraction of viewport (0..1 on each axis) */
  x: number;
  y: number;
}

interface Props {
  cursors: CursorData[];
}

export default function CursorOverlay({ cursors }: Props) {
  if (cursors.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {cursors.map((cursor) => {
        const left = `${cursor.x * 100}%`;
        const top = `${cursor.y * 100}%`;
        return (
          <div
            key={cursor.id}
            style={{
              position: 'absolute',
              top,
              left,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: cursor.color,
                border: '2px solid rgba(0,0,0,0.5)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                background: cursor.color,
                color: '#1a1205',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                letterSpacing: '0.02em',
                marginTop: 2,
              }}
            >
              {cursor.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}