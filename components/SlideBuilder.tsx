'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Slide, SlideBlock, SlideBackground } from '@/lib/types';
import SlideViewer, { blockStyleToProps, absolutePosStyle } from './SlideViewer';
import { SLIDES } from '@/lib/slides-data';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function newId(prefix = 's') {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

function blankSlide(): Slide {
  return {
    id: newId(),
    type: 'story',
    title: { front: '', back: '' },
    blocks: [
      { id: newId('b'), type: 'text', front: '在這裡輸入文字…', back: '在這裡輸入文字…' },
    ],
  };
}

function blankBlock(type: SlideBlock['type']): SlideBlock {
  const base: SlideBlock = { id: newId('b'), type, front: '', back: '' };
  if (type === 'image') {
    return { ...base, src: '', alt: '', width: '100%' };
  }
  if (type === 'html') {
    return { ...base, front: '<p>HTML 內容…</p>', back: '<p>HTML 內容…</p>' };
  }
  return { ...base, front: '文字內容…', back: '文字內容…' };
}

/** Put a block into free (absolute) mode at a starting position. */
function makeAbsolute(b: SlideBlock, x = 8, y = 8): SlideBlock {
  return {
    ...b,
    layout: 'absolute',
    pos: b.pos ?? { x, y, unit: 'percent' },
    width: b.width || '40%',
    zIndex: b.zIndex ?? 1,
  };
}

/**
 * Deep-copy the built-in deck so editing it never mutates the SLIDES constant,
 * and give every slide fresh ids (the builder keys React state by id).
 */
function cloneBuiltInDeck(): Slide[] {
  const copy: Slide[] = JSON.parse(JSON.stringify(SLIDES));
  return copy.map((s) => ({ ...s, id: newId() }));
}

/** Convert a legacy (type-based) slide into an element-style slide with blocks. */
function legacyToBlocks(slide: Slide): Slide[] {
  const blocks: SlideBlock[] = [];
  const push = (type: SlideBlock['type'], front: string, back: string, extra?: Partial<SlideBlock>) => {
    blocks.push({ id: newId('b'), type, front, back, ...extra });
  };

  // Kicker (small accent text)
  if (slide.kicker) {
    push('text', slide.kicker.front, slide.kicker.back, {
      style2: {
        color: 'var(--accent)',
        fontSize: '0.78rem',
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: 14,
      },
    });
  }
  // Title (large heading)
  if (slide.title) {
    const isCover = slide.type === 'cover';
    push('text', slide.title.front, slide.title.back, {
      style2: {
        fontSize: isCover ? '2.8rem' : '2.4rem',
        fontWeight: '800',
        lineHeight: '1.2',
        marginBottom: 18,
      },
    });
  }

  switch (slide.type) {
    case 'cover':
      if (slide.story) {
        push('html', slide.story.front, slide.story.back, {
          style2: {
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'left',
          },
        });
      }
      break;
    case 'story':
      if (slide.story) push('html', slide.story.front, slide.story.back);
      break;
    case 'takeaway':
      if (slide.takeaway) {
        push('html', slide.takeaway.front, slide.takeaway.back, {
          style2: {
            maxWidth: '700px',
            margin: '0 auto',
            textAlign: 'left',
          },
        });
      }
      break;
    case 'table':
      if (slide.table) {
        const t = slide.table.front;
        const html = buildTableHtml(t.headers, t.rows);
        push('html', html, buildTableHtml(slide.table.back.headers, slide.table.back.rows));
      }
      break;
    case 'steps':
      if (slide.steps) {
        const s = slide.steps.front;
        const html = buildStepsHtml(s);
        push('html', html, buildStepsHtml(slide.steps.back));
      }
      break;
    case 'pyramid':
      if (slide.pyramid) {
        const p = slide.pyramid.front;
        const html = p.map((tier, i) => `<div style="padding:14px;border-radius:8px;text-align:center;font-weight:600;margin:8px 0;width:${[52, 72, 92][i] || 92}%;background:${i === 0 ? 'var(--accent)' : i === 1 ? '#3a4155' : '#262c3c'};color:${i === 0 ? '#1a1205' : 'var(--ink)'}">${tier.label}</div>`).join('');
        push('html', html, html);
      }
      break;
    case 'quiz':
      if (slide.quiz) {
        const q = slide.quiz.front;
        const html = `<p>${q.question}</p>` + q.options.map((o, i) => `<div style="padding:14px 18px;border:1px solid var(--line);border-radius:8px;margin:10px 0;background:var(--card)">${String.fromCharCode(65 + i)}. ${o.text}</div>`).join('');
        push('html', html, html);
      }
      break;
  }

  return [{ ...slide, blocks }];
}

function buildTableHtml(headers: string[], rows: (string | { text: string; span?: number; style?: string })[][]): string {
  const cellText = (c: string | { text: string }) => (typeof c === 'string' ? c : c.text);
  const ths = headers.map((h) => `<th style="padding:12px 14px;text-align:left;border-bottom:1px solid var(--line);color:var(--accent);font-weight:700">${h}</th>`).join('');
  const trs = rows
    .map((row) => `<tr>${row.map((c, ci) => `<td style="padding:12px 14px;border-bottom:1px solid var(--line);${ci === 0 ? 'font-weight:600' : ''}">${cellText(c)}</td>`).join('')}</tr>`)
    .join('');
  return `<table style="width:100%;border-collapse:collapse;margin-top:16px"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function buildStepsHtml(steps: { title: string; description: string }[]): string {
  return steps
    .map((s, i) => `<div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px dashed var(--line)"><div style="flex:0 0 34px;height:34px;border-radius:50%;background:var(--accent);color:#1a1205;font-weight:800;display:flex;align-items:center;justify-content:center">${i + 1}</div><div><b>${s.title}</b><br/><span style="color:var(--muted)">${s.description}</span></div></div>`)
    .join('');
}

// ---------------------------------------------------------------------------
// Small form primitives
// ---------------------------------------------------------------------------

const labelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  letterSpacing: '0.1em',
  color: 'var(--muted)',
  fontWeight: 700,
  marginBottom: 6,
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--line)',
  color: 'var(--ink)',
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  outline: 'none',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 72,
  resize: 'vertical',
  lineHeight: 1.6,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  );
}

