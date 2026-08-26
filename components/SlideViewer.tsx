'use client';

import { useState, useEffect } from 'react';
import type { Slide } from '@/lib/types';
import CursorOverlay from './CursorOverlay';

interface CursorData {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

interface Props {
  slide: Slide;
  slideNumber: number;
  totalSlides: number;
  onQuizSelect?: (idx: number, correct: boolean) => void;
  onPyramidLight?: (idx: number) => void;
  remoteCursors?: CursorData[];
  /** Admin-driven pyramid lit indexes. When provided, Pyramid becomes read-only. */
  pyramidLit?: number[];
}

const SLIDE_ANIMATION_MAP: Record<string, string> = {
  cover: 'animate__fadeInDown animate__slow',
  story: 'animate__fadeIn animate__slow',
  table: 'animate__fadeInUp animate__slow',
  steps: 'animate__fadeIn animate__slow',
  pyramid: 'animate__zoomIn animate__slow',
  quiz: 'animate__fadeInUp animate__slow',
  takeaway: 'animate__heartBeat animate__slow',
};

export default function SlideViewer({ slide, slideNumber, totalSlides, onQuizSelect, onPyramidLight, remoteCursors, pyramidLit }: Props) {
  const animClass = SLIDE_ANIMATION_MAP[slide.type] ?? 'animate__fadeIn animate__slow';

  return (
    <div
      key={slide.id}
      className={`animate__animated ${animClass}`}
      style={{
        width: 'min(880px, 92vw)',
        position: 'relative',
      }}
    >
      {slide.kicker && <div className="kicker">{slide.kicker}</div>}

      {renderSlide(slide, onQuizSelect, onPyramidLight, pyramidLit)}

      <CursorOverlay cursors={remoteCursors || []} />

      {totalSlides > 0 && (
        <div style={{ marginTop: 28, color: 'var(--muted)', fontSize: '0.78rem', textAlign: 'center' }}>
          {slideNumber + 1} / {totalSlides}
        </div>
      )}
    </div>
  );
}

function renderSlide(slide: Slide, onQuizSelect?: (idx: number, correct: boolean) => void, onPyramidLight?: (idx: number) => void, pyramidLit?: number[]) {
  switch (slide.type) {
    case 'cover':
      return (
        <div>
          <h1 style={{ fontSize: '2.3rem', lineHeight: 1.3, marginBottom: 18 }}>
            {slide.title.split('<br>').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p style={{ fontSize: '1.12rem', color: 'var(--muted)', lineHeight: 1.8 }}>
            一個顧問花了三十年才學會的說話方式——
            <br />
            今天用八分鐘，講給你聽。
          </p>
        </div>
      );

    case 'story':
      return (
        <div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: 16 }}>{slide.title}</h2>
          <div className="story-box" dangerouslySetInnerHTML={{ __html: slide.story || '' }} />
        </div>
      );

    case 'table':
      return (
        <div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: 16 }}>{slide.title}</h2>
          {slide.table && (
            <div style={{ width: '100%', overflow: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: 16,
                }}
              >
                <thead>
                  <tr>
                    {slide.table.headers.map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: '12px 14px',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--line)',
                          color: 'var(--accent)',
                          fontWeight: 700,
                          fontSize: '0.98rem',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slide.table.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => {
                        const cellText = typeof cell === 'string' ? cell : cell.text;
                        const span = typeof cell === 'string' ? 1 : cell.span || 1;
                        const cellStyle = typeof cell === 'string' ? undefined : cell.style;
                        return (
                          <td
                            key={ci}
                            colSpan={span}
                            style={{
                              padding: '12px 14px',
                              borderBottom: '1px solid var(--line)',
                              fontSize: '0.98rem',
                              lineHeight: 1.6,
                              fontWeight: ci === 0 ? 600 : 'normal',
                              whiteSpace: ci === 0 ? 'nowrap' : 'normal',
                              color: cellStyle === 'accent' ? 'var(--accent)' : 'var(--ink)',
                              textAlign: cellStyle === 'center' ? 'center' : 'left',
                            }}
                          >
                            {cellText}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {slide.table.afterTableHtml && (
                <div dangerouslySetInnerHTML={{ __html: slide.table.afterTableHtml }} />
              )}
            </div>
          )}
        </div>
      );

    case 'steps':
      return (
        <div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: 16 }}>{slide.title}</h2>
          <div style={{ marginTop: 8 }}>
            {slide.steps?.map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                  padding: '12px 0',
                  borderBottom: '1px dashed var(--line)',
                }}
              >
                <div
                  style={{
                    flex: '0 0 34px',
                    height: 34,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: '#1a1205',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <b style={{ display: 'block', marginBottom: 2 }}>{step.title}</b>
                  <span style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{step.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'pyramid':
      return <Pyramid tiers={slide.pyramid || []} onLight={onPyramidLight} title={slide.title} remoteLit={pyramidLit} />;

    case 'quiz':
      return <QuizComponent slide={slide} onSelect={onQuizSelect} />;

    case 'takeaway':
      return (
        <div>
          <h1 style={{ fontSize: '1.9rem', marginBottom: 18 }}>{slide.title}</h1>
          <div
            className="story-box"
            style={{ fontSize: '1.2rem', textAlign: 'center' }}
            dangerouslySetInnerHTML={{ __html: slide.takeaway || '' }}
          />
          <p style={{ fontSize: '1.12rem', color: 'var(--muted)', lineHeight: 1.8, textAlign: 'center', marginTop: 22 }}>
            ☕ 下次報告前，想想小美和她的那句話。
          </p>
        </div>
      );

    default:
      return null;
  }
}

function Pyramid({
  tiers,
  onLight,
  title,
  remoteLit,
}: {
  tiers: NonNullable<Slide['pyramid']>;
  onLight?: (idx: number) => void;
  title: string;
  /** When provided, lit state is driven by admin (read-only on this client). */
  remoteLit?: number[];
}) {
  const isControlled = Array.isArray(remoteLit);
  const [localLit, setLocalLit] = useState<Set<number>>(new Set());
  const lit = isControlled ? new Set(remoteLit) : localLit;

  const [message, setMessage] = useState('');
  const [lastClicked, setLastClicked] = useState<number | null>(null);

  useEffect(() => {
    if (!isControlled) return;
    // Compute message from remote lit
    const ordered = tiers.filter((_, i) => remoteLit.includes(i));
    if (ordered.length === 0) {
      setMessage('');
    } else if (ordered.length >= tiers.length) {
      setMessage('✅ 完整的金字塔：上層統整下層，同層不重疊、不遺漏');
    } else {
      setMessage(ordered[ordered.length - 1].message);
    }
  }, [remoteLit, tiers, isControlled]);

  function light(i: number) {
    if (isControlled) return; // admin-controlled, do nothing locally
    const newLit = new Set(localLit);
    newLit.add(i);
    setLocalLit(newLit);
    setLastClicked(i);
    setTimeout(() => setLastClicked(null), 600);
    setMessage(tiers[i].message);
    if (newLit.size === tiers.length) {
      setMessage('✅ 完整的金字塔：上層統整下層，同層不重疊、不遺漏');
    }
    onLight?.(i);
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.7rem', marginBottom: 16 }}>{title}</h2>
      <p style={{ fontSize: '1.12rem', color: 'var(--muted)', lineHeight: 1.8, textAlign: 'center', marginBottom: 16 }}>
        {isControlled ? '金字塔，從頂端往下的思考邏輯' : '點一下金字塔，從頂端往下點燈 👇'}
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          marginTop: 24,
        }}
      >
        {tiers.map((tier, i) => {
          const justClicked = !isControlled && lastClicked === i;
          const isLit = lit.has(i);
          const styles: React.CSSProperties = {
            padding: 14,
            borderRadius: 8,
            textAlign: 'center',
            fontWeight: 600,
            transition: 'all .4s ease',
            opacity: isLit ? 1 : 0.35,
            transform: isLit ? 'scale(1)' : 'scale(0.96)',
            cursor: isControlled ? 'default' : 'pointer',
            width: ['52%', '72%', '92%'][i],
            background: i === 0 ? 'var(--accent)' : i === 1 ? '#3a4155' : '#262c3c',
            color: i === 0 ? '#1a1205' : i === 2 ? 'var(--muted)' : 'var(--ink)',
          };
          return (
            <div
              key={i}
              style={styles}
              onClick={() => light(i)}
              className={
                justClicked
                  ? 'animate__animated animate__rubberBand'
                  : isControlled && isLit
                    ? 'animate__animated animate__fadeIn'
                    : undefined
              }
            >
              {tier.label}
            </div>
          );
        })}
      </div>
      <p
        style={{ color: 'var(--accent)', marginTop: 8, fontWeight: 600, minHeight: 28, textAlign: 'center' }}
        className={message ? 'animate__animated animate__fadeIn' : undefined}
      >
        {message}
      </p>
    </div>
  );
}

