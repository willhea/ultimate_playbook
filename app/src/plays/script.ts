/**
 * Write a play as a script: a starting formation, then steps that say who runs
 * where and who throws to whom. Built with the same edit operations as the
 * editor, so a scripted play is exactly what someone could build by hand.
 */
import type { Play, StackSpacing, Vec } from '../model/types';
import { createPlay } from '../model/defaults';
import { addStep, movePlayer, setCurve, setFacing, setHolder, setThrowCurve, updateFrame } from '../model/edit';
import { openSign } from '../model/formations';

/**
 * A spot given the way a coach says it (decision #30): yards to the open or break
 * side of a player, and ahead (downfield) or back. "from" is a player, or "disc" for
 * whoever has the disc at the start of the step. In a step, it's where that player
 * ends the step; a player placed from themselves moves from where they started it
 * ("O7 takes 7 yd ahead and 7 to the open side"). Example: the dump,
 * `{ from: 'O1', break: 10, back: 2 }`.
 */
export interface Relative {
  from: string;
  open?: number;
  break?: number;
  ahead?: number;
  back?: number;
}

/** A spot on the field: yards, or relative to a player. */
export type Spot = Vec | Relative;

export type Run = Spot | { to: Spot; bend: Vec };

export const isRelative = (s: Spot): s is Relative => 'from' in s;

/** Where a relative spot is, given where its player is, for a play with this open side. */
export function resolveRelative(rel: Relative, at: Vec, open: Play['open']): Vec {
  const across = ((rel.open ?? 0) - (rel.break ?? 0)) * openSign(open);
  return { x: at.x + (rel.ahead ?? 0) - (rel.back ?? 0), y: at.y + across };
}

/**
 * Work out every spot in `spots`, in an order where each relative spot's player is
 * already placed. `where(id)` says where a player is now and `start(id)` where they
 * began; `place` puts one somewhere. Throws if spots refer to each other in a circle.
 */
function placeAll(
  spots: Record<string, Spot>,
  holder: string,
  open: Play['open'],
  where: (id: string) => Vec | undefined,
  start: (id: string) => Vec | undefined,
  place: (id: string, to: Vec) => void,
) {
  const waiting = new Map(Object.entries(spots));
  const target = (s: Relative) => (s.from === 'disc' ? holder : s.from);
  while (waiting.size) {
    const ready = [...waiting].find(([id, s]) => !isRelative(s) || target(s) === id || !waiting.has(target(s)));
    if (!ready) throw new Error(`These positions refer to each other in a circle: ${[...waiting.keys()].join(', ')}.`);
    const [id, s] = ready;
    waiting.delete(id);
    if (!isRelative(s)) {
      place(id, s);
      continue;
    }
    const at = target(s) === id ? start(id) : where(target(s));
    if (!at) throw new Error(`${id} is placed relative to ${target(s)}, who isn't in the play.`);
    place(id, resolveRelative(s, at, open));
  }
}

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
  setup: { positions: Record<string, Spot>; notes: string; name?: string; holder?: string; stack?: StackSpacing };
  steps: StepScript[];
}

export function scriptPlay(script: PlayScript): Play {
  let play = createPlay(script.title);
  // The setup: an offensive player who moves brings their defender along, as in the
  // editor, unless the script places that defender too.
  const positions = { ...play.frames[0].positions };
  const holder = script.setup.holder ?? 'O1';
  const given = script.setup.positions;
  const defaults = play.frames[0].positions;
  placeAll(given, holder, play.open, (id) => positions[id], (id) => defaults[id], (id, to) => {
    const from = positions[id];
    positions[id] = to;
    for (const d of play.players) {
      if (d.guards !== id || given[d.id] || !from || !positions[d.id]) continue;
      positions[d.id] = { x: positions[d.id].x + to.x - from.x, y: positions[d.id].y + to.y - from.y };
    }
  });
  play = {
    ...play,
    stack: script.setup.stack,
    frames: [
      {
        ...play.frames[0],
        name: script.setup.name ?? 'Setup',
        notes: script.setup.notes,
        positions,
        discHolder: holder,
      },
    ],
  };
  script.steps.forEach((s, k) => {
    const i = k + 1;
    play = addStep(play, k);
    play = updateFrame(play, i, { name: s.name, notes: s.notes, duration: s.duration, release: s.release ?? 0.4 });
    const runs = s.runs ?? {};
    const spots = Object.fromEntries(Object.entries(runs).map(([id, run]) => [id, 'to' in run ? run.to : run]));
    const before = play.frames[i - 1].positions;
    placeAll(spots, play.frames[i - 1].discHolder, play.open, (id) => play.frames[i].positions[id], (id) => before[id], (id, to) => {
      const run = runs[id];
      play = movePlayer(play, i, id, to);
      if ('bend' in run) play = setCurve(play, i, id, run.bend);
      // No bend means a straight run, even for a defender who had an automatic curve.
      else if (play.frames[i].curves[id]) play = setCurve(play, i, id, null);
    });
    if (s.throwTo) {
      play = setHolder(play, i, s.throwTo);
      if (s.throwBend) play = setThrowCurve(play, i, s.throwBend);
    }
    for (const [id, angle] of Object.entries(s.facing ?? {})) play = setFacing(play, i, id, angle);
  });
  return play;
}
