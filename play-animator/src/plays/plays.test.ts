import { describe, expect, it } from 'vitest';
import { buildExamplePlays } from './index';
import { validatePlay } from '../model/validate';
import { evaluate, totalDuration } from '../model/engine';
import { dist } from '../model/geometry';
import { createPlay } from '../model/defaults';
import { scriptPlay } from './script';

describe('example plays', () => {
  for (const play of buildExamplePlays()) {
    it(`${play.title}: makes sense as ultimate and is ready to narrate`, () => {
      expect(validatePlay(play)).toEqual([]);

      // At least one throw, and the disc ends up caught.
      expect(play.frames.some((f, k) => k > 0 && f.discHolder !== play.frames[k - 1].discHolder)).toBe(true);
      const end = evaluate(play, totalDuration(play));
      const holder = play.frames[play.frames.length - 1].discHolder;
      expect(dist(end.disc.pos, end.players[holder].pos)).toBeLessThan(1.5);

      // Nobody runs with the disc.
      play.frames.forEach((f, k) => {
        const prev = play.frames[k - 1];
        if (prev && prev.discHolder === f.discHolder) {
          expect(dist(prev.positions[f.discHolder], f.positions[f.discHolder])).toBeLessThan(1);
        }
      });

      // Every step has a name and something to say over it.
      for (const f of play.frames) expect(f.name.trim() && f.notes.trim()).toBeTruthy();
    });
  }
});

it('scriptPlay applies each step’s runs, bends, throw and facing', () => {
  const setup = createPlay().frames[0].positions;
  const play = scriptPlay({
    title: 'T',
    setup: { positions: setup, notes: 'n' },
    steps: [{ name: 's', notes: 'n', duration: 2, runs: { O3: { to: { x: 40, y: 30 }, bend: { x: 2, y: 0 } }, O4: { x: 50, y: 5 } }, throwTo: 'O3', throwBend: { x: 0, y: 3 }, release: 0.6, facing: { D5: 90 } }],
  });
  const f = play.frames[1];
  expect(f.positions.O3).toEqual({ x: 40, y: 30 });
  expect(f.positions.O4).toEqual({ x: 50, y: 5 });
  expect(f.curves).toEqual({ O3: { x: 2, y: 0 } });
  expect([f.discHolder, f.throwCurve, f.release, f.facing.D5]).toEqual(['O3', { x: 0, y: 3 }, 0.6, 90]);
});
