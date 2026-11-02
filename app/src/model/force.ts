/**
 * Showing the force (spec A-2/A-3). The coach's design: the mark holds both arms
 * straight out, and the break side, the half of the field the mark takes away, is
 * shaded. The line splitting the field runs through the thrower, parallel to the
 * mark's arms. It's a simple 180° split; real break throws can bend round it.
 */
import type { OpenSide, Play, Vec } from './types';
import type { PlayView } from './engine';
import { releaseAt } from './engine';
import { dist, smoothstep } from './geometry';

/** A defender this close to the thrower is marking them; the force fades in as they arrive. */
export const MARK_RANGE = { full: 3.2, none: 4.5 };

export interface ForceView {
  thrower: string;
  mark: string;
  /** Unit vector from the thrower toward the break side (toward the mark). */
  breakSide: Vec;
  /** 0–1: how fully the force is shown (fades in while the mark sets up). */
  strength: number;
}

/** Who has the disc at this moment, or null while it's in the air. */
export function holderAt(play: Play, view: PlayView): string | null {
  if (view.disc.inFlight) return null;
  const f = play.frames[view.index];
  if (view.index === 0 || view.u >= 1) return f.discHolder;
  const prev = play.frames[view.index - 1];
  return prev.discHolder !== f.discHolder && view.u < releaseAt(f) ? prev.discHolder : f.discHolder;
}

export function forceView(play: Play, view: PlayView): ForceView | null {
  const thrower = holderAt(play, view);
  if (!thrower || !view.players[thrower]) return null;
  const t = view.players[thrower].pos;
  let best: { id: string; d: number } | null = null;
  for (const p of play.players) {
    if (p.team !== 'D' || p.guards !== thrower || !view.players[p.id]) continue;
    const d = dist(view.players[p.id].pos, t);
    if (!best || d < best.d) best = { id: p.id, d };
  }
  if (!best || best.d < 1e-6) return null;
  const strength = 1 - smoothstep(MARK_RANGE.full, MARK_RANGE.none, best.d);
  if (strength <= 0) return null;
  const m = view.players[best.id].pos;
  return { thrower, mark: best.id, breakSide: { x: (m.x - t.x) / best.d, y: (m.y - t.y) / best.d }, strength };
}

/** The force in the coach's words, for a right-handed thrower. */
export function forceLabel(open: OpenSide = 'bottom'): string {
  return open === 'bottom' ? 'Force home (flick)' : 'Force away (backhand)';
}
