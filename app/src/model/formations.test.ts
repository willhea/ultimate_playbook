// Formations are checked for their shape and for making sense as ultimate,
// not for exact yardages, so the spacing defaults can be tuned freely.
import { describe, expect, it } from 'vitest';
import { DUMP, GUARD_GAP, horizontalStack, STACK_OFFSET, STACK_SLANT, verticalStack, type OpenSide } from './formations';
import { FIELD, PLAYER_RADIUS } from './field';
import { dist } from './geometry';
import { createPlay } from './defaults';
import { validatePlay } from './validate';
import { handOffset } from './engine';

const asPlay = (positions: Record<string, { x: number; y: number }>) => {
  const play = createPlay();
  return { ...play, frames: [{ ...play.frames[0], positions }] };
};
const ids = (...n: number[]) => n.map((k) => `O${k}`);

describe.each<OpenSide>(['bottom', 'top'])('with the open side at the %s', (open) => {
  /** −1 when the break side is toward y = 0 (the top of the screen), +1 when toward y = 40. */
  const breakSide = open === 'bottom' ? -1 : 1;

  it('vertical stack: five cutters in an evenly spaced line downfield, angled slightly toward the break side', () => {
    const pos = verticalStack({ open });
    const stack = ids(3, 4, 5, 6, 7).map((id) => pos[id]);
    const gaps = stack.slice(1).map((p, k) => p.x - stack[k].x);
    expect(new Set(gaps).size).toBe(1);
    expect(stack[0].x).toBeGreaterThan(pos.O1.x);
    // The front of the stack stands to the break side of the thrower (decision #28)…
    expect(Math.sign(stack[0].y - pos.O1.y)).toBe(breakSide);
    expect(Math.abs(stack[0].y - pos.O1.y)).toBeCloseTo(STACK_OFFSET, 6);
    // …and each cutter behind a little further over: a slight angle, not a wall across the field.
    const across = stack.slice(1).map((p, k) => (p.y - stack[k].y) * breakSide);
    for (const a of across) expect(a).toBeCloseTo(STACK_SLANT, 6);
    expect(validatePlay(asPlay(pos))).toEqual([]);
  });

  it('vertical stack: the dump stands well over on the break side, a little behind the thrower (decision #28)', () => {
    const pos = verticalStack({ open });
    expect((pos.O2.y - pos.O1.y) * breakSide).toBeCloseTo(DUMP.break, 6);
    expect(pos.O1.x - pos.O2.x).toBeCloseTo(DUMP.back, 6);
    // Their defender stands between the two handlers.
    expect(dist(pos.D2, pos.O2)).toBeCloseTo(GUARD_GAP, 6);
    expect(dist(pos.D2, pos.O1)).toBeLessThan(dist(pos.O2, pos.O1));
  });

  it('vertical stack: near the break sideline, the stack angles into the open side instead, and everyone stays on the field', () => {
    const nearBreak = { x: 40, y: open === 'bottom' ? 6 : FIELD.width - 6 };
    const pos = verticalStack({ open, disc: nearBreak });
    expect(Math.sign(pos.O3.y - pos.O1.y)).toBe(-breakSide);
    for (const p of Object.values(pos)) expect(p.y > 0 && p.y < FIELD.width).toBe(true);
  });

  it('downfield defenders start with about 2 yd of grass between them and their player (decision #29)', () => {
    const pos = verticalStack({ open });
    for (const n of [3, 4, 5, 6, 7]) expect(dist(pos[`D${n}`], pos[`O${n}`]) - 2 * PLAYER_RADIUS).toBeCloseTo(2, 6);
  });

  it('the mark stands on the break side of the thrower; downfield defenders take away the open side', () => {
    for (const pos of [verticalStack({ open }), horizontalStack({ open })]) {
      expect(Math.sign(pos.D1.y - pos.O1.y)).toBe(breakSide);
      for (const n of [4, 5, 6]) expect(Math.sign(pos[`D${n}`].y - pos[`O${n}`].y)).toBe(-breakSide);
    }
  });

  it('downfield defenders line up on the open side: even near the disc, deep further downfield to force the cut under', () => {
    const pos = verticalStack({ open });
    const ahead = (n: number) => pos[`D${n}`].x - pos[`O${n}`].x; // how far deep of their player
    for (const n of [3, 4, 5, 6, 7]) expect(Math.sign(pos[`D${n}`].y - pos[`O${n}`].y)).toBe(-breakSide);
    expect(Math.abs(ahead(3))).toBeLessThan(1); // the front of the stack: about even
    expect(ahead(7)).toBeGreaterThan(1.5); // the back of the stack: deep
    for (const n of [4, 5, 6, 7]) expect(ahead(n)).toBeGreaterThanOrEqual(ahead(n - 1));
  });

  it('horizontal stack: three handlers behind four cutters level across the field', () => {
    const pos = horizontalStack({ open });
    const cutters = ids(4, 5, 6, 7).map((id) => pos[id]);
    expect(new Set(cutters.map((p) => p.x)).size).toBe(1);
    for (const h of ids(1, 2, 3)) expect(pos[h].x).toBeLessThan(cutters[0].x);
    expect(validatePlay(asPlay(pos))).toEqual([]);
  });
});

it('new plays can start from either stack', () => {
  const cutters = (formation: 'vertical' | 'horizontal') => ids(4, 5, 6, 7).map((id) => createPlay('x', formation).frames[0].positions[id]);
  expect(new Set(cutters('horizontal').map((p) => p.x)).size).toBe(1); // level across the field
  const vertical = cutters('vertical'); // in a line downfield, angled slightly
  expect(vertical.every((p, k) => k === 0 || p.x > vertical[k - 1].x)).toBe(true);
});

it('defaults to force home: a right-handed flick toward the home sideline at the bottom', () => {
  const pos = verticalStack();
  expect(pos.D1.y).toBeLessThan(pos.O1.y); // the mark takes away the backhand side (the top)
  expect(handOffset(0).y).toBeGreaterThan(0); // facing downfield, the disc is in the right hand (the bottom side)
});
