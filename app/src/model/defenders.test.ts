import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createPlay } from './defaults';
import { addPlayer, addStep, movePlayer, removePlayer, setGuards, setHolder, setManual } from './edit';
import { guardSpot, markSpot } from './formations';
import { dist } from './geometry';
import { evaluate, frameTimes } from './engine';
import { PLAYER_RADIUS } from './field';
import { TRAIL } from './defenders';
import { exportPlay, importPlay } from './storage';
import { buildPlay, stepScript } from '../test/arbitraries';

const oneStep = () => addStep(createPlay(), 0);

describe('automatic defenders', () => {
  it('trail a step behind a runner, and keep their spacing when their player stands still', () => {
    const play = movePlayer(oneStep(), 1, 'O7', { x: 50, y: 30 });
    const [setup, step] = play.frames;
    expect(dist(step.positions.D7, step.positions.O7)).toBeCloseTo(TRAIL, 5);
    expect(step.positions.D7.x).toBeGreaterThan(50); // behind O7, who ran back toward the disc
    expect(step.positions.D6).toEqual(setup.positions.D6);
  });

  it('trail on the side of the run they started on', () => {
    // O5 runs straight downfield; D5 starts on the open (home, bottom) side, so trails on that side.
    const o5 = createPlay().frames[0].positions.O5;
    const play = movePlayer(oneStep(), 1, 'O5', { x: o5.x + 15, y: o5.y });
    const { D5, O5 } = play.frames[1].positions;
    expect(D5.y).toBeGreaterThan(O5.y + 1);
    expect(D5.x).toBeLessThan(O5.x - 1);
  });

  it('stay close to their player all the way through a cut, swinging round behind them', () => {
    // O7 cuts under from the back; D7 starts on the deep, open side and ends trailing.
    const play = movePlayer(oneStep(), 1, 'O7', { x: 50, y: 30 });
    const times = frameTimes(play);
    for (let k = 1; k < 20; k++) {
      const view = evaluate(play, (times[1] * k) / 20);
      const gap = dist(view.players.D7.pos, view.players.O7.pos);
      expect(gap, `${k}/20 of the way`).toBeGreaterThan(2);
      expect(gap, `${k}/20 of the way`).toBeLessThan(4.5);
    }
  });

  it('come along when their player is moved in the setup', () => {
    const play = movePlayer(oneStep(), 0, 'O4', { x: 60, y: 10 });
    const gap = (f: number) => ({ x: play.frames[f].positions.D4.x - 60, y: play.frames[f].positions.D4.y - 10 });
    const before = createPlay().frames[0].positions;
    expect(gap(0)).toEqual({ x: expect.closeTo(before.D4.x - before.O4.x), y: expect.closeTo(before.D4.y - before.O4.y) });
    expect(gap(1)).toEqual(gap(0));
  });

  it('step up to mark a player who catches the disc', () => {
    const play = setHolder(oneStep(), 1, 'O3');
    expect(play.frames[1].positions.D3).toEqual(markSpot(play.frames[1].positions.O3));
  });

  it('stay where they are dragged in a step, until set back to automatic', () => {
    let play = movePlayer(oneStep(), 1, 'D5', { x: 70, y: 30 });
    play = movePlayer(play, 1, 'O5', { x: 50, y: 10 });
    expect(play.frames[1].positions.D5).toEqual({ x: 70, y: 30 });
    play = setManual(play, 1, 'D5', false);
    expect(dist(play.frames[1].positions.D5, play.frames[1].positions.O5)).toBeCloseTo(TRAIL, 5);
  });

  it('move to guard a new player, and follow them from then on', () => {
    let play = setGuards(oneStep(), 'D3', 'O7');
    expect(play.frames[0].positions.D3).toEqual(guardSpot(play.frames[0].positions.O7, play.frames[0].positions.O1));
    play = movePlayer(play, 1, 'O7', { x: 90, y: 30 });
    expect(dist(play.frames[1].positions.D3, play.frames[1].positions.O7)).toBeCloseTo(TRAIL, 5);
  });

  it('includes a defender added back to the play: they mark or follow straight away', () => {
    // Found by the edit fuzzer: a re-added defender stood on the sideline until the next edit.
    let play = setHolder(oneStep(), 1, 'O2');
    play = addPlayer(removePlayer(play, 'D2'), 'D');
    expect(play.frames[1].positions.D2).toEqual(markSpot(play.frames[1].positions.O2));
  });

  it('never run through the player they guard', () => {
    const offenseOnly = fc
      .array(stepScript, { minLength: 1, maxLength: 3 })
      .map((steps) => buildPlay(steps.map((s) => ({ ...s, moves: s.moves.filter((m) => m.player.startsWith('O')) }))));
    fc.assert(
      fc.property(offenseOnly, (play) => {
        const times = frameTimes(play);
        for (let i = 1; i < play.frames.length; i++) {
          for (let k = 1; k < 40; k++) {
            const view = evaluate(play, times[i - 1] + ((times[i] - times[i - 1]) * k) / 40);
            for (let n = 1; n <= 7; n++) {
              expect(dist(view.players[`D${n}`].pos, view.players[`O${n}`].pos)).toBeGreaterThan(PLAYER_RADIUS);
            }
          }
        }
      }),
      { numRuns: 60 },
    );
  });

  it('leave plays saved before automatic defenders looking exactly as they did', () => {
    // An old (version 1) file: every defender was placed by hand.
    const old = JSON.parse(exportPlay(movePlayer(oneStep(), 1, 'O7', { x: 50, y: 30 })));
    old.version = 1;
    old.frames[1].positions.D7 = { x: 47, y: 31 };
    delete old.frames[1].manual;

    const play = importPlay(JSON.stringify(old));
    expect(play.version).toBe(2);
    expect(play.frames.map((f) => f.positions)).toEqual(old.frames.map((f: { positions: unknown }) => f.positions));
    expect(play.frames[1].manual).toEqual({ D7: true }); // D6 was where automatic would put them anyway
    // D6 in the right spot but on a different curve still counts as placed by hand.
    const curved = JSON.parse(JSON.stringify(old));
    curved.frames[1].curves.D6 = { x: 3, y: 3 };
    expect(importPlay(JSON.stringify(curved)).frames[1].manual).toEqual({ D7: true, D6: true });
    expect(movePlayer(play, 1, 'O7', { x: 60, y: 35 }).frames[1].positions.D7).toEqual({ x: 47, y: 31 });
  });
});
