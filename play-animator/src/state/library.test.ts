import { describe, expect, it } from 'vitest';
import { createDemoPlay } from '../plays';
import { movePlayer } from '../model/edit';
import { currentPlay, libraryReducer, type LibraryState } from './library';

function start(): LibraryState {
  const play = createDemoPlay();
  return { plays: [play], currentId: play.id, past: [], future: [], dragBase: null };
}
const moveO7 = (s: LibraryState, x: number) => movePlayer(currentPlay(s), 0, 'O7', { x, y: 10 });
const o7 = (s: LibraryState) => currentPlay(s).frames[0].positions.O7.x;

describe('undo and redo', () => {
  it('undoes and redoes an edit, and a new edit clears the redo history', () => {
    const s0 = start();
    const before = o7(s0);
    let s = libraryReducer(s0, { type: 'edit', play: moveO7(s0, 70) });
    s = libraryReducer(s, { type: 'undo' });
    expect(o7(s)).toBe(before);
    s = libraryReducer(s, { type: 'redo' });
    expect(o7(s)).toBe(70);
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
    expect(s.plays).toHaveLength(2);
    expect(currentPlay(s).title).toMatch(/\(copy\)$/);
    expect(s.past).toEqual([]);
    s = libraryReducer(s, { type: 'open', id: s.plays[1].id });
    expect(s.currentId).toBe(s.plays[1].id);
  });

  it('deletes plays, always leaving one to work on', () => {
    const s0 = start();
    let s = libraryReducer(s0, { type: 'delete', id: s0.currentId });
    expect(s.plays).toHaveLength(1);
    s = libraryReducer(s, { type: 'delete', id: s.plays[0].id });
    expect(s.plays).toHaveLength(1);
  });
});
