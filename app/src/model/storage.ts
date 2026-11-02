/** Saving plays in the browser, and reading/writing play files. */
import type { Play } from './types';
import { newId } from './edit';
import { readPlay } from './sanitize';

const PLAYS_KEY = 'ultimate-playbook:plays';
const CURRENT_KEY = 'ultimate-playbook:current';

export function loadPlays(): Play[] {
  try {
    const raw = localStorage.getItem(PLAYS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(readPlay).filter((p): p is Play => p !== null) : [];
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

/** Checks that something is a whole play (from this version or an older one), so a bad file can't break the app. */
export function isPlay(value: unknown): boolean {
  return readPlay(value) !== null;
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
  const play = readPlay(parsed);
  if (!play) throw new Error('That file is missing parts of a play (players, steps or the disc).');
  const now = Date.now();
  return { ...play, id: newId('play'), createdAt: now, updatedAt: now };
}

export function fileNameFor(play: Play): string {
  const slug = play.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'play';
  return `${slug}.play.json`;
}
