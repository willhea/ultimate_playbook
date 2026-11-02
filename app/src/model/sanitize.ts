/**
 * Reading a play from outside the app: a share link, an imported file, or what a
 * browser saved earlier. Anyone can make a link, so none of it is trusted. The play
 * is rebuilt field by field, keeping only well-formed values within sensible
 * limits, so a broken or malicious play is refused instead of crashing or freezing
 * the app for whoever opens it.
 */
import type { Frame, OpenSide, Play, Player, StackSpacing, Vec } from './types';
import { newId } from './edit';
import { upgradeDefenders } from './defenders';

export const LIMITS = {
  frames: 100,
  title: 200,
  name: 200,
  notes: 5000,
  /** Seconds per step. */
  duration: { min: 0.1, max: 60 },
  /** Yards from the field, either way; dragging can't get anywhere near this. */
  coordinate: 1000,
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (n: unknown, lo: number, hi: number): n is number => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
const text = (s: unknown, max: number): string => (typeof s === 'string' ? s.slice(0, max) : '');
const field = (o: unknown, key: string): unknown => (isObj(o) && Object.hasOwn(o, key) ? o[key] : undefined);

function vec(v: unknown): Vec | null {
  const x = field(v, 'x');
  const y = field(v, 'y');
  return finite(x, -LIMITS.coordinate, LIMITS.coordinate) && finite(y, -LIMITS.coordinate, LIMITS.coordinate) ? { x, y } : null;
}

function readPlayers(raw: unknown[]): Player[] | null {
  const players: Player[] = [];
  for (const r of raw) {
    const id = field(r, 'id');
    if (typeof id !== 'string' || !/^[OD][1-7]$/.test(id) || players.some((p) => p.id === id)) return null;
    if (field(r, 'team') !== id[0] || field(r, 'number') !== Number(id[1])) return null;
    players.push({ id, team: id[0] as Player['team'], number: Number(id[1]), guards: null });
  }
  raw.forEach((r, i) => {
    const g = field(r, 'guards');
    const target = players.find((p) => p.id === g);
    if (players[i].team === 'D' && target?.team === 'O') players[i].guards = target.id;
  });
  return players;
}

function readFrame(raw: unknown, k: number, players: Player[], seenIds: Set<string>): Frame | null {
  if (!isObj(raw)) return null;
  const ids = players.map((p) => p.id);

  const positions: Record<string, Vec> = {};
  for (const id of ids) {
    const p = vec(field(raw.positions, id));
    if (!p) return null;
    positions[id] = p;
  }
  const holder = players.find((p) => p.id === raw.discHolder);
  if (!holder || holder.team !== 'O') return null;
  if (k > 0 && !finite(raw.duration, LIMITS.duration.min, LIMITS.duration.max)) return null;

  const facing: Record<string, number> = {};
  const curves: Record<string, Vec> = {};
  const manual: Record<string, true> = {};
  for (const id of ids) {
    const a = field(raw.facing, id);
    if (finite(a, -720, 720)) facing[id] = a;
    const c = vec(field(raw.curves, id));
    if (c) curves[id] = c;
    if (field(raw.manual, id) === true) manual[id] = true;
  }

  let id = text(raw.id, 64);
  if (!id || seenIds.has(id)) id = newId('f');
  seenIds.add(id);

  return {
    id,
    name: text(raw.name, LIMITS.name),
    notes: text(raw.notes, LIMITS.notes),
    duration: k === 0 ? 0 : (raw.duration as number),
    positions,
    facing,
    curves,
    discHolder: holder.id,
    throwCurve: vec(raw.throwCurve),
    release: finite(raw.release, 0, 0.95) ? raw.release : 0.4,
    ...(Object.keys(manual).length > 0 && { manual }),
  };
}

function readStack(raw: unknown): StackSpacing | undefined {
  const kind = field(raw, 'kind');
  const depth = field(raw, 'depth');
  const spacing = field(raw, 'spacing');
  if (!finite(depth, 1, 60)) return undefined;
  if (kind === 'horizontal') return { kind, depth };
  if (kind === 'vertical' && finite(spacing, 1, 20)) return { kind, depth, spacing };
  return undefined;
}

/** A clean, up-to-date copy of a play from outside the app, or null if it isn't a whole play. */
export function readPlay(value: unknown): Play | null {
  if (!isObj(value)) return null;
  const version = value.version;
  if ((version !== 1 && version !== 2) || typeof value.title !== 'string') return null;
  if (!Array.isArray(value.players) || !Array.isArray(value.frames)) return null;
  if (value.frames.length === 0 || value.frames.length > LIMITS.frames) return null;

  const players = readPlayers(value.players);
  if (!players || !players.some((p) => p.team === 'O')) return null;

  const seen = new Set<string>();
  const frames: Frame[] = [];
  for (const [k, raw] of value.frames.entries()) {
    const f = readFrame(raw, k, players, seen);
    if (!f) return null;
    frames.push(f);
  }

  const now = Date.now();
  const open: OpenSide | undefined = value.open === 'top' || value.open === 'bottom' ? value.open : undefined;
  const stack = readStack(value.stack);
  const play: Play = {
    version: 2,
    id: text(value.id, 100) || newId('play'),
    title: text(value.title, LIMITS.title),
    createdAt: finite(value.createdAt, 0, 1e14) ? value.createdAt : now,
    updatedAt: finite(value.updatedAt, 0, 1e14) ? value.updatedAt : now,
    players,
    frames,
    ...(open && { open }),
    ...(stack && { stack }),
  };
  // Plays saved before automatic defenders had every defender placed by hand.
  return version === 1 ? upgradeDefenders(play) : play;
}
