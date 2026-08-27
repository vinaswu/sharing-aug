'use client';

import { useEffect, useState, useMemo, useCallback, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SlideViewer from '@/components/SlideViewer';
import { SLIDES } from '@/lib/slides-data';
import { useRoom, useAdminSlideControl, usePyramidReset, useLocalSlideChangeNotifier, useChatMessages } from '@/lib/hooks';
import { setPyramidLit, setCursorVisible, kickUser, clearChatMessages } from '@/lib/firebase';
import ChatMessagePanel from '@/components/ChatMessagePanel';
import type { User, QuizAnswer } from '@/lib/types';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = params?.roomId || 'pyramid-ch3';

  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth check on mount: re-validate the sessionStorage password against the
  // server-side ADMIN_PASSWORD so a deployment without NEXT_PUBLIC_* env vars
  // still works (and so a stale session is rejected).
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

  const { room, loading } = useRoom(authChecked ? roomId : null);
  const messages = useChatMessages(authChecked ? roomId : null);
  const forceSlide = useAdminSlideControl(roomId);
  const remoteCurrentSlide = room?.currentSlide ?? 0;

  usePyramidReset(roomId);

  const users = useMemo(() => {
    if (!room) return [];
    return Object.values(room.users).sort((a, b) => b.joinedAt - a.joinedAt);
  }, [room]);

  const handlePyramidLight = useCallback(
    (idx: number) => {
      const current = room?.pyramidLit || [];
      if (current.includes(idx)) return;
      setPyramidLit(roomId, [...current, idx]).catch((err) =>
        console.error('Failed to broadcast pyramid lit', err)
      );
    },
    [roomId, room?.pyramidLit]
  );

  const currentSlideIndex = room?.currentSlide ?? 0;
  const currentSlide = SLIDES[currentSlideIndex] || SLIDES[0];
  const totalClicks = useMemo(
    () => users.reduce((sum, u) => sum + (Number(u.clickCount) || 0), 0),
    [users]
  );

  // Extract other users' cursor positions (same slide only).
  // Hidden when admin has toggled cursor visibility off.
  const cursorVisible = room?.cursorVisible ?? true;
  const remoteCursors = useMemo(() => {
    if (!cursorVisible) return [];
    return users
      .filter((u) => u.cursor != null)
      .map((u) => ({
        id: u.id,
        name: u.name,
        color: u.color,
        x: u.cursor!.x,
        y: u.cursor!.y,
      }));
  }, [users, cursorVisible]);

  const handleCursorToggle = useCallback(
    (next: boolean) => {
      setCursorVisible(roomId, next).catch((err) =>
        console.error('Failed to toggle cursor visibility', err)
      );
    },
    [roomId]
  );

  // Admin: kick a single user out of the room. Removes the user node; the
  // targeted client detects its own disappearance (see useKickDetection in
  // the presenter page) and logs out.
  const handleKick = useCallback(
    (userId: string, userName: string) => {
      const ok = window.confirm(`確定要踢出「${userName}」嗎？`);
      if (!ok) return;
      kickUser(roomId, userId).catch((err) =>
        console.error('Failed to kick user', err)
      );
    },
    [roomId]
  );

  // Admin: kick everyone. Useful at the end of a session to reset the room
  // without nuking the room-wide state (current slide, pyramid, etc.).
  const handleKickAll = useCallback(() => {
    if (users.length === 0) return;
    const ok = window.confirm(
      `確定要踢出全部 ${users.length} 位使用者？他們需要重新輸入名字才能再進來。`
    );
    if (!ok) return;
    users.forEach((u) => {
      kickUser(roomId, u.id).catch((err) =>
        console.error('Failed to kick user', u.id, err)
      );
    });
  }, [roomId, users]);

  // Quiz answers: latest entry per user, sorted by recency
  const quizStats = useMemo(() => {
    const list = room?.quizAnswers ?? [];
    return [...list].sort((a, b) => (b.at || 0) - (a.at || 0));
  }, [room?.quizAnswers]);

  // Wrap goTo so a user-initiated slide change emits a `app:slidechange` event
  // for usePyramidReset. Firebase roundtrip will then update `room.currentSlide`
  // through the normal subscription path.
  const emitSlideChange = useLocalSlideChangeNotifier(() => {});
  const goTo = useCallback(
    (i: number) => {
      if (i < 0 || i >= SLIDES.length) return;
      emitSlideChange(i);
      forceSlide(i);
    },
    [emitSlideChange, forceSlide]
  );

  if (!authChecked || loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>載入中…</div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: '1.15rem', color: 'var(--accent)' }}>🛡️ 管理員控制台</h1>
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>房間：{roomId}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Cursor visibility toggle */}
          <CursorToggle visible={cursorVisible} onChange={handleCursorToggle} />
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            👥 <b style={{ color: 'var(--accent)' }}>{users.length}</b> 人在線 ·
            <b style={{ color: 'var(--accent)' }}> {totalClicks}</b> 次點擊
          </span>
          {users.length > 0 && (
            <button
              onClick={handleKickAll}
              title="把全部線上使用者踢出"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--line)',
                color: 'var(--bad, #ff6b6b)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              🚫 全部踢出
            </button>
          )}
          <button
            onClick={() => clearChatMessages(roomId).catch(console.error)}
            title="清空聊天室"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            🗑 清空聊天
          </button>
          <Link
            href="/admin"
            style={{ color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'underline' }}
          >
            登出
          </Link>
        </div>
      </header>

      {/* Main content: split layout */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
        }}
      >
        {/* Left panel: users */}
        <aside
          style={{
            width: 320,
            borderRight: '1px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--card)',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            <h2 style={{ fontSize: '0.95rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>
              線上使用者 ({users.length})
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 4 }}>
              顯示各使用者目前停留的頁面
            </p>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
            {users.length === 0 && (
              <p style={{ color: 'var(--muted)', padding: 20, textAlign: 'center' }}>
                目前無人上線
              </p>
            )}
            {users.map((u) => {
              const isOnCurrent = u.slideIndex === currentSlideIndex;
              return (
                <div
                  key={u.id}
                  style={{
                    padding: '12px 8px',
                    borderBottom: '1px solid var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: u.color,
                      flexShrink: 0,
                      boxShadow: '0 0 0 2px rgba(0,0,0,.3)',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {u.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                      第 {u.slideIndex + 1} 頁
                      {isOnCurrent && (
                        <span
                          style={{
                            marginLeft: 6,
                            color: 'var(--good)',
                            fontWeight: 700,
                          }}
                        >
                          ● 同步中
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleKick(u.id, u.name)}
                    title={`踢出 ${u.name}`}
                    aria-label={`踢出 ${u.name}`}
                    style={{
                      flexShrink: 0,
                      background: 'transparent',
                      border: '1px solid var(--line)',
                      color: 'var(--bad, #ff6b6b)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      lineHeight: 1,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 107, 107, .15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    踢出
                  </button>
                </div>
              );
            })}
          </div>

          {/* Click stats footer */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--line)',
              background: 'rgba(0,0,0,.2)',
            }}
          >
            <h3
              style={{
                fontSize: '0.85rem',
                color: 'var(--accent)',
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}
            >
              📊 點擊統計
            </h3>
            {users.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>無資料</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {users
                  .slice()
                  .sort((a, b) => (Number(b.clickCount) || 0) - (Number(a.clickCount) || 0))
                  .map((u) => (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.85rem',
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: u.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.name}
                      </span>
                      <b style={{ color: 'var(--accent)', minWidth: 36, textAlign: 'right' }}>
                        {u.clickCount || 0} 次
                      </b>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right panel: slide control */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2 style={{ fontSize: '0.95rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>
              目前播放：第 {currentSlideIndex + 1} 頁 / 共 {SLIDES.length} 頁
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => goTo(currentSlideIndex - 1)}
                disabled={currentSlideIndex <= 0}
                style={btnStyle(currentSlideIndex > 0)}
              >
                ← 上一頁
              </button>
              <button
                onClick={() => goTo(currentSlideIndex + 1)}
                disabled={currentSlideIndex >= SLIDES.length - 1}
                style={btnStyle(currentSlideIndex < SLIDES.length - 1)}
              >
                下一頁 →
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative', // anchor for ChatMessagePanel (absolute)
            }}
          >
            <div
              style={{
                background: 'transparent',
                border: 'none',
                maxWidth: '100%',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <SlideViewer
                slide={currentSlide}
                slideNumber={currentSlideIndex}
                totalSlides={SLIDES.length}
                mode="back"
                remoteCursors={remoteCursors}
                onPyramidLight={handlePyramidLight}
              />
            </div>

            {/* Chat panel — anchored to the top-right of the slide area,
                not the full viewport, so it stays inside the slide bounds. */}
            <ChatMessagePanel messages={messages} variant="absolute" />
          </div>

          {/* Quiz answers panel - only shown on the quiz slide */}
          {currentSlide.type === 'quiz' && currentSlide.quiz && (
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--line)',
                background: 'rgba(0,0,0,.25)',
                maxHeight: 240,
                overflow: 'auto',
              }}
            >
              <h3
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--accent)',
                  letterSpacing: '0.1em',
                  marginBottom: 10,
                }}
              >
                🧠 學員作答統計（{quizStats.length} / {users.length} 人）
              </h3>
              {quizStats.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>尚無人作答</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Per-option breakdown */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      marginBottom: 4,
                    }}
                  >
                    {currentSlide.quiz.front.options.map((opt, i) => {
                      const count = quizStats.filter((a) => a.idx === i).length;
                      const isCorrect = opt.correct;
                      return (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.8rem',
                            padding: '4px 10px',
                            borderRadius: 12,
                            border: `1px solid ${isCorrect ? 'var(--accent)' : 'var(--line)'}`,
                            background: isCorrect
                              ? 'rgba(245, 185, 66, .15)'
                              : 'var(--card)',
                            color: isCorrect ? 'var(--accent)' : 'var(--muted)',
                          }}
                        >
                          {String.fromCharCode(65 + i)} · {count} 人
                          {isCorrect && ' ✓'}
                        </span>
                      );
                    })}
                  </div>
                  {/* Per-user list */}
                  {users.map((u) => {
                    const latest = pickLatestAnswer(room?.quizAnswers, u.id);
                    const optionLetter = latest
                      ? String.fromCharCode(65 + latest.idx)
                      : '—';
                    const colorClass = latest
                      ? latest.correct
                        ? 'var(--accent)'
                        : 'var(--muted)'
                      : 'var(--muted)';
                    return (
                      <div
                        key={u.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: '0.85rem',
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: u.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {u.name}
                        </span>
                        {latest ? (
                          <Fragment key="answer">
                            <b style={{ color: colorClass, minWidth: 24 }}>
                              {optionLetter}
                            </b>
                            <span style={{ color: colorClass, fontSize: '0.75rem' }}>
                              {latest.correct ? '✅' : '❌'}
                            </span>
                          </Fragment>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                            未作答
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Slide picker grid */}
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--line)',
              background: 'rgba(0,0,0,.2)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
                gap: 8,
              }}
            >
              {SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  style={{
                    padding: '8px 4px',
                    background: i === currentSlideIndex ? 'var(--accent)' : 'var(--card)',
                    color: i === currentSlideIndex ? '#1a1205' : 'var(--ink)',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function btnStyle(enabled: boolean): React.CSSProperties {
  return {
    background: 'var(--card)',
    border: '1px solid var(--line)',
    color: 'var(--ink)',
    borderRadius: 8,
    padding: '8px 18px',
    fontSize: '0.95rem',
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.4,
    fontFamily: 'inherit',
  };
}

/**
 * Pill-style toggle switch. Admin uses this to control whether the front-end
 * users broadcast cursor positions and whether the admin's CursorOverlay
 * renders. State is shared via RTDB so all clients stay in sync.
 */
function CursorToggle({
  visible,
  onChange,
}: {
  visible: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 10px 4px 6px',
        border: '1px solid var(--line)',
        borderRadius: 999,
        background: 'var(--card)',
        cursor: 'pointer',
        userSelect: 'none',
        fontSize: '0.85rem',
        color: visible ? 'var(--accent)' : 'var(--muted)',
        transition: 'color .2s',
      }}
      title="切換前端用戶的滑鼠游標是否廣播 / 是否顯示"
    >
      <span
        aria-hidden
        style={{
          position: 'relative',
          width: 32,
          height: 18,
          borderRadius: 999,
          background: visible ? 'var(--accent)' : 'var(--line)',
          transition: 'background .2s',
          flexShrink: 0,
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 2,
            left: visible ? 16 : 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: visible ? '#1a1205' : '#888',
            transition: 'left .2s, background .2s',
          }}
        />
      </span>
      <span style={{ fontWeight: 700, letterSpacing: '0.04em' }}>
        {visible ? '顯示滑鼠' : '隱藏滑鼠'}
      </span>
      <input
        type="checkbox"
        checked={visible}
        onChange={(e) => onChange(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        aria-label="切換滑鼠游標顯示"
      />
    </label>
  );
}

function pickLatestAnswer(
  list: QuizAnswer[] | undefined,
  userId: string
): QuizAnswer | null {
  if (!list || list.length === 0) return null;
  let latest: QuizAnswer | null = null;
  for (const a of list) {
    if (a.userId !== userId) continue;
    if (!latest || (a.at || 0) > (latest.at || 0)) latest = a;
  }
  return latest;
}
