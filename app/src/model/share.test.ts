import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { decodePlay, encodePlay, parseHash, slugOf } from './share';
import { anyPlay } from '../test/arbitraries';
import { createDemoPlay, playbook } from '../plays';

describe('share links', () => {
  it('carry any play inside the link, to the centimetre, under a fresh id', async () => {
    await fc.assert(
      fc.asyncProperty(anyPlay, async (play) => {
        const code = await encodePlay(play);
        expect(code).toMatch(/^[A-Za-z0-9_-]+$/); // safe in a link as it is
        const back = await decodePlay(code);
        expect(back.id).not.toBe(play.id);
        expect(back.frames.map((f) => f.discHolder)).toEqual(play.frames.map((f) => f.discHolder));
        back.frames.forEach((f, i) => {
          for (const [id, p] of Object.entries(play.frames[i].positions)) {
            expect(Math.abs(f.positions[id].x - p.x)).toBeLessThanOrEqual(0.0051);
            expect(Math.abs(f.positions[id].y - p.y)).toBeLessThanOrEqual(0.0051);
          }
        });
      }),
      { numRuns: 25 },
    );
  });

  it('are short enough to send in a message', async () => {
    expect((await encodePlay(createDemoPlay())).length).toBeLessThan(3000);
  });

  it('explain, rather than crash, when a link is broken or cut off', async () => {
    const code = await encodePlay(createDemoPlay());
    for (const bad of ['', 'not a play', code.slice(0, code.length / 2), 'A'.repeat(70_000)]) {
      await expect(decodePlay(bad)).rejects.toThrow(/whole play/);
    }
  });

  it('read what a page address asks for', () => {
    expect(parseHash('#play=abc_-1')).toEqual({ kind: 'shared', code: 'abc_-1' });
    expect(parseHash('#playbook=vertical-stack-dump-and-swing')).toEqual({ kind: 'playbook', slug: 'vertical-stack-dump-and-swing' });
    expect(parseHash('')).toEqual({ kind: 'none' });
    expect(parseHash('#something-else')).toEqual({ kind: 'none' });
  });

  it('give every playbook play its own short name', () => {
    const slugs = playbook().map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugOf('Vertical stack: back cuts under, then deep')).toBe('vertical-stack-back-cuts-under-then-deep');
  });
});
