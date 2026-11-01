/** Pure editing operations. Each returns a new Play and never mutates its input. */
import type { Frame, Play, Player, Team, Vec } from './types';
import { add, dist, sub } from './geometry';
import { isManual, placeDefenders } from './defenders';
import { markSpot, underSpot } from './formations';

const SAME_SPOT = 0.01;

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function withFrames(play: Play, frames: Frame[]): Play {
  return { ...play, frames };
}

function replaceFrame(play: Play, i: number, f: Frame): Play {
  return withFrames(play, play.frames.map((x, j) => (j === i ? f : x)));
}

function guardsSomeone(play: Play, id: string): boolean {
  return Boolean(play.players.find((p) => p.id === id)?.guards);
}

/** Mark a defender as placed by hand in frame i (only steps; the setup is always by hand). */
function pin(play: Play, i: number, id: string): Play {
  const f = play.frames[i];
  if (i === 0 || !guardsSomeone(play, id) || isManual(f, id)) return play;
  return replaceFrame(play, i, { ...f, manual: { ...f.manual, [id]: true } });
}

/** Move one player in frame i, and in later frames where they hadn't moved yet. */
function shift(frames: Frame[], i: number, id: string, to: Vec): void {
  const old = frames[i].positions[id];
  frames[i] = { ...frames[i], positions: { ...frames[i].positions, [id]: to } };
  for (let j = i + 1; j < frames.length; j++) {
    if (dist(frames[j].positions[id], old) > SAME_SPOT) break;
    frames[j] = { ...frames[j], positions: { ...frames[j].positions, [id]: to } };
  }
}

/**
 * Move a player in frame i. Later frames where the player hadn't moved yet
 * move with them, so changing the setup doesn't create accidental runs.
 * Automatic defenders follow (see defenders.ts). Moving a player in the setup
 * brings their defender along; dragging a defender in a step places them by hand.
 */
export function movePlayer(play: Play, i: number, id: string, to: Vec): Play {
  const frames = play.frames.map((f) => f);
  if (i === 0) {
    const delta = sub(to, frames[0].positions[id]);
    for (const d of play.players) {
      if (d.guards === id && frames[0].positions[d.id]) shift(frames, 0, d.id, add(frames[0].positions[d.id], delta));
    }
  }
  shift(frames, i, id, to);
  return placeDefenders(pin(withFrames(play, frames), i, id));
}

/** Bend (or straighten, with null) a player's run into frame i. Bending a defender's run places them by hand. */
export function setCurve(play: Play, i: number, id: string, bend: Vec | null): Play {
  const pinned = pin(play, i, id);
  const curves = { ...pinned.frames[i].curves };
  if (bend) curves[id] = bend;
  else delete curves[id];
  return placeDefenders(replaceFrame(pinned, i, { ...pinned.frames[i], curves }));
}

/** Switch a defender between following their player automatically and staying where they were put. */
export function setManual(play: Play, i: number, id: string, manual: boolean): Play {
  if (manual) return pin(play, i, id);
  const f = play.frames[i];
  if (!isManual(f, id)) return play;
  const rest = { ...f.manual };
  delete rest[id];
  return placeDefenders(replaceFrame(play, i, { ...f, manual: Object.keys(rest).length ? rest : undefined }));
}

export function setThrowCurve(play: Play, i: number, bend: Vec | null): Play {
  return replaceFrame(play, i, { ...play.frames[i], throwCurve: bend });
}

/** Give the disc to a player in frame i. Later frames that still had the old holder follow. */
export function setHolder(play: Play, i: number, id: string): Play {
  const old = play.frames[i].discHolder;
  if (old === id) return play;
  const frames = play.frames.map((f) => f);
  for (let j = i; j < frames.length; j++) {
    if (j > i && frames[j].discHolder !== old) break;
    frames[j] = { ...frames[j], discHolder: id, throwCurve: j === i ? frames[j].throwCurve : null };
  }
  return placeDefenders(withFrames(play, frames));
}

export function setFacing(play: Play, i: number, id: string, angle: number | null): Play {
  const facing = { ...play.frames[i].facing };
  if (angle === null) delete facing[id];
  else facing[id] = Math.round(angle) % 360;
  return replaceFrame(play, i, { ...play.frames[i], facing });
}

