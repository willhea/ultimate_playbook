import { describe, expect, it } from 'vitest';
import { buildExamplePlays } from './index';
import { validatePlay } from '../model/validate';
import { evaluate, totalDuration } from '../model/engine';
import { dist } from '../model/geometry';

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
