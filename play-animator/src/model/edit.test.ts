import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createPlay } from './defaults';
import {
  addPlayer,
  addStep,
  canAddPlayer,
  deleteStep,
  holdsDisc,
  movePlayer,
  moveStep,
  removePlayer,
  resetMove,
  setCurve,
  setGuards,
  setHolder,
  stepLabel,
  teamPlayers,
  updateFrame,
} from './edit';
import { anyPlay, fieldPoint } from '../test/arbitraries';

const threeSteps = () => addStep(addStep(addStep(createPlay(), 0), 1), 2);

describe('moving players', () => {
  it('carries a setup change into later steps where the player has not moved', () => {
    const moved = movePlayer(threeSteps(), 0, 'O6', { x: 60, y: 10 });
    expect(moved.frames.map((f) => f.positions.O6)).toEqual(Array(4).fill({ x: 60, y: 10 }));
  });

  it('stops carrying a change at the first step where the player runs', () => {
    let play = movePlayer(threeSteps(), 2, 'O6', { x: 80, y: 5 });
    play = movePlayer(play, 0, 'O6', { x: 60, y: 10 });
    expect(play.frames.map((f) => f.positions.O6)).toEqual([
      { x: 60, y: 10 },
      { x: 60, y: 10 },
      { x: 80, y: 5 },
      { x: 80, y: 5 },
    ]);
  });

  it('never changes earlier steps, and never mutates the original play', () => {
    fc.assert(
      fc.property(anyPlay, fc.nat(), fieldPoint, (play, k, to) => {
        const i = k % play.frames.length;
        const before = JSON.stringify(play);
        const moved = movePlayer(play, i, 'O3', to);
        expect(JSON.stringify(play)).toBe(before);
        for (let j = 0; j < i; j++) expect(moved.frames[j]).toEqual(play.frames[j]);
        expect(moved.frames[i].positions.O3).toEqual(to);
      }),
    );
  });

  it('puts a run back with resetMove', () => {
    let play = movePlayer(addStep(createPlay(), 0), 1, 'O4', { x: 70, y: 5 });
    play = setCurve(play, 1, 'O4', { x: 3, y: 3 });
    const reset = resetMove(play, 1, 'O4');
    expect(reset.frames[1].positions.O4).toEqual(play.frames[0].positions.O4);
    expect(reset.frames[1].curves.O4).toBeUndefined();
    expect(resetMove(play, 0, 'O4')).toBe(play);
  });
});

describe('the disc', () => {
  it('passes on in later steps that still had the old holder', () => {
    const passed = setHolder(threeSteps(), 1, 'O3');
    expect(passed.frames.map((f) => f.discHolder)).toEqual(['O1', 'O3', 'O3', 'O3']);
  });

  it('does not overwrite a later throw', () => {
    let play = setHolder(threeSteps(), 3, 'O5');
    play = setHolder(play, 1, 'O3');
    expect(play.frames.map((f) => f.discHolder)).toEqual(['O1', 'O3', 'O3', 'O5']);
  });

  it('is a no-op to give it to whoever already has it', () => {
    const play = threeSteps();
    expect(setHolder(play, 1, 'O1')).toBe(play);
  });
});

describe('steps', () => {
  it('adds a step that starts where the previous one ended', () => {
    let play = movePlayer(addStep(createPlay(), 0), 1, 'O2', { x: 20, y: 30 });
    play = addStep(play, 1);
    expect(play.frames[2].positions).toEqual(play.frames[1].positions);
    expect(play.frames[2].curves).toEqual({});
    expect(stepLabel(play, 2)).toBe('Step 2');
    expect(stepLabel(updateFrame(play, 2, { name: 'Swing' }), 2)).toBe('Swing');
  });

  it('reorders steps but keeps the setup first', () => {
    const play = threeSteps();
    const [, a, b] = play.frames;
    expect(moveStep(play, 1, 1).frames.slice(1, 3).map((f) => f.id)).toEqual([b.id, a.id]);
    expect(moveStep(play, 1, -1)).toBe(play);
    expect(moveStep(play, 3, 1)).toBe(play);
  });

  it('deletes steps but never the setup', () => {
    const play = threeSteps();
    expect(deleteStep(play, 0)).toBe(play);
    expect(deleteStep(play, 2).frames).toHaveLength(3);
    expect(deleteStep(createPlay(), 0).frames).toHaveLength(1);
  });
});

describe('players', () => {
  it('will not remove a player who has the disc in any step', () => {
    const play = setHolder(addStep(createPlay(), 0), 1, 'O4');
    expect(holdsDisc(play, 'O4')).toBe(true);
    expect(removePlayer(play, 'O4')).toBe(play);
    expect(removePlayer(play, 'O1')).toBe(play);
  });

  it('frees up the defender of a removed player', () => {
    const fewer = removePlayer(createPlay(), 'O7');
    expect(fewer.players.some((p) => p.id === 'O7')).toBe(false);
    expect(fewer.players.find((p) => p.id === 'D7')?.guards).toBeNull();
    expect(fewer.frames[0].positions.O7).toBeUndefined();
  });

  it('adds back the lowest free number, up to seven a side', () => {
    const play = createPlay();
    expect(canAddPlayer(play, 'O')).toBe(false);
    const fewer = removePlayer(removePlayer(play, 'O3'), 'D3');
    const back = addPlayer(fewer, 'D');
    expect(teamPlayers(back, 'D').map((p) => p.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(back.players.find((p) => p.id === 'D3')?.guards).toBeNull(); // O3 is gone
    expect(addPlayer(play, 'O')).toBe(play);
  });

  it('changes who a defender guards', () => {
    const play = setGuards(createPlay(), 'D2', 'O5');
    expect(play.players.find((p) => p.id === 'D2')?.guards).toBe('O5');
    expect(setGuards(play, 'D2', null).players.find((p) => p.id === 'D2')?.guards).toBeNull();
  });
});
