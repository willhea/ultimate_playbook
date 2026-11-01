import { describe, expect, it } from 'vitest';
import { underThenDeep } from '../plays/vertical';
import { scriptPlay } from '../plays/script';
import { buildExamplePlays } from '../plays';
import { evaluate, frameTimes, releaseAt } from './engine';
import { flipForce } from './edit';
import { placeDefenders } from './defenders';
import { forceLabel, forceView } from './force';
import { validatePlay } from './validate';

const play = scriptPlay(underThenDeep);
const times = frameTimes(play);

describe('the force', () => {
  it('in the setup, the mark takes away the break side toward the away sideline (force home)', () => {
    const force = forceView(play, evaluate(play, 0));
    expect(force).toMatchObject({ thrower: 'O1', mark: 'D1', strength: 1 });
    expect(force!.breakSide.y).toBeLessThan(0); // up the screen, toward the away sideline
    expect(forceLabel(play.open)).toBe('Force home (flick)');
  });

  it('disappears while the disc is in the air, and comes back on the receiver once their defender marks', () => {
    const step = play.frames[1];
    const inFlight = times[0] + step.duration * (releaseAt(step) + 0.1);
    expect(forceView(play, evaluate(play, inFlight))).toBeNull();
    expect(forceView(play, evaluate(play, times[1]))).toMatchObject({ thrower: 'O7', mark: 'D7', strength: 1 });
  });

  it('flips between force home and force away by mirroring the play', () => {
    const flipped = flipForce(play);
    expect(forceLabel(flipped.open)).toBe('Force away (backhand)');
    expect(forceView(flipped, evaluate(flipped, 0))!.breakSide.y).toBeGreaterThan(0);
    // Automatic defenders agree with the mirror image: re-placing them changes nothing.
    const replaced = placeDefenders(flipped);
    replaced.frames.forEach((f, i) => {
      for (const [id, p] of Object.entries(f.positions)) {
        expect(p.x).toBeCloseTo(flipped.frames[i].positions[id].x, 6);
        expect(p.y).toBeCloseTo(flipped.frames[i].positions[id].y, 6);
      }
    });
    const back = flipForce(flipped);
    expect(back.open).toBe('bottom');
    back.frames.forEach((f, i) => {
      for (const [id, p] of Object.entries(f.positions)) expect(p.y).toBeCloseTo(play.frames[i].positions[id].y, 9);
      expect(f.facing).toEqual(play.frames[i].facing);
    });
  });

  it('keeps every example play valid when flipped', () => {
    for (const p of buildExamplePlays()) expect(validatePlay(flipForce(p)), p.title).toEqual([]);
  });
});
