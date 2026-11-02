import { describe, expect, it } from 'vitest';
import { createDemoPlay } from '../plays';
import { frameTimes, totalDuration } from '../model/engine';
import { advance, frameAt, goToFrame, idleClock, seek, start, stepBack, stepForward, type Clock } from './playbackClock';

const play = createDemoPlay();
const times = frameTimes(play);
const total = totalDuration(play);

/** Run the clock at 60 frames a second until it stops. */
function run(c: Clock, opts = { speed: 1, loop: false }) {
  let seconds = 0;
  while (c.playing && seconds < 60) {
    c = advance(c, 1 / 60, play, opts);
    seconds += 1 / 60;
  }
  return { clock: c, seconds };
}

describe('playback clock', () => {
  it('plays from the start to the end and stops there, starting over if played again', () => {
    const { clock, seconds } = run(start(idleClock(), play));
    expect(clock).toEqual(idleClock(total));
    expect(seconds).toBeCloseTo(total, 1);
    expect(start(clock, play).time).toBe(0);
  });

  it('plays twice as fast at 2× and wraps around when looping', () => {
    expect(run(start(idleClock(), play), { speed: 2, loop: false }).seconds).toBeCloseTo(total / 2, 1);
    expect(advance(start(idleClock(total - 0.01), play), 0.05, play, { speed: 1, loop: true }).time).toBe(0);
  });

  it('plays exactly one step at a time (even with Loop on), and goes back a step', () => {
    const last = play.frames.length - 1;
    const { clock } = run(stepForward(goToFrame(last - 1, play), play), { speed: 1, loop: true });
    expect(frameAt(clock, play)).toBe(last);
    expect(stepForward(clock, play)).toEqual(clock); // nothing after the last step
    const midStep = advance(stepForward(goToFrame(0, play), play), 0.1, play, { speed: 1, loop: false });
    expect(stepForward(midStep, play)).toEqual(idleClock(times[1])); // pressed again: finish the step now
    expect(frameAt(stepBack(clock, play), play)).toBe(last - 1);
    expect(frameAt(stepBack(seek((times[1] + times[2]) / 2, play), play), play)).toBe(1);
  });

  it('reports a step only when paused exactly on it', () => {
    expect(frameAt(goToFrame(1, play), play)).toBe(1);
    expect(frameAt(seek(times[1] + 0.1, play), play)).toBeNull();
    expect(frameAt(start(goToFrame(1, play), play), play)).toBeNull();
  });
});