/** Change who a defender guards. They move to guard their new player in the setup, and follow them from there. */
export function setGuards(play: Play, defenderId: string, targetId: string | null): Play {
  let next: Play = {
    ...play,
    players: play.players.map((p) => (p.id === defenderId ? { ...p, guards: targetId } : p)),
  };
  const setup = play.frames[0];
  const target = targetId ? setup.positions[targetId] : undefined;
  if (target) {
    const frames = [...next.frames];
    shift(frames, 0, defenderId, setup.discHolder === targetId ? markSpot(target) : underSpot(target));
    next = withFrames(next, frames);
  }
  return placeDefenders(next);
}

export type FrameMeta = Partial<Pick<Frame, 'name' | 'notes' | 'duration' | 'release'>>;

export function updateFrame(play: Play, i: number, meta: FrameMeta): Play {
  return replaceFrame(play, i, { ...play.frames[i], ...meta });
}

/** Insert a new step after frame i, starting with everyone where they are in frame i. */
export function addStep(play: Play, i: number): Play {
  const base = play.frames[i];
  const step: Frame = {
    id: newId('f'),
    name: '',
    notes: '',
    duration: 2,
    positions: { ...base.positions },
    facing: { ...base.facing },
    curves: {},
    discHolder: base.discHolder,
    throwCurve: null,
    release: 0.4,
  };
  const frames = [...play.frames.slice(0, i + 1), step, ...play.frames.slice(i + 1)];
  return withFrames(play, frames);
}

export function deleteStep(play: Play, i: number): Play {
  if (i === 0 || play.frames.length <= 1) return play;
  return placeDefenders(withFrames(play, play.frames.filter((_, j) => j !== i)));
}

/** Swap step i with its neighbour (dir −1 or +1). The setup (frame 0) stays first. */
export function moveStep(play: Play, i: number, dir: -1 | 1): Play {
  const j = i + dir;
  if (i === 0 || j <= 0 || j >= play.frames.length) return play;
  const frames = [...play.frames];
  [frames[i], frames[j]] = [frames[j], frames[i]];
  return placeDefenders(withFrames(play, frames));
}

/** Put a player back where they were at the start of step i. */
export function resetMove(play: Play, i: number, id: string): Play {
  if (i === 0) return play;
  const moved = movePlayer(play, i, id, play.frames[i - 1].positions[id]);
  return setCurve(moved, i, id, null);
}

const TEAM_SIZE = 7;

export function teamPlayers(play: Play, team: Team): Player[] {
  return play.players.filter((p) => p.team === team).sort((a, b) => a.number - b.number);
}

export function canAddPlayer(play: Play, team: Team): boolean {
  return teamPlayers(play, team).length < TEAM_SIZE;
}

/** Add the next-numbered player to a team, placed on the sideline. */
export function addPlayer(play: Play, team: Team): Play {
  if (!canAddPlayer(play, team)) return play;
  const taken = new Set(teamPlayers(play, team).map((p) => p.number));
  let n = 1;
  while (taken.has(n)) n++;
  const id = `${team}${n}`;
  const offenseId = `O${n}`;
  const guards = team === 'D' && play.players.some((p) => p.id === offenseId) ? offenseId : null;
  const player: Player = { id, team, number: n, guards };
  const spot: Vec = { x: 24 + n * 4 + (team === 'D' ? 1.5 : 0), y: team === 'O' ? -1.5 : 41.5 };
  return {
    ...play,
    players: [...play.players, player],
    frames: play.frames.map((f) => ({ ...f, positions: { ...f.positions, [id]: spot } })),
  };
}

/** True if the player ever has the disc, in which case they can't be removed. */
export function holdsDisc(play: Play, id: string): boolean {
  return play.frames.some((f) => f.discHolder === id);
}

export function removePlayer(play: Play, id: string): Play {
  if (holdsDisc(play, id)) return play;
  const strip = <T,>(r: Record<string, T>): Record<string, T> => {
    const copy = { ...r };
    delete copy[id];
    return copy;
  };
  return {
    ...play,
    players: play.players
      .filter((p) => p.id !== id)
      .map((p) => (p.guards === id ? { ...p, guards: null } : p)),
    frames: play.frames.map((f) => ({
      ...f,
      positions: strip(f.positions),
      facing: strip(f.facing),
      curves: strip(f.curves),
      ...(f.manual && { manual: strip(f.manual) }),
    })),
  };
}

export function stepLabel(play: Play, i: number): string {
  if (i === 0) return play.frames[0].name || 'Setup';
  return play.frames[i].name || `Step ${i}`;
}
