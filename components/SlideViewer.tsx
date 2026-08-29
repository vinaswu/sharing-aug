'use client';

import { useState, useEffect } from 'react';
import type { Slide, QuizData, TierData, SlideBlock, SlideBackground } from '@/lib/types';
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
  /**
   * Which side of the slide to render:
   *  - 'front' (default): audience-facing content
   *  - 'back' : presenter/admin-facing content with a subtle "back view" badge
   */
  mode?: 'front' | 'back';
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

/** Pick the right side of every sided field on the slide. */
function pickSide<T>(sided: { front: T; back: T } | undefined, mode: 'front' | 'back'): T | undefined {
  return sided ? sided[mode] : undefined;
}

export default function SlideViewer({
  slide,
  slideNumber,
  totalSlides,
  mode = 'front',
  onQuizSelect,
  onPyramidLight,
  remoteCursors,
  pyramidLit,
}: Props) {
  const animClass = SLIDE_ANIMATION_MAP[slide.type] ?? 'animate__fadeIn animate__slow';
  const isBack = mode === 'back';
  const scriptBack = isBack ? slide.script?.back : '';
  const hasScript = Boolean(scriptBack && scriptBack.trim().length > 0);

  // Element-style slides: when `blocks` is present, render those instead of
  // the legacy type-specific layout. This is what the Builder produces.
  const useBlocks = Array.isArray(slide.blocks) && slide.blocks.length > 0;

  return (
    <div
      key={slide.id}
      className={`animate__animated ${animClass}`}
      style={{
        width: 'min(880px, 92vw)',
        position: 'relative',
        // Subtle visual cue that this is the admin/presenter view.
        borderLeft: isBack ? '3px solid var(--accent)' : '3px solid transparent',
        paddingLeft: isBack ? 14 : 0,
        ...buildBackgroundStyle(slide.background),
      }}
    >
      {isBack && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            right: 0,
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            color: 'var(--accent)',
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: '2px 8px',
            fontWeight: 700,
            zIndex: 2,
          }}
        >
          後台視圖 · BACK
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: hasScript ? 'minmax(0, 1fr) 280px' : '1fr',
          gap: hasScript ? 20 : 0,
          alignItems: 'start',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ minWidth: 0 }}>
          {useBlocks ? (
            <BlockList blocks={slide.blocks!} mode={mode} />
          ) : (
            <>
              {slide.kicker && <div className="kicker">{pickSide(slide.kicker, mode)}</div>}
              {renderSlide(slide, mode, onQuizSelect, onPyramidLight, pyramidLit)}
            </>
          )}

          <CursorOverlay cursors={remoteCursors || []} />

          {totalSlides > 0 && (
            <div style={{ marginTop: 28, color: 'var(--muted)', fontSize: '0.78rem', textAlign: 'center' }}>
              {slideNumber + 1} / {totalSlides}
            </div>
          )}
        </div>

        {hasScript && <ScriptPanel text={scriptBack!} />}
      </div>
    </div>
  );
}

/**
 * Build the CSS style object for a slide background. Supports a solid color,
 * a background image, and a tint/dim overlay drawn on top of the image.
 */
function buildBackgroundStyle(bg?: SlideBackground): React.CSSProperties {
  if (!bg) return {};
  const style: React.CSSProperties = {
    borderRadius: bg.radius || 12,
    padding: bg.padding || '28px 32px',
  };
  if (bg.image) {
    style.backgroundImage = `url(${bg.image})`;
    style.backgroundSize = bg.size || 'cover';
    style.backgroundPosition = bg.position || 'center';
    style.backgroundRepeat = bg.repeat || 'no-repeat';
  }
  if (bg.color && !bg.image) {
    style.background = bg.color;
  }
  if (bg.overlay) {
    // Draw the overlay on top of the image (or color) using a pseudo-layer.
    // We use a box-shadow inset trick is unreliable, so we layer with an
    // extra backgroundImage entry when an image is present.
    if (bg.image) {
      style.backgroundImage = `linear-gradient(${bg.overlay}, ${bg.overlay}), url(${bg.image})`;
    } else {
      style.background = bg.color ? `linear-gradient(${bg.overlay}, ${bg.overlay}), ${bg.color}` : bg.overlay;
    }
  }
  return style;
}

