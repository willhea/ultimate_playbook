/**
 * Write a play as a script: a starting formation, then steps that say who runs
 * where and who throws to whom. Built with the same edit operations as the
 * editor, so a scripted play is exactly what someone could build by hand.
 */
import type { Play, StackSpacing, Vec } from '../model/types';
import { createPlay } from '../model/defaults';
import { addStep, movePlayer, setCurve, setFacing, setHolder, setThrowCurve, updateFrame } from '../model/edit';

export type Run = Vec | { to: Vec; bend: Vec };

export interface StepScript {
  name: string;
  /** What to say over this step in a video. */
  notes: string;
  /** Seconds. */
  duration: number;
  /** Where players end up, optionally with a bend in their path. */
  runs?: Record<string, Run>;
  /** Offensive player who catches the disc in this step. */
  throwTo?: string;
  /** When the disc is released, as a fraction of the step. */
  release?: number;
  /** Curve of the throw (offset from the middle of a straight throw). */
  throwBend?: Vec;
  /** Facing set by hand at the end of this step, in degrees (0 = toward the attacking end zone). */
  facing?: Record<string, number>;
}

export interface PlayScript {
  title: string;
  setup: { positions: Record<string, Vec>; notes: string; name?: string; holder?: string; stack?: StackSpacing };
  steps: StepScript[];
}

export function scriptPlay(script: PlayScript): Play {
  let play = createPlay(script.title);
  play = {
    ...play,
    stack: script.setup.stack,
    frames: [
      {
        ...play.frames[0],
        name: script.setup.name ?? 'Setup',
        notes: script.setup.notes,
        positions: { ...play.frames[0].positions, ...script.setup.positions },
        discHolder: script.setup.holder ?? 'O1',
      },
    ],
  };
  script.steps.forEach((s, k) => {
    const i = k + 1;
    play = addStep(play, k);
    play = updateFrame(play, i, { name: s.name, notes: s.notes, duration: s.duration, release: s.release ?? 0.4 });
    for (const [id, run] of Object.entries(s.runs ?? {})) {
      const to = 'to' in run ? run.to : run;
      play = movePlayer(play, i, id, to);
      if ('bend' in run) play = setCurve(play, i, id, run.bend);
    }
    if (s.throwTo) {
      play = setHolder(play, i, s.throwTo);
      if (s.throwBend) play = setThrowCurve(play, i, s.throwBend);
    }
    for (const [id, angle] of Object.entries(s.facing ?? {})) play = setFacing(play, i, id, angle);
  });
  return play;
}
