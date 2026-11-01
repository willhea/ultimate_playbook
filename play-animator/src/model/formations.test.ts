import { describe, expect, it } from 'vitest';
import { FIELD } from './field';
import { horizontalStack, markSpot, verticalStack } from './formations';
import { createPlay } from './defaults';
import { validatePlay } from './validate';
import { dist } from './geometry';

const asPlay = (positions: ReturnType<typeof verticalStack>) => {
  const play = createPlay();
  return { ...play, frames: [{ ...play.frames[0], positions }] };
};

describe('vertical stack', () => {
  it('lines five cutters up down the middle, 12 yd from the disc and 5 yd apart by default', () => {
    const pos = verticalStack({ disc: { x: 30, y: 20 } });
    const stack = ['O3', 'O4', 'O5', 'O6', 'O7'].map((id) => pos[id]);
    stack.forEach((p, k) => {
      expect(p.y).toBe(FIELD.width / 2);
      expect(p.x).toBe(30 + 12 + k * 5);
    });
  });

  it('puts the dump behind the thrower on the break side', () => {
    const bottom = verticalStack({ open: 'bottom' });
    expect(bottom.O2.x).toBeLessThan(bottom.O1.x);
    expect(bottom.O2.y).toBeLessThan(bottom.O1.y);
    const top = verticalStack({ open: 'top' });
    expect(top.O2.y).toBeGreaterThan(top.O1.y);
  });

  it('respects depth and spacing options', () => {
    const pos = verticalStack({ disc: { x: 30, y: 20 }, depth: 10, spacing: 4 });
    expect(pos.O3.x).toBe(40);
    expect(pos.O7.x).toBe(56);
  });

  it('passes the ultimate checks for either open side', () => {
    expect(validatePlay(asPlay(verticalStack({ open: 'bottom' })))).toEqual([]);
    expect(validatePlay(asPlay(verticalStack({ open: 'top' })))).toEqual([]);
  });
});

describe('horizontal stack', () => {
  it('spreads three handlers and four cutters across the field', () => {
    const pos = horizontalStack({ disc: { x: 40, y: 20 } });
    const handlers = ['O1', 'O2', 'O3'].map((id) => pos[id]);
    const cutters = ['O4', 'O5', 'O6', 'O7'].map((id) => pos[id]);
    expect(new Set(cutters.map((c) => c.x)).size).toBe(1);
    expect(cutters[0].x - 40).toBe(15);
    expect(cutters.map((c) => c.y)).toEqual([...cutters.map((c) => c.y)].sort((a, b) => a - b));
    for (const h of handlers) expect(h.x).toBeLessThan(cutters[0].x);
    // Cutters span most of the field's width.
    expect(cutters[3].y - cutters[0].y).toBeGreaterThan(FIELD.width * 0.7);
  });

  it('passes the ultimate checks for either open side', () => {
    expect(validatePlay(asPlay(horizontalStack({ open: 'bottom' })))).toEqual([]);
    expect(validatePlay(asPlay(horizontalStack({ open: 'top' })))).toEqual([]);
  });
});

describe('the mark', () => {
  it('stands on the break side, close but not on top of the thrower', () => {
    const t = { x: 40, y: 20 };
    expect(markSpot(t, 'bottom').y).toBeLessThan(t.y);
    expect(markSpot(t, 'top').y).toBeGreaterThan(t.y);
    expect(dist(markSpot(t), t)).toBeGreaterThan(2);
    expect(dist(markSpot(t), t)).toBeLessThan(3);
  });
});
