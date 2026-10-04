import { useCallback, useEffect, useRef, useState } from 'react';
import type { Play } from '../model/types';
import { frameTimes, locate, totalDuration } from '../model/engine';

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
  const [time, setTimeState] = useState(0);
  const timeRef = useRef(0);
  const setTime = (t: number) => {
    timeRef.current = t;
    setTimeState(t);
  };
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);
  const stopAt = useRef<number | null>(null);

  const times = frameTimes(play);
  const total = totalDuration(play);

  // Keep the playhead inside the play when steps are deleted or shortened.
  const clamped = Math.min(time, total);

  const live = useRef({ total, speed, loop });
  live.current = { total, speed, loop };

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      let stop = false;
      let next = Math.min(timeRef.current, live.current.total) + dt * live.current.speed;
      const target = stopAt.current ?? live.current.total;
      if (next >= target) {
        if (stopAt.current === null && live.current.loop && live.current.total > 0) {
          next = 0;
        } else {
          next = target;
          stop = true;
        }
      }
      setTime(next);
      if (stop) {
        stopAt.current = null;
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const frame = playing ? null : (() => {
    const i = times.findIndex((t) => Math.abs(t - clamped) < 1e-6);
    return i === -1 ? null : i;
  })();

  const doPlay = useCallback(() => {
    stopAt.current = null;
    if (timeRef.current >= live.current.total - 1e-6) setTime(0);
    setPlaying(live.current.total > 0);
  }, []);
  const pause = useCallback(() => {
    stopAt.current = null;
    setPlaying(false);
  }, []);

  const stepForward = () => {
    const { index, u } = locate(play, clamped);
    const target = u >= 1 ? index + 1 : index;
    if (target >= times.length || target === 0) {
      if (playing) pause();
      return;
    }
    if (playing && stopAt.current !== null) {
      // Already animating a step: finish it immediately.
      stopAt.current = null;
      setPlaying(false);
      setTime(times[target]);
      return;
    }
    stopAt.current = times[target];
    setPlaying(true);
  };

  const stepBack = () => {
    pause();
    const { index, u } = locate(play, clamped);
    const target = u >= 1 ? Math.max(0, index - 1) : index - 1;
    setTime(times[Math.max(0, target)]);
  };

  const goToFrame = (i: number, inPlay: Play = play) => {
    pause();
    const t = frameTimes(inPlay);
    setTime(t[Math.max(0, Math.min(i, t.length - 1))]);
  };

  const seek = (t: number) => {
    pause();
    setTime(Math.max(0, Math.min(total, t)));
  };

  return {
    time: clamped,
    playing,
    speed,
    loop,
    frame,
    play: doPlay,
    pause,
    toggle: () => (playing ? pause() : doPlay()),
    stepForward,
    stepBack,
    goToFrame,
    seek,
    setSpeed,
    setLoop,
  };
}
