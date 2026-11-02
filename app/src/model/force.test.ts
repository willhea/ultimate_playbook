import { describe, expect, it } from 'vitest';
import { underThenDeep } from '../plays/vertical';
import { scriptPlay } from '../plays/script';
import { buildExamplePlays } from '../plays';
import { evaluate, frameTimes, releaseAt } from './engine';
import { flipForce, movePlayer } from './edit';
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

  it('stays on the thrower until the release, and fades in as a new mark arrives', () => {
    const step = play.frames[1];
    const beforeRelease = forceView(play, evaluate(play, times[0] + step.duration * releaseAt(step) * 0.5));
    expect(beforeRelease).toMatchObject({ thrower: 'O1', mark: 'D1', strength: 1 });
    const b = beforeRelease!.breakSide;
    expect(Math.hypot(b.x, b.y)).toBeCloseTo(1, 6); // a direction, toward the mark
    // Move the mark away step by step: the force fades, then disappears.
    const o1 = play.frames[0].positions.O1;
    const markAt = (gap: number) => {
      const moved = movePlayer(play, 0, 'D1', { x: o1.x, y: o1.y - gap });
      return forceView(moved, evaluate(moved, 0));
    };
    const fading = markAt(3.8);
    expect(fading?.strength).toBeGreaterThan(0);
    expect(fading?.strength).toBeLessThan(1);
    expect(markAt(5)).toBeNull();
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
