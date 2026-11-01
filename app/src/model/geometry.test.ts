import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { angleDiff, angleTo, bendFromHandle, controlPoint, easeInOut, handlePoint, quad, quadDeriv, smoothstep } from './geometry';

const point = fc.record({ x: fc.double({ min: -50, max: 150, noNaN: true }), y: fc.double({ min: -50, max: 100, noNaN: true }) });

describe('geometry', () => {
  it('measures angles with 0° toward the attacking end zone and 90° down the screen', () => {
    expect(angleTo({ x: 3, y: 4 }, { x: 8, y: 4 })).toBe(0);
    expect(angleTo({ x: 3, y: 4 }, { x: 3, y: 9 })).toBe(90);
    expect(angleTo({ x: 3, y: 4 }, { x: 1, y: 4 })).toBe(180);
  });

  it('turns the short way round', () => {
    expect(angleDiff(350, 10)).toBeCloseTo(20);
    expect(angleDiff(10, 350)).toBeCloseTo(-20);
  });

  it('puts the bend handle on the curve halfway along, and turns a dragged handle back into the same bend', () => {
    fc.assert(
      fc.property(point, point, point, (a, b, h) => {
        const bend = bendFromHandle(a, b, h);
        const halfway = quad(a, controlPoint(a, b, bend), b, 0.5);
        expect(halfway.x).toBeCloseTo(h.x, 6);
        expect(halfway.y).toBeCloseTo(h.y, 6);
        expect(handlePoint(a, b, bend).x).toBeCloseTo(h.x, 6);
      }),
    );
  });

  it('knows which way a curve is heading at every point (used to turn runners)', () => {
    fc.assert(
      fc.property(point, point, point, fc.double({ min: 0.05, max: 0.95, noNaN: true }), (a, c, b, t) => {
        const h = 1e-6;
        const ahead = quad(a, c, b, t + h);
        const behind = quad(a, c, b, t - h);
        const d = quadDeriv(a, c, b, t);
        expect(d.x).toBeCloseTo((ahead.x - behind.x) / (2 * h), 2);
        expect(d.y).toBeCloseTo((ahead.y - behind.y) / (2 * h), 2);
      }),
    );
  });

  it('eases in and out without going backwards', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    for (let u = 0; u < 1; u += 0.05) expect(easeInOut(u + 0.05)).toBeGreaterThanOrEqual(easeInOut(u));
    expect([smoothstep(0, 1, -1), smoothstep(0, 1, 0.25), smoothstep(0, 1, 0.5), smoothstep(0, 1, 2)]).toEqual([0, 0.15625, 0.5, 1]);
  });
});
