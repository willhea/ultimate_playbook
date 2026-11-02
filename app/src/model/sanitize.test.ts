// A share link or an imported file can contain anything. These try to break the app
// with damaged plays: each must be refused, or come back whole and safe to show.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { LIMITS, readPlay } from './sanitize';
import { decodePlay } from './share';
import { evaluate, totalDuration } from './engine';
import { forceView } from './force';
import { validatePlay } from './validate';
import { fitView } from './view';
import { buildExamplePlays, createDemoPlay } from '../plays';

/** Every place inside a JSON value that can be replaced. */
function paths(v: unknown, at: (string | number)[] = []): (string | number)[][] {
  if (typeof v !== 'object' || v === null) return [at];
  const keys = Array.isArray(v) ? v.map((_, i) => i) : Object.keys(v);
  return [at, ...keys.flatMap((k) => paths((v as Record<string | number, unknown>)[k], [...at, k]))];
}

function replaceAt(root: unknown, path: (string | number)[], value: unknown): unknown {
  if (path.length === 0) return value;
  const copy = JSON.parse(JSON.stringify(root));
  let node = copy;
  for (const k of path.slice(0, -1)) node = node[k];
  node[path[path.length - 1]] = value;
  return copy;
}

function expectSafe(value: unknown) {
  const play = readPlay(value);
  if (!play) return;
  expect(typeof play.title).toBe('string');
  for (const f of play.frames) expect([typeof f.name, typeof f.notes]).toEqual(['string', 'string']);
  const total = totalDuration(play);
  expect(Number.isFinite(total)).toBe(true);
  for (const t of [0, total / 2, total]) {
    const view = evaluate(play, t);
    for (const p of Object.values(view.players)) expect(Number.isFinite(p.pos.x + p.pos.y + p.facing)).toBe(true);
    forceView(play, view);
  }
  validatePlay(play);
  fitView(play);
}

describe('reading plays from outside the app', () => {
  const originals = JSON.parse(JSON.stringify(buildExamplePlays()));

  it('keeps every example play exactly as it was', () => {
    for (const p of originals) expect(readPlay(p)).toEqual(p);
  });

  it('refuses or safely repairs a play with any part damaged', () => {
    fc.assert(
      fc.property(fc.nat(), fc.nat(), fc.jsonValue({ maxDepth: 2 }), (which, where, junk) => {
        const play = originals[which % originals.length];
        const all = paths(play);
        expectSafe(replaceAt(play, all[where % all.length], junk));
      }),
      { numRuns: 600 },
    );
  });

  it('refuses plays too long to show', () => {
    const play = JSON.parse(JSON.stringify(createDemoPlay()));
    play.frames = Array.from({ length: LIMITS.frames + 1 }, (_, i) => ({ ...play.frames[1], id: `f${i}` }));
    expect(readPlay(play)).toBeNull();
    const slow = JSON.parse(JSON.stringify(createDemoPlay()));
    slow.frames[1].duration = 1e12;
    expect(readPlay(slow)).toBeNull();
  });

  it('refuses a short link that would unpack into something huge', async () => {
    const huge = new TextEncoder().encode(' '.repeat(5_000_000));
    const packed = new Uint8Array(await new Response(new Blob([huge]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
    let bin = '';
    for (const b of packed) bin += String.fromCharCode(b);
    const code = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(code.length).toBeLessThan(10_000);
    await expect(decodePlay(code)).rejects.toThrow(/whole play/);
  });
});

describe('reading plays from outside the app: specific damage', () => {
  const good = () => JSON.parse(JSON.stringify(createDemoPlay()));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refused: [string, (p: any) => void][] = [
    ['a player id that isn’t O1–O7 or D1–D7', (p) => (p.players[0].id = 'O9')],
    ['a player id with extra text', (p) => (p.players[0].id = 'xO1')],
    ['two players with the same id', (p) => (p.players[1] = { ...p.players[0] })],
    ['a player on the wrong team for their id', (p) => (p.players[0].team = 'D')],
    ['a player whose number doesn’t match their id', (p) => (p.players[0].number = 3)],
    ['the disc held by a defender', (p) => (p.frames[1].discHolder = 'D1')],
    ['a position far off the field', (p) => (p.frames[1].positions.O3 = { x: 5000, y: 10 })],
    ['a position that isn’t a number', (p) => (p.frames[1].positions.O3 = { x: '40', y: 10 })],
    ['a step with no length', (p) => (p.frames[1].duration = 0)],
    ['no offense at all', (p) => (p.players = p.players.filter((x: { team: string }) => x.team === 'D'))],
  ];
  for (const [what, damage] of refused) {
    it(`refuses ${what}`, () => {
      const p = good();
      damage(p);
      expect(readPlay(p)).toBeNull();
    });
  }

  it('repairs what can be repaired, and drops what can’t', () => {
    const p = good();
    p.title = 'T'.repeat(500);
    p.frames[1].notes = 'n'.repeat(LIMITS.notes + 100);
    p.frames[1].facing = { O3: 'left', O4: 90, O5: 5000 };
    p.frames[1].curves = { O7: { x: 'a', y: 1 } };
    p.frames[2].id = p.frames[1].id; // duplicate step ids
    p.frames[1].release = 3;
    p.players.find((x: { id: string }) => x.id === 'D3').guards = 'D4'; // a defender guarding a defender
    p.open = 'sideways';
    p.stack = { kind: 'vertical', depth: 12 }; // no spacing
    const r = readPlay(p)!;
    expect(r.title).toHaveLength(LIMITS.title);
    expect(r.frames[1].notes).toHaveLength(LIMITS.notes);
    expect(r.frames[1].facing).toEqual({ O4: 90 });
    expect(r.frames[1].curves).toEqual({});
    expect(r.frames[2].id).not.toBe(r.frames[1].id);
    expect(r.frames[1].release).toBe(0.4);
    expect(r.players.find((x) => x.id === 'D3')!.guards).toBeNull();
    expect(r.open).toBeUndefined();
    expect(r.stack).toBeUndefined();
    const h = good();
    h.stack = { kind: 'horizontal', depth: 15 };
    h.open = 'top';
    expect(readPlay(h)).toMatchObject({ stack: { kind: 'horizontal', depth: 15 }, open: 'top' });
  });
});
