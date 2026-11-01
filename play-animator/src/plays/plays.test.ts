import { describe, expect, it } from 'vitest';
import { buildExamplePlays, examplePlays } from './index';
import { validatePlay } from '../model/validate';
import { evaluate, frameTimes, totalDuration } from '../model/engine';
import { dist } from '../model/geometry';
import { isPlay } from '../model/storage';

describe('example plays', () => {
  const plays = buildExamplePlays();

  it('include three vertical and three horizontal stack plays', () => {
    expect(plays.filter((p) => p.title.startsWith('Vertical stack')).length).toBe(3);
    expect(plays.filter((p) => p.title.startsWith('Horizontal stack')).length).toBe(3);
  });

  for (const play of plays) {
    describe(play.title, () => {
      it('passes every ultimate check (spacing, speeds, defenders, bounds)', () => {
        expect(validatePlay(play)).toEqual([]);
      });

      it('is a valid play file', () => {
        expect(isPlay(play)).toBe(true);
      });

      it('has a name and voiceover notes for every step', () => {
        for (const f of play.frames) {
          expect(f.name.trim()).not.toBe('');
          expect(f.notes.trim()).not.toBe('');
        }
      });

      it('completes at least one throw, and ends with the disc caught', () => {
        const throws = play.frames.filter((f, k) => k > 0 && f.discHolder !== play.frames[k - 1].discHolder);
        expect(throws.length).toBeGreaterThan(0);
        const end = evaluate(play, totalDuration(play));
        expect(end.disc.inFlight).toBe(false);
        const holder = play.frames[play.frames.length - 1].discHolder;
        expect(dist(end.disc.pos, end.players[holder].pos)).toBeLessThan(1.5);
      });

      it('never has a thrower run with the disc (no travels)', () => {
        play.frames.forEach((f, k) => {
          if (k === 0) return;
          const prev = play.frames[k - 1];
          // Whoever had the disc at the start of a step either throws it or stays put.
          if (prev.discHolder === f.discHolder) {
            expect(dist(prev.positions[f.discHolder], f.positions[f.discHolder])).toBeLessThan(1);
          }
        });
      });

      it('takes a sensible amount of time to watch', () => {
        const t = totalDuration(play);
        expect(t).toBeGreaterThan(1);
        expect(t).toBeLessThan(15);
        expect(frameTimes(play)).toHaveLength(play.frames.length);
      });
    });
  }

  it('builds fresh, independent copies each time', () => {
    const [a] = buildExamplePlays();
    const [b] = buildExamplePlays();
    expect(a.id).not.toBe(b.id);
    expect(examplePlays).toHaveLength(6);
  });
});
