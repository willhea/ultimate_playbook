import { describe, expect, it } from 'vitest';
import { createDemoPlay, createPlay } from './defaults';
import { evaluate, frameAtTime, frameTimes, locate, staticFacing, totalDuration } from './engine';
import { addStep, deleteStep, movePlayer, moveStep, removePlayer, setCurve, setFacing, setHolder, setThrowCurve } from './edit';
import { angleDiff, dist } from './geometry';
import { exportPlay, importPlay, isPlay } from './storage';

describe('timeline', () => {
  const play = createDemoPlay();

  it('reaches each frame at the sum of the step durations', () => {
    frameTimes(play).forEach((t, k) => expect(t).toBeCloseTo([0, 2.2, 5.8][k]));
    expect(totalDuration(play)).toBeCloseTo(5.8);
    expect(frameAtTime(play, 2.2)).toBe(1);
    expect(frameAtTime(play, 3)).toBeNull();
    expect(locate(play, 4)).toEqual({ index: 2, u: (4 - 2.2) / 3.6 });
  });

  it('shows exactly the saved positions at each frame', () => {
    frameTimes(play).forEach((t, k) => {
      const view = evaluate(play, t);
      for (const p of play.players) expect(view.players[p.id].pos).toEqual(play.frames[k].positions[p.id]);
    });
  });
});

describe('motion is smooth', () => {
  const play = createDemoPlay();
  const dt = 1 / 120;
  const samples = Math.ceil(totalDuration(play) / dt);

  it('never jumps position or turns suddenly between animation frames', () => {
    let prev = evaluate(play, 0);
    for (let s = 1; s <= samples; s++) {
      const view = evaluate(play, Math.min(s * dt, totalDuration(play)));
      for (const p of play.players) {
        expect(dist(prev.players[p.id].pos, view.players[p.id].pos)).toBeLessThan(0.5);
        expect(Math.abs(angleDiff(prev.players[p.id].facing, view.players[p.id].facing))).toBeLessThan(20);
      }
      expect(dist(prev.disc.pos, view.disc.pos)).toBeLessThan(1);
      prev = view;
    }
  });

  it('flies the disc from the thrower to the receiver', () => {
    const atCatch = evaluate(play, frameTimes(play)[1]);
    expect(dist(atCatch.disc.pos, play.frames[1].positions.O3)).toBeLessThan(1.5);
    const midThrow = evaluate(play, 2.2 * 0.8);
    expect(midThrow.disc.inFlight).toBe(true);
    expect(midThrow.disc.height).toBeGreaterThan(0);
  });
});

describe('automatic facing', () => {
  const play = createPlay();

  it('points defenders at the player they guard and offense at the disc', () => {
    const d3 = play.frames[0].positions.D3;
    const o3 = play.frames[0].positions.O3;
    const expected = (Math.atan2(o3.y - d3.y, o3.x - d3.x) * 180) / Math.PI;
    expect(Math.abs(angleDiff(staticFacing(play, 0, 'D3'), expected))).toBeLessThan(0.01);
    // O5 is downfield of the disc, so faces back toward it (roughly −x).
    expect(Math.abs(angleDiff(staticFacing(play, 0, 'O5'), 180))).toBeLessThan(10);
    // The holder faces the attacking end zone.
    expect(staticFacing(play, 0, 'O1')).toBe(0);
  });

  it('lets a manual facing override the automatic one', () => {
    const turned = setFacing(play, 0, 'D3', 90);
    expect(staticFacing(turned, 0, 'D3')).toBe(90);
    expect(staticFacing(setFacing(turned, 0, 'D3', null), 0, 'D3')).toBe(staticFacing(play, 0, 'D3'));
  });
});

