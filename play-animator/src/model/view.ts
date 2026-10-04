import type { Play } from './types';
import { FULL_VIEW, VIEW_ASPECT, type ViewBox } from './field';

const PAD = 7;
const MIN_WIDTH = 48;

/** A close-up that contains every position the play uses, at the field's aspect ratio. */
export function fitView(play: Play): ViewBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const f of play.frames) {
    for (const p of Object.values(f.positions)) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (!Number.isFinite(minX)) return FULL_VIEW;

  let w = Math.max(maxX - minX + PAD * 2, (maxY - minY + PAD * 2) * VIEW_ASPECT, MIN_WIDTH);
  if (w >= FULL_VIEW.w) return FULL_VIEW;
  const h = w / VIEW_ASPECT;
  w = h * VIEW_ASPECT;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const x = Math.min(Math.max(cx - w / 2, FULL_VIEW.x), FULL_VIEW.x + FULL_VIEW.w - w);
  const y = Math.min(Math.max(cy - h / 2, FULL_VIEW.y), FULL_VIEW.y + FULL_VIEW.h - h);
  return { x, y, w, h };
}
