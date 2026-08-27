'use client';

interface Props {
  currentIndex: number;
  total: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onJump: (i: number) => void;
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 4,
  padding: '1px 5px',
  fontSize: '0.72rem',
  fontFamily: 'monospace',
  color: 'rgba(255,255,255,0.6)',
  lineHeight: 1.5,
};

function HintBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: '0.72rem',
        color: 'rgba(255,255,255,0.38)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
}

export default function Navigation({ currentIndex, total, canPrev, canNext, onPrev, onNext, onJump }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 20px',
        background: 'rgba(255,255,255,.02)',
        borderTop: '1px solid var(--line)',
        zIndex: 2,
      }}
    >
      {/* Usage hint — left side */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <HintBadge>
          <kbd style={kbdStyle}>←</kbd><kbd style={kbdStyle}>→</kbd> 換頁
        </HintBadge>
        <HintBadge>
          <kbd style={kbdStyle}>/</kbd> 發訊息
        </HintBadge>
      </div>

      <button
        onClick={onPrev}
        disabled={!canPrev}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          color: 'var(--ink)',
          borderRadius: 8,
          padding: '9px 22px',
          fontSize: '1rem',
          cursor: canPrev ? 'pointer' : 'not-allowed',
          opacity: canPrev ? 1 : 0.5,
          fontFamily: 'inherit',
        }}
      >
        ← 上一頁
      </button>
      <div style={{ display: 'flex', gap: 7, margin: '0 14px' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            onClick={() => onJump(i)}
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: i === currentIndex ? 'var(--accent)' : 'var(--line)',
              transform: i === currentIndex ? 'scale(1.25)' : 'scale(1)',
              cursor: 'pointer',
              transition: 'all .2s',
            }}
          />
        ))}
      </div>
      <button
        onClick={onNext}
        disabled={!canNext}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          color: 'var(--ink)',
          borderRadius: 8,
          padding: '9px 22px',
          fontSize: '1rem',
          cursor: canNext ? 'pointer' : 'not-allowed',
          opacity: canNext ? 1 : 0.5,
          fontFamily: 'inherit',
        }}
      >
        下一頁 →
      </button>
    </div>
  );
}
