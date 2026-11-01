import { afterEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import { createDemoPlay } from './defaults';
import { exportPlay, fileNameFor, importPlay, isPlay, loadCurrentId, loadPlays, saveCurrentId, savePlays } from './storage';
import { anyPlay } from '../test/arbitraries';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('play files', () => {
  it('round-trips any play through export and import, with a new id', () => {
    fc.assert(
      fc.property(anyPlay, (play) => {
        const copy = importPlay(exportPlay(play));
        expect(copy.id).not.toBe(play.id);
        // JSON can't tell -0 from 0, which doesn't matter for positions; compare what a file can hold.
        const asSaved = JSON.parse(JSON.stringify(play));
        expect(copy.frames).toEqual(asSaved.frames);
        expect(copy.players).toEqual(asSaved.players);
        expect(isPlay(copy)).toBe(true);
      }),
      { numRuns: 50 },
    );
  });

  it('rejects text that is not a play, with a message a person can act on', () => {
    expect(() => importPlay('hello')).toThrow(/isn't a play file/);
    expect(() => importPlay('{"version":1}')).toThrow(/missing parts/);
    const broken = JSON.parse(exportPlay(createDemoPlay()));
    delete broken.frames[1].positions.O3;
    expect(() => importPlay(JSON.stringify(broken))).toThrow(/missing parts/);
  });

  it('names files after the play', () => {
    expect(fileNameFor({ ...createDemoPlay(), title: 'Ho stack: wing iso!' })).toBe('ho-stack-wing-iso.play.json');
    expect(fileNameFor({ ...createDemoPlay(), title: '' })).toBe('play.play.json');
  });
});

describe('browser storage', () => {
  it('saves and loads plays and the open play', () => {
    vi.stubGlobal('localStorage', memoryStorage());
    const play = createDemoPlay();
    savePlays([play]);
    saveCurrentId(play.id);
    expect(loadPlays()).toEqual([play]);
    expect(loadCurrentId()).toBe(play.id);
  });

  it('drops anything saved that is not a valid play', () => {
    const store = memoryStorage();
    vi.stubGlobal('localStorage', store);
    store.setItem('ultimate-animations:plays', JSON.stringify([createDemoPlay(), { junk: true }]));
    expect(loadPlays()).toHaveLength(1);
    store.setItem('ultimate-animations:plays', 'not json');
    expect(loadPlays()).toEqual([]);
  });

  it('keeps working when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(loadPlays()).toEqual([]);
    expect(loadCurrentId()).toBeNull();
    expect(() => savePlays([createDemoPlay()])).not.toThrow();
    expect(() => saveCurrentId('x')).not.toThrow();
  });
});
