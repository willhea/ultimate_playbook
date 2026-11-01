import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { angleDiff, angleTo, bendFromHandle, easeInOut, handlePoint } from './geometry';

describe('geometry', () => {
  it('measures angles with 0° toward the attacking end zone and 90° down the screen', () => {
    expect(angleTo({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe(0);
    expect(angleTo({ x: 0, y: 0 }, { x: 0, y: 5 })).toBe(90);
  });

  it('turns the short way round', () => {
    expect(angleDiff(350, 10)).toBeCloseTo(20);
    expect(angleDiff(10, 350)).toBeCloseTo(-20);
  });

  it('turns a dragged bend handle back into the same bend', () => {
    const point = fc.record({ x: fc.double({ min: -50, max: 150, noNaN: true }), y: fc.double({ min: -50, max: 100, noNaN: true }) });
    fc.assert(
      fc.property(point, point, point, (a, b, h) => {
        const back = handlePoint(a, b, bendFromHandle(a, b, h));
        expect(back.x).toBeCloseTo(h.x, 6);
        expect(back.y).toBeCloseTo(h.y, 6);
      }),
    );
  });

  it('eases in and out without going backwards', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    for (let u = 0; u < 1; u += 0.05) expect(easeInOut(u + 0.05)).toBeGreaterThanOrEqual(easeInOut(u));
  });
});
