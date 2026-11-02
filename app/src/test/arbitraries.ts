/** fast-check generators for random-but-valid plays, shared by the property tests. */
import fc from 'fast-check';
import type { Play, Vec } from '../model/types';
import { createPlay } from '../model/defaults';
import { addStep, movePlayer, setCurve, setFacing, setHolder, setThrowCurve, updateFrame } from '../model/edit';

const OFFENSE = ['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7'];
const EVERYONE = [...OFFENSE, 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];

export const fieldPoint: fc.Arbitrary<Vec> = fc.record({
  x: fc.double({ min: 0, max: 110, noNaN: true }),
  y: fc.double({ min: 0, max: 40, noNaN: true }),
});

export const bend: fc.Arbitrary<Vec> = fc.record({
  x: fc.double({ min: -10, max: 10, noNaN: true }),
  y: fc.double({ min: -10, max: 10, noNaN: true }),
});

export interface StepScript {
  duration: number;
  release: number;
  moves: { player: string; to: Vec; bend: Vec | null }[];
  throwTo: string | null;
  throwBend: Vec | null;
  facing: { player: string; angle: number } | null;
}

export const stepScript: fc.Arbitrary<StepScript> = fc.record({
  duration: fc.double({ min: 0.5, max: 3, noNaN: true }),
  release: fc.double({ min: 0.1, max: 0.9, noNaN: true }),
  moves: fc.array(
    fc.record({ player: fc.constantFrom(...EVERYONE), to: fieldPoint, bend: fc.option(bend, { nil: null }) }),
    { maxLength: 6 },
  ),
  throwTo: fc.option(fc.constantFrom(...OFFENSE), { nil: null }),
  throwBend: fc.option(bend, { nil: null }),
  facing: fc.option(fc.record({ player: fc.constantFrom(...EVERYONE), angle: fc.double({ min: 0, max: 359, noNaN: true }) }), {
    nil: null,
  }),
});

/** Build a play from scripted steps, using the same edit operations the UI uses. */
export function buildPlay(steps: StepScript[]): Play {
  let play = createPlay('Generated');
  steps.forEach((s, k) => {
    const i = k + 1;
    play = addStep(play, k);
    play = updateFrame(play, i, { duration: s.duration, release: s.release });
    for (const m of s.moves) {
      play = movePlayer(play, i, m.player, m.to);
      if (m.bend) play = setCurve(play, i, m.player, m.bend);
    }
    if (s.throwTo && s.throwTo !== play.frames[i].discHolder) {
      play = setHolder(play, i, s.throwTo);
      if (s.throwBend) play = setThrowCurve(play, i, s.throwBend);
    }
    if (s.facing) play = setFacing(play, i, s.facing.player, s.facing.angle);
  });
  return play;
}

export const anyPlay: fc.Arbitrary<Play> = fc.array(stepScript, { minLength: 1, maxLength: 3 }).map(buildPlay);
