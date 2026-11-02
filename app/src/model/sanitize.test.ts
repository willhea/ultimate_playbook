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
