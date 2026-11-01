/**
 * Checks that a play makes sense as ultimate, not just as data: players on the
 * field, no one standing on top of anyone else, believable running and throwing
 * speeds. Used by the tests for every built-in play; the editor can show these
 * as warnings later.
 */
import type { Play } from './types';
import { FIELD, FIELD_MARGIN, PLAYER_RADIUS } from './field';
import { controlPoint, dist, quad } from './geometry';
import { throwGeometry } from './engine';

export type IssueCode =
  | 'too-many-players'
  | 'missing-position'
  | 'out-of-bounds'
  | 'holder-not-offense'
  | 'bad-duration'
  | 'bad-release'
  | 'overlap'
  | 'too-fast'
  | 'throw-too-fast'
  | 'throw-too-slow'
  | 'defender-far';

export interface Issue {
  level: 'error' | 'warning';
  code: IssueCode;
  /** Frame index the issue is in (0 = setup). */
  frame: number;
  players: string[];
  message: string;
}

/** Fast but human: elite players top out around 10 yd/s. */
export const MAX_RUN_SPEED = 9;
/** Average disc speed over a throw, in yd/s. */
export const THROW_SPEED = { min: 5, max: 30 };
/** How far a person-to-person defender can start from their player. */
export const MAX_GUARD_DISTANCE = 6;
/** A defender can stand tighter on the player they guard (a mark on the thrower, say) than anyone else can stand to anyone. */
export const MIN_GUARD_DISTANCE = 2.2;
const TEAM_SIZE = 7;

export function pathLength(p0: { x: number; y: number }, c: { x: number; y: number }, p1: { x: number; y: number }): number {
  let len = 0;
  let prev = p0;
  for (let k = 1; k <= 24; k++) {
    const p = quad(p0, c, p1, k / 24);
    len += dist(prev, p);
    prev = p;
  }
  return len;
}

export function validatePlay(play: Play): Issue[] {
  const issues: Issue[] = [];
  const add = (level: Issue['level'], code: IssueCode, frame: number, players: string[], message: string) =>
    issues.push({ level, code, frame, players, message });

  for (const team of ['O', 'D'] as const) {
    const n = play.players.filter((p) => p.team === team).length;
    if (n > TEAM_SIZE) add('error', 'too-many-players', 0, [], `${team === 'O' ? 'Offense' : 'Defense'} has ${n} players; the limit is ${TEAM_SIZE}.`);
  }

  play.frames.forEach((f, k) => {
    for (const p of play.players) {
      const pos = f.positions[p.id];
      if (!pos) {
        add('error', 'missing-position', k, [p.id], `${p.id} has no position.`);
        continue;
      }
      const inside =
        pos.x >= -FIELD_MARGIN && pos.x <= FIELD.length + FIELD_MARGIN && pos.y >= -FIELD_MARGIN && pos.y <= FIELD.width + FIELD_MARGIN;
      if (!inside) add('error', 'out-of-bounds', k, [p.id], `${p.id} is off the edge of the field.`);
    }

    const holder = play.players.find((p) => p.id === f.discHolder);
    if (!holder || holder.team !== 'O') add('error', 'holder-not-offense', k, [f.discHolder], `The disc is held by ${f.discHolder}, who isn't on offense.`);

    if (k > 0 && !(f.duration > 0)) add('error', 'bad-duration', k, [], 'Steps need a length greater than zero.');
    if (f.release < 0 || f.release > 0.95) add('error', 'bad-release', k, [], 'The release has to be between the start and end of the step.');

    // Nobody standing on top of anybody at the end of a step.
    for (let a = 0; a < play.players.length; a++) {
      for (let b = a + 1; b < play.players.length; b++) {
        const pa = f.positions[play.players[a].id];
        const pb = f.positions[play.players[b].id];
        const guarding = play.players[a].guards === play.players[b].id || play.players[b].guards === play.players[a].id;
        const minimum = guarding ? MIN_GUARD_DISTANCE : PLAYER_RADIUS * 2;
        if (pa && pb && dist(pa, pb) < minimum) {
          add('warning', 'overlap', k, [play.players[a].id, play.players[b].id], `${play.players[a].id} and ${play.players[b].id} overlap.`);
        }
      }
    }

    if (k === 0) return;
    const prev = play.frames[k - 1];

    for (const p of play.players) {
      const p0 = prev.positions[p.id];
      const p1 = f.positions[p.id];
      if (!p0 || !p1) continue;
      const speed = pathLength(p0, controlPoint(p0, p1, f.curves[p.id]), p1) / f.duration;
      if (speed > MAX_RUN_SPEED) add('warning', 'too-fast', k, [p.id], `${p.id} runs ${speed.toFixed(1)} yd/s; that's faster than a person can run.`);
    }

    const g = throwGeometry(play, k);
    if (g) {
      const flight = (1 - f.release) * f.duration;
      const speed = pathLength(g.from, controlPoint(g.from, g.to, f.throwCurve), g.to) / flight;
      if (speed > THROW_SPEED.max) add('warning', 'throw-too-fast', k, [prev.discHolder, f.discHolder], `The throw travels ${speed.toFixed(1)} yd/s; give it more time.`);
      if (speed < THROW_SPEED.min) add('warning', 'throw-too-slow', k, [prev.discHolder, f.discHolder], `The throw floats at ${speed.toFixed(1)} yd/s; it would be easy to block.`);
    }
  });

  const setup = play.frames[0];
  for (const d of play.players) {
    if (d.team !== 'D' || !d.guards) continue;
    const a = setup.positions[d.id];
    const b = setup.positions[d.guards];
    if (a && b && dist(a, b) > MAX_GUARD_DISTANCE) {
      add('warning', 'defender-far', 0, [d.id, d.guards], `${d.id} starts ${dist(a, b).toFixed(1)} yd from ${d.guards}, who they guard.`);
    }
  }

  return issues;
}
