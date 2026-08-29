'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Slide, SlideBlock, SlideBackground } from '@/lib/types';
import SlideViewer from './SlideViewer';
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

/** Convert a legacy (type-based) slide into an element-style slide with blocks. */
function legacyToBlocks(slide: Slide): Slide[] {
  const blocks: SlideBlock[] = [];
  const push = (type: SlideBlock['type'], front: string, back: string, extra?: Partial<SlideBlock>) => {
    blocks.push({ id: newId('b'), type, front, back, ...extra });
  };

  if (slide.kicker) push('text', slide.kicker.front, slide.kicker.back);
  if (slide.title) push('text', slide.title.front, slide.title.back);

  switch (slide.type) {
    case 'cover':
      if (slide.story) push('html', slide.story.front, slide.story.back);
      break;
    case 'story':
      if (slide.story) push('html', slide.story.front, slide.story.back);
      break;
    case 'takeaway':
      if (slide.takeaway) push('html', slide.takeaway.front, slide.takeaway.back);
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
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  // Keep draft in sync when the remote deck changes (e.g. first load).
  const remoteKey = useMemo(() => slides.map((s) => `${s.id}:${s.order}`).join(','), [slides]);
  const lastRemoteKey = useRef(remoteKey);
  useEffect(() => {
    if (remoteKey !== lastRemoteKey.current) {
      lastRemoteKey.current = remoteKey;
      setDraft(slides);
      setDirty(false);
    }
  }, [remoteKey, slides]);

  const selected = draft.find((s) => s.id === selectedId) ?? null;

  // --- Deck operations -------------------------------------------------

  const addSlide = () => {
    const s = blankSlide();
    setDraft((d) => [...d, s]);
    setSelectedId(s.id);
    setDirty(true);
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
    setDirty(true);
  };

  const deleteSlide = (id: string) => {
    setDraft((d) => d.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
    setDirty(true);
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
    setDirty(true);
  };

  const updateSlide = (id: string, patch: Partial<Slide>) => {
    setDraft((d) => d.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setDirty(true);
  };

  // --- Block operations ------------------------------------------------

  const addBlock = (slideId: string, type: SlideBlock['type']) => {
    setDraft((d) =>
      d.map((s) => {
        if (s.id !== slideId) return s;
        const blocks = s.blocks ?? [];
        return { ...s, blocks: [...blocks, blankBlock(type)] };
      })
    );
    setDirty(true);
  };

  const updateBlock = (slideId: string, blockId: string, block: SlideBlock) => {
    setDraft((d) =>
      d.map((s) => {
        if (s.id !== slideId) return s;
        return { ...s, blocks: (s.blocks ?? []).map((b) => (b.id === blockId ? block : b)) };
      })
    );
    setDirty(true);
  };

  const deleteBlock = (slideId: string, blockId: string) => {
    setDraft((d) =>
      d.map((s) => {
        if (s.id !== slideId) return s;
        return { ...s, blocks: (s.blocks ?? []).filter((b) => b.id !== blockId) };
      })
    );
    setDirty(true);
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
    setDirty(true);
  };

  const importBuiltIn = () => {
    // Convert each built-in slide into element-style blocks.
    const imported = SLIDES.flatMap((s, i) =>
      legacyToBlocks({ ...JSON.parse(JSON.stringify(s)), id: newId(), order: i })
    );
    setDraft(imported);
    setSelectedId(imported[0]?.id ?? null);
    setDirty(true);
  };

  const clearAll = () => {
    if (!window.confirm('確定要清空全部自訂投影片？這會讓觀眾端回到內建簡報。')) return;
    setDraft([]);
    setSelectedId(null);
    setDirty(true);
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

        {/* Center: canvas */}
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          {selected ? (
            <SlideViewer slide={selected} slideNumber={draft.indexOf(selected)} totalSlides={draft.length} mode="front" />
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
              </div>

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
                <div key={b.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>#{bi + 1}</span>
                    <button type="button" onClick={() => moveBlock(selected.id, b.id, -1)} disabled={bi === 0} style={miniBtnStyle(bi === 0)} title="上移">↑</button>
                    <button type="button" onClick={() => moveBlock(selected.id, b.id, 1)} disabled={bi === (selected.blocks ?? []).length - 1} style={miniBtnStyle(bi === (selected.blocks ?? []).length - 1)} title="下移">↓</button>
                    <button type="button" onClick={() => deleteBlock(selected.id, b.id)} style={miniBtnStyle(false, 'var(--bad)')} title="刪除元素">✕</button>
                  </div>
                  <BlockEditor block={b} onChange={(nb) => updateBlock(selected.id, b.id, nb)} />
                </div>
              ))}

              {(selected.blocks ?? []).length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'center', padding: 12 }}>
                  尚無元素 — 從上方新增
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
