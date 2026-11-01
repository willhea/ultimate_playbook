import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Play } from './types';
import { createPlay } from './defaults';
import { createDemoPlay } from '../plays';
import { evaluate, frameAtTime, frameTimes, locate, staticFacing, throwGeometry, totalDuration } from './engine';
import { addStep, movePlayer, setFacing, setHolder } from './edit';
import { angleDiff, dist } from './geometry';
import { anyPlay } from '../test/arbitraries';

describe('timeline', () => {
  const play = createDemoPlay();
  const times = frameTimes(play);

  it('reaches each frame at the sum of the step durations', () => {
    let t = 0;
    play.frames.forEach((f, k) => {
      if (k > 0) t += f.duration;
      expect(times[k]).toBeCloseTo(t);
    });
    expect(totalDuration(play)).toBeCloseTo(t);
  });

  it('knows when the playhead is exactly on a step', () => {
    expect(frameAtTime(play, times[1])).toBe(1);
    expect(frameAtTime(play, (times[1] + times[2]) / 2)).toBeNull();
  });

  it('locates a time inside its step', () => {
    const mid = (times[1] + times[2]) / 2;
    expect(locate(play, mid)).toEqual({ index: 2, u: expect.closeTo(0.5, 6) });
    expect(locate(play, -1)).toEqual({ index: 0, u: 1 });
    expect(locate(play, 1e9)).toEqual({ index: play.frames.length - 1, u: 1 });
  });

  it('treats a play with only a setup as zero length', () => {
    const only = createPlay();
    expect(totalDuration(only)).toBe(0);
    expect(locate(only, 3)).toEqual({ index: 0, u: 1 });
  });
});

describe('positions', () => {
  it('shows exactly the saved positions at every step, for any play', () => {
    fc.assert(
      fc.property(anyPlay, (play) => {
        frameTimes(play).forEach((t, k) => {
          const view = evaluate(play, t);
          for (const p of play.players) expect(view.players[p.id].pos).toEqual(play.frames[k].positions[p.id]);
        });
      }),
      { numRuns: 60 },
    );
  });
});

/** Samples a play finely and returns the biggest jump in position, disc and facing, ignoring players right next to their facing target. */
function biggestJumps(play: Play, dt = 1 / 240) {
  let pos = 0;
  let disc = 0;
  let turn = 0;
  let where = '';
  let prev = evaluate(play, 0);
  const total = totalDuration(play);
  for (let t = dt; t <= total + 1e-9; t += dt) {
    const view = evaluate(play, Math.min(t, total));
    for (const p of play.players) {
      pos = Math.max(pos, dist(prev.players[p.id].pos, view.players[p.id].pos));
      // A player the disc (or their player) flies or runs right past turns quickly; that's expected.
      const target = p.team === 'D' && p.guards ? view.players[p.guards].pos : view.disc.pos;
      if (dist(view.players[p.id].pos, target) < 4) continue;
      const d = Math.abs(angleDiff(prev.players[p.id].facing, view.players[p.id].facing));
      if (d > turn) {
        turn = d;
        where = `${p.id} at ${t.toFixed(3)}s`;
      }
    }
    disc = Math.max(disc, dist(prev.disc.pos, view.disc.pos));
    prev = view;
  }
  return { pos, disc, turn, where };
}

/**
 * Finds a real jump: a change in a player's position or facing, or the disc's
 * position, that stays big however closely we look. Fast but smooth motion
 * spreads out when the interval is halved again and again; a jump doesn't.
 * Players whose facing target passes within a yard of them are skipped for
 * facing, because there the direction to the target genuinely flips.
 */
function discontinuity(play: Play, dt = 1 / 120): string | null {
  const total = totalDuration(play);
  const at = (t: number) => evaluate(play, Math.min(Math.max(t, 0), total));
  const targetDistance = (view: ReturnType<typeof evaluate>, id: string) => {
    const p = play.players.find((x) => x.id === id)!;
    const target = p.team === 'D' && p.guards ? view.players[p.guards].pos : view.disc.pos;
    return dist(view.players[id].pos, target);
  };
  type Probe = (a: ReturnType<typeof evaluate>, b: ReturnType<typeof evaluate>) => number;
  const probes: [string, Probe, number][] = [['disc', (a, b) => dist(a.disc.pos, b.disc.pos), 0.5]];
  for (const p of play.players) {
    probes.push([`${p.id} position`, (a, b) => dist(a.players[p.id].pos, b.players[p.id].pos), 0.5]);
    probes.push([
      `${p.id} facing`,
      (a, b) =>
        targetDistance(a, p.id) > 1 && targetDistance(b, p.id) > 1 ? Math.abs(angleDiff(a.players[p.id].facing, b.players[p.id].facing)) : 0,
      10,
    ]);
  }
  const jumps = (probe: Probe, limit: number, a: number, b: number, depth: number): boolean => {
    if (probe(at(a), at(b)) < limit) return false;
    if (depth === 0) return true;
    const m = (a + b) / 2;
    return jumps(probe, limit, a, m, depth - 1) || jumps(probe, limit, m, b, depth - 1);
  };
  let prev = at(0);
  for (let t = 0; t < total; t += dt) {
    const t1 = Math.min(t + dt, total);
    const next = at(t1);
    for (const [name, probe, limit] of probes) {
      // Only zoom in where a big change shows up between samples.
      if (probe(prev, next) >= limit && jumps(probe, limit, t, t1, 16)) return `${name} near ${t.toFixed(3)}s`;
    }
    prev = next;
  }
  return null;
}

