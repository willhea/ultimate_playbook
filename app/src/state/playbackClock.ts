/**
 * The playback clock as pure functions: where the playhead is, whether it's
 * running, and where it should stop. The React hook in usePlayback.ts only
 * feeds it animation frames.
 */
import type { Play } from '../model/types';
import { frameTimes, locate, totalDuration } from '../model/engine';

const EPS = 1e-6;
/** Longest frame step we accept (s), so a stalled tab doesn't jump the play forward. */
export const MAX_DT = 0.1;

export interface Clock {
  time: number;
  playing: boolean;
  /** Stop here instead of at the end of the play (used by "play the next step"). */
  stopAt: number | null;
}

export interface ClockOptions {
  speed: number;
  loop: boolean;
}

export const idleClock = (time = 0): Clock => ({ time, playing: false, stopAt: null });

/** Move the playhead forward by `dt` seconds of wall time. */
export function advance(clock: Clock, dt: number, play: Play, opts: ClockOptions): Clock {
  if (!clock.playing) return clock;
  const total = totalDuration(play);
  const next = Math.min(clock.time, total) + Math.min(Math.max(dt, 0), MAX_DT) * opts.speed;
  const target = clock.stopAt ?? total;
  if (next < target) return { ...clock, time: next };
  if (clock.stopAt === null && opts.loop && total > 0) return { ...clock, time: 0 };
  return idleClock(target);
}

export function start(clock: Clock, play: Play): Clock {
  const total = totalDuration(play);
  if (total <= 0) return idleClock(0);
  const time = clock.time >= total - EPS ? 0 : Math.min(clock.time, total);
  return { time, playing: true, stopAt: null };
}

export function stop(clock: Clock): Clock {
  return idleClock(clock.time);
}

/** Animate just the next step and stop on it. Pressed again mid-step, it jumps to the end of that step. */
export function stepForward(clock: Clock, play: Play): Clock {
  const times = frameTimes(play);
  const { index, u } = locate(play, Math.min(clock.time, totalDuration(play)));
  const target = u >= 1 ? index + 1 : index;
  if (target >= times.length || target === 0) return stop(clock);
  if (clock.playing && clock.stopAt !== null) return idleClock(times[target]);
  return { time: clock.time, playing: true, stopAt: times[target] };
}

/** Jump back to the start of the current step, or to the previous step when already on one. */
export function stepBack(clock: Clock, play: Play): Clock {
  const times = frameTimes(play);
  const { index } = locate(play, Math.min(clock.time, totalDuration(play)));
  // On a step that's the previous step; mid-step, it's the start of this one. Both are index − 1.
  return idleClock(times[Math.max(0, index - 1)]);
}

export function goToFrame(i: number, play: Play): Clock {
  const times = frameTimes(play);
  return idleClock(times[Math.max(0, Math.min(i, times.length - 1))]);
}

export function seek(t: number, play: Play): Clock {
  return idleClock(Math.max(0, Math.min(totalDuration(play), t)));
}

/** Frame index when paused exactly on a step, otherwise null. */
export function frameAt(clock: Clock, play: Play): number | null {
  if (clock.playing) return null;
  const time = Math.min(clock.time, totalDuration(play));
  const i = frameTimes(play).findIndex((t) => Math.abs(t - time) < EPS);
  return i === -1 ? null : i;
}
