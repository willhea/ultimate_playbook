/**
 * How players move along their paths over time: no stopping between steps, and a
 * quick plant where a run changes direction (decision #24).
 *
 * A player's path in one step is a leg. Along a leg the speed ramps from its starting
 * speed up to a steady running speed, holds, and ramps to its ending speed. Where two
 * legs meet (at the end of a step):
 *  - a player who stands still on either side starts or stops there;
 *  - a player running on in about the same direction keeps their speed;
 *  - a sharper change of direction is a plant: the speed drops for a moment, more the
 *    sharper the turn, then the player drives out of it.
 *
 * The fraction of a leg covered is the fraction along its curve parameter, as the
 * automatic defenders assume (their paths are built point for point against their
 * player's). Pure functions, cached per play (plays are never changed in place).
 */
import type { Play, Vec } from './types';
import { angleDiff, angleLerp, angleOfVec, clamp, controlPoint, dist, quad, quadDeriv } from './geometry';

/** Seconds to get going from standing, or to come to a stop. */
export const START_RAMP = 0.6;
/** Seconds to slow into a plant, and again to drive out of it. */
export const PLANT_RAMP = 0.3;
/** Shorter than this (yards), a path counts as standing still. */
const STILL = 0.05;
/** Speed through a join is never more than this times either leg's average, so every leg can still reach its end in time. */
const MAX_JOIN_RATIO = 1.5;
const SAMPLES = 24;

export interface Leg {
  p0: Vec;
  c: Vec;
  p1: Vec;
  /** Length along the curve, yards. */
  length: number;
  /** Seconds. */
  duration: number;
}

/** Where two legs meet, at the end of a step. */
export interface Join {
  /** Speed through the join, yd/s. 0 when the player stands still on either side. */
  speed: number;
  /** 1 running straight on, falling to 0 for a full turn back. 0 when standing. */
  flow: number;
  /** Direction of running through the join (halfway between the two legs), degrees. */
  dir: number;
}

/** A leg's speed over time: a ramp from v0 to vc over ta seconds, steady, then a ramp to v1 over td. */
export interface Profile {
  v0: number;
  v1: number;
  vc: number;
  ta: number;
  td: number;
  length: number;
  duration: number;
}

const cache = new WeakMap<Play, Map<string, Leg | Join[] | Profile>>();

function cached<T extends Leg | Join[] | Profile>(play: Play, key: string, make: () => T): T {
  let m = cache.get(play);
  if (!m) cache.set(play, (m = new Map()));
  let v = m.get(key) as T | undefined;
  if (!v) m.set(key, (v = make()));
  return v;
}

/** Player `id`'s path in step i (from frame i − 1 to frame i). */
export function leg(play: Play, i: number, id: string): Leg {
  return cached(play, `leg ${i} ${id}`, () => {
    const prev = play.frames[i - 1];
    const cur = play.frames[i];
    const p0 = prev.positions[id];
    const p1 = cur.positions[id];
    const c = controlPoint(p0, p1, cur.curves[id]);
    let length = 0;
    let last = p0;
    for (let k = 1; k <= SAMPLES; k++) {
      const p = quad(p0, c, p1, k / SAMPLES);
      length += dist(last, p);
      last = p;
    }
    return { p0, c, p1, length, duration: cur.duration };
  });
}

const moves = (l: Leg) => l.length > STILL && l.duration > 0;
const average = (l: Leg) => l.length / l.duration;

/** Running direction at a point on a leg (curve parameter t), degrees. */
export function legDirection(l: Leg, t: number): number {
  return angleOfVec(quadDeriv(l.p0, l.c, l.p1, t), angleOfVec({ x: l.p1.x - l.p0.x, y: l.p1.y - l.p0.y }));
}

const STANDING: Join = { speed: 0, flow: 0, dir: 0 };

/** A leg's speed over time, given its speeds at each end. */
function shape(l: Leg, v0: number, v1: number): Profile {
  const T = l.duration;
  let ta = v0 > 0 ? PLANT_RAMP : START_RAMP;
  let td = v1 > 0 ? PLANT_RAMP : START_RAMP;
  if (ta + td > T) {
    const s = T / (ta + td);
    ta *= s;
    td *= s;
  }
  // The steady speed that covers the leg in time. Join speeds are capped, so it's never negative.
  const vc = T > 0 ? Math.max(0, (l.length - (ta * v0) / 2 - (td * v1) / 2) / (T - ta / 2 - td / 2)) : 0;
  return { v0, v1, vc, ta, td, length: l.length, duration: T };
}

