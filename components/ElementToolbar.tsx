'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SlideBlock, BlockStyle } from '@/lib/types';
import HTMLEditor from './HTMLEditor';

// ---------------------------------------------------------------------------
// Shared style constants — kept in one place so the ElementToolbar looks the
// same whether it sits above a flow block or an absolute one.
// ---------------------------------------------------------------------------

const compact: React.CSSProperties = {
  height: 24,
  background: 'var(--bg)',
  border: '1px solid var(--line)',
  borderRadius: 4,
  color: 'var(--ink)',
  padding: '0 6px',
  fontSize: '0.7rem',
  fontFamily: 'inherit',
  outline: 'none',
  minWidth: 0,
};

function smallBtnStyle(color: string, active = false): React.CSSProperties {
  return {
    background: active ? color : 'transparent',
    border: `1px solid ${color}`,
    color: active ? '#1a1205' : color,
    borderRadius: 4,
    padding: '1px 7px',
    fontSize: '0.7rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    lineHeight: 1.4,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  };
}

function miniBtnStyle(disabled: boolean, color = 'var(--line)'): React.CSSProperties {
  return {
    background: 'transparent',
    border: `1px solid ${color}`,
    color,
    borderRadius: 3,
    padding: '0 5px',
    fontSize: '0.65rem',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    fontFamily: 'inherit',
    lineHeight: 1.5,
  };
}

const tinyLabel: React.CSSProperties = {
  fontSize: '0.58rem',
  letterSpacing: '0.08em',
  color: 'var(--muted)',
  fontWeight: 700,
  textTransform: 'uppercase',
  lineHeight: 1,
};

// ---------------------------------------------------------------------------
// ElementToolbar — sits directly above the selected block on the canvas.
// Houses ALL block-level controls (content / layout / position / size /
// typography / box) so the user never has to hunt through a side panel.
// `position` lets the caller choose between 'top' (default — floats above
// the element) and 'bottom' for narrow spaces.
// ---------------------------------------------------------------------------

export interface ElementToolbarProps {
  block: SlideBlock;
  onChange: (b: SlideBlock) => void;
  onClose: () => void;
  /** When true, render a tabbed switch inside the toolbar (front/back).
   *  Required when the block is text/html so the user can edit either side. */
  showSideToggle?: boolean;
  onSwitchAbsolute?: () => void;
}

export default function ElementToolbar({
  block,
  onChange,
  onClose,
  showSideToggle,
  onSwitchAbsolute,
}: ElementToolbarProps) {
  const s2 = block.style2 ?? {};
  const isAbs = block.layout === 'absolute';
  const pos = block.pos ?? { x: 8, y: 8, unit: 'percent' as const };

  const setS2 = (patch: Partial<BlockStyle>) =>
    onChange({ ...block, style2: { ...s2, ...patch } as BlockStyle });
  const setPos = (patch: Partial<SlideBlock['pos']>) =>
    onChange({ ...block, pos: { ...pos, ...patch } });

  return (
    <div
      // stopPropagation so clicking the toolbar never deselects the block.
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        flexWrap: 'wrap',
        minWidth: 0,
      }}
    >
      {/* ---- Block identity + close ---- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          paddingRight: 8,
          borderRight: '1px solid var(--accent)',
        }}
      >
        <span style={{ fontSize: '0.95rem' }}>
          {block.type === 'image' ? '🖼️' : block.type === 'html' ? '📝' : '🔤'}
        </span>
        <b style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>{block.type}</b>
        {showSideToggle && (
          <span style={{ fontSize: '0.6rem', color: 'var(--muted)', marginLeft: 4 }}>
            下方可直接編輯
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          style={{ ...miniBtnStyle(false, 'var(--muted)'), fontSize: '0.7rem' }}
          title="取消選取"
        >
          ✕
        </button>
      </div>

      {/* ---- Image-specific: src / alt / width ---- */}
      {block.type === 'image' ? (
        <>
          <Group label="圖片 URL">
            <input
              value={block.src || ''}
              onChange={(e) => onChange({ ...block, src: e.target.value })}
              placeholder="https://…"
              style={{ ...compact, width: 180 }}
            />
          </Group>
          <Group label="Alt">
            <input
              value={block.alt || ''}
              onChange={(e) => onChange({ ...block, alt: e.target.value })}
              style={{ ...compact, width: 100 }}
            />
          </Group>
        </>
      ) : null}

      {/* ---- Layout mode ---- */}
      <Group label="排列">
        <div style={{ display: 'flex', gap: 3 }}>
          <button
            type="button"
            onClick={() => onChange({ ...block, layout: 'flow' })}
            style={smallBtnStyle(!isAbs ? 'var(--accent)' : 'var(--line)', !isAbs)}
          >
            ☰ 順序
          </button>
          <button
            type="button"
            onClick={() => {
              if (isAbs) return;
              onChange({
                ...block,
                layout: 'absolute',
                pos: pos ?? { x: 8, y: 8, unit: 'percent' },
                width: block.width || '40%',
                zIndex: block.zIndex ?? 1,
              });
              onSwitchAbsolute?.();
            }}
            style={smallBtnStyle(isAbs ? 'var(--accent)' : 'var(--line)', isAbs)}
          >
            ✛ 自由
          </button>
        </div>
      </Group>

      {/* ---- Position & size (absolute) or width (flow) ---- */}
      {isAbs ? (
        <>
          <Group label="X / Y / 單位">
            <div style={{ display: 'flex', gap: 3 }}>
              <input
                type="number"
                value={Math.round(pos.x * 10) / 10}
                onChange={(e) => setPos({ x: Number(e.target.value) || 0 })}
                style={{ ...compact, width: 48 }}
              />
              <input
                type="number"
                value={Math.round(pos.y * 10) / 10}
                onChange={(e) => setPos({ y: Number(e.target.value) || 0 })}
                style={{ ...compact, width: 48 }}
              />
              <select
                value={pos.unit || 'percent'}
                onChange={(e) => setPos({ unit: e.target.value as 'percent' | 'px' })}
                style={{ ...compact, width: 48 }}
              >
                <option value="percent">%</option>
                <option value="px">px</option>
              </select>
            </div>
          </Group>
          <Group label="快速對齊">
            <div style={{ display: 'flex', gap: 2 }}>
              {[
                { l: '↖', x: 4, y: 4 },
                { l: '↑', x: 25, y: 4 },
                { l: '↗', x: 60, y: 4 },
                { l: '←', x: 4, y: 38 },
                { l: '◎', x: 25, y: 38 },
                { l: '→', x: 60, y: 38 },
                { l: '↙', x: 4, y: 76 },
                { l: '↓', x: 25, y: 76 },
                { l: '↘', x: 60, y: 76 },
              ].map((p) => (
                <button key={p.l} type="button" onClick={() => setPos({ x: p.x, y: p.y })} style={miniBtnStyle(false)}>
                  {p.l}
                </button>
              ))}
            </div>
          </Group>
          <Group label="寬 / 高">
            <div style={{ display: 'flex', gap: 3 }}>
              <input
                value={block.width || ''}
                onChange={(e) => onChange({ ...block, width: e.target.value })}
                placeholder="40%"
                style={{ ...compact, width: 56 }}
              />
              <input
                value={block.height || ''}
                onChange={(e) => onChange({ ...block, height: e.target.value })}
                placeholder="auto"
                style={{ ...compact, width: 56 }}
              />
            </div>
          </Group>
        </>
      ) : (
        <Group label="寬度">
          <input
            value={block.width || ''}
            onChange={(e) => onChange({ ...block, width: e.target.value })}
            placeholder="100%"
            style={{ ...compact, width: 72 }}
          />
        </Group>
      )}

      {/* ---- Typography ---- */}
      <Group label="字級 / 字重">
        <div style={{ display: 'flex', gap: 3 }}>
          <input
            value={s2.fontSize || ''}
            onChange={(e) => setS2({ fontSize: e.target.value })}
            placeholder="1rem"
            style={{ ...compact, width: 52 }}
          />
          <select
            value={s2.fontWeight || ''}
            onChange={(e) => setS2({ fontWeight: e.target.value || undefined })}
            style={{ ...compact, width: 56 }}
          >
            <option value="">（預設）</option>
            <option value="300">300</option>
            <option value="400">400</option>
            <option value="600">600</option>
            <option value="700">700</option>
            <option value="900">900</option>
          </select>
          <button
            type="button"
            onClick={() => setS2({ fontStyle: s2.fontStyle ? undefined : 'italic' })}
            style={smallBtnStyle(s2.fontStyle ? 'var(--accent)' : 'var(--line)', !!s2.fontStyle)}
            title="斜體"
          >
            <i>I</i>
          </button>
        </div>
      </Group>

      <Group label="顏色 / 對齊">
        <div style={{ display: 'flex', gap: 3 }}>
          <input
            type="color"
            value={s2.color && s2.color.startsWith('#') ? s2.color : '#ffffff'}
            onChange={(e) => setS2({ color: e.target.value })}
            style={{ ...compact, width: 26, padding: 0 }}
          />
          <input
            value={s2.color || ''}
            onChange={(e) => setS2({ color: e.target.value })}
            placeholder="var(--ink)"
            style={{ ...compact, width: 78 }}
          />
          <select
            value={s2.textAlign || ''}
            onChange={(e) =>
              setS2({ textAlign: (e.target.value || undefined) as 'left' | 'center' | 'right' | undefined })
            }
            style={{ ...compact, width: 52 }}
          >
            <option value="">（預設）</option>
            <option value="left">左</option>
            <option value="center">中</option>
            <option value="right">右</option>
          </select>
        </div>
      </Group>

      <Group label="行高 / 旋轉">
        <div style={{ display: 'flex', gap: 3 }}>
          <input
            value={s2.lineHeight || ''}
            onChange={(e) => setS2({ lineHeight: e.target.value })}
            placeholder="1.8"
            style={{ ...compact, width: 44 }}
          />
          <button type="button" onClick={() => setS2({ transform: 'rotate(-3deg)' })} style={miniBtnStyle(false)}>
            ↺
          </button>
          <input
            value={s2.transform || ''}
            onChange={(e) => setS2({ transform: e.target.value })}
            placeholder="rotate(0deg)"
            style={{ ...compact, width: 84 }}
          />
          <button type="button" onClick={() => setS2({ transform: 'rotate(3deg)' })} style={miniBtnStyle(false)}>
            ↻
          </button>
        </div>
      </Group>

      <Group label="背景 / 邊框">
        <div style={{ display: 'flex', gap: 3 }}>
          <input
            type="color"
            value={s2.background && s2.background.startsWith('#') ? s2.background : '#3a4155'}
            onChange={(e) => setS2({ background: e.target.value })}
            style={{ ...compact, width: 26, padding: 0 }}
          />
          <input
            value={s2.borderRadius || ''}
            onChange={(e) => setS2({ borderRadius: e.target.value })}
            placeholder="圓角"
            style={{ ...compact, width: 60 }}
          />
          <input
            value={s2.padding || ''}
            onChange={(e) => setS2({ padding: e.target.value })}
            placeholder="內距"
            style={{ ...compact, width: 56 }}
          />
        </div>
      </Group>

      {/* ---- Z-layer ---- */}
      {isAbs && (
        <Group label="Z 層">
          <input
            type="number"
            value={block.zIndex ?? 1}
            onChange={(e) => onChange({ ...block, zIndex: Number(e.target.value) || 1 })}
            style={{ ...compact, width: 46 }}
          />
        </Group>
      )}
    </div>
  );
}

