import { describe, expect, it } from 'vitest';
import { createDemoPlay, createPlay } from '../model/defaults';
import { movePlayer } from '../model/edit';
import { currentPlay, libraryReducer, type LibraryState } from './library';

function start(): LibraryState {
  const play = createDemoPlay();
  return { plays: [play], currentId: play.id, past: [], future: [], dragBase: null };
}

const moveO7 = (s: LibraryState, x: number) => movePlayer(currentPlay(s), 0, 'O7', { x, y: 10 });

describe('undo and redo', () => {
  it('undoes and redoes an edit', () => {
    const s0 = start();
    const s1 = libraryReducer(s0, { type: 'edit', play: moveO7(s0, 70) });
    expect(currentPlay(s1).frames[0].positions.O7).toEqual({ x: 70, y: 10 });
    const s2 = libraryReducer(s1, { type: 'undo' });
    expect(currentPlay(s2).frames).toEqual(currentPlay(s0).frames);
    const s3 = libraryReducer(s2, { type: 'redo' });
    expect(currentPlay(s3).frames).toEqual(currentPlay(s1).frames);
  });

  it('records a whole drag as one undo step', () => {
    let s = start();
    const before = currentPlay(s);
    for (const x of [62, 64, 66, 68]) s = libraryReducer(s, { type: 'preview', play: moveO7(s, x) });
    s = libraryReducer(s, { type: 'endPreview' });
    expect(s.past).toHaveLength(1);
    expect(currentPlay(s).frames[0].positions.O7.x).toBe(68);
    s = libraryReducer(s, { type: 'undo' });
    expect(currentPlay(s).frames).toEqual(before.frames);
  });

  it('undoes an edit still in progress, like a half-typed name', () => {
    let s = start();
    const before = currentPlay(s);
    s = libraryReducer(s, { type: 'preview', play: { ...before, title: 'Half typ' } });
    s = libraryReducer(s, { type: 'undo' });
    expect(currentPlay(s).title).toBe(before.title);
    s = libraryReducer(s, { type: 'redo' });
    expect(currentPlay(s).title).toBe('Half typ');
  });

  it('forgets the redo history after a new edit', () => {
    let s = start();
    s = libraryReducer(s, { type: 'edit', play: moveO7(s, 70) });
    s = libraryReducer(s, { type: 'undo' });
    s = libraryReducer(s, { type: 'edit', play: moveO7(s, 50) });
    expect(s.future).toEqual([]);
    expect(libraryReducer(s, { type: 'redo' })).toBe(s);
  });

  it('ignores undo and redo with nothing to do, and edits that change nothing', () => {
    const s = start();
    expect(libraryReducer(s, { type: 'undo' })).toBe(s);
    expect(libraryReducer(s, { type: 'redo' })).toBe(s);
    expect(libraryReducer(s, { type: 'edit', play: currentPlay(s) })).toBe(s);
    expect(libraryReducer(s, { type: 'endPreview' })).toBe(s);
  });

  it('stamps edits with the time they were made', () => {
    const s = start();
    const old = { ...currentPlay(s), updatedAt: 0 };
    const next = libraryReducer({ ...s, plays: [old] }, { type: 'edit', play: { ...old, title: 'New' } });
    expect(currentPlay(next).updatedAt).toBeGreaterThan(0);
  });
});

describe('the plays list', () => {
  it('creates and opens a new play, with fresh history', () => {
    let s = libraryReducer(start(), { type: 'edit', play: moveO7(start(), 70) });
    s = libraryReducer(s, { type: 'create' });
    expect(s.plays).toHaveLength(2);
    expect(currentPlay(s).title).toBe('Untitled play');
    expect(s.past).toEqual([]);
  });

  it('creates from a given play (import or template)', () => {
    const p = createPlay('From template');
    const s = libraryReducer(start(), { type: 'create', play: p });
    expect(currentPlay(s)).toBe(p);
  });

  it('duplicates the open play under a new id', () => {
    const s = libraryReducer(start(), { type: 'duplicate' });
    expect(s.plays).toHaveLength(2);
    expect(currentPlay(s).id).not.toBe(s.plays[1].id);
    expect(currentPlay(s).title).toMatch(/\(copy\)$/);
  });

  it('opens another play, ignoring unknown ids', () => {
    let s = libraryReducer(start(), { type: 'create' });
    const other = s.plays[1].id;
    s = libraryReducer(s, { type: 'open', id: other });
    expect(s.currentId).toBe(other);
    expect(libraryReducer(s, { type: 'open', id: 'nope' })).toBe(s);
  });

  it('deletes plays, always leaving one to work on', () => {
    let s = libraryReducer(start(), { type: 'create' });
    const [newest, oldest] = s.plays;
    s = libraryReducer(s, { type: 'delete', id: oldest.id });
    expect(s.plays.map((p) => p.id)).toEqual([newest.id]);
    s = libraryReducer(s, { type: 'delete', id: newest.id });
    expect(s.plays).toHaveLength(1);
    expect(s.plays[0].id).not.toBe(newest.id);
  });
});
