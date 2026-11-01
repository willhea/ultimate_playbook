import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createPlay } from './defaults';
import { FULL_VIEW, VIEW_ASPECT } from './field';
import { fitView } from './view';
import { anyPlay } from '../test/arbitraries';

describe('close-up view', () => {
  it('contains every position the play uses, at the field’s aspect ratio, inside the field', () => {
    fc.assert(
      fc.property(anyPlay, (play) => {
        const v = fitView(play);
        expect(v.w / v.h).toBeCloseTo(VIEW_ASPECT, 6);
        expect(v.x).toBeGreaterThanOrEqual(FULL_VIEW.x - 1e-9);
        expect(v.y).toBeGreaterThanOrEqual(FULL_VIEW.y - 1e-9);
        expect(v.x + v.w).toBeLessThanOrEqual(FULL_VIEW.x + FULL_VIEW.w + 1e-9);
        expect(v.y + v.h).toBeLessThanOrEqual(FULL_VIEW.y + FULL_VIEW.h + 1e-9);
        for (const f of play.frames) {
          for (const p of Object.values(f.positions)) {
            expect(p.x).toBeGreaterThanOrEqual(v.x);
            expect(p.x).toBeLessThanOrEqual(v.x + v.w);
            expect(p.y).toBeGreaterThanOrEqual(v.y);
            expect(p.y).toBeLessThanOrEqual(v.y + v.h);
          }
        }
      }),
    );
  });

  it('zooms in on a play that uses only part of the field', () => {
    const v = fitView(createPlay());
    expect(v.w).toBeLessThan(FULL_VIEW.w);
  });
});
