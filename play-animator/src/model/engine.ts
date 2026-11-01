/**
 * The animation engine: given a play and a time in seconds, work out where every
 * player and the disc are and which way each player faces. Pure functions only,
 * so playback, scrubbing and (later) video export all agree.
 */
import type { Frame, Play, Player, Vec } from './types';
import {
  add,
  angleDiff,
  angleLerp,
  directionBlend,
  angleOfVec,
  angleTo,
  clamp,
  controlPoint,
  dist,
  easeInOut,
  easeInOutDeriv,
  normalizeAngle,
  polar,
  quad,
  quadDeriv,
  smoothstep,
} from './geometry';

/** The disc is carried slightly in front of and to the right of the holder. */
const HAND_REACH = 0.95;
const HAND_ANGLE = 35;
/** Paths shorter than this (yards) count as standing still for facing purposes. */
const MIN_RUN = 0.75;

export interface PlayerView {
  pos: Vec;
  facing: number;
}

export interface DiscView {
  pos: Vec;
  inFlight: boolean;
  /** 0 on the ground/in hand, up to 1 at the top of a long throw. Used to draw height. */
  height: number;
}

export interface PlayView {
  players: Record<string, PlayerView>;
  disc: DiscView;
  /** Frame being animated into (0 = setup). */
  index: number;
  /** Progress through that step, 0–1. 1 means the frame is reached. */
  u: number;
}

export function handOffset(facing: number): Vec {
  return polar(facing + HAND_ANGLE, HAND_REACH);
}

/** Time (s) at which each frame is reached. */
export function frameTimes(play: Play): number[] {
  const times = [0];
  for (let i = 1; i < play.frames.length; i++) times.push(times[i - 1] + play.frames[i].duration);
  return times;
}

export function totalDuration(play: Play): number {
  const t = frameTimes(play);
  return t[t.length - 1];
}

/** Index of the frame exactly at `time`, or null when between frames. */
export function frameAtTime(play: Play, time: number): number | null {
  const times = frameTimes(play);
  const i = times.findIndex((t) => Math.abs(t - time) < 1e-6);
  return i === -1 ? null : i;
}

/** Which step `time` falls in, and how far through it. */
export function locate(play: Play, time: number): { index: number; u: number } {
  const times = frameTimes(play);
  if (time <= 0 || play.frames.length === 1) return { index: 0, u: 1 };
  for (let i = 1; i < times.length; i++) {
    if (time <= times[i] + 1e-9) {
      // Step times are sums of floats, so treat "a hair before step i" as on step i.
      if (Math.abs(time - times[i]) < 1e-9) return { index: i, u: 1 };
      const d = play.frames[i].duration;
      return { index: i, u: d > 0 ? clamp((time - times[i - 1]) / d, 0, 1) : 1 };
    }
  }
  return { index: times.length - 1, u: 1 };
}

/** Of the turns equivalent to `d` (d ± 360°), the one closest to the reference turn `ref`. */
function closestTurn(d: number, ref: number): number {
  while (d - ref > 180) d -= 360;
  while (ref - d > 180) d += 360;
  return d;
}

function playerById(play: Play, id: string): Player | undefined {
  return play.players.find((p) => p.id === id);
}

/** Position of a player `u` of the way through the step into frame i. */
export function pathPos(play: Play, i: number, id: string, u: number): Vec {
  const p0 = play.frames[i - 1].positions[id];
  const p1 = play.frames[i].positions[id];
  const c = controlPoint(p0, p1, play.frames[i].curves[id]);
  return quad(p0, c, p1, easeInOut(u));
}

function isThrowStep(play: Play, i: number): boolean {
  return i > 0 && play.frames[i - 1].discHolder !== play.frames[i].discHolder;
}

/** When the disc leaves the thrower's hand, as a fraction of the step. Never exactly at the start, so the thrower has time to turn. */
function releaseAt(f: Frame): number {
  return clamp(f.release, 0.05, 0.95);
}

/** Where the thrower's body is when the disc leaves their hand in step i. */
function releaseBody(play: Play, i: number): Vec {
  return pathPos(play, i, play.frames[i - 1].discHolder, releaseAt(play.frames[i]));
}

/** The angle the thrower faces at release: toward where the receiver will catch it. */
function throwAngle(play: Play, i: number): number {
  return angleTo(releaseBody(play, i), play.frames[i].positions[play.frames[i].discHolder]);
}

function releasePoint(play: Play, i: number): Vec {
  return add(releaseBody(play, i), handOffset(throwAngle(play, i)));
}

/** Automatic facing for a player standing at frame k. */
export function autoFacing(play: Play, k: number, id: string): number {
  const f = play.frames[k];
  const pos = f.positions[id];
  const player = playerById(play, id);
  if (!player || !pos) return 0;

  if (player.team === 'D') {
    const target = player.guards && f.positions[player.guards] ? f.positions[player.guards] : staticDisc(play, k);
    return angleTo(pos, target, 180);
  }
  if (id === f.discHolder) {
    // Just caught it: still facing the throw. Otherwise face the attacking end zone.
    if (isThrowStep(play, k)) return angleTo(pos, releasePoint(play, k));
    return 0;
  }
  return angleTo(pos, staticDisc(play, k));
}

export function staticFacing(play: Play, k: number, id: string): number {
  const override = play.frames[k].facing[id];
  return override !== undefined ? override : autoFacing(play, k, id);
}

function staticDisc(play: Play, k: number): Vec {
  const f: Frame = play.frames[k];
  const h = f.discHolder;
  return add(f.positions[h], handOffset(staticFacing(play, k, h)));
}

