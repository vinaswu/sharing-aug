'use client';

import React from 'react';
import type { SlideBlock, BlockStyle } from '@/lib/types';

/** Apply block-level style2 (and legacy style string) to a CSSProperties object.
 *  Used by both the front-end BlockList and the Builder preview — single source
 *  of truth for how a block's inline styles are computed. */
export function blockStyleToProps(b: SlideBlock): React.CSSProperties {
  const s2 = b.style2;
  const style: React.CSSProperties = {};
  if (s2) {
    if (s2.fontSize) style.fontSize = s2.fontSize;
    if (s2.fontWeight) style.fontWeight = Number(s2.fontWeight) || (s2.fontWeight as string);
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
    if (s2.marginBottom) style.marginBottom = s2.marginBottom;
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
      (style as Record<string, string>)[camel] = val;
    });
  }
  return style;
}

/** Render one block's content. Mirrors what the front-end and the Builder show. */
export function renderBlockContent(
  b: SlideBlock,
  content: string,
  /** Extra CSS class to apply to the root element. */
  extraClassName?: string,
): React.ReactNode {
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
    // When the block has explicit style2/style, use those directly (full control).
    // Otherwise apply the default story-box class so globals.css drives the look
    // (same on front-end and Builder).
    const useInlineStyle = Boolean(b.style2 || b.style);
    return (
      <div
        className={useInlineStyle ? extraClassName : 'story-box'}
        style={useInlineStyle ? base : base}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // text block - renders as a plain text div
  return (
    <div
      className={extraClassName}
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
}

/** Renders the flow of blocks (non-absolute) as a vertical flex column.
 *  This is the ONLY place in the codebase that renders block content for the
 *  audience-facing front-end. The Builder imports this same component. */
export function BlockFlowRenderer({
  blocks,
  mode,
  className,
  extraClassName,
}: {
  blocks: SlideBlock[];
  mode: 'front' | 'back';
  /** Extra class on the outer flex container. */
  className?: string;
  /** Extra class on each block's root element. */
  extraClassName?: string;
}) {
  const flow = blocks.filter((b) => b.layout !== 'absolute');
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1,
        minHeight: 0,
      }}
    >
      {flow.map((b) => {
        const content = mode === 'back' ? b.back : b.front;
        return (
          <div key={b.id}>
            {renderBlockContent(b, content, extraClassName)}
          </div>
        );
      })}
    </div>
  );
}