/**
 * How player `id` passes through every frame. Running straight on, the speed through a
 * join settles on the steady speed of the legs either side (a few rounds of adjusting,
 * since each leg's steady speed depends on its joins); turning, it drops.
 */
function joins(play: Play, id: string): Join[] {
  return cached(play, `joins ${id}`, () => {
    const n = play.frames.length;
    const legs = play.frames.map((_, i) => (i > 0 ? leg(play, i, id) : null));
    const result: Join[] = play.frames.map(() => STANDING);
    const caps: number[] = play.frames.map(() => 0);
    for (let k = 1; k < n - 1; k++) {
      const a = legs[k]!;
      const b = legs[k + 1]!;
      if (!moves(a) || !moves(b)) continue;
      const inDir = legDirection(a, 1);
      const outDir = legDirection(b, 0);
      const turn = (Math.abs(angleDiff(inDir, outDir)) * Math.PI) / 180;
      const flow = ((1 + Math.cos(turn)) / 2) ** 2;
      caps[k] = MAX_JOIN_RATIO * Math.min(average(a), average(b));
      result[k] = { speed: flow * Math.min((average(a) + average(b)) / 2, caps[k]), flow, dir: angleLerp(inDir, outDir, 0.5) };
    }
    for (let round = 0; round < 6; round++) {
      for (let k = 1; k < n - 1; k++) {
        if (result[k].flow === 0) continue;
        const steadyA = shape(legs[k]!, result[k - 1].speed, result[k].speed).vc;
        const steadyB = shape(legs[k + 1]!, result[k].speed, result[k + 1].speed).vc;
        result[k] = { ...result[k], speed: result[k].flow * Math.min((steadyA + steadyB) / 2, caps[k]) };
      }
    }
    return result;
  });
}

/** How player `id` passes through frame k: starts, stops, runs on, or plants. */
export function join(play: Play, k: number, id: string): Join {
  if (k <= 0 || k >= play.frames.length - 1) return STANDING;
  return joins(play, id)[k];
}

/** Player `id`'s speed over time in step i. */
export function profile(play: Play, i: number, id: string): Profile {
  return cached(play, `profile ${i} ${id}`, () => shape(leg(play, i, id), join(play, i - 1, id).speed, join(play, i, id).speed));
}

/** Distance covered `t` seconds into the leg. */
export function travelled(p: Profile, t: number): number {
  const { v0, v1, vc, ta, td, duration: T } = p;
  if (T <= 0 || p.length <= 0) return t > 0 ? p.length : 0;
  t = clamp(t, 0, T);
  const rampUp = ta > 0 ? (v0 * Math.min(t, ta) + ((vc - v0) * Math.min(t, ta) ** 2) / (2 * ta)) : 0;
  if (t <= ta) return clamp(rampUp, 0, p.length);
  const steadyEnd = T - td;
  const steady = vc * (Math.min(t, steadyEnd) - ta);
  if (t <= steadyEnd) return clamp(rampUp + steady, 0, p.length);
  const s = t - steadyEnd;
  const rampDown = vc * s + ((v1 - vc) * s * s) / (2 * td);
  return clamp(rampUp + steady + rampDown, 0, p.length);
}

/** Speed `t` seconds into the leg, yd/s. */
export function speedAt(p: Profile, t: number): number {
  const { v0, v1, vc, ta, td, duration: T } = p;
  if (T <= 0) return 0;
  if (t < ta) return v0 + ((vc - v0) * t) / ta;
  if (t <= T - td) return vc;
  return vc + ((v1 - vc) * (t - (T - td))) / td;
}

export interface Moment {
  pos: Vec;
  /** Curve parameter, 0–1, for the running direction. */
  param: number;
  /** Seconds into the step. */
  t: number;
}

/** Where player `id` is `u` of the way (in time) through step i. */
export function momentAt(play: Play, i: number, id: string, u: number): Moment {
  const l = leg(play, i, id);
  if (u >= 1) return { pos: l.p1, param: 1, t: l.duration };
  if (u <= 0) return { pos: l.p0, param: 0, t: 0 };
  const t = u * l.duration;
  const param = l.length > 0 ? clamp(travelled(profile(play, i, id), t) / l.length, 0, 1) : 1;
  return { pos: quad(l.p0, l.c, l.p1, param), param, t };
}
