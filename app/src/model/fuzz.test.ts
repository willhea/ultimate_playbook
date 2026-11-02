// Trying to break the editor: random sequences of every editing operation, from
// either stack, checking after each one that the play is still whole, plays back
// without errors, and has its automatic defenders where they belong.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Play } from './types';
import { createPlay } from './defaults';
import {
  addPlayer,
  addStep,
  deleteStep,
  flipForce,
  movePlayer,
  moveStep,
  removePlayer,
  resetMove,
  setCurve,
  setFacing,
  setGuards,
  setHolder,
  setManual,
  setStack,
  setThrowCurve,
  updateFrame,
} from './edit';
import { evaluate, totalDuration } from './engine';
import { placeDefenders } from './defenders';
import { readPlay } from './sanitize';
import { validatePlay } from './validate';
import { forceView } from './force';
import { fitView } from './view';
import { bend, fieldPoint } from '../test/arbitraries';

const SLOTS = ['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];

// Each operation picks its step and player from whatever the play has at that moment.
type Op = (play: Play) => Play;
const step = (play: Play, k: number) => k % play.frames.length;
const someone = (play: Play, k: number) => play.players[k % play.players.length]?.id ?? 'O1';
const offense = (play: Play, k: number) => {
  const o = play.players.filter((p) => p.team === 'O');
  return o[k % o.length].id;
};

const op: fc.Arbitrary<{ name: string; run: Op }> = fc.oneof(
  fc.record({ k: fc.nat(), j: fc.nat(), to: fieldPoint }).map(({ k, j, to }) => ({ name: 'move', run: (p: Play) => movePlayer(p, step(p, k), someone(p, j), to) })),
  fc.record({ k: fc.nat(), j: fc.nat(), b: fc.option(bend, { nil: null }) }).map(({ k, j, b }) => ({ name: 'bend', run: (p: Play) => setCurve(p, step(p, k), someone(p, j), b) })),
  fc.record({ k: fc.nat(), j: fc.nat() }).map(({ k, j }) => ({ name: 'throw', run: (p: Play) => setHolder(p, step(p, k), offense(p, j)) })),
  fc.record({ k: fc.nat(), b: fc.option(bend, { nil: null }) }).map(({ k, b }) => ({ name: 'bend throw', run: (p: Play) => setThrowCurve(p, step(p, k), b) })),
  fc.record({ k: fc.nat(), j: fc.nat(), a: fc.option(fc.integer({ min: -400, max: 400 }), { nil: null }) }).map(({ k, j, a }) => ({ name: 'face', run: (p: Play) => setFacing(p, step(p, k), someone(p, j), a) })),
  fc.record({ j: fc.nat(), t: fc.option(fc.constantFrom(...SLOTS), { nil: null }) }).map(({ j, t }) => ({
    name: 'guard',
    run: (p: Play) => {
      const d = p.players.filter((x) => x.team === 'D');
      const target = t && p.players.find((x) => x.id === t && x.team === 'O');
      return d.length ? setGuards(p, d[j % d.length].id, target ? target.id : null) : p;
    },
  })),
  fc.record({ k: fc.nat(), d: fc.double({ min: 0.5, max: 6, noNaN: true }), r: fc.double({ min: 0, max: 0.9, noNaN: true }) }).map(({ k, d, r }) => ({ name: 'timing', run: (p: Play) => updateFrame(p, step(p, k), { duration: d, release: r }) })),
  fc.nat().map((k) => ({ name: 'add step', run: (p: Play) => (p.frames.length < 8 ? addStep(p, step(p, k)) : p) })),
  fc.nat().map((k) => ({ name: 'delete step', run: (p: Play) => deleteStep(p, step(p, k)) })),
  fc.record({ k: fc.nat(), up: fc.boolean() }).map(({ k, up }) => ({ name: 'reorder', run: (p: Play) => moveStep(p, step(p, k), up ? -1 : 1) })),
  fc.record({ k: fc.nat(), j: fc.nat() }).map(({ k, j }) => ({ name: 'undo run', run: (p: Play) => resetMove(p, step(p, k), someone(p, j)) })),
  fc.record({ k: fc.nat(), j: fc.nat(), m: fc.boolean() }).map(({ k, j, m }) => ({ name: 'by hand', run: (p: Play) => setManual(p, step(p, k), someone(p, j), m) })),
  fc.constantFrom<'O' | 'D'>('O', 'D').map((team) => ({ name: 'add player', run: (p: Play) => addPlayer(p, team) })),
  fc.nat().map((j) => ({ name: 'remove player', run: (p: Play) => removePlayer(p, someone(p, j)) })),
  fc.record({ depth: fc.integer({ min: 8, max: 25 }), spacing: fc.double({ min: 4, max: 8, noNaN: true }) }).map(({ depth, spacing }) => ({
    name: 'stack spacing',
    run: (p: Play) => (p.stack ? setStack(p, p.stack.kind === 'vertical' ? { kind: 'vertical', depth, spacing } : { kind: 'horizontal', depth }) : p),
  })),
  fc.constant({ name: 'flip force', run: (p: Play) => flipForce(p) }),
);

function expectWhole(play: Play) {
  // Still a whole play: it survives saving, sharing or exporting and reading back.
  expect(readPlay(JSON.parse(JSON.stringify(play)))).not.toBeNull();
  expect(() => validatePlay(play)).not.toThrow();
  fitView(play);
  // Plays back: everyone and the disc are somewhere real at every moment.
  const total = totalDuration(play);
  for (let s = 0; s <= 12; s++) {
    const view = evaluate(play, (total * s) / 12);
    for (const p of Object.values(view.players)) expect(Number.isFinite(p.pos.x + p.pos.y + p.facing)).toBe(true);
    expect(Number.isFinite(view.disc.pos.x + view.disc.pos.y)).toBe(true);
    forceView(play, view);
  }
  // Automatic defenders are already where they belong: re-placing them moves nobody.
  const again = placeDefenders(play);
  again.frames.forEach((f, i) => {
    for (const [id, pos] of Object.entries(f.positions)) {
      expect(Math.hypot(pos.x - play.frames[i].positions[id].x, pos.y - play.frames[i].positions[id].y), `${id} in step ${i}`).toBeLessThan(1e-6);
    }
  });
}

describe('random editing', () => {
  it('never leaves a play broken, from either stack', () => {
    fc.assert(
      fc.property(fc.constantFrom<'vertical' | 'horizontal'>('vertical', 'horizontal'), fc.array(op, { minLength: 1, maxLength: 14 }), (formation, ops) => {
        let play = addStep(createPlay('Fuzz', formation), 0);
        for (const o of ops) {
          play = o.run(play);
          expectWhole(play);
        }
      }),
      { numRuns: 150 },
    );
  });
});
