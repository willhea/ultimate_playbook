import { describe, expect, it } from 'vitest';
import { createDemoPlay, createPlay } from '../model/defaults';
import { frameTimes, totalDuration } from '../model/engine';
import { MAX_DT, advance, frameAt, goToFrame, idleClock, seek, start, stepBack, stepForward, stop, type Clock } from './playbackClock';

const play = createDemoPlay();
const times = frameTimes(play);
const total = totalDuration(play);
const normal = { speed: 1, loop: false };

/** Run the clock with fixed frame steps until it stops (or a safety limit). */
function runUntilStopped(c: Clock, opts = normal, dt = 1 / 60) {
  let frames = 0;
  while (c.playing && frames < 100000) {
    c = advance(c, dt, play, opts);
    frames++;
  }
  return { clock: c, seconds: frames * dt };
}

describe('playing', () => {
  it('runs from the start to the end and stops there', () => {
    const { clock, seconds } = runUntilStopped(start(idleClock(), play));
    expect(clock).toEqual(idleClock(total));
    expect(seconds).toBeCloseTo(total, 1);
  });

  it('starts over when played from the end', () => {
    expect(start(idleClock(total), play)).toEqual({ time: 0, playing: true, stopAt: null });
  });

  it('does nothing for a play with no steps', () => {
    expect(start(idleClock(), createPlay())).toEqual(idleClock(0));
  });

  it('plays twice as fast at 2×', () => {
    const { seconds } = runUntilStopped(start(idleClock(), play), { speed: 2, loop: false });
    expect(seconds).toBeCloseTo(total / 2, 1);
  });

  it('wraps around when looping', () => {
    let c = start(idleClock(total - 0.01), play);
    c = advance(c, 0.05, play, { speed: 1, loop: true });
    expect(c).toEqual({ time: 0, playing: true, stopAt: null });
  });

  it('never jumps more than one frame step, even after the tab was asleep', () => {
    const c = advance(start(idleClock(), play), 10, play, normal);
    expect(c.time).toBeCloseTo(MAX_DT);
  });

  it('ignores time while paused', () => {
    const c = stop(idleClock(1));
    expect(advance(c, 0.5, play, normal)).toBe(c);
  });
});

describe('stepping', () => {
  it('plays exactly one step and stops on it', () => {
    const c = stepForward(goToFrame(1, play), play);
    expect(c.stopAt).toBe(times[2]);
    const { clock } = runUntilStopped(c);
    expect(clock).toEqual(idleClock(times[2]));
    expect(frameAt(clock, play)).toBe(2);
  });

  it('finishes the step at once when pressed again mid-step', () => {
    let c = stepForward(idleClock(), play);
    c = advance(c, 0.05, play, normal);
    expect(stepForward(c, play)).toEqual(idleClock(times[1]));
  });

  it('does nothing past the last step', () => {
    expect(stepForward(idleClock(total), play)).toEqual(idleClock(total));
  });

  it('goes back one step from a step, and to the start of the step from the middle of one', () => {
    expect(stepBack(goToFrame(2, play), play)).toEqual(idleClock(times[1]));
    expect(stepBack(seek((times[1] + times[2]) / 2, play), play)).toEqual(idleClock(times[1]));
    expect(stepBack(idleClock(0), play)).toEqual(idleClock(0));
  });
});

describe('jumping', () => {
  it('jumps to a step, clamping out-of-range indexes', () => {
    expect(goToFrame(1, play)).toEqual(idleClock(times[1]));
    expect(goToFrame(99, play)).toEqual(idleClock(total));
    expect(goToFrame(-3, play)).toEqual(idleClock(0));
  });

  it('seeks inside the play only', () => {
    expect(seek(-1, play).time).toBe(0);
    expect(seek(1e6, play).time).toBe(total);
  });

  it('reports the step only when paused exactly on one', () => {
    expect(frameAt(goToFrame(1, play), play)).toBe(1);
    expect(frameAt(seek(times[1] + 0.1, play), play)).toBeNull();
    expect(frameAt({ ...goToFrame(1, play), playing: true }, play)).toBeNull();
  });
});
