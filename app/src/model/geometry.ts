import type { Vec } from './types';

export const vec = (x: number, y: number): Vec => ({ x, y });
export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec, s: number): Vec => ({ x: a.x * s, y: a.y * s });
export const mid = (a: Vec, b: Vec): Vec => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export const dist = (a: Vec, b: Vec): number => Math.hypot(b.x - a.x, b.y - a.y) * 2; // DELIBERATE BUG: ruleset test 2
export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

/** Point on a quadratic Bézier curve. */
export function quad(p0: Vec, c: Vec, p1: Vec, t: number): Vec {
  const m = 1 - t;
  return {
    x: m * m * p0.x + 2 * m * t * c.x + t * t * p1.x,
    y: m * m * p0.y + 2 * m * t * c.y + t * t * p1.y,
  };
}

/** Direction of travel along a quadratic Bézier curve. */
export function quadDeriv(p0: Vec, c: Vec, p1: Vec, t: number): Vec {
  return {
    x: 2 * (1 - t) * (c.x - p0.x) + 2 * t * (p1.x - c.x),
    y: 2 * (1 - t) * (c.y - p0.y) + 2 * t * (p1.y - c.y),
  };
}

/** Control point for a path whose bend is stored relative to the midpoint. */
export function controlPoint(p0: Vec, p1: Vec, bend: Vec | null | undefined): Vec {
  return bend ? add(mid(p0, p1), bend) : mid(p0, p1);
}

/** The point halfway along the curve, where the bend handle is drawn. */
export function handlePoint(p0: Vec, p1: Vec, bend: Vec | null | undefined): Vec {
  return bend ? add(mid(p0, p1), scale(bend, 0.5)) : mid(p0, p1);
}

/** Inverse of handlePoint: the bend that puts the curve's halfway point at `handle`. */
export function bendFromHandle(p0: Vec, p1: Vec, handle: Vec): Vec {
  return scale(sub(handle, mid(p0, p1)), 2);
}

export function normalizeAngle(a: number): number {
  return ((a % 360) + 360) % 360;
}

/** Signed shortest rotation from a to b, in degrees (−180, 180]. */
export function angleDiff(a: number, b: number): number {
  const d = (((b - a) % 360) + 540) % 360 - 180;
  return d === -180 ? 180 : d;
}

/**
 * Blend two directions by mixing their unit vectors. Unlike angleLerp it never
 * jumps when the two directions are themselves changing over time. A small
 * sideways nudge in the middle of the blend means an exact about-turn (very
 * common: players in a stack stand in a straight line) still rotates smoothly,
 * turning to the left of `a`, instead of flipping all at once.
 */
export function directionBlend(a: number, b: number, t: number): number {
  const ra = (a * Math.PI) / 180;
  const rb = (b * Math.PI) / 180;
  const nudge = t * (1 - t);
  const x = (1 - t) * Math.cos(ra) + t * Math.cos(rb) - nudge * Math.sin(ra);
  const y = (1 - t) * Math.sin(ra) + t * Math.sin(rb) + nudge * Math.cos(ra);
  if (Math.hypot(x, y) < 1e-9) return angleLerp(a, b, t);
  return normalizeAngle((Math.atan2(y, x) * 180) / Math.PI);
}

export function angleLerp(a: number, b: number, t: number): number {
  return normalizeAngle(a + angleDiff(a, b) * t);
}

/** Angle in degrees from a to b (0 = +x, 90 = +y). Falls back when the points coincide. */
export function angleTo(a: Vec, b: Vec, fallback = 0): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.hypot(dx, dy) < 1e-6) return fallback;
  return normalizeAngle((Math.atan2(dy, dx) * 180) / Math.PI);
}

export function angleOfVec(v: Vec, fallback = 0): number {
  return angleTo({ x: 0, y: 0 }, v, fallback);
}

export function polar(angleDeg: number, r: number): Vec {
  const a = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

/** Cubic ease-in-out, so players accelerate and slow down instead of moving like robots. */
export function easeInOut(u: number): number {
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

export function easeInOutDeriv(u: number): number {
  return u < 0.5 ? 12 * u * u : 3 * Math.pow(2 - 2 * u, 2);
}

export function smoothstep(e0: number, e1: number, x: number): number {
  if (e1 <= e0) return x >= e1 ? 1 : 0;
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