/** Merge a BlockStyle object + inline CSS string into a React style object. */
export function blockStyleToProps(b: SlideBlock): React.CSSProperties {
  const s2 = b.style2;
  const style: React.CSSProperties = {};
  if (s2) {
    if (s2.fontSize) style.fontSize = s2.fontSize;
    if (s2.fontWeight) style.fontWeight = Number(s2.fontWeight) || (s2.fontWeight as any);
    if (s2.fontStyle) style.fontStyle = s2.fontStyle;
    if (s2.color) style.color = s2.color;
    if (s2.textAlign) style.textAlign = s2.textAlign;
    if (s2.lineHeight) style.lineHeight = s2.lineHeight;
    if (s2.letterSpacing) style.letterSpacing = s2.letterSpacing;
    if (s2.textTransform) style.textTransform = s2.textTransform;
    if (s2.textShadow) style.textShadow = s2.textShadow;
    if (s2.background) style.background = s2.background;
    if (s2.border) style.border = s2.border;
    if (s2.borderRadius) style.borderRadius = s2.borderRadius;
    if (s2.padding) style.padding = s2.padding;
    if (s2.boxShadow) style.boxShadow = s2.boxShadow;
    if (typeof s2.opacity === 'number') style.opacity = s2.opacity;
    if (s2.transform) style.transform = s2.transform;
  }
  if (b.style) {
    // Parse the legacy inline "key: value; key: value" string.
    b.style.split(';').forEach((decl) => {
      const idx = decl.indexOf(':');
      if (idx < 0) return;
      const key = decl.slice(0, idx).trim();
      const val = decl.slice(idx + 1).trim();
      if (!key || !val) return;
      const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      (style as any)[camel] = val;
    });
  }
  return style;
}

/** CSS for absolutely positioned blocks. */
export function absolutePosStyle(b: SlideBlock): React.CSSProperties {
  if (b.layout !== 'absolute' || !b.pos) return { position: 'relative' };
  const u = b.pos.unit === 'px' ? 'px' : '%';
  return {
    position: 'absolute',
    left: `${b.pos.x}${u}`,
    top: `${b.pos.y}${u}`,
    width: b.width || undefined,
    height: b.height || undefined,
    zIndex: b.zIndex ?? 1,
  };
}

/**
 * Render a list of element-style blocks (the Builder's output). Each block
 * picks its front/back content based on `mode`. Blocks with `layout:
 * 'absolute'` are positioned freely on the slide surface; the rest stack
 * vertically in a flow column.
 */