function evaluateFrame(play: Play, k: number): PlayView {
  const f = play.frames[k];
  const players: Record<string, PlayerView> = {};
  for (const p of play.players) {
    players[p.id] = { pos: f.positions[p.id], facing: staticFacing(play, k, p.id) };
  }
  return { players, disc: { pos: staticDisc(play, k), inFlight: false, height: 0 }, index: k, u: 1 };
}

export function evaluate(play: Play, time: number): PlayView {
  const { index: i, u } = locate(play, time);
  if (i === 0 || u >= 1) return evaluateFrame(play, i);

  const prev = play.frames[i - 1];
  const cur = play.frames[i];
  const thrower = prev.discHolder;
  const receiver = cur.discHolder;
  const throwing = thrower !== receiver;
  const r = releaseAt(cur);
  const e = easeInOut(u);

  const positions: Record<string, Vec> = {};
  for (const p of play.players) positions[p.id] = pathPos(play, i, p.id, u);

  const facing: Record<string, number> = {};

  /** Blend automatic facing with overrides and with the direction of running. */
  const finish = (player: Player, live: number): number => {
    const id = player.id;
    const fromOverride = prev.facing[id];
    const toOverride = cur.facing[id];
    let base = live;
    if (fromOverride !== undefined && toOverride !== undefined) {
      // Both ends set by hand: turn the short way between them, the same way for the whole step.
      base = normalizeAngle(fromOverride + angleDiff(fromOverride, toOverride) * e);
    } else if (fromOverride !== undefined || toOverride !== undefined) {
      // One end set by hand, the other automatic (and possibly moving).
      base = directionBlend(fromOverride ?? live, toOverride ?? live, e);
    }
    // A mark shuffling with the thrower keeps facing them rather than turning to run.
    const shuffling =
      player.team === 'D' && player.guards !== null && player.guards === thrower && player.guards === receiver;
    if (toOverride !== undefined || shuffling) return base;

    const p0 = prev.positions[id];
    const p1 = cur.positions[id];
    if (dist(p0, p1) < MIN_RUN) return base;
    const c = controlPoint(p0, p1, cur.curves[id]);
    const run = angleOfVec(quadDeriv(p0, c, p1, e), base);
    const w = clamp(easeInOutDeriv(u), 0, 1);
    if (w >= 1) return run;
    // Turning into (or out of) the run can mean a turn of nearly 180°. Blend from
    // the standing facing at that end of the step, and pick the turn direction once
    // from where the run starts (or ends), so the player never flips between turning
    // left and right partway through.
    const starting = u < 0.5;
    const anchor = starting ? staticFacing(play, i - 1, id) : staticFacing(play, i, id);
    const runAtEnd = angleOfVec(quadDeriv(p0, c, p1, starting ? 0 : 1), anchor);
    return normalizeAngle(anchor + closestTurn(angleDiff(anchor, run), angleDiff(anchor, runAtEnd)) * w);
  };

  // 1. Whoever has the disc at the start of the step, since the disc's position depends on them.
  const holderPlayer = playerById(play, thrower)!;
  let toCatch = 0;
  if (throwing) {
    // The thrower squares up to the receiver by the moment of release, whatever they
    // were doing before (running, facing set by hand), so the disc leaves from the
    // same spot the flight starts from.
    toCatch = throwAngle(play, i);
    if (u < r) {
      const natural = finish(holderPlayer, autoFacing(play, i - 1, thrower));
      facing[thrower] = directionBlend(natural, toCatch, smoothstep(0, r, u));
    } else {
      facing[thrower] = toCatch;
    }
  } else {
    const live = angleLerp(autoFacing(play, i - 1, thrower), autoFacing(play, i, thrower), e);
    facing[thrower] = finish(holderPlayer, live);
  }

  // 2. The disc.
  let disc: DiscView;
  if (throwing && u >= r) {
    const from = releasePoint(play, i);
    const to = add(cur.positions[receiver], handOffset(staticFacing(play, i, receiver)));
    const v = (u - r) / (1 - r);
    const pos = quad(from, controlPoint(from, to, cur.throwCurve), to, v);
    const height = Math.sin(Math.PI * v) * clamp(dist(from, to) / 45, 0.15, 1);
    disc = { pos, inFlight: true, height };
  } else {
    disc = { pos: add(positions[thrower], handOffset(facing[thrower])), inFlight: false, height: 0 };
  }

  // 3. Everyone else.
  for (const p of play.players) {
    if (p.id === thrower) continue;
    const pos = positions[p.id];
    let live: number;
    if (p.team === 'D') {
      const target = p.guards && positions[p.guards] ? positions[p.guards] : disc.pos;
      live = angleTo(pos, target, 180);
    } else if (throwing && p.id === receiver) {
      live = angleTo(pos, u < r ? disc.pos : releasePoint(play, i));
    } else {
      live = angleTo(pos, disc.pos);
    }
    facing[p.id] = finish(p, live);
  }

  // After letting go, the thrower eases out of the throw back to their normal facing.
  if (throwing && u >= r) {
    const natural = finish(holderPlayer, angleTo(positions[thrower], disc.pos, toCatch));
    facing[thrower] = directionBlend(toCatch, natural, smoothstep(r, r + (1 - r) * 0.5, u));
  }

  const players: Record<string, PlayerView> = {};
  for (const p of play.players) players[p.id] = { pos: positions[p.id], facing: facing[p.id] };
  return { players, disc, index: i, u };
}

/** Geometry of the throw in step i, for drawing it in the editor. */
export function throwGeometry(play: Play, i: number): { from: Vec; to: Vec } | null {
  if (!isThrowStep(play, i)) return null;
  const cur = play.frames[i];
  return {
    from: releasePoint(play, i),
    to: add(cur.positions[cur.discHolder], handOffset(staticFacing(play, i, cur.discHolder))),
  };
}