// Internal helper: a labelled control group inside the toolbar.
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={tinyLabel}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ElementInlineEditor — a contentEditable / textarea wrapper that renders
// INSIDE the element box on the canvas (no modal). The user types directly
// into the slide; every keystroke commits via onChange.
//
//   text block → plain textarea
//   html block → HTMLEditor (visual + source tabs, front/back toggle)
//
// While editing, the toolbar above the element stays open and continues to
// apply typography. Clicking outside commits and deselects.
// ---------------------------------------------------------------------------

export interface ElementInlineEditorProps {
  block: SlideBlock;
  onChange: (b: SlideBlock) => void;
  /** Fires when the user finishes editing (blur, Esc, click-outside). */
  onCommit: () => void;
  /** Fired when the user wants to insert raw HTML programmatically. */
}

export function ElementInlineEditor({ block, onChange, onCommit }: ElementInlineEditorProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const isHTML = block.type === 'html';

  const setSideValue = (next: 'front' | 'back', v: string) => {
    if (next === 'front') onChange({ ...block, front: v });
    else onChange({ ...block, back: v });
  };

  const value = side === 'front' ? block.front : block.back;

  // Commit & close on Esc.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCommit();
    }
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={onKey}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        background: 'rgba(0,0,0,.15)',
        borderRadius: 6,
        padding: 6,
        minWidth: 0,
      }}
    >
      {/* front/back tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          type="button"
          onClick={() => setSide('front')}
          style={smallBtnStyle(side === 'front' ? 'var(--accent)' : 'var(--line)', side === 'front')}
        >
          前台
        </button>
        <button
          type="button"
          onClick={() => setSide('back')}
          style={smallBtnStyle(side === 'back' ? 'var(--accent)' : 'var(--line)', side === 'back')}
        >
          後台
        </button>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onCommit}
          style={{
            background: 'var(--accent)',
            color: '#1a1205',
            border: 'none',
            borderRadius: 4,
            padding: '2px 10px',
            fontSize: '0.7rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          title="完成編輯"
        >
          ✓ 完成
        </button>
      </div>

      {/* The editor body. html → HTMLEditor (full toolbar), text → textarea */}
      <div style={{ minHeight: 60, maxHeight: 360, overflow: 'auto' }}>
        {isHTML ? (
          <HTMLEditor
            value={value}
            onChange={(v) => setSideValue(side, v)}
            side={side}
            onSideChange={setSide}
            placeholder="輸入 HTML 內容…"
          />
        ) : (
          <textarea
            value={value}
            onChange={(e) => setSideValue(side, e.target.value)}
            onBlur={() => onCommit()}
            placeholder="輸入文字…"
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: 80,
              padding: '10px 12px',
              border: '1px solid var(--line)',
              outline: 'none',
              resize: 'vertical',
              background: 'var(--bg)',
              color: 'var(--ink)',
              fontFamily: 'inherit',
              fontSize: '0.92rem',
              lineHeight: 1.6,
              borderRadius: 6,
            }}
          />
        )}
      </div>
    </div>
  );
}
