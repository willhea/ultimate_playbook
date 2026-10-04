/** Saving plays in the browser, and reading/writing play files. */
import type { Play } from './types';
import { newId } from './edit';

const PLAYS_KEY = 'ultimate-animations:plays';
const CURRENT_KEY = 'ultimate-animations:current';

export function loadPlays(): Play[] {
  try {
    const raw = localStorage.getItem(PLAYS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPlay) : [];
  } catch {
    return [];
  }
}

export function savePlays(plays: Play[]): void {
  try {
    localStorage.setItem(PLAYS_KEY, JSON.stringify(plays));
  } catch {
    // Storage can be unavailable (private window, blocked site data). The app keeps working in memory.
  }
}

export function loadCurrentId(): string | null {
  try {
    return localStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
}

export function saveCurrentId(id: string): void {
  try {
    localStorage.setItem(CURRENT_KEY, id);
  } catch {
    // See savePlays.
  }
}

function isVec(v: unknown): boolean {
  return typeof v === 'object' && v !== null && typeof (v as { x: unknown }).x === 'number' && typeof (v as { y: unknown }).y === 'number';
}

/** Checks that something looks like a saved play, so a bad file can't break the app. */
export function isPlay(value: unknown): value is Play {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Play;
  if (p.version !== 1 || typeof p.title !== 'string' || !Array.isArray(p.players) || !Array.isArray(p.frames)) return false;
  if (p.frames.length === 0) return false;
  const ids = p.players.map((pl) => pl.id);
  return p.frames.every(
    (f) =>
      typeof f === 'object' &&
      f !== null &&
      ids.every((id) => isVec(f.positions?.[id])) &&
      ids.includes(f.discHolder) &&
      typeof f.duration === 'number',
  );
}

export function exportPlay(play: Play): string {
  return JSON.stringify(play, null, 2);
}

/** Parse a play file. Imported plays get a fresh id so they never overwrite an existing play. */
export function importPlay(text: string): Play {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That isn't a play file. It should be the text you got from Export.");
  }
  if (!isPlay(parsed)) throw new Error('That file is missing parts of a play (players, steps or the disc).');
  const now = Date.now();
  return { ...parsed, id: newId('play'), createdAt: now, updatedAt: now };
}

export function fileNameFor(play: Play): string {
  const slug = play.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'play';
  return `${slug}.play.json`;
}
