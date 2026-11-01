import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDemoPlay, examplePlays } from '../plays';
import { createPlay } from '../model/defaults';
import { movePlayer } from '../model/edit';
import { currentPlay, initLibrary, libraryReducer, type LibraryState } from './library';

/** Two plays, with the demo open. */
function start(): LibraryState {
  const play = createDemoPlay();
  return { plays: [play, createPlay('Other')], currentId: play.id, past: [], future: [], dragBase: null };
}
const moveO7 = (s: LibraryState, x: number) => movePlayer(currentPlay(s), 0, 'O7', { x, y: 10 });
const o7 = (s: LibraryState) => currentPlay(s).frames[0].positions.O7.x;

describe('undo and redo', () => {
  it('undoes and redoes several edits in order, and a new edit clears the redo history', () => {
    const s0 = start();
    const before = o7(s0);
    let s = libraryReducer(s0, { type: 'edit', play: moveO7(s0, 70) });
    s = libraryReducer(s, { type: 'edit', play: moveO7(s, 80) });
    expect(s.plays[1]).toBe(s0.plays[1]); // editing one play leaves the others alone
    s = libraryReducer(s, { type: 'undo' });
    expect(o7(s)).toBe(70);
    s = libraryReducer(s, { type: 'undo' });
    expect(o7(s)).toBe(before);
    s = libraryReducer(libraryReducer(s, { type: 'redo' }), { type: 'redo' });
    expect(o7(s)).toBe(80);
    s = libraryReducer(s, { type: 'undo' });
    s = libraryReducer(libraryReducer(s, { type: 'undo' }), { type: 'edit', play: moveO7(s, 50) });
    expect(s.future).toEqual([]);
  });

  it('records a whole drag, or a half-typed name, as one undo step', () => {
    let s = start();
    const before = o7(s);
    for (const x of [62, 64, 66]) s = libraryReducer(s, { type: 'preview', play: moveO7(s, x) });
    s = libraryReducer(s, { type: 'endPreview' });
    expect(s.past).toHaveLength(1);
    expect(o7(libraryReducer(s, { type: 'undo' }))).toBe(before);

    const s0 = start();
    s = libraryReducer(s0, { type: 'preview', play: { ...currentPlay(s0), title: 'Half typ' } });
    expect(currentPlay(libraryReducer(s, { type: 'undo' })).title).toBe(currentPlay(s0).title);
  });
});

describe('the plays list', () => {
  it('creates, duplicates and opens plays, each with fresh history', () => {
    const s0 = start();
    let s = libraryReducer(s0, { type: 'edit', play: moveO7(s0, 70) });
    s = libraryReducer(s, { type: 'duplicate' });
    expect(s.plays).toHaveLength(3);
    expect(currentPlay(s).title).toMatch(/\(copy\)$/);
    expect(s.past).toEqual([]);
    s = libraryReducer(s, { type: 'open', id: s.plays[1].id });
    expect(s.currentId).toBe(s.plays[1].id);
  });

  it('deletes the chosen play, always leaving one to work on', () => {
    const s0 = start();
    let s = libraryReducer(s0, { type: 'delete', id: s0.currentId });
    expect(s.plays.map((p) => p.title)).toEqual(['Other']);
    expect(s.currentId).toBe(s.plays[0].id);
    s = libraryReducer(s, { type: 'delete', id: s.plays[0].id });
    expect(s.plays).toHaveLength(1);
    expect(s.plays[0].title).not.toBe('Other');
  });
});

describe('opening the app', () => {
  afterEach(() => vi.unstubAllGlobals());
  const storage = (data: Record<string, string>) => ({ getItem: (k: string) => data[k] ?? null, setItem: () => {} });

  it('starts with the example plays on a first visit', () => {
    vi.stubGlobal('localStorage', storage({}));
    expect(initLibrary().plays.map((p) => p.title)).toEqual(examplePlays.map((p) => p.title));
  });

  it('reopens the play that was open last time', () => {
    const a = createPlay('A');
    const b = createPlay('B');
    vi.stubGlobal('localStorage', storage({ 'ultimate-playbook:plays': JSON.stringify([a, b]), 'ultimate-playbook:current': b.id }));
    expect(currentPlay(initLibrary()).title).toBe('B');
  });
});