function smallBtnStyle(color: string): React.CSSProperties {
  return {
    background: 'transparent',
    border: `1px solid ${color}`,
    color,
    borderRadius: 5,
    padding: '3px 9px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  };
}

function miniBtnStyle(disabled: boolean, color = 'var(--line)'): React.CSSProperties {
  return {
    background: 'transparent',
    border: `1px solid ${color}`,
    color,
    borderRadius: 4,
    padding: '1px 6px',
    fontSize: '0.72rem',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    fontFamily: 'inherit',
    lineHeight: 1.4,
  };
}

// ---------------------------------------------------------------------------
// Background editor
// ---------------------------------------------------------------------------

function BackgroundEditor({
  bg,
  onChange,
}: {
  bg: SlideBackground | undefined;
  onChange: (bg: SlideBackground) => void;
}) {
  const current = bg ?? {};
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12, marginBottom: 14, background: 'rgba(0,0,0,.15)' }}>
      <div style={{ ...labelStyle, marginBottom: 10 }}>背景</div>
      <Field label="底色">
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="color"
            value={current.color && current.color.startsWith('#') ? current.color : '#0f1115'}
            onChange={(e) => onChange({ ...current, color: e.target.value })}
            style={{ width: 40, height: 36, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}
          />
          <input
            value={current.color || ''}
            onChange={(e) => onChange({ ...current, color: e.target.value })}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="#0f1115 或 var(--bg)"
          />
        </div>
      </Field>
      <Field label="背景圖片 URL">
        <input
          value={current.image || ''}
          onChange={(e) => onChange({ ...current, image: e.target.value })}
          style={inputStyle}
          placeholder="https://… 或 /images/bg.jpg"
        />
      </Field>
      {current.image && (
        <>
          <Field label="圖片尺寸（background-size）">
            <select
              value={current.size || 'cover'}
              onChange={(e) => onChange({ ...current, size: e.target.value })}
              style={inputStyle}
            >
              <option value="cover">cover（填滿裁切）</option>
              <option value="contain">contain（完整顯示）</option>
              <option value="auto">auto（原始尺寸）</option>
              <option value="100% 100%">100% 100%（拉伸）</option>
            </select>
          </Field>
          <Field label="圖片位置（background-position）">
            <input
              value={current.position || ''}
              onChange={(e) => onChange({ ...current, position: e.target.value })}
              style={inputStyle}
              placeholder="center / center top / 20% 30%"
            />
          </Field>
          <Field label="圖片平鋪（background-repeat）">
            <select
              value={current.repeat || 'no-repeat'}
              onChange={(e) => onChange({ ...current, repeat: e.target.value })}
              style={inputStyle}
            >
              <option value="no-repeat">不平鋪</option>
              <option value="repeat">水平垂直平鋪</option>
              <option value="repeat-x">水平平鋪</option>
              <option value="repeat-y">垂直平鋪</option>
            </select>
          </Field>
        </>
      )}
      <Field label="圖片遮罩（overlay）">
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            value={current.overlay || ''}
            onChange={(e) => onChange({ ...current, overlay: e.target.value })}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="rgba(15,17,21,0.6)"
          />
          <button
            type="button"
            onClick={() => onChange({ ...current, overlay: 'rgba(15,17,21,0.6)' })}
            style={smallBtnStyle('var(--line)')}
            title="套用預設遮罩"
          >
            預設
          </button>
        </div>
      </Field>
      <div style={{ display: 'flex', gap: 8 }}>
        <Field label="圓角">
          <input
            value={current.radius || ''}
            onChange={(e) => onChange({ ...current, radius: e.target.value })}
            style={inputStyle}
            placeholder="12px"
          />
        </Field>
        <Field label="內距">
          <input
            value={current.padding || ''}
            onChange={(e) => onChange({ ...current, padding: e.target.value })}
            style={inputStyle}
            placeholder="28px 32px"
          />
        </Field>
      </div>
      {(current.color || current.image) && (
        <button type="button" onClick={() => onChange({})} style={smallBtnStyle('var(--bad)')}>
          清除背景
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block editor (single element)
// ---------------------------------------------------------------------------

function BlockEditor({
  block,
  onChange,
}: {
  block: SlideBlock;
  onChange: (b: SlideBlock) => void;
}) {
  const [locked, setLocked] = useState(true);

  const setSide = (side: 'front' | 'back', v: string) => {
    if (locked) onChange({ ...block, front: v, back: v });
    else if (side === 'front') onChange({ ...block, front: v });
    else onChange({ ...block, back: v });
  };

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12, marginBottom: 10, background: 'rgba(0,0,0,.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: '1.1rem' }}>{block.type === 'image' ? '🖼️' : block.type === 'html' ? '📝' : '🔤'}</span>
        <b style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{block.type}</b>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setLocked(!locked)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: locked ? 'var(--accent)' : 'var(--muted)',
            fontSize: '0.7rem',
            padding: 0,
            fontFamily: 'inherit',
          }}
          title={locked ? '前後內容同步（點擊解鎖獨立編輯）' : '前後獨立編輯（點擊同步）'}
        >
          {locked ? '🔗 同步' : '✂️ 獨立'}
        </button>
      </div>

      {block.type === 'image' && (
        <>
          <Field label="圖片 URL">
            <input value={block.src || ''} onChange={(e) => onChange({ ...block, src: e.target.value })} style={inputStyle} placeholder="https://… 或 /images/pic.jpg" />
          </Field>
          <Field label="Alt 文字">
            <input value={block.alt || ''} onChange={(e) => onChange({ ...block, alt: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="寬度">
            <input value={block.width || ''} onChange={(e) => onChange({ ...block, width: e.target.value })} style={inputStyle} placeholder="100% 或 320px" />
          </Field>
        </>
      )}

      {block.type !== 'image' && (
        <>
          <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginBottom: 3 }}>前台（觀眾）</div>
          {block.type === 'html' ? (
            <textarea value={block.front} onChange={(e) => setSide('front', e.target.value)} style={{ ...textareaStyle, minHeight: 90, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }} />
          ) : (
            <textarea value={block.front} onChange={(e) => setSide('front', e.target.value)} style={textareaStyle} />
          )}
          {!locked && (
            <>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginBottom: 3, marginTop: 8 }}>後台（講者）</div>
              {block.type === 'html' ? (
                <textarea value={block.back} onChange={(e) => setSide('back', e.target.value)} style={{ ...textareaStyle, minHeight: 90, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }} />
              ) : (
                <textarea value={block.back} onChange={(e) => setSide('back', e.target.value)} style={textareaStyle} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full block controls (style + layout panel)
// ---------------------------------------------------------------------------

function SelectCtl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        <option value="">（預設）</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

function BlockControls({
  block,
  onChange,
}: {
  block: SlideBlock;
  onChange: (b: SlideBlock) => void;
}) {
  const [open, setOpen] = useState(false);
  const s2 = block.style2 ?? {};
  const setS2 = (patch: Partial<SlideBlock['style2']>) =>
    onChange({ ...block, style2: { ...s2, ...patch } as SlideBlock['style2'] });

  const isAbs = block.layout === 'absolute';
  const pos = block.pos ?? { x: 8, y: 8, unit: 'percent' as const };
  const setPos = (patch: Partial<SlideBlock['pos']>) =>
    onChange({ ...block, pos: { ...pos, ...patch } });

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 8, marginBottom: 10, background: 'rgba(0,0,0,.15)', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          color: 'var(--ink)',
          cursor: 'pointer',
          padding: '9px 12px',
          fontSize: '0.8rem',
          fontWeight: 700,
          fontFamily: 'inherit',
        }}
      >
        <span>{open ? '▾' : '▸'}</span> 样式與位置
        <span style={{ flex: 1 }} />
        <span style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--muted)' }}>
          {isAbs ? `絕對定位 (${Math.round(pos.x)}, ${Math.round(pos.y)})` : '順序排列'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '4px 12px 12px' }}>
          {/* ---- Layout mode ---- */}
          <Field label="排列模式">
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => onChange({ ...block, layout: 'flow' })}
                style={smallBtnStyle(!isAbs ? 'var(--accent)' : 'var(--line)')}
              >
                ☰ 順序排列
              </button>
              <button
                type="button"
                onClick={() => onChange(makeAbsolute(block))}
                style={smallBtnStyle(isAbs ? 'var(--accent)' : 'var(--line)')}
              >
                ✛ 自由拖動
              </button>
            </div>
          </Field>

          {isAbs && (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                <Field label="X">
                  <input
                    type="number"
                    value={Math.round(pos.x * 10) / 10}
                    onChange={(e) => setPos({ x: Number(e.target.value) || 0 })}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Y">
                  <input
                    type="number"
                    value={Math.round(pos.y * 10) / 10}
                    onChange={(e) => setPos({ y: Number(e.target.value) || 0 })}
                    style={inputStyle}
                  />
                </Field>
                <Field label="單位">
                  <select
                    value={pos.unit || 'percent'}
                    onChange={(e) => setPos({ unit: e.target.value as 'percent' | 'px' })}
                    style={inputStyle}
                  >
                    <option value="percent">%</option>
                    <option value="px">px</option>
                  </select>
                </Field>
              </div>
              <Field label="快速對齊">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[
                    { l: '↖ 左上', x: 4, y: 4 },
                    { l: '↑ 上中', x: 25, y: 4 },
                    { l: '↗ 右上', x: 60, y: 4 },
                    { l: '← 左', x: 4, y: 40 },
                    { l: '◎ 置中', x: 25, y: 38 },
                    { l: '→ 右', x: 60, y: 40 },
                    { l: '↙ 左下', x: 4, y: 76 },
                    { l: '↓ 下中', x: 25, y: 76 },
                    { l: '↘ 右下', x: 60, y: 76 },
                  ].map((p) => (
                    <button key={p.l} type="button" onClick={() => setPos({ x: p.x, y: p.y })} style={miniBtnStyle(false)}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </Field>
              <div style={{ display: 'flex', gap: 8 }}>
                <Field label="寬度">
                  <input value={block.width || ''} onChange={(e) => onChange({ ...block, width: e.target.value })} style={inputStyle} placeholder="40% / 320px" />
                </Field>
                <Field label="高度">
                  <input value={block.height || ''} onChange={(e) => onChange({ ...block, height: e.target.value })} style={inputStyle} placeholder="auto / 200px" />
                </Field>
                <Field label="層級 z">
                  <input
                    type="number"
                    value={block.zIndex ?? 1}
                    onChange={(e) => onChange({ ...block, zIndex: Number(e.target.value) || 1 })}
                    style={inputStyle}
                  />
                </Field>
              </div>
            </>
          )}
          {!isAbs && (
            <Field label="寬度（順序排列時）">
              <input value={block.width || ''} onChange={(e) => onChange({ ...block, width: e.target.value })} style={inputStyle} placeholder="100%" />
            </Field>
          )}

          {/* ---- Typography ---- */}
          <div style={{ ...labelStyle, margin: '14px 0 8px', borderTop: '1px dashed var(--line)', paddingTop: 12 }}>文字樣式</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Field label="字級">
              <input value={s2.fontSize || ''} onChange={(e) => setS2({ fontSize: e.target.value })} style={inputStyle} placeholder="1.5rem / 24px" />
            </Field>
            <SelectCtl
              label="字重"
              value={s2.fontWeight || ''}
              onChange={(v) => setS2({ fontWeight: v || undefined })}
              options={[
                { value: '300', label: '細 300' },
                { value: '400', label: '常规 400' },
                { value: '600', label: '半粗 600' },
                { value: '700', label: '粗 700' },
                { value: '900', label: '特粗 900' },
              ]}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Field label="顏色">
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="color"
                  value={s2.color && s2.color.startsWith('#') ? s2.color : '#ffffff'}
                  onChange={(e) => setS2({ color: e.target.value })}
                  style={{ width: 36, height: 34, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}
                />
                <input value={s2.color || ''} onChange={(e) => setS2({ color: e.target.value })} style={{ ...inputStyle, flex: 1 }} placeholder="var(--ink)" />
              </div>
            </Field>
            <SelectCtl
              label="對齊"
              value={s2.textAlign || ''}
              onChange={(v) => setS2({ textAlign: (v || undefined) as 'left' | 'center' | 'right' | undefined })}
              options={[
                { value: 'left', label: '左' },
                { value: 'center', label: '中' },
                { value: 'right', label: '右' },
              ]}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Field label="行高">
              <input value={s2.lineHeight || ''} onChange={(e) => setS2({ lineHeight: e.target.value })} style={inputStyle} placeholder="1.8" />
            </Field>
            <Field label="字距">
              <input value={s2.letterSpacing || ''} onChange={(e) => setS2({ letterSpacing: e.target.value })} style={inputStyle} placeholder="0.05em" />
            </Field>
            <SelectCtl
              label="大小寫"
              value={s2.textTransform || ''}
              onChange={(v) => setS2({ textTransform: (v || undefined) as 'uppercase' | 'capitalize' | undefined })}
              options={[
                { value: 'uppercase', label: '全大寫' },
                { value: 'capitalize', label: '首字母大寫' },
              ]}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <button type="button" onClick={() => setS2({ fontStyle: s2.fontStyle ? undefined : 'italic' })} style={smallBtnStyle(s2.fontStyle ? 'var(--accent)' : 'var(--line)')}>
              <i>I</i> 斜體
            </button>
            <Field label="透明度">
              <input
                type="range" min={0} max={1} step={0.05}
                value={s2.opacity ?? 1}
                onChange={(e) => setS2({ opacity: Number(e.target.value) })}
                style={{ width: 120 }}
              />
            </Field>
          </div>
          <Field label="文字陰影">
            <input value={s2.textShadow || ''} onChange={(e) => setS2({ textShadow: e.target.value })} style={inputStyle} placeholder="0 2px 8px rgba(0,0,0,.8)" />
          </Field>

          {/* ---- Box ---- */}
          <div style={{ ...labelStyle, margin: '14px 0 8px', borderTop: '1px dashed var(--line)', paddingTop: 12 }}>外框與背景</div>
          <Field label="背景色">
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="color"
                value={s2.background && s2.background.startsWith('#') ? s2.background : '#3a4155'}
                onChange={(e) => setS2({ background: e.target.value })}
                style={{ width: 36, height: 34, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}
              />
              <input value={s2.background || ''} onChange={(e) => setS2({ background: e.target.value })} style={{ ...inputStyle, flex: 1 }} placeholder="rgba(0,0,0,.4)" />
            </div>
          </Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <Field label="邊框">
              <input value={s2.border || ''} onChange={(e) => setS2({ border: e.target.value })} style={inputStyle} placeholder="1px solid var(--line)" />
            </Field>
            <Field label="圓角">
              <input value={s2.borderRadius || ''} onChange={(e) => setS2({ borderRadius: e.target.value })} style={inputStyle} placeholder="8px" />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Field label="內距">
              <input value={s2.padding || ''} onChange={(e) => setS2({ padding: e.target.value })} style={inputStyle} placeholder="12px 16px" />
            </Field>
            <Field label="陰影">
              <input value={s2.boxShadow || ''} onChange={(e) => setS2({ boxShadow: e.target.value })} style={inputStyle} placeholder="0 4px 16px rgba(0,0,0,.4)" />
            </Field>
          </div>
          <Field label="旋轉 / 變形（transform）">
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={s2.transform || ''} onChange={(e) => setS2({ transform: e.target.value })} style={{ ...inputStyle, flex: 1 }} placeholder="rotate(-3deg)" />
              <button type="button" onClick={() => setS2({ transform: 'rotate(-3deg)' })} style={miniBtnStyle(false)} title="左傾 3 度">-3°</button>
              <button type="button" onClick={() => setS2({ transform: 'rotate(3deg)' })} style={miniBtnStyle(false)} title="右傾 3 度">+3°</button>
            </div>
          </Field>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit canvas — drag surface for absolutely positioned blocks
// ---------------------------------------------------------------------------

function renderBlockPreview(b: SlideBlock, mode: 'front' | 'back') {
  const content = mode === 'back' ? b.back : b.front;
  const base = blockStyleToProps(b);
  if (b.type === 'image') {
    return b.src ? (
      <img
        src={b.src}
        alt={b.alt || ''}
        draggable={false}
        style={{ ...base, width: '100%', height: b.height || undefined, borderRadius: (base.borderRadius as string) || 8, display: 'block' }}
      />
    ) : (
      <div style={{ ...base, border: '1px dashed var(--line)', borderRadius: 8, padding: '18px 12px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>
        （請填入圖片 URL）
      </div>
    );
  }
  if (b.type === 'html') {
    return (
      <div
        style={{
          ...(b.style2 || b.style ? base : { borderLeft: '4px solid var(--accent)', padding: '10px 14px' }),
          wordBreak: 'break-word',
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return (
    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--ink)', wordBreak: 'break-word', ...base }}>
      {content || '（空文字）'}
    </div>
  );
}

function EditCanvas({
  slide,
  previewMode,
  selectedBlock,
  dragging,
  onSelectBlock,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  slide: Slide;
  previewMode: 'front' | 'back';
  selectedBlock: string | null;
  dragging: string | null;
  onSelectBlock: (id: string) => void;
  onPointerDown: (e: React.PointerEvent, slideId: string, block: SlideBlock) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}) {
  const bg = slide.background;
  const surfaceStyle: React.CSSProperties = {
    position: 'relative',
    minHeight: 'min(560px, 70vh)',
    borderRadius: bg?.radius || 12,
    padding: bg?.padding || '28px 32px',
    border: '1px solid var(--line)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };
  if (bg?.image) {
    surfaceStyle.backgroundImage = bg.overlay
      ? `linear-gradient(${bg.overlay}, ${bg.overlay}), url(${bg.image})`
      : `url(${bg.image})`;
    surfaceStyle.backgroundSize = bg.size || 'cover';
    surfaceStyle.backgroundPosition = bg.position || 'center';
    surfaceStyle.backgroundRepeat = (bg.repeat || 'no-repeat') as React.CSSProperties['backgroundRepeat'];
  } else if (bg?.color) {
    surfaceStyle.background = bg.color;
  } else {
    surfaceStyle.background = 'var(--card)';
  }

  const blocks = slide.blocks ?? [];
  const flow = blocks.filter((b) => b.layout !== 'absolute');
  const abs = blocks.filter((b) => b.layout === 'absolute');
  // Built-in (legacy) slides carry no `blocks` — the edit canvas would be a
  // blank card. Render a read-only preview of the legacy content instead.
  const isLegacy = blocks.length === 0;

  const wrapStyle = (b: SlideBlock, isAbs: boolean): React.CSSProperties => {
    const isDrag = dragging === b.id;
    const s: React.CSSProperties = isAbs
      ? { ...absolutePosStyle(b), cursor: isDrag ? 'grabbing' : 'grab', touchAction: 'none' as const }
      : { position: 'relative', marginBottom: 18 };
    return s;
  };

  const ringStyle = (): React.CSSProperties => {
    return {
      outline: 'var(--accent) solid 2px',
      outlineOffset: 3,
      borderRadius: 4,
    };
  };
  const idleRing: React.CSSProperties = { outline: '1px dashed rgba(128,128,128,.35)', outlineOffset: 3, borderRadius: 4 };

  return (
    <div style={surfaceStyle} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
      {isLegacy ? (
        <div style={{ position: 'relative' }}>
          <div style={{ pointerEvents: 'none' }}>
            <SlideViewer slide={slide} slideNumber={0} totalSlides={0} mode={previewMode} />
          </div>
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 5,
              background: 'var(--accent)',
              color: '#1a1205',
              fontSize: '0.68rem',
              fontWeight: 700,
              borderRadius: 6,
              padding: '3px 10px',
              pointerEvents: 'none',
            }}
          >
            內建頁面 · 唯讀預覽（按「匯入內建簡報」后可编辑）
          </div>
        </div>
      ) : (
      <>
      {flow.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {flow.map((b) => (
            <div
              key={b.id}
              style={wrapStyle(b, false)}
              onClick={(e) => { e.stopPropagation(); onSelectBlock(b.id); }}
            >
              <div style={selectedBlock === b.id ? ringStyle() : idleRing}>{renderBlockPreview(b, previewMode)}</div>
            </div>
          ))}
        </div>
      )}
      {abs.map((b) => (
        <div
          key={b.id}
          style={wrapStyle(b, true)}
          onPointerDown={(e) => onPointerDown(e, slide.id, b)}
          onClick={(e) => { e.stopPropagation(); onSelectBlock(b.id); }}
        >
          <div style={selectedBlock === b.id ? ringStyle() : idleRing}>
            {renderBlockPreview(b, previewMode)}
            {selectedBlock === b.id && (
              <div style={{ position: 'absolute', top: -10, right: -10, display: 'flex', gap: 2, alignItems: 'center', background: 'var(--accent)', color: '#1a1205', fontSize: '0.62rem', fontWeight: 700, borderRadius: 6, padding: '2px 6px', pointerEvents: 'none' }}>
                ✛ {Math.round(b.pos?.x ?? 0)}% , {Math.round(b.pos?.y ?? 0)}%
              </div>
            )}
          </div>
        </div>
      ))}
      </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Builder component
// ---------------------------------------------------------------------------

interface Props {
  roomId: string;
  slides: Slide[];
  onSave: (slides: Slide[]) => Promise<void>;
}

export default function SlideBuilder({ roomId, slides, onSave }: Props) {
  const [draft, setDraft] = useState<Slide[]>(slides);
  const [selectedId, setSelectedId] = useState<string | null>(slides[0]?.id ?? null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'front' | 'back'>('front');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  // Tracks whether the local draft has been touched since the last remote
  // sync. The `useEffect` below will refuse to overwrite local edits with a
  // later RTDB echo once this is true.
  const hasUserEdited = useRef(false);

  // Single place that flips `hasUserEdited` and marks the deck dirty.
  const markDirty = useCallback(() => {
    hasUserEdited.current = true;
    setDirty(true);
  }, []);

  // --- Drag state for free-placement canvas ---
  const dragState = useRef<{
    blockId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    rect: DOMRect;
  } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  // Keep draft in sync when the remote deck changes (e.g. first load).
  // `hasUserEdited` (declared above) guards against a later RTDB echo
  // overwriting in-progress edits.
  const remoteKey = useMemo(() => slides.map((s) => `${s.id}:${s.order}`).join(','), [slides]);
  const lastRemoteKey = useRef(remoteKey);
  useEffect(() => {
    if (remoteKey !== lastRemoteKey.current) {
      lastRemoteKey.current = remoteKey;
      if (!hasUserEdited.current) {
        setDraft(slides);
        setDirty(false);
      }
    }
  }, [remoteKey, slides]);

  const selected = draft.find((s) => s.id === selectedId) ?? null;

  // --- Deck operations -------------------------------------------------

  const addSlide = () => {
    const s = blankSlide();
    setDraft((d) => [...d, s]);
    setSelectedId(s.id);
    markDirty();
  };

  const duplicateSlide = (id: string) => {
    setDraft((d) => {
      const idx = d.findIndex((s) => s.id === id);
      if (idx < 0) return d;
      const copy: Slide = { ...JSON.parse(JSON.stringify(d[idx])), id: newId() };
      if (copy.blocks) copy.blocks = copy.blocks.map((b) => ({ ...b, id: newId('b') }));
      const next = [...d];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    markDirty();
  };

  const deleteSlide = (id: string) => {
    setDraft((d) => d.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
    markDirty();
  };

  const moveSlide = (id: string, dir: -1 | 1) => {
    setDraft((d) => {
      const idx = d.findIndex((s) => s.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= d.length) return d;
      const next = [...d];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    markDirty();
  };

  const updateSlide = (id: string, patch: Partial<Slide>) => {
    setDraft((d) => d.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    markDirty();
  };

  // --- Block operations ------------------------------------------------

  const addBlock = (slideId: string, type: SlideBlock['type']) => {
    const b = blankBlock(type);
    setDraft((d) =>
      d.map((s) => {
        if (s.id !== slideId) return s;
        const blocks = s.blocks ?? [];
        return { ...s, blocks: [...blocks, b] };
      })
    );
    setSelectedBlock(b.id);
    markDirty();
  };

  const updateBlock = (slideId: string, blockId: string, block: SlideBlock) => {
    setDraft((d) =>
      d.map((s) => {
        if (s.id !== slideId) return s;
        return { ...s, blocks: (s.blocks ?? []).map((b) => (b.id === blockId ? block : b)) };
      })
    );
    markDirty();
  };

  const deleteBlock = (slideId: string, blockId: string) => {
    setDraft((d) =>
      d.map((s) => {
        if (s.id !== slideId) return s;
        return { ...s, blocks: (s.blocks ?? []).filter((b) => b.id !== blockId) };
      })
    );
    if (selectedBlock === blockId) setSelectedBlock(null);
    markDirty();
  };

  /** Toggle a block between flow and free (absolute) placement. */
  const toggleBlockAbsolute = (slideId: string, blockId: string) => {
    setDraft((d) =>
      d.map((s) => {
        if (s.id !== slideId) return s;
        return {
          ...s,
          blocks: (s.blocks ?? []).map((b) => {
            if (b.id !== blockId) return b;
            return b.layout === 'absolute' ? { ...b, layout: 'flow' as const } : makeAbsolute(b);
          }),
        };
      })
    );
    markDirty();
  };

  // --- Pointer drag for absolutely positioned blocks -----------------------
  const onBlockPointerDown = (e: React.PointerEvent, slideId: string, block: SlideBlock) => {
    if (block.layout !== 'absolute') return;
    if ((e.target as HTMLElement).closest('input,textarea,select,button')) return;
    const surface = (e.currentTarget as HTMLElement).parentElement;
    if (!surface) return;
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    dragState.current = {
      blockId: block.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: block.pos?.x ?? 8,
      origY: block.pos?.y ?? 8,
      rect: surface.getBoundingClientRect(),
    };
    setDragging(block.id);
    setSelectedBlock(block.id);
  };

  const onBlockPointerMove = (e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d) return;
    const dxPct = ((e.clientX - d.startX) / d.rect.width) * 100;
    const dyPct = ((e.clientY - d.startY) / d.rect.height) * 100;
    let nx = d.origX + dxPct;
    let ny = d.origY + dyPct;
    // Snap to edges/center within ±2%.
    [0, 50, 100].forEach((g) => {
      if (Math.abs(nx - g) < 2) nx = g;
      if (Math.abs(ny - g) < 2) ny = g;
    });
    nx = Math.max(-10, Math.min(110, nx));
    ny = Math.max(-10, Math.min(110, ny));
    setDraft((prev) =>
      prev.map((s) =>
        (s.blocks ?? []).some((b) => b.id === d.blockId)
          ? {
              ...s,
              blocks: s.blocks!.map((b) =>
                b.id === d.blockId
                  ? { ...b, pos: { ...b.pos!, x: Math.round(nx * 10) / 10, y: Math.round(ny * 10) / 10 } }
                  : b
              ),
            }
          : s
      )
    );
    markDirty();
  };

  const onBlockPointerUp = (e: React.PointerEvent) => {
    if (dragState.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      dragState.current = null;
      setDragging(null);
    }
  };

  const moveBlock = (slideId: string, blockId: string, dir: -1 | 1) => {
    setDraft((d) =>
      d.map((s) => {
        if (s.id !== slideId) return s;
        const blocks = [...(s.blocks ?? [])];
        const idx = blocks.findIndex((b) => b.id === blockId);
        const target = idx + dir;
        if (idx < 0 || target < 0 || target >= blocks.length) return s;
        [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
        return { ...s, blocks };
      })
    );
    markDirty();
  };

  const importBuiltIn = () => {
    // Convert each built-in slide into element-style blocks. `cloneBuiltInDeck`
    // gives each slide a fresh id (so React keys stay unique) and keeps the
    // built-in SLIDES array immutable.
    const imported = cloneBuiltInDeck().map((s, i) => {
      const converted = legacyToBlocks(s);
      return { ...converted[0], order: i };
    });
    setDraft(imported);
    setSelectedId(imported[0]?.id ?? null);
    setSelectedBlock(null);
    markDirty();
  };

  const clearAll = () => {
    if (!window.confirm('確定要清空全部自訂投影片？這會讓觀眾端回到內建簡報。')) return;
    setDraft([]);
    setSelectedId(null);
    setSelectedBlock(null);
    markDirty();
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setSavedAt(Date.now());
      setDirty(false);
    } catch (err) {
      console.error('Save failed:', err);
      alert('儲存失敗，請檢查網路後再試');
    } finally {
      setSaving(false);
    }
  };

  // Ctrl/Cmd+S to save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // --- Render ----------------------------------------------------------

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 18px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--card)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent)' }}>🧱 Slide Builder</span>
        <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>房間：{roomId}</span>
        <div style={{ flex: 1 }} />
        {dirty && <span style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>● 未儲存</span>}
        {savedAt && !dirty && <span style={{ color: 'var(--good)', fontSize: '0.8rem' }}>✓ 已儲存</span>}
        <button type="button" onClick={importBuiltIn} style={smallBtnStyle('var(--line)')}>
          ⬇ 匯入內建簡報
        </button>
        <button type="button" onClick={clearAll} style={smallBtnStyle('var(--bad)')}>
          🗑 清空
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            background: 'var(--accent)',
            color: '#1a1205',
            border: 'none',
            borderRadius: 7,
            padding: '8px 22px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {saving ? '儲存中…' : '💾 儲存 (Ctrl+S)'}
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left: slide list + add */}
        <aside
          style={{
            width: 220,
            borderRight: '1px solid var(--line)',
            background: 'var(--card)',
            overflowY: 'auto',
            flexShrink: 0,
            padding: 14,
          }}
        >
          <div style={labelStyle}>投影片</div>
          <button
            type="button"
            onClick={addSlide}
            style={{
              width: '100%',
              background: 'var(--accent)',
              color: '#1a1205',
              border: 'none',
              borderRadius: 7,
              padding: '10px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 12,
              fontFamily: 'inherit',
            }}
          >
            ＋ 新增投影片
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {draft.map((s, i) => (
              <div
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                style={{
                  background: selectedId === s.id ? 'var(--accent)' : 'var(--bg)',
                  color: selectedId === s.id ? '#1a1205' : 'var(--ink)',
                  border: `1px solid ${selectedId === s.id ? 'var(--accent)' : 'var(--line)'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: '0.8rem' }}>{i + 1}</b>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{(s.blocks ?? []).length} 元素</span>
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.title?.front || s.blocks?.[0]?.front || '(無標題)'}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveSlide(s.id, -1); }} disabled={i === 0} style={miniBtnStyle(i === 0)} title="往前移">←</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveSlide(s.id, 1); }} disabled={i === draft.length - 1} style={miniBtnStyle(i === draft.length - 1)} title="往後移">→</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); duplicateSlide(s.id); }} style={miniBtnStyle(false)} title="複製">⧉</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); deleteSlide(s.id); }} style={miniBtnStyle(false, 'var(--bad)')} title="刪除">✕</button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: canvas (free-placement drag surface) */}
        <main
          style={{ flex: 1, minWidth: 0, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}
          onClick={() => setSelectedBlock(null)}
        >
          {selected ? (
            <div style={{ width: '100%', maxWidth: 860 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 6, textAlign: 'center' }}>
                ✛ 絕對定位的元素可直接以滑鼠拖曳（自動吸附邊界/中心）
              </div>
              <EditCanvas
                slide={selected}
                previewMode={previewMode}
                selectedBlock={selectedBlock}
                dragging={dragging}
                onSelectBlock={setSelectedBlock}
                onPointerDown={onBlockPointerDown}
                onPointerMove={onBlockPointerMove}
                onPointerUp={onBlockPointerUp}
              />
            </div>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>選擇或新增一張投影片開始編輯</div>
          )}
        </main>

        {/* Right: properties (background + blocks) */}
        <aside
          style={{
            width: 340,
            borderLeft: '1px solid var(--line)',
            background: 'var(--card)',
            overflowY: 'auto',
            flexShrink: 0,
            padding: 16,
          }}
        >
          {selected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <b style={{ fontSize: '0.95rem' }}>🎨 屬性</b>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>#{selected.id.slice(-4)}</span>
                <span style={{ flex: 1 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={previewMode === 'back'} onChange={(e) => setPreviewMode(e.target.checked ? 'back' : 'front')} />
                  預覽背面
                </label>
              </div>

              {/* Quick-select chips */}
              {(selected.blocks ?? []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {(selected.blocks ?? []).map((b, bi) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBlock(b.id)}
                      style={{
                        ...miniBtnStyle(false),
                        background: selectedBlock === b.id ? 'var(--accent)' : 'var(--bg)',
                        color: selectedBlock === b.id ? '#1a1205' : 'var(--ink)',
                      }}
                      title={`元素 ${bi + 1}`}
                    >
                      {bi + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Background */}
              <BackgroundEditor bg={selected.background} onChange={(bg) => updateSlide(selected.id, { background: bg })} />

              {/* Blocks */}
              <div style={{ ...labelStyle, marginBottom: 8 }}>元素（{(selected.blocks ?? []).length}）</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <button type="button" onClick={() => addBlock(selected.id, 'text')} style={smallBtnStyle('var(--accent)')}>🔤 文字</button>
                <button type="button" onClick={() => addBlock(selected.id, 'html')} style={smallBtnStyle('var(--accent)')}>📝 HTML</button>
                <button type="button" onClick={() => addBlock(selected.id, 'image')} style={smallBtnStyle('var(--accent)')}>🖼️ 圖片</button>
              </div>

              {(selected.blocks ?? []).map((b, bi) => (
                <div
                  key={b.id}
                  style={{
                    marginBottom: 10,
                    border: `1px solid ${selectedBlock === b.id ? 'var(--accent)' : 'var(--line)'}`,
                    borderRadius: 10,
                    padding: 10,
                    background: selectedBlock === b.id ? 'rgba(255,209,102,.06)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700 }}>#{bi + 1}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{b.type === 'image' ? '圖片' : b.type === 'html' ? 'HTML' : '文字'}</span>
                    {b.layout === 'absolute' && <span style={{ fontSize: '0.65rem', color: 'var(--accent)' }}>✛ 自由</span>}
                    <span style={{ flex: 1 }} />
                    <button type="button" onClick={() => toggleBlockAbsolute(selected.id, b.id)} style={miniBtnStyle(false)} title={b.layout === 'absolute' ? '改回順序排列' : '設為自由拖動'}>
                      ✛
                    </button>
                    <button type="button" onClick={() => moveBlock(selected.id, b.id, -1)} disabled={bi === 0} style={miniBtnStyle(bi === 0)} title="上移">↑</button>
                    <button type="button" onClick={() => moveBlock(selected.id, b.id, 1)} disabled={bi === (selected.blocks ?? []).length - 1} style={miniBtnStyle(bi === (selected.blocks ?? []).length - 1)} title="下移">↓</button>
                    <button type="button" onClick={() => deleteBlock(selected.id, b.id)} style={miniBtnStyle(false, 'var(--bad)')} title="刪除元素">✕</button>
                  </div>
                  <BlockEditor block={b} onChange={(nb) => updateBlock(selected.id, b.id, nb)} />
                  <BlockControls block={b} onChange={(nb) => updateBlock(selected.id, b.id, nb)} />
                </div>
              ))}

              {(selected.blocks ?? []).length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'center', padding: 12 }}>
                  尚無元素 — 從上方新增（文字／HTML／圖片）
                </p>
              )}
            </>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 20 }}>選一張投影片以編輯屬性</div>
          )}
        </aside>
      </div>
    </div>
  );
}
