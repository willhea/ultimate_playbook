import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createPlay } from './defaults';
import { createDemoPlay } from '../plays';
import { evaluate, frameAtTime, frameTimes, locate, staticFacing, totalDuration } from './engine';
import { addStep, movePlayer, setFacing, setHolder } from './edit';
import { angleDiff, angleTo, dist } from './geometry';
import { anyPlay } from '../test/arbitraries';
import { findJump } from '../test/continuity';

const demo = createDemoPlay();
const times = frameTimes(demo);

describe('timeline', () => {
  it('reaches each step at the running total of step lengths', () => {
    let t = 0;
    demo.frames.forEach((f, k) => {
      if (k > 0) t += f.duration;
      expect(times[k]).toBeCloseTo(t);
    });
    expect(frameAtTime(demo, times[1])).toBe(1);
    expect(frameAtTime(demo, (times[1] + times[2]) / 2)).toBeNull();
    expect(locate(demo, (times[1] + times[2]) / 2)).toEqual({ index: 2, u: expect.closeTo(0.5, 6) });
    expect(totalDuration(createPlay())).toBe(0);
  });
});

describe('animation', () => {
  it('shows exactly the saved positions at every step, for any play', () => {
    fc.assert(
      fc.property(anyPlay, (play) => {
        frameTimes(play).forEach((t, k) => {
          const view = evaluate(play, t);
          for (const p of play.players) expect(view.players[p.id].pos).toEqual(play.frames[k].positions[p.id]);
        });
      }),
    );
  });

  it('never jumps: positions, facing and the disc move continuously, for any play', () => {
    expect(findJump(demo)).toBeNull();
    fc.assert(
      fc.property(anyPlay, (play) => {
        expect(findJump(play)).toBeNull();
      }),
      { numRuns: 40 },
    );
  }, 30_000); // about 1 s normally; mutation testing runs it much slower

  it('keeps the disc in the thrower’s hand until the release, then lands it with the receiver', () => {
    const f = demo.frames[2];
    const before = evaluate(demo, times[1] + f.duration * f.release * 0.9);
    expect(before.disc.inFlight).toBe(false);
    const during = evaluate(demo, times[1] + f.duration * (f.release + (1 - f.release) / 2));
    expect(during.disc.inFlight).toBe(true);
    const after = evaluate(demo, times[2]);
    expect(dist(after.disc.pos, f.positions[f.discHolder])).toBeLessThan(1.5);
  });
});

describe('automatic facing', () => {
  const play = createPlay();
  const pos = play.frames[0].positions;
  const facingTo = (from: string, to: string) => angleTo(pos[from], pos[to]);

  it('turns defenders to their player, offense to the disc, and the holder downfield', () => {
    expect(angleDiff(staticFacing(play, 0, 'D3'), facingTo('D3', 'O3'))).toBeCloseTo(0, 6);
    expect(Math.abs(angleDiff(staticFacing(play, 0, 'O5'), facingTo('O5', 'O1')))).toBeLessThan(5);
    expect(staticFacing(play, 0, 'O1')).toBe(0);
  });

  it('turns a receiver toward the throw they caught', () => {
    let p = movePlayer(addStep(play, 0), 1, 'O5', { x: pos.O5.x - 5, y: 30 });
    p = setHolder(p, 1, 'O5');
    expect(Math.abs(angleDiff(staticFacing(p, 1, 'O5'), angleTo(p.frames[1].positions.O5, pos.O1)))).toBeLessThan(10);
  });

  it('turns a runner toward where they are running, but keeps a mark facing the thrower', () => {
    let p = movePlayer(addStep(play, 0), 1, 'O7', { x: pos.O7.x, y: 2 });
    p = movePlayer(p, 1, 'D1', { x: pos.D1.x + 3, y: pos.D1.y });
    const mid = evaluate(p, p.frames[1].duration / 2);
    expect(Math.abs(angleDiff(mid.players.O7.facing, 270))).toBeLessThan(5);
    expect(Math.abs(angleDiff(mid.players.D1.facing, angleTo(mid.players.D1.pos, pos.O1)))).toBeLessThan(5);
  });

  it('turns the thrower to face the receiver by the moment the disc is released', () => {
    const f = demo.frames[2];
    const atRelease = evaluate(demo, times[1] + f.duration * f.release);
    const thrower = demo.frames[1].discHolder;
    expect(Math.abs(angleDiff(atRelease.players[thrower].facing, angleTo(atRelease.players[thrower].pos, f.positions[f.discHolder])))).toBeLessThan(1);
  });

  it('turns the short way between two facings set by hand', () => {
    let p = setFacing(play, 0, 'D6', 350);
    p = setFacing(addStep(p, 0), 1, 'D6', 30);
    const mid = evaluate(p, p.frames[1].duration / 2).players.D6.facing;
    expect(Math.abs(angleDiff(mid, 10))).toBeLessThan(1); // through 0°, not the long way round via 190°
  });

  it('lets a facing set by hand override the automatic one, and undo it', () => {
    const p = setFacing(play, 0, 'D3', 90);
    expect(staticFacing(p, 0, 'D3')).toBe(90);
    expect(staticFacing(setFacing(p, 0, 'D3', null), 0, 'D3')).toBe(staticFacing(play, 0, 'D3'));
  });
});