function BlockList({ blocks, mode }: { blocks: SlideBlock[]; mode: 'front' | 'back' }) {
  const flow = blocks.filter((b) => b.layout !== 'absolute');
  const abs = blocks.filter((b) => b.layout === 'absolute');

  const renderOne = (b: SlideBlock) => {
    const content = mode === 'back' ? b.back : b.front;
    const base = blockStyleToProps(b);
    if (b.type === 'image') {
      return (
        <img
          src={b.src}
          alt={b.alt || ''}
          style={{
            ...base,
            width: b.width || '100%',
            height: b.height || undefined,
            maxWidth: '100%',
            borderRadius: (base.borderRadius as string) || 8,
            display: 'block',
          }}
        />
      );
    }
    if (b.type === 'html') {
      return (
        <div
          className={b.style2 || b.style ? undefined : 'story-box'}
          style={b.style2 || b.style ? base : { ...base, borderLeft: '4px solid var(--accent)' }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    // text
    return (
      <div
        style={{
          whiteSpace: 'pre-wrap',
          lineHeight: 1.8,
          fontSize: '1.05rem',
          color: 'var(--ink)',
          ...base,
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {flow.map((b) => (
          <div key={b.id}>{renderOne(b)}</div>
        ))}
      </div>
      {abs.map((b) => (
        <div key={b.id} style={absolutePosStyle(b)}>
          {renderOne(b)}
        </div>
      ))}
    </>
  );
}

function ScriptPanel({ text }: { text: string }) {
  return (
    <aside
      className="script-panel"
      style={{
        position: 'sticky',
        top: 16,
        maxHeight: 'calc(100vh - 48px)',
        overflowY: 'auto',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 6,
        padding: '14px 16px',
        fontSize: '0.88rem',
        lineHeight: 1.7,
        color: 'var(--ink)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.12em',
          color: 'var(--accent)',
          fontWeight: 700,
          marginBottom: 12,
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>📝</span> 講者讀稿
      </div>
      {text.split('\n').map((line, i) => {
        // Section headers like 【標題】
        if (line.startsWith('【') && line.endsWith('】')) {
          return (
            <div
              key={i}
              style={{
                fontWeight: 700,
                color: 'var(--accent)',
                marginTop: 14,
                marginBottom: 6,
                fontSize: '0.92rem',
                fontFamily: 'inherit',
                borderBottom: '1px solid var(--line)',
                paddingBottom: 4,
              }}
            >
              {line}
            </div>
          );
        }
        // Bullet points like →
        if (line.startsWith('→')) {
          return (
            <div
              key={i}
              style={{
                marginLeft: 8,
                marginBottom: 4,
                fontFamily: 'inherit',
              }}
            >
              <span style={{ color: 'var(--accent)', marginRight: 6 }}>→</span>
              {line.slice(1)}
            </div>
          );
        }
        // Numbered items like 1. 2.
        if (/^\d+\.\s/.test(line)) {
          return (
            <div
              key={i}
              style={{
                marginLeft: 8,
                marginBottom: 4,
                fontFamily: 'inherit',
              }}
            >
              {line}
            </div>
          );
        }
        // Empty lines
        if (line.trim() === '') {
          return <div key={i} style={{ height: 6 }} />;
        }
        // Regular text
        return (
          <div
            key={i}
            style={{
              fontFamily: 'inherit',
              whiteSpace: 'pre-wrap',
            }}
          >
            {line}
          </div>
        );
      })}
    </aside>
  );
}

function renderSlide(
  slide: Slide,
  mode: 'front' | 'back',
  onQuizSelect?: (idx: number, correct: boolean) => void,
  onPyramidLight?: (idx: number) => void,
  pyramidLit?: number[]
) {
  const title = pickSide(slide.title, mode) ?? '';
  const sidedStory = pickSide(slide.story, mode);
  const sidedTable = pickSide(slide.table, mode);
  const sidedSteps = pickSide(slide.steps, mode);
  const sidedPyramid = pickSide(slide.pyramid, mode);
  const sidedQuiz = pickSide(slide.quiz, mode);
  const sidedTakeaway = pickSide(slide.takeaway, mode);

  switch (slide.type) {
    case 'cover':
      return (
        <div>
          <h1 style={{ fontSize: '2.3rem', lineHeight: 1.3, marginBottom: 18 }}>
            {title.split('<br>').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p style={{ fontSize: '1.12rem', color: 'var(--muted)', lineHeight: 1.8 }}>
            一個顧問花了三十年才學會的說話方式——
            <br />
            今天用一個杯麵的時間，講給你聽。
          </p>
        </div>
      );

    case 'story':
      return (
        <div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: 16 }}>{title}</h2>
          <div className="story-box" dangerouslySetInnerHTML={{ __html: sidedStory || '' }} />
        </div>
      );

    case 'table':
      return (
        <div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: 16 }}>{title}</h2>
          {sidedTable && (
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
                    {sidedTable.headers.map((h, i) => (
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
                  {sidedTable.rows.map((row, ri) => (
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
              {sidedTable.afterTableHtml && (
                <div dangerouslySetInnerHTML={{ __html: sidedTable.afterTableHtml }} />
              )}
            </div>
          )}
        </div>
      );

    case 'steps':
      return (
        <div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: 16 }}>{title}</h2>
          <div style={{ marginTop: 8 }}>
            {sidedSteps?.map((step, i) => (
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: 'block', marginBottom: 2 }}>{step.title}</b>
                  {mode === 'back' && step.noteRows && step.noteRows.length > 0 ? (
                    <table
                      style={{
                        marginTop: 6,
                        borderCollapse: 'collapse',
                        width: '100%',
                        maxWidth: 640,
                        fontSize: '0.9rem',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                      }}
                    >
                      <tbody>
                        {step.noteRows.map((row, ri) => (
                          <tr key={ri}>
                            <td
                              style={{
                                padding: '6px 12px 6px 0',
                                borderTop: '1px solid var(--line)',
                                borderBottom:
                                  ri === step.noteRows!.length - 1 ? '1px solid var(--line)' : 'none',
                                color: 'var(--accent)',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                verticalAlign: 'top',
                                width: '38%',
                              }}
                            >
                              {row.label}
                            </td>
                            <td
                              style={{
                                padding: '6px 0',
                                borderTop: '1px solid var(--line)',
                                borderBottom:
                                  ri === step.noteRows!.length - 1 ? '1px solid var(--line)' : 'none',
                                color: 'var(--muted)',
                                lineHeight: 1.55,
                                verticalAlign: 'top',
                              }}
                            >
                              {row.detail}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : mode === 'back' && step.noteLines && step.noteLines.length > 0 ? (
                    <ul
                      style={{
                        marginTop: 6,
                        marginBottom: 0,
                        paddingLeft: 0,
                        listStyle: 'none',
                        borderLeft: '2px solid var(--accent)',
                        background: 'rgba(245, 185, 66, 0.06)',
                      }}
                    >
                      {step.noteLines.map((line, li) => (
                        <li
                          key={li}
                          style={{
                            padding: '6px 12px',
                            color: 'var(--ink)',
                            fontSize: '0.92rem',
                            lineHeight: 1.65,
                            borderBottom:
                              li === step.noteLines!.length - 1 ? 'none' : '1px dashed var(--line)',
                          }}
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : mode === 'back' && step.note ? (
                    <div
                      style={{
                        marginTop: 4,
                        color: 'var(--muted)',
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                        padding: '6px 10px',
                        borderLeft: '2px solid var(--accent)',
                        background: 'rgba(245, 185, 66, 0.06)',
                      }}
                    >
                      {step.note}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{step.description}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'pyramid':
      return (
        <Pyramid
          tiers={sidedPyramid || []}
          onLight={onPyramidLight}
          title={title}
          remoteLit={pyramidLit}
        />
      );

    case 'quiz':
      return sidedQuiz ? (
        <QuizComponent title={title} quiz={sidedQuiz} onSelect={onQuizSelect} />
      ) : null;

    case 'takeaway':
      return (
        <div>
          <h1 style={{ fontSize: '1.9rem', marginBottom: 18 }}>{title}</h1>
          <div
            className="story-box"
            style={{ fontSize: '1.2rem', textAlign: 'center' }}
            dangerouslySetInnerHTML={{ __html: sidedTakeaway || '' }}
          />
          <p style={{ fontSize: '1.12rem', color: 'var(--muted)', lineHeight: 1.8, textAlign: 'center', marginTop: 22 }}>
            � 下次報告前，想想小美和她的那句話。
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
  tiers: TierData[];
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

function QuizComponent({
  title,
  quiz,
  onSelect,
}: {
  title: string;
  quiz: QuizData;
  onSelect?: (idx: number, correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  function select(idx: number, correct: boolean) {
    if (selected !== null) return;
    setSelected(idx);
    setMessage(correct ? quiz.correctMessage : quiz.wrongMessage);
    onSelect?.(idx, correct);
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.7rem', marginBottom: 16 }}>{title}</h2>
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
