import { afterEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import { createDemoPlay } from '../plays';
import { exportPlay, importPlay, isPlay, loadCurrentId, loadPlays, saveCurrentId, savePlays } from './storage';
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

  it('rejects play files with any required part missing or the wrong type', () => {
    const good = JSON.parse(exportPlay(createDemoPlay()));
    // A parsed file is untyped JSON; breaking it on purpose needs a loose type.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const broken: [string, (p: any) => void][] = [
      ['an unknown version', (p) => (p.version = 3)],
      ['no title', (p) => delete p.title],
      ['no players', (p) => delete p.players],
      ['no steps', (p) => (p.frames = [])],
      ['a position that is not a point', (p) => (p.frames[0].positions.O2 = { x: 'left', y: 3 })],
      ['a step with no length', (p) => delete p.frames[1].duration],
      ['the disc held by nobody', (p) => (p.frames[1].discHolder = 'O9')],
      ['not an object', (p) => (p.frames[1] = null)],
    ];
    expect(isPlay(good)).toBe(true);
    for (const [what, breakIt] of broken) {
      const p = structuredClone(good);
      breakIt(p);
      expect(isPlay(p), what).toBe(false);
    }
  });

  it('rejects text that is not a play, with a message a person can act on', () => {
    expect(() => importPlay('hello')).toThrow(/isn't a play file/);
    expect(() => importPlay('{"version":1}')).toThrow(/missing parts/);
    const broken = JSON.parse(exportPlay(createDemoPlay()));
    delete broken.frames[1].positions.O3;
    expect(() => importPlay(JSON.stringify(broken))).toThrow(/missing parts/);
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
    store.setItem('ultimate-playbook:plays', JSON.stringify([createDemoPlay(), { junk: true }]));
    expect(loadPlays()).toHaveLength(1);
    store.setItem('ultimate-playbook:plays', 'not json');
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
