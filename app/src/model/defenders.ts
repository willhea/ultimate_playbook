/**
 * Automatic defenders (spec E-8). A defender who guards someone follows them from
 * step to step, so building a play only takes moving the offense:
 *
 * - While the disc is in the air to their player, the defender stays on their side
 *   of them (decision #27). In the step **after** the catch they step up to **mark**,
 *   unless the catch was a score: then the play is over.
 * - When their player runs, the defender **trails** a step behind, along the run.
 * - Otherwise the defender **keeps the same spacing** they had at the end of the last step.
 *
 * Dragging a defender in a step places them *by hand* for that step
 * (`frame.manual[id]`). The setup is always where the coach put everyone.
 *
 * Automatic spots are written into `frame.positions` and `frame.curves`, so the
 * engine and the file format don't need to know about any of this.
 */
import type { Frame, OpenSide, Play, Vec } from './types';
import { add, controlPoint, dist, mid, scale, sub } from './geometry';
import { GUARD_GAP, markSpot } from './formations';
import { GOAL_LINES, PLAYER_RADIUS } from './field';

/** A player who moves more than this in a step is running. */
const RUN = 1;
/** How far behind a running player their defender ends up: a step behind, with the circles just clear of each other. */
export const TRAIL = 2 * PLAYER_RADIUS + 0.5;
/** Spacing up to this is close guarding: the defender swings around their player rather than passing through them. */
const CLOSE = GUARD_GAP + 1;
const SAME = 0.05;

const len = (v: Vec) => Math.hypot(v.x, v.y);

export function isManual(frame: Frame, id: string): boolean {
  return frame.manual?.[id] === true;
}

/**
 * True when `id` caught the disc in the step before step `i`, so their defender
 * steps up to mark them in step `i`. A catch in the end zone being attacked is a
 * score, and nobody marks after it.
 */
export function caughtJustBefore(frames: Frame[], i: number, id: string): boolean {
  if (i < 2) return false; // the setup's mark is placed by hand
  const caught = frames[i - 1].discHolder === id && frames[i - 2].discHolder !== id;
  const at = frames[i - 1].positions[id];
  return caught && !!at && at.x < GOAL_LINES[1];
}

/** Where an automatic defender ends step `i`, and the bend of their path, given where everyone was before it. */
export function guardMove(
  frames: Frame[],
  i: number,
  defender: string,
  guarded: string,
  open: OpenSide = 'bottom',
): { to: Vec; bend: Vec | null } | null {
  const prev = frames[i - 1];
  const f = frames[i];
  const o0 = prev.positions[guarded];
  const o1 = f.positions[guarded];
  const d0 = prev.positions[defender];
  if (!o0 || !o1 || !d0) return null;

  const oc = controlPoint(o0, o1, f.curves[guarded]);
  let to: Vec;
  if (caughtJustBefore(frames, i, guarded)) {
    to = markSpot(o1, open);
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
    for (const d of guarding) {
      const f = frames[i];
      if (isManual(f, d.id)) continue;
      const move = guardMove(frames, i, d.id, d.guards!, play.open);
      if (!move) continue;
      const curves = { ...f.curves };
      if (move.bend) curves[d.id] = move.bend;
      else delete curves[d.id];
      frames[i] = { ...f, positions: { ...f.positions, [d.id]: move.to }, curves };
    }
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
      const move = guardMove(play.frames, i, d.id, d.guards!, play.open);
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
