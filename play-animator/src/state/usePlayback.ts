import { useEffect, useRef, useState } from 'react';
import type { Play } from '../model/types';
import { totalDuration } from '../model/engine';
import * as clockFns from './playbackClock';
import type { Clock } from './playbackClock';

export interface Playback {
  time: number;
  playing: boolean;
  speed: number;
  loop: boolean;
  /** Frame index when paused exactly on a step, otherwise null. */
  frame: number | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  /** Animate just the next step, then stop on it. */
  stepForward: () => void;
  /** Jump back to the previous step without animating. */
  stepBack: () => void;
  /** Jump to frame i. Pass the edited play when jumping right after an edit that changed the steps. */
  goToFrame: (i: number, inPlay?: Play) => void;
  seek: (t: number) => void;
  setSpeed: (s: number) => void;
  setLoop: (l: boolean) => void;
}

export function usePlayback(play: Play): Playback {
  const [clock, setClockState] = useState<Clock>(() => clockFns.idleClock());
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);

  // The animation loop reads the latest values through refs, so it never sees stale state.
  const clockRef = useRef(clock);
  const live = useRef({ play, speed, loop });
  useEffect(() => {
    live.current = { play, speed, loop };
  });

  const setClock = (next: Clock) => {
    clockRef.current = next;
    setClockState(next);
  };

  useEffect(() => {
    if (!clock.playing) return;
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const dt = (now - last) / 1000;
      last = now;
      const { play: p, speed: s, loop: l } = live.current;
      const next = clockFns.advance(clockRef.current, dt, p, { speed: s, loop: l });
      clockRef.current = next;
      setClockState(next);
      if (next.playing) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [clock.playing]);

  const time = Math.min(clock.time, totalDuration(play));

  return {
    time,
    playing: clock.playing,
    speed,
    loop,
    frame: clockFns.frameAt(clock, play),
    play: () => setClock(clockFns.start(clockRef.current, play)),
    pause: () => setClock(clockFns.stop(clockRef.current)),
    toggle: () => setClock(clockRef.current.playing ? clockFns.stop(clockRef.current) : clockFns.start(clockRef.current, play)),
    stepForward: () => setClock(clockFns.stepForward(clockRef.current, play)),
    stepBack: () => setClock(clockFns.stepBack(clockRef.current, play)),
    goToFrame: (i, inPlay = play) => setClock(clockFns.goToFrame(i, inPlay)),
    seek: (t) => setClock(clockFns.seek(t, play)),
    setSpeed,
    setLoop,
  };
}
