/**
 * Automatic defenders (spec E-8). A defender who guards someone follows them from
 * step to step, so building a play only takes moving the offense:
 *
 * - When their player catches the disc, the defender steps up to **mark** them.
 * - When their player runs, the defender **trails** a step behind, along the run.
 * - Otherwise the defender **keeps the same spacing** they had at the end of the last step.
 *
 * Dragging a defender in a step places them *by hand* for that step
 * (`frame.manual[id]`). The setup is always where the coach put everyone.
 *
 * Automatic spots are written into `frame.positions` and `frame.curves`, so the
 * engine and the file format don't need to know about any of this.
 */
import type { Frame, Play, Vec } from './types';
import { add, controlPoint, dist, mid, scale, sub } from './geometry';
import { markSpot } from './formations';

/** A player who moves more than this in a step is running. */
const RUN = 1;
/** How far behind a running player their defender ends up. */
export const TRAIL = 2.7;
/** Spacing up to this is close guarding: the defender swings around their player rather than passing through them. */
const CLOSE = 4;
const SAME = 0.05;

const len = (v: Vec) => Math.hypot(v.x, v.y);

export function isManual(frame: Frame, id: string): boolean {
  return frame.manual?.[id] === true;
}

/** Where an automatic defender ends a step, and the bend of their path, given where everyone was before it. */
export function guardMove(prev: Frame, f: Frame, defender: string, guarded: string): { to: Vec; bend: Vec | null } | null {
  const o0 = prev.positions[guarded];
  const o1 = f.positions[guarded];
  const d0 = prev.positions[defender];
  if (!o0 || !o1 || !d0) return null;

  const oc = controlPoint(o0, o1, f.curves[guarded]);
  let to: Vec;
  if (f.discHolder === guarded && prev.discHolder !== guarded) {
    to = markSpot(o1);
  } else if (dist(o0, o1) > RUN) {
    // A step behind, angled toward the side of the run the defender started on,
    // the way a defender chases without running through their player.
    const raw = sub(o1, oc);
    const h = scale(raw, 1 / (len(raw) || 1));
    const g = sub(d0, o0);
    const side = h.x * g.y - h.y * g.x < 0 ? -1 : 1;
    const back = { x: -h.x - side * h.y, y: -h.y + side * h.x }; // −h turned 45° toward that side, length √2
    to = add(o1, scale(back, TRAIL / Math.SQRT2));
  } else {
    to = add(o1, sub(d0, o0));
  }

  // Path: follow the runner's path, with the spacing between them turning smoothly
  // from the old spacing to the new one.
  const g0 = sub(d0, o0);
  const g1 = sub(to, o1);
  const r0 = len(g0);
  const r1 = len(g1);
  let gc: Vec;
  if (r0 < SAME || r1 < SAME || r0 > CLOSE || r1 > CLOSE) {
    gc = mid(g0, g1);
  } else {
    // A quadratic curve's control point that keeps the spacing near r all the way round.
    const r = (r0 + r1) / 2;
    const s = add(scale(g0, 1 / r0), scale(g1, 1 / r1));
    let cosHalf = len(s) / 2;
    let toward = cosHalf < 1e-6 ? { x: -g0.y / r0, y: g0.x / r0 } : scale(s, 1 / len(s));
    // Chasing a runner to the far side of them, swing round behind them, not across their path.
    const run = sub(o1, o0);
    if (dist(o0, o1) > RUN && cosHalf < 0.5 && toward.x * run.x + toward.y * run.y > 0) {
      toward = scale(toward, -1);
      cosHalf = -cosHalf;
    }
    gc = scale(toward, 2 * r - r * cosHalf);
  }
  const bend = sub(add(oc, gc), mid(d0, to));
  return { to, bend: len(bend) < SAME ? null : bend };
}

/** Recompute every automatic defender in every step after the setup. */
export function placeDefenders(play: Play): Play {
  const guarding = play.players.filter((p) => p.team === 'D' && p.guards);
  if (guarding.length === 0) return play;
  const frames = [...play.frames];
  for (let i = 1; i < frames.length; i++) {
    let f = frames[i];
    for (const d of guarding) {
      if (isManual(f, d.id)) continue;
      const move = guardMove(frames[i - 1], f, d.id, d.guards!);
      if (!move) continue;
      const curves = { ...f.curves };
      if (move.bend) curves[d.id] = move.bend;
      else delete curves[d.id];
      f = { ...f, positions: { ...f.positions, [d.id]: move.to }, curves };
    }
    frames[i] = f;
  }
  return { ...play, frames };
}

/**
 * Plays saved before automatic defenders (version 1) had every defender placed by hand.
 * Mark each defender as placed by hand wherever automatic placement would move them,
 * so old plays look exactly as they did.
 */
export function upgradeDefenders(play: Play): Play {
  const guarding = play.players.filter((p) => p.team === 'D' && p.guards);
  const frames = play.frames.map((f, i) => {
    if (i === 0) return f;
    const manual: Record<string, true> = { ...f.manual };
    for (const d of guarding) {
      const move = guardMove(play.frames[i - 1], f, d.id, d.guards!);
      const bend = f.curves[d.id];
      const same =
        move &&
        dist(move.to, f.positions[d.id]) < SAME &&
        (move.bend && bend ? dist(move.bend, bend) < SAME : !move.bend && !bend);
      if (!same) manual[d.id] = true;
    }
    return Object.keys(manual).length ? { ...f, manual } : f;
  });
  return { ...play, version: 2, frames };
}
