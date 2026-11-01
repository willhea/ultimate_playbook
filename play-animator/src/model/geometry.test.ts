import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  angleDiff,
  angleLerp,
  angleTo,
  bendFromHandle,
  easeInOut,
  easeInOutDeriv,
  handlePoint,
  normalizeAngle,
  quad,
  smoothstep,
} from './geometry';

const angle = fc.double({ min: -720, max: 720, noNaN: true });
const point = fc.record({ x: fc.double({ min: -50, max: 150, noNaN: true }), y: fc.double({ min: -50, max: 100, noNaN: true }) });

describe('angles', () => {
  it('normalizes into [0, 360)', () => {
    fc.assert(fc.property(angle, (a) => {
      const n = normalizeAngle(a);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(360);
    }));
  });

  it('takes the short way round', () => {
    expect(angleDiff(350, 10)).toBeCloseTo(20);
    expect(angleDiff(10, 350)).toBeCloseTo(-20);
    fc.assert(fc.property(angle, angle, (a, b) => {
      const d = angleDiff(a, b);
      expect(Math.abs(d)).toBeLessThanOrEqual(180);
      expect(Math.abs(angleDiff(a + d, b))).toBeLessThan(1e-6);
    }));
  });

  it('interpolates between the ends', () => {
    fc.assert(fc.property(angle, angle, (a, b) => {
      expect(Math.abs(angleDiff(angleLerp(a, b, 0), a))).toBeLessThan(1e-6);
      expect(Math.abs(angleDiff(angleLerp(a, b, 1), b))).toBeLessThan(1e-6);
    }));
  });

  it('measures the direction from one point to another (0° = attacking, 90° = down the screen)', () => {
    expect(angleTo({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe(0);
    expect(angleTo({ x: 0, y: 0 }, { x: 0, y: 5 })).toBe(90);
    expect(angleTo({ x: 1, y: 1 }, { x: 1, y: 1 }, 42)).toBe(42);
  });
});

describe('curves', () => {
  it('passes through both ends', () => {
    fc.assert(fc.property(point, point, point, (a, c, b) => {
      const startPt = quad(a, c, b, 0);
      expect(startPt.x).toBeCloseTo(a.x, 9);
      expect(startPt.y).toBeCloseTo(a.y, 9);
      const end = quad(a, c, b, 1);
      expect(end.x).toBeCloseTo(b.x, 9);
      expect(end.y).toBeCloseTo(b.y, 9);
    }));
  });

  it('turns a dragged handle back into the same bend', () => {
    fc.assert(fc.property(point, point, point, (a, b, h) => {
      const back = handlePoint(a, b, bendFromHandle(a, b, h));
      expect(back.x).toBeCloseTo(h.x, 6);
      expect(back.y).toBeCloseTo(h.y, 6);
    }));
  });
});

describe('easing', () => {
  it('starts at rest, ends at rest, and never goes backwards', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOutDeriv(0)).toBe(0);
    expect(easeInOutDeriv(1)).toBe(0);
    let prev = 0;
    for (let u = 0.01; u <= 1; u += 0.01) {
      expect(easeInOut(u)).toBeGreaterThanOrEqual(prev);
      prev = easeInOut(u);
    }
  });

  it('has a derivative that matches the curve', () => {
    for (const u of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const h = 1e-5;
      expect(easeInOutDeriv(u)).toBeCloseTo((easeInOut(u + h) - easeInOut(u - h)) / (2 * h), 3);
    }
  });

  it('smoothsteps between edges', () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(1, 1, 1)).toBe(1);
  });
});
