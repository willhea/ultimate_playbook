import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Play } from './types';
import { createPlay } from './defaults';
import { addStep, movePlayer, setFacing, updateFrame } from './edit';
import { evaluate, frameTimes, staticFacing } from './engine';
import { angleDiff, angleTo, dist } from './geometry';
import { join, leg, PLANT_RAMP, profile, speedAt, START_RAMP, travelled } from './motion';
import { anyPlay } from '../test/arbitraries';

/** O7 runs `first` in step 1 and `second` in step 2, from (70, 20), each step 2 s. */
function twoLegs(first: { x: number; y: number }, second: { x: number; y: number }): Play {
  let play = createPlay();
  play = movePlayer(play, 0, 'O7', { x: 70, y: 20 });
  play = addStep(addStep(play, 0), 1);
  play = updateFrame(updateFrame(play, 1, { duration: 2 }), 2, { duration: 2 });
  play = movePlayer(play, 1, 'O7', first);
  return movePlayer(play, 2, 'O7', second);
}

/** O7's speed (yd/s) at time t, measured from the animation. */
function speed(play: Play, t: number, h = 1e-3): number {
  return dist(evaluate(play, t - h).players.O7.pos, evaluate(play, t + h).players.O7.pos) / (2 * h);
}

describe('motion through a step', () => {
  it('starts from standing, runs at a steady speed, and stops where the play stops', () => {
    const play = twoLegs({ x: 80, y: 20 }, { x: 80, y: 20 }); // runs 10 yd, then stands
    expect(speed(play, 0.01)).toBeLessThan(0.5);
    const steady = speed(play, 1);
    expect(steady).toBeGreaterThan(5); // 10 yd in 2 s, with time to get going and to stop
    expect(speed(play, 1.3)).toBeCloseTo(steady, 3);
    expect(speed(play, 1.99)).toBeLessThan(0.5);
    expect(join(play, 1, 'O7').speed).toBe(0);
  });

  it('carries the speed from one step into the next when the run goes straight on', () => {
    const play = twoLegs({ x: 80, y: 20 }, { x: 90, y: 20 });
    // The same steady speed before, through and after the end of step 1: no slowing down at all.
    const atJoin = speed(play, 2);
    expect(atJoin).toBeGreaterThan(5);
    expect(speed(play, 1)).toBeCloseTo(atJoin, 2);
    expect(speed(play, 3)).toBeCloseTo(atJoin, 2);
  });

  it('plants at a change of direction: the sharper the turn, the bigger the slowdown', () => {
    const slightly = twoLegs({ x: 80, y: 20 }, { x: 89.4, y: 23.4 }); // 20° off
    const square = twoLegs({ x: 80, y: 20 }, { x: 80, y: 30 }); // 90°
    const back = twoLegs({ x: 80, y: 20 }, { x: 72.9, y: 27.1 }); // 135°, back toward the disc
    const atJoin = [slightly, square, back].map((p) => speed(p, 2));
    expect(atJoin[0]).toBeGreaterThan(4);
    expect(atJoin[1]).toBeLessThan(0.3 * speed(square, 1));
    expect(atJoin[2]).toBeLessThan(atJoin[1]);
    expect(atJoin[2]).toBeGreaterThan(0); // never a dead stop unless the play stops
    // The plant is quick: back at full speed soon after.
    expect(speed(square, 2 + PLANT_RAMP + 0.01)).toBeGreaterThan(0.95 * speed(square, 3));
  });

  it('takes longer to get going from standing than to drive out of a plant', () => {
    const play = twoLegs({ x: 80, y: 20 }, { x: 80, y: 30 });
    expect(profile(play, 1, 'O7').ta).toBe(START_RAMP);
    expect(profile(play, 2, 'O7').ta).toBe(PLANT_RAMP);
  });

  it('faces where they run while running on through a step, and turns to look on a hard plant', () => {
    const on = twoLegs({ x: 80, y: 20 }, { x: 90, y: 20 });
    expect(Math.abs(angleDiff(staticFacing(on, 1, 'O7'), 0))).toBeLessThan(1);
    const planted = twoLegs({ x: 80, y: 20 }, { x: 72.9, y: 27.1 });
    const lookAtDisc = angleTo(planted.frames[1].positions.O7, planted.frames[1].positions.O1);
    expect(Math.abs(angleDiff(staticFacing(planted, 1, 'O7'), lookAtDisc))).toBeLessThan(15);
  });

  it('keeps a facing set by hand at the end of a step, even running on', () => {
    const play = setFacing(twoLegs({ x: 80, y: 20 }, { x: 90, y: 20 }), 1, 'O7', 180);
    expect(staticFacing(play, 1, 'O7')).toBe(180);
  });
});

describe('motion, for any play', () => {
  it('covers each path exactly in the step’s time, never going backwards', () => {
    fc.assert(
      fc.property(anyPlay, (play) => {
        for (let i = 1; i < play.frames.length; i++) {
          for (const p of play.players) {
            const prof = profile(play, i, p.id);
            const l = leg(play, i, p.id);
            expect(travelled(prof, l.duration)).toBeCloseTo(l.length, 6);
            expect(prof.vc).toBeGreaterThanOrEqual(0);
            let last = 0;
            for (let k = 1; k <= 20; k++) {
              const s = travelled(prof, (l.duration * k) / 20);
              expect(s).toBeGreaterThanOrEqual(last - 1e-9);
              last = s;
            }
          }
        }
      }),
      { numRuns: 60 },
    );
  });

  it('never changes speed in an instant: each step starts at the speed the last one ended', () => {
    fc.assert(
      fc.property(anyPlay, (play) => {
        for (let k = 1; k < play.frames.length - 1; k++) {
          for (const p of play.players) {
            const end = profile(play, k, p.id);
            const start = profile(play, k + 1, p.id);
            expect(speedAt(end, end.duration)).toBeCloseTo(speedAt(start, 0), 9);
          }
        }
      }),
      { numRuns: 60 },
    );
  });

  it('reaches every step on time', () => {
    fc.assert(
      fc.property(anyPlay, (play) => {
        frameTimes(play).forEach((t, k) => {
          for (const p of play.players) expect(evaluate(play, t).players[p.id].pos).toEqual(play.frames[k].positions[p.id]);
        });
      }),
      { numRuns: 30 },
    );
  });
});
