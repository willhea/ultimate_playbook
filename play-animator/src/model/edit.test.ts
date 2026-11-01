import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createPlay } from './defaults';
import { addPlayer, addStep, deleteStep, moveStep, movePlayer, removePlayer, resetMove, setCurve, setHolder } from './edit';
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

  it('puts a run back, curve and all', () => {
    let play = movePlayer(addStep(createPlay(), 0), 1, 'O4', { x: 70, y: 5 });
    play = resetMove(setCurve(play, 1, 'O4', { x: 3, y: 3 }), 1, 'O4');
    expect(play.frames[1].positions.O4).toEqual(play.frames[0].positions.O4);
    expect(play.frames[1].curves.O4).toBeUndefined();
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

  it('removes and adds players, but never the one with the disc', () => {
    const play = createPlay();
    expect(removePlayer(play, 'O1')).toBe(play);
    const fewer = removePlayer(play, 'O7');
    expect(fewer.players.find((p) => p.id === 'D7')?.guards).toBeNull();
    expect(addPlayer(fewer, 'O').players).toHaveLength(14);
    expect(addPlayer(play, 'O')).toBe(play); // already seven
  });
});
