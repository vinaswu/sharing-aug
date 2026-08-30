'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Lightweight WYSIWYG HTML editor built on contentEditable.
 *
 * Two surfaces (selectable via tabs):
 *   - 視覺 (Visual): a real contentEditable that applies HTML formatting via
 *     document.execCommand so what you see is what gets rendered.
 *   - 原始 (Source): a plain textarea for raw HTML editing.
 *
 * Synchronization rules:
 *   - Switching Visual → Source copies the editor's HTML into the textarea.
 *   - Switching Source → Visual parses the textarea and loads it into the
 *     contentEditable (this also lets users paste raw HTML).
 *   - onChange fires for every keystroke with the current HTML.
 *
 * Front/back sides are managed by the caller; this component only renders
 * ONE side at a time.
 */
export interface HTMLEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** Show the front/back toggle in the toolbar. Caller manages state. */
  side?: 'front' | 'back';
  onSideChange?: (side: 'front' | 'back') => void;
  /** When true, the editor is in "text" mode (no HTML tags shown in the
   *  toolbar). The user can still type plain text — no rich formatting is
   *  available unless you flip this to false. */
  textMode?: boolean;
  /** Placeholder shown when the editor is empty. */
  placeholder?: string;
}

type Tab = 'visual' | 'source';

export default function HTMLEditor({
  value,
  onChange,
  side = 'front',
  onSideChange,
  textMode = false,
  placeholder,
}: HTMLEditorProps) {
  const [tab, setTab] = useState<Tab>('visual');
  const editorRef = useRef<HTMLDivElement | null>(null);
  const sourceRef = useRef<HTMLTextAreaElement | null>(null);
  // Local source string — committed to the parent only when switching tabs
  // or when the source textarea blurs. This avoids thrashing onChange while
  // the user is typing in source mode.
  const [sourceValue, setSourceValue] = useState(value);

  // Keep the source buffer in sync if the parent's value changes from
  // outside (e.g. switching slides or sides).
  useEffect(() => {
    setSourceValue(value);
    // If we're currently on the visual tab and the value changes externally,
    // update the contentEditable body to match.
    if (tab === 'visual' && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Apply `value` to the contentEditable body on mount and on tab switch
  // (visual → source → visual).
  useEffect(() => {
    if (tab === 'visual' && editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Run a contentEditable command. Falls back gracefully if the browser
  // doesn't support it (some execCommand calls are deprecated but still work
  // everywhere we care about — Chrome/Safari/Firefox/Edge).
  const exec = useCallback((cmd: string, val?: string) => {
    if (typeof document === 'undefined') return;
    document.execCommand(cmd, false, val);
    // After execCommand runs, push the resulting HTML back into state.
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    // Refocus the editor so subsequent commands apply to the same selection.
    editorRef.current?.focus();
  }, [onChange]);

  const onInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const switchTab = useCallback((next: Tab) => {
    if (next === tab) return;
    if (next === 'source') {
      // Visual → Source: copy current editor HTML into the buffer.
      const html = editorRef.current?.innerHTML ?? value;
      setSourceValue(html);
    } else {
      // Source → Visual: load the source buffer into the editor.
      if (editorRef.current) {
        editorRef.current.innerHTML = sourceValue;
      }
      onChange(sourceValue);
    }
    setTab(next);
  }, [tab, value, sourceValue, onChange]);

  const tbStyle: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--line)',
    color: 'var(--ink)',
    borderRadius: 4,
    width: 32,
    height: 28,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const tbActiveStyle: React.CSSProperties = {
    ...tbStyle,
    background: 'var(--accent)',
    color: '#1a1205',
    borderColor: 'var(--accent)',
  };

  const divider: React.CSSProperties = {
    width: 1,
    background: 'var(--line)',
    alignSelf: 'stretch',
    margin: '0 4px',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--card)',
        borderRadius: 8,
        border: '1px solid var(--line)',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* ---- Toolbar ---- */}
      {!textMode && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 4,
            padding: '6px 8px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg)',
          }}
        >
          {/* Tabs (Visual / Source) */}
          <div style={{ display: 'flex', gap: 2, marginRight: 6 }}>
            <button
              type="button"
              onClick={() => switchTab('visual')}
              style={tab === 'visual' ? tbActiveStyle : tbStyle}
              title="視覺編輯"
            >
              👁
            </button>
            <button
              type="button"
              onClick={() => switchTab('source')}
              style={tab === 'source' ? tbActiveStyle : tbStyle}
              title="HTML 原始碼"
            >
              {'</>'}
            </button>
          </div>

          <div style={divider} />

          {/* Basic formatting — disabled in source mode */}
          <button
            type="button"
            disabled={tab !== 'visual'}
            onClick={() => exec('bold')}
            style={tab === 'visual' ? tbStyle : { ...tbStyle, opacity: 0.4, cursor: 'not-allowed' }}
            title="粗體"
          >
            <b>B</b>
          </button>
          <button
            type="button"
            disabled={tab !== 'visual'}
            onClick={() => exec('italic')}
            style={tab === 'visual' ? tbStyle : { ...tbStyle, opacity: 0.4, cursor: 'not-allowed' }}
            title="斜體"
          >
            <i>I</i>
          </button>
          <button
            type="button"
            disabled={tab !== 'visual'}
            onClick={() => exec('underline')}
            style={tab === 'visual' ? tbStyle : { ...tbStyle, opacity: 0.4, cursor: 'not-allowed' }}
            title="底線"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            disabled={tab !== 'visual'}
            onClick={() => exec('strikeThrough')}
            style={tab === 'visual' ? tbStyle : { ...tbStyle, opacity: 0.4, cursor: 'not-allowed' }}
            title="刪除線"
          >
            <s>S</s>
          </button>

          <div style={divider} />

          {/* Headings */}
          <select
            disabled={tab !== 'visual'}
            onChange={(e) => {
              if (e.target.value) exec('formatBlock', e.target.value);
              e.target.value = '';
            }}
            style={{ ...tbStyle, width: 'auto', padding: '0 6px' }}
            defaultValue=""
            title="標題層級"
          >
            <option value="">標題</option>
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
            <option value="h4">H4</option>
            <option value="p">段落</option>
          </select>

          <div style={divider} />

          {/* Lists */}
          <button
            type="button"
            disabled={tab !== 'visual'}
            onClick={() => exec('insertUnorderedList')}
            style={tab === 'visual' ? tbStyle : { ...tbStyle, opacity: 0.4, cursor: 'not-allowed' }}
            title="項目列表"
          >
            •
          </button>
          <button
            type="button"
            disabled={tab !== 'visual'}
            onClick={() => exec('insertOrderedList')}
            style={tab === 'visual' ? tbStyle : { ...tbStyle, opacity: 0.4, cursor: 'not-allowed' }}
            title="編號列表"
          >
            1.
          </button>

          <div style={divider} />

          {/* Alignment */}
          <button type="button" disabled={tab !== 'visual'} onClick={() => exec('justifyLeft')} style={tab === 'visual' ? tbStyle : { ...tbStyle, opacity: 0.4, cursor: 'not-allowed' }} title="靠左">⬅</button>
          <button type="button" disabled={tab !== 'visual'} onClick={() => exec('justifyCenter')} style={tab === 'visual' ? tbStyle : { ...tbStyle, opacity: 0.4, cursor: 'not-allowed' }} title="置中">↔</button>
          <button type="button" disabled={tab !== 'visual'} onClick={() => exec('justifyRight')} style={tab === 'visual' ? tbStyle : { ...tbStyle, opacity: 0.4, cursor: 'not-allowed' }} title="靠右">➡</button>

          <div style={divider} />

          {/* Link / image / clear */}
          <button
            type="button"
            disabled={tab !== 'visual'}
            onClick={() => {
              const url = prompt('連結網址：', 'https://');
              if (url) exec('createLink', url);
            }}
            style={tab === 'visual' ? tbStyle : { ...tbStyle, opacity: 0.4, cursor: 'not-allowed' }}
            title="插入連結"
          >
            🔗
          </button>
          <button
            type="button"
            disabled={tab !== 'visual'}
            onClick={() => exec('removeFormat')}
            style={tab === 'visual' ? tbStyle : { ...tbStyle, opacity: 0.4, cursor: 'not-allowed' }}
            title="清除格式"
          >
            ✕
          </button>

          <div style={{ flex: 1 }} />

          {/* Side toggle */}
          {onSideChange && (
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                type="button"
                onClick={() => onSideChange('front')}
                style={{
                  ...tbStyle,
                  width: 'auto',
                  padding: '0 8px',
                  background: side === 'front' ? 'var(--accent)' : 'var(--bg)',
                  color: side === 'front' ? '#1a1205' : 'var(--ink)',
                }}
              >
                前台
              </button>
              <button
                type="button"
                onClick={() => onSideChange('back')}
                style={{
                  ...tbStyle,
                  width: 'auto',
                  padding: '0 8px',
                  background: side === 'back' ? 'var(--accent)' : 'var(--bg)',
                  color: side === 'back' ? '#1a1205' : 'var(--ink)',
                }}
              >
                後台
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---- Editor body ---- */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {tab === 'visual' ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={onInput}
            data-placeholder={placeholder}
            spellCheck={false}
            style={{
              padding: '12px 16px',
              minHeight: '100%',
              outline: 'none',
              lineHeight: 1.7,
              fontSize: '0.95rem',
              color: 'var(--ink)',
              overflow: 'auto',
              maxHeight: '100%',
            }}
          />
        ) : (
          <textarea
            ref={sourceRef}
            value={sourceValue}
            onChange={(e) => setSourceValue(e.target.value)}
            onBlur={() => onChange(sourceValue)}
            placeholder={placeholder}
            spellCheck={false}
            style={{
              width: '100%',
              height: '100%',
              padding: '12px 16px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              color: 'var(--ink)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: '0.85rem',
              lineHeight: 1.6,
            }}
          />
        )}
      </div>
    </div>
  );
}