function QuizComponent({ slide, onSelect }: { slide: Slide; onSelect?: (idx: number, correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  if (!slide.quiz) return null;
  const quiz = slide.quiz;

  function select(idx: number, correct: boolean) {
    if (selected !== null) return;
    setSelected(idx);
    setMessage(correct ? quiz.correctMessage : quiz.wrongMessage);
    onSelect?.(idx, correct);
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.7rem', marginBottom: 16 }}>{slide.title}</h2>
      <p style={{ fontSize: '1.12rem', color: 'var(--muted)', lineHeight: 1.8, marginBottom: 16 }}>
        {quiz.question}
      </p>
      <div style={{ marginTop: 20 }}>
        {quiz.options.map((opt, i) => {
          const isSelected = selected === i;
          const styles: React.CSSProperties = {
            display: 'block',
            width: '100%',
            textAlign: 'left',
            background: 'var(--card)',
            border: `1px solid ${
              isSelected ? (opt.correct ? 'var(--good)' : 'var(--bad)') : 'var(--line)'
            }`,
            color: 'var(--ink)',
            borderRadius: 8,
            padding: '14px 18px',
            margin: '10px 0',
            fontSize: '1rem',
            cursor: selected === null ? 'pointer' : 'default',
            transition: 'all .2s',
            fontFamily: 'inherit',
            position: 'relative',
          };
          return (
            <button
              key={i}
              style={styles}
              onClick={() => select(i, opt.correct)}
              className={`animate__animated animate__fadeInUp animate__faster${
                isSelected ? ' animate__pulse' : ''
              }`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
      <p
        className={message ? 'animate__animated animate__headShake' : undefined}
        style={{ color: 'var(--accent)', marginTop: 8, fontWeight: 600, minHeight: 28 }}
      >
        {message}
      </p>
    </div>
  );
}
