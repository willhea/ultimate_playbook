import { describe, expect, it } from 'vitest';
import { createPlay } from './defaults';
import { addPlayer, addStep, movePlayer, setHolder, updateFrame } from './edit';
import { validatePlay, type IssueCode } from './validate';

const codes = (play: ReturnType<typeof createPlay>): IssueCode[] => validatePlay(play).map((i) => i.code);

describe('validatePlay', () => {
  it('accepts the default starting formation', () => {
    expect(validatePlay(createPlay())).toEqual([]);
  });

  it('flags players standing on top of each other', () => {
    const play = movePlayer(createPlay(), 0, 'O5', createPlay().frames[0].positions.O4);
    expect(codes(play)).toContain('overlap');
  });

  it('lets a defender stand tighter on their own player than anyone else can stand to anyone', () => {
    const o1 = createPlay().frames[0].positions.O1;
    expect(codes(movePlayer(createPlay(), 0, 'D1', { x: o1.x + 2.3, y: o1.y }))).not.toContain('overlap');
    expect(codes(movePlayer(createPlay(), 0, 'D1', { x: o1.x + 1, y: o1.y }))).toContain('overlap');
  });

  it('flags runs faster than a person can run', () => {
    let play = addStep(createPlay(), 0);
    play = updateFrame(play, 1, { duration: 1 });
    expect(codes(movePlayer(play, 1, 'O7', { x: 70, y: 20 }))).not.toContain('too-fast'); // 9 yd in 1 s
    expect(codes(movePlayer(play, 1, 'O7', { x: 90, y: 20 }))).toContain('too-fast'); // 29 yd in 1 s
  });

  it('flags throws that are too fast or float too long', () => {
    let play = addStep(createPlay(), 0);
    play = setHolder(play, 1, 'O7'); // ~26 yd throw
    expect(codes(updateFrame(play, 1, { duration: 0.5, release: 0.5 }))).toContain('throw-too-fast');
    expect(codes(updateFrame(play, 1, { duration: 6, release: 0 }))).toContain('throw-too-slow');
    expect(codes(updateFrame(play, 1, { duration: 2, release: 0.4 }))).toEqual([]);
  });

  it('flags a defender who starts far from their player', () => {
    expect(codes(movePlayer(createPlay(), 0, 'D6', { x: 20, y: 5 }))).toContain('defender-far');
  });

  it('flags players off the field and too many players', () => {
    expect(codes(movePlayer(createPlay(), 0, 'O2', { x: -10, y: 5 }))).toContain('out-of-bounds');
    const crowded = { ...createPlay() };
    crowded.players = [...crowded.players, { id: 'O8', team: 'O' as const, number: 8, guards: null }];
    crowded.frames = crowded.frames.map((f) => ({ ...f, positions: { ...f.positions, O8: { x: 5, y: 5 } } }));
    expect(codes(crowded)).toContain('too-many-players');
    expect(addPlayer(createPlay(), 'O').players).toHaveLength(14);
  });

  it('flags a defender holding the disc', () => {
    const play = { ...createPlay() };
    play.frames = play.frames.map((f) => ({ ...f, discHolder: 'D2' }));
    expect(codes(play)).toContain('holder-not-offense');
  });
});
