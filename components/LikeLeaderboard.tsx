'use client';

import { useMemo } from 'react';
import type { User } from '@/lib/types';

interface LikeLeaderboardProps {
  users: Record<string, User>;
  /** The current user's id, to highlight their own row */
  currentUserId: string;
}

/**
 * Floating panel in the bottom-right corner of the presenter/audience view.
 * Shows all online users sorted by clickCount descending so everyone can see
 * a live, room-wide engagement leaderboard.
 *
 * Positioned above the "BY 918 VINAS WU" copyright line.
 * Hidden when there are 0 users.
 */
export default function LikeLeaderboard({ users, currentUserId }: LikeLeaderboardProps) {
  const sorted = useMemo(() => {
    return Object.values(users)
      .sort((a, b) => (Number(b.clickCount) || 0) - (Number(a.clickCount) || 0))
      .slice(0, 8); // cap at 8 rows so it doesn't grow forever
  }, [users]);

  if (sorted.length === 0) return null;

  const maxClicks = Number(sorted[0].clickCount) || 0;

  return (
    <div
      style={{
        position: 'fixed',
        right: 14,
        bottom: 84, // safely above the Navigation bar (~60px tall)
        zIndex: 96,
        background: 'rgba(10, 10, 15, 0.82)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(245, 185, 66, 0.25)',
        borderRadius: 10,
        padding: '10px 14px',
        minWidth: 180,
        maxWidth: 240,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(245, 185, 66, 0.7)',
          marginBottom: 8,
        }}
      >
        ❤️ Like 排行榜
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {sorted.map((u, rank) => {
          const clicks = Number(u.clickCount) || 0;
          const isMe = u.id === currentUserId;
          const barWidth = maxClicks > 0 ? (clicks / maxClicks) * 100 : 0;

          return (
            <div
              key={u.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: isMe ? 1 : 0.82,
              }}
            >
              {/* Rank badge */}
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color:
                    rank === 0
                      ? '#ffd700'
                      : rank === 1
                      ? '#c0c0c0'
                      : rank === 2
                      ? '#cd7f32'
                      : 'rgba(255,255,255,0.35)',
                  minWidth: 14,
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}.`}
              </span>

              {/* Color dot + name */}
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: u.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '0.75rem',
                  color: isMe ? '#fff' : 'rgba(255,255,255,0.75)',
                  fontWeight: isMe ? 700 : 400,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {isMe ? `${u.name} (你)` : u.name}
              </span>

              {/* Click count + bar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: rank === 0 ? '#ffd700' : 'rgba(255,255,255,0.65)',
                  }}
                >
                  {clicks}
                </span>
                {maxClicks > 0 && (
                  <div
                    style={{
                      height: 2,
                      width: 60,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        background:
                          rank === 0
                            ? '#ffd700'
                            : rank === 1
                            ? '#c0c0c0'
                            : rank === 2
                            ? '#cd7f32'
                            : 'rgba(245, 185, 66, 0.55)',
                        borderRadius: 2,
                        transition: 'width .4s ease',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