describe('editing', () => {
  it('carries a setup change into later steps where the player has not moved', () => {
    const play = addStep(addStep(createPlay(), 0), 1);
    const moved = movePlayer(play, 0, 'O6', { x: 60, y: 10 });
    expect(moved.frames.map((f) => f.positions.O6)).toEqual([
      { x: 60, y: 10 },
      { x: 60, y: 10 },
      { x: 60, y: 10 },
    ]);
    expect(play.frames[0].positions.O6).not.toEqual({ x: 60, y: 10 });
  });

  it('stops carrying a change at the first step where the player runs', () => {
    let play = addStep(addStep(createPlay(), 0), 1);
    play = movePlayer(play, 2, 'O6', { x: 80, y: 5 });
    const moved = movePlayer(play, 0, 'O6', { x: 60, y: 10 });
    expect(moved.frames[1].positions.O6).toEqual({ x: 60, y: 10 });
    expect(moved.frames[2].positions.O6).toEqual({ x: 80, y: 5 });
  });

  it('passes the disc on in later steps that still had the old holder', () => {
    const play = addStep(addStep(createPlay(), 0), 1);
    const passed = setHolder(play, 1, 'O3');
    expect(passed.frames.map((f) => f.discHolder)).toEqual(['O1', 'O3', 'O3']);
  });

  it('adds, reorders and deletes steps but keeps the setup first', () => {
    let play = addStep(createPlay(), 0);
    play = addStep(play, 1);
    const [, a, b] = play.frames;
    expect(moveStep(play, 1, 1).frames.map((f) => f.id).slice(1)).toEqual([b.id, a.id]);
    expect(moveStep(play, 1, -1)).toBe(play);
    expect(deleteStep(play, 0)).toBe(play);
    expect(deleteStep(play, 1).frames).toHaveLength(2);
  });

  it('will not remove a player who has the disc', () => {
    const play = createPlay();
    expect(removePlayer(play, 'O1')).toBe(play);
    const fewer = removePlayer(play, 'O7');
    expect(fewer.players.some((p) => p.id === 'O7')).toBe(false);
    expect(fewer.players.find((p) => p.id === 'D7')?.guards).toBeNull();
  });
});

describe('play files', () => {
  it('round-trips through export and import with a new id', () => {
    const play = createDemoPlay();
    const copy = importPlay(exportPlay(play));
    expect(copy.id).not.toBe(play.id);
    expect(copy.frames).toEqual(play.frames);
    expect(isPlay(copy)).toBe(true);
  });

  it('rejects text that is not a play', () => {
    expect(() => importPlay('hello')).toThrow(/isn't a play file/);
    expect(() => importPlay('{"version":1}')).toThrow(/missing parts/);
  });
});

describe('motion is smooth in randomly built plays', () => {
  // Small deterministic random generator so failures are reproducible.
  const rng = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let seed = 1; seed <= 25; seed++) {
    it(`play #${seed}`, () => {
      const rand = rng(seed);
      let play = createPlay();
      for (let s = 1; s <= 4; s++) {
        play = addStep(play, s - 1);
        play = { ...play, frames: play.frames.map((f, k) => (k === s ? { ...f, release: 0.2 + rand() * 0.6 } : f)) };
        for (const p of play.players) {
          if (rand() < 0.5) continue;
          play = movePlayer(play, s, p.id, { x: 10 + rand() * 90, y: rand() * 40 });
          if (rand() < 0.5) play = setCurve(play, s, p.id, { x: rand() * 16 - 8, y: rand() * 16 - 8 });
        }
        if (rand() < 0.6) {
          const offense = play.players.filter((p) => p.team === 'O' && p.id !== play.frames[s].discHolder);
          play = setHolder(play, s, offense[Math.floor(rand() * offense.length)].id);
          if (rand() < 0.5) play = setThrowCurve(play, s, { x: rand() * 20 - 10, y: rand() * 20 - 10 });
        }
        if (rand() < 0.3) play = setFacing(play, s, play.players[Math.floor(rand() * 14)].id, rand() * 360);
      }
      const dt = 1 / 240;
      let prev = evaluate(play, 0);
      for (let t = dt; t <= totalDuration(play) + 1e-9; t += dt) {
        const view = evaluate(play, t);
        for (const p of play.players) {
          // Someone the disc (or their player) flies or runs right past turns quickly; that's expected.
          const target = p.team === 'D' && p.guards ? view.players[p.guards].pos : view.disc.pos;
          if (dist(view.players[p.id].pos, target) < 4) continue;
          const turn = Math.abs(angleDiff(prev.players[p.id].facing, view.players[p.id].facing));
          expect(turn, `${p.id} at ${t.toFixed(3)}s`).toBeLessThan(30);
        }
        prev = view;
      }
    });
  }
});
