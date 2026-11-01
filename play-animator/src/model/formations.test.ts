// Formations are checked for their shape and for making sense as ultimate,
// not for exact yardages, so the spacing defaults can be tuned freely.
import { describe, expect, it } from 'vitest';
import { horizontalStack, verticalStack, type OpenSide } from './formations';
import { createPlay } from './defaults';
import { validatePlay } from './validate';

const asPlay = (positions: Record<string, { x: number; y: number }>) => {
  const play = createPlay();
  return { ...play, frames: [{ ...play.frames[0], positions }] };
};
const ids = (...n: number[]) => n.map((k) => `O${k}`);

describe.each<OpenSide>(['bottom', 'top'])('with the open side at the %s', (open) => {
  it('vertical stack: five cutters in an evenly spaced line downfield, the dump behind on the break side', () => {
    const pos = verticalStack({ open });
    const stack = ids(3, 4, 5, 6, 7).map((id) => pos[id]);
    expect(new Set(stack.map((p) => p.y)).size).toBe(1);
    const gaps = stack.slice(1).map((p, k) => p.x - stack[k].x);
    expect(new Set(gaps).size).toBe(1);
    expect(stack[0].x).toBeGreaterThan(pos.O1.x);
    expect(pos.O2.x).toBeLessThan(pos.O1.x);
    expect(Math.sign(pos.O2.y - pos.O1.y)).toBe(open === 'bottom' ? -1 : 1);
    expect(validatePlay(asPlay(pos))).toEqual([]);
  });

  it('horizontal stack: three handlers behind four cutters level across the field', () => {
    const pos = horizontalStack({ open });
    const cutters = ids(4, 5, 6, 7).map((id) => pos[id]);
    expect(new Set(cutters.map((p) => p.x)).size).toBe(1);
    for (const h of ids(1, 2, 3)) expect(pos[h].x).toBeLessThan(cutters[0].x);
    expect(validatePlay(asPlay(pos))).toEqual([]);
  });
});
