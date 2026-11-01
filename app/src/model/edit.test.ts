import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createPlay } from './defaults';
import { addPlayer, addStep, deleteStep, moveStep, movePlayer, removePlayer, resetMove, setCurve, setFacing, setHolder, setStack } from './edit';
import { validatePlay } from './validate';
import { anyPlay, fieldPoint } from '../test/arbitraries';

const threeSteps = () => addStep(addStep(addStep(createPlay(), 0), 1), 2);

describe('editing', () => {
  it('carries a move into later steps, up to the first step where the player runs', () => {
    let play = movePlayer(threeSteps(), 2, 'O6', { x: 80, y: 5 });
    play = movePlayer(play, 0, 'O6', { x: 60, y: 10 });
    expect(play.frames.map((f) => f.positions.O6)).toEqual([
      { x: 60, y: 10 },
      { x: 60, y: 10 },
      { x: 80, y: 5 },
      { x: 80, y: 5 },
    ]);
  });

  it('never changes earlier steps or the original play', () => {
    fc.assert(
      fc.property(anyPlay, fc.nat(), fieldPoint, (play, k, to) => {
        const i = k % play.frames.length;
        const before = JSON.stringify(play);
        const moved = movePlayer(play, i, 'O3', to);
        expect(JSON.stringify(play)).toBe(before);
        for (let j = 0; j < i; j++) expect(moved.frames[j]).toEqual(play.frames[j]);
      }),
    );
  });

  it('bends, sets facing for and resets one player without touching anyone else', () => {
    let play = movePlayer(movePlayer(addStep(createPlay(), 0), 1, 'O4', { x: 70, y: 5 }), 1, 'O5', { x: 75, y: 5 });
    play = setCurve(setCurve(play, 1, 'O4', { x: 3, y: 3 }), 1, 'O5', { x: 1, y: 1 });
    play = setFacing(setFacing(play, 1, 'O4', 90), 1, 'O5', 45);
    expect(play.frames[1].curves).toMatchObject({ O4: { x: 3, y: 3 }, O5: { x: 1, y: 1 } });
    expect(play.frames[1].facing).toEqual({ O4: 90, O5: 45 });
    play = resetMove(play, 1, 'O4');
    expect(play.frames[1].positions.O4).toEqual(play.frames[0].positions.O4);
    expect(play.frames[1].curves.O4).toBeUndefined();
    expect(play.frames[1].curves.O5).toEqual({ x: 1, y: 1 });
  });

  it('passes the disc on to later steps, without overwriting a later throw', () => {
    let play = setHolder(threeSteps(), 3, 'O5');
    play = setHolder(play, 1, 'O3');
    expect(play.frames.map((f) => f.discHolder)).toEqual(['O1', 'O3', 'O3', 'O5']);
  });

  it('adds, reorders and deletes steps, keeping the setup first', () => {
    const play = threeSteps();
    const [, a, b] = play.frames;
    expect(moveStep(play, 1, 1).frames.slice(1, 3).map((f) => f.id)).toEqual([b.id, a.id]);
    expect(moveStep(play, 1, -1)).toBe(play);
    expect(deleteStep(play, 0)).toBe(play);
    expect(deleteStep(play, 2).frames).toHaveLength(3);
  });

  it('re-spaces the stack from the setup: cutters and their defenders move, runs still end where they did', () => {
    let play = movePlayer(addStep(createPlay(), 0), 1, 'O7', { x: 50, y: 30 });
    play = setStack(play, { kind: 'vertical', depth: 15, spacing: 7 });
    const [setup, step] = play.frames;
    expect(setup.positions.O3.x - setup.positions.O1.x).toBeCloseTo(15);
    expect(setup.positions.O4.x - setup.positions.O3.x).toBeCloseTo(7);
    expect(setup.positions.D4.x).toBeGreaterThan(setup.positions.O4.x - 1); // defenders came along
    expect(step.positions.O4).toEqual(setup.positions.O4); // a cutter who didn't run moves with the stack
    expect(step.positions.O7).toEqual({ x: 50, y: 30 }); // a run still ends where it did
    expect(play.stack).toEqual({ kind: 'vertical', depth: 15, spacing: 7 });
    expect(validatePlay(setStack(createPlay('h', 'horizontal'), { kind: 'horizontal', depth: 20 }))).toEqual([]);
  });

  it('removes and adds players, but never the one with the disc', () => {
    const play = createPlay();
    expect(removePlayer(play, 'O1')).toBe(play);
    const fewer = removePlayer(play, 'O3');
    expect(fewer.frames[0].positions.O3).toBeUndefined();
    expect(fewer.frames[0].positions.O4).toEqual(play.frames[0].positions.O4); // everyone else stays put
    expect(fewer.players.find((p) => p.id === 'D3')?.guards).toBeNull();
    const back = addPlayer(fewer, 'O');
    expect(back.players.find((p) => p.team === 'O' && p.number === 3)).toBeDefined(); // the free number is reused
    expect(addPlayer(play, 'O')).toBe(play); // already seven
  });
});
