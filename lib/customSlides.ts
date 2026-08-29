// RTDB access layer for admin-built (custom) slides.
//
// Custom slides are stored under `rooms/{roomId}/customSlides` as a map keyed
// by slide id. When the map is non-empty, presenter/admin clients use it
// instead of the hardcoded SLIDES constant. Deleting the node reverts to the
// built-in deck.
import { database, ref, set, update, remove, onValue, off } from './firebase';
import type { Slide } from './types';

export function getCustomSlidesRef(roomId: string) {
  return ref(database, `rooms/${roomId}/customSlides`);
}

/**
 * Subscribe to a room's custom slides.
 * Returns an unsubscribe function. The callback receives the full slide list
 * (ordered by `order`) or null when no custom slides exist.
 */
export function subscribeCustomSlides(
  roomId: string,
  callback: (slides: Slide[] | null) => void
): () => void {
  const nodeRef = getCustomSlidesRef(roomId);
  const unsubscribe = onValue(nodeRef, (snap) => {
    const raw = snap.val();
    if (!raw || typeof raw !== 'object') {
      callback(null);
      return;
    }
    const slides = Object.values(raw as Record<string, Slide>)
      .map((s) => normalizeSlide(s))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    callback(slides.length > 0 ? slides : null);
  });
  return () => {
    unsubscribe();
    off(nodeRef);
  };
}

/**
 * Save the full custom slide list for a room.
 * Slides are keyed by id and carry an `order` field so ordering survives the
 * map round-trip. Pass an empty array to clear (revert to built-in deck).
 */
export async function saveCustomSlides(roomId: string, slides: Slide[]): Promise<void> {
  const nodeRef = getCustomSlidesRef(roomId);
  if (slides.length === 0) {
    await remove(nodeRef);
    return;
  }
  const map: Record<string, Slide> = {};
  slides.forEach((s, i) => {
    map[s.id] = { ...s, order: i };
  });
  await set(nodeRef, map);
}

/**
 * Replace a single slide (by id) in the custom deck.
 */
export async function upsertCustomSlide(roomId: string, slide: Slide): Promise<void> {
  const nodeRef = ref(database, `rooms/${roomId}/customSlides/${slide.id}`);
  await set(nodeRef, slide);
}

/**
 * Remove one slide by id.
 */
export async function deleteCustomSlide(roomId: string, slideId: string): Promise<void> {
  const nodeRef = ref(database, `rooms/${roomId}/customSlides/${slideId}`);
  await remove(nodeRef);
}

/**
 * Reorder the deck by rewriting the `order` field of each slide.
 */
export async function reorderCustomSlides(roomId: string, slides: Slide[]): Promise<void> {
  const updates: Record<string, unknown> = {};
  slides.forEach((s, i) => {
    updates[`${s.id}/order`] = i;
  });
  await update(ref(database, `rooms/${roomId}/customSlides`), updates);
}

/**
 * Convert the built-in SLIDES array into a custom deck (used by "Import
 * built-in deck" in the builder).
 */
export function toCustomSlides(slides: Slide[]): Slide[] {
  return slides.map((s, i) => ({ ...s, order: i }));
}

/**
 * RTDB strips empty objects/arrays on read. Restore required fields so the
 * slide renders correctly (e.g. a table slide with an empty `rows` array).
 */
function normalizeSlide(raw: Slide): Slide {
  const s: Slide = { ...raw };
  if (!s.id) s.id = 's_' + Math.random().toString(36).slice(2, 9);
  if (!s.type) s.type = 'story';
  if (!s.title) s.title = { front: '', back: '' };
  // Normalize element-style blocks (RTDB strips empty arrays).
  if (s.blocks && !Array.isArray(s.blocks)) {
    delete s.blocks;
  } else if (Array.isArray(s.blocks)) {
    s.blocks = s.blocks.map((b) => ({
      ...b,
      id: b.id || 'b_' + Math.random().toString(36).slice(2, 9),
      type: b.type || 'text',
      front: b.front ?? '',
      back: b.back ?? '',
    }));
  }
  // Normalize background (RTDB strips empty objects).
  if (s.background && typeof s.background !== 'object') {
    delete s.background;
  }
  if (s.type === 'table' && s.table) {
    const t = s.table;
    s.table = {
      front: { ...t.front, headers: Array.isArray(t.front.headers) ? t.front.headers : [], rows: Array.isArray(t.front.rows) ? t.front.rows : [] },
      back: { ...t.back, headers: Array.isArray(t.back.headers) ? t.back.headers : [], rows: Array.isArray(t.back.rows) ? t.back.rows : [] },
    };
  }
  if (s.type === 'steps' && s.steps && !Array.isArray(s.steps.front)) {
    delete s.steps;
  }
  if (s.type === 'pyramid' && s.pyramid && !Array.isArray(s.pyramid.front)) {
    delete s.pyramid;
  }
  return s;
}