describe('motion is smooth', () => {
  it('in the demo play', () => {
    const j = biggestJumps(createDemoPlay());
    expect(j.pos).toBeLessThan(0.5);
    expect(j.disc).toBeLessThan(1);
    expect(j.turn, j.where).toBeLessThan(20);
    expect(discontinuity(createDemoPlay())).toBeNull();
  });

  it('in any play built with the editor: no position, facing or disc ever jumps', () => {
    fc.assert(
      fc.property(anyPlay, (play) => {
        expect(discontinuity(play)).toBeNull();
      }),
      // FC_RUNS=1000 npm test runs a much longer search.
      { numRuns: Number(process.env.FC_RUNS ?? 40) },
    );
  }, 600_000);
});

describe('the disc', () => {
  const play = createDemoPlay();
  const times = frameTimes(play);
  const throwStep = play.frames.findIndex((f, k) => k > 0 && f.discHolder !== play.frames[k - 1].discHolder);

  it('stays in the thrower’s hand until the release', () => {
    const f = play.frames[throwStep];
    const justBefore = times[throwStep - 1] + f.duration * (f.release - 0.02);
    const view = evaluate(play, justBefore);
    expect(view.disc.inFlight).toBe(false);
    expect(dist(view.disc.pos, view.players[play.frames[throwStep - 1].discHolder].pos)).toBeLessThan(1.5);
  });

  it('flies after the release and lands in the receiver’s hand', () => {
    const f = play.frames[throwStep];
    const mid = times[throwStep - 1] + f.duration * (f.release + (1 - f.release) / 2);
    const view = evaluate(play, mid);
    expect(view.disc.inFlight).toBe(true);
    expect(view.disc.height).toBeGreaterThan(0);
    const end = evaluate(play, times[throwStep]);
    expect(end.disc.inFlight).toBe(false);
    expect(dist(end.disc.pos, f.positions[f.discHolder])).toBeLessThan(1.5);
  });

  it('describes the throw for drawing, only in steps that have one', () => {
    expect(throwGeometry(play, throwStep)).not.toBeNull();
    expect(throwGeometry(play, 0)).toBeNull();
  });
});

describe('automatic facing', () => {
  const play = createPlay();

  it('points defenders at the player they guard', () => {
    const d3 = play.frames[0].positions.D3;
    const o3 = play.frames[0].positions.O3;
    const expected = (Math.atan2(o3.y - d3.y, o3.x - d3.x) * 180) / Math.PI;
    expect(Math.abs(angleDiff(staticFacing(play, 0, 'D3'), expected))).toBeLessThan(0.01);
  });

  it('points offense at the disc, and the holder toward the attacking end zone', () => {
    expect(Math.abs(angleDiff(staticFacing(play, 0, 'O5'), 180))).toBeLessThan(15);
    expect(staticFacing(play, 0, 'O1')).toBe(0);
  });

  it('turns a receiver toward the throw when they catch it', () => {
    let p = addStep(play, 0);
    p = movePlayer(p, 1, 'O5', { x: 50, y: 30 });
    p = setHolder(p, 1, 'O5');
    const receiverFacing = staticFacing(p, 1, 'O5');
    const thrower = p.frames[1].positions.O1;
    const towardThrower = (Math.atan2(thrower.y - 30, thrower.x - 50) * 180) / Math.PI;
    expect(Math.abs(angleDiff(receiverFacing, towardThrower))).toBeLessThan(10);
  });

  it('turns a runner to face where they are running', () => {
    let p = addStep(play, 0);
    const o7 = play.frames[0].positions.O7;
    p = movePlayer(p, 1, 'O7', { x: o7.x, y: 2 }); // straight toward the top sideline
    const mid = evaluate(p, p.frames[1].duration / 2);
    expect(Math.abs(angleDiff(mid.players.O7.facing, 270))).toBeLessThan(5);
  });

  it('keeps a mark facing the thrower while shuffling', () => {
    let p = addStep(play, 0);
    const thrower = play.frames[0].positions.O1;
    p = movePlayer(p, 1, 'D1', { x: thrower.x + 3, y: thrower.y });
    const mid = evaluate(p, p.frames[1].duration / 2);
    const toThrower = (Math.atan2(thrower.y - mid.players.D1.pos.y, thrower.x - mid.players.D1.pos.x) * 180) / Math.PI;
    expect(Math.abs(angleDiff(mid.players.D1.facing, toThrower))).toBeLessThan(5);
  });

  it('lets a manual facing override the automatic one, and holds it while running', () => {
    let p = setFacing(play, 0, 'D3', 90);
    expect(staticFacing(p, 0, 'D3')).toBe(90);
    expect(staticFacing(setFacing(p, 0, 'D3', null), 0, 'D3')).toBe(staticFacing(play, 0, 'D3'));
    p = addStep(play, 0);
    p = movePlayer(p, 1, 'D6', { x: 80, y: 20 });
    p = setFacing(p, 1, 'D6', 180); // backpedalling: running deep while facing the disc
    const late = evaluate(p, p.frames[1].duration * 0.95);
    expect(Math.abs(angleDiff(late.players.D6.facing, 180))).toBeLessThan(25);
  });
});
