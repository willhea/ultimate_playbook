/** Example plays from a vertical stack. See docs/research/stacks.md. */
import { DEFAULT_STACK, stackPositions } from '../model/formations';
import type { PlayScript } from './script';

const stack = DEFAULT_STACK.vertical;
const setup = stackPositions(stack, { x: 40, y: 20 });
// Stack: O3 (52,20), O4 (57,20), O5 (62,20), O6 (67,20), O7 (72,20). Open side is the bottom (y → 40).

// Coaching rule (see docs/research/stacks.md): cuts come from the back of the stack,
// where the cutter has the most room to build speed. The exceptions are end-zone sets
// and break-side cuts, which come from the front.

export const underThenDeep: PlayScript = {
  title: 'Vertical stack: back cuts under, then deep',
  setup: {
    positions: setup,
    stack,
    notes:
      'A vertical stack: O1 has the disc, O2 is the dump behind, and five cutters line up down the middle. The mark forces home: our right-handed thrower is forced to flick toward the home sideline, the bottom of the screen. Cuts start from the back of the stack.',
  },
  steps: [
    {
      name: 'O7 cuts under from the back',
      notes:
        'The back of the stack has the most room. O7 builds speed down the open-side lane, toward the home sideline, and comes under for the flick.',
      duration: 3.4,
      runs: {
        // Out wide first, around the defenders lined up on the open side, then under.
        O7: { to: { x: 50, y: 30 }, bend: { x: 6, y: 8 } },
      },
      throwTo: 'O7',
      release: 0.65,
    },
    {
      name: 'O6 goes deep',
      notes: 'The next cutter from the back attacks the space behind the defense, and O7 puts up the huck.',
      duration: 3.8,
      runs: {
        O6: { to: { x: 92, y: 28 }, bend: { x: -1, y: 4 } },
      },
      throwTo: 'O6',
      release: 0.45,
      throwBend: { x: -2, y: 5 },
    },
  ],
};

export const clearAndReCut: PlayScript = {
  title: 'Vertical stack: clear, then the next cut',
  setup: {
    positions: setup,
    stack,
    notes:
      'Same stack. The downfield defenders line up on the open side and play deep, so they make their cutters come under. Watch how a cutter who doesn’t get the disc gets out of the way for the next one.',
  },
  steps: [
    {
      name: 'O7 goes deep, but it’s covered',
      notes: 'O7 cuts deep from the back of the stack, but D7 is already playing deep and stays with them, so there’s no huck.',
      duration: 3.2,
      runs: {
        O7: { to: { x: 90, y: 28 }, bend: { x: 0, y: 2 } },
        // Placed by hand: D7 runs step for step on the deep side.
        D7: { to: { x: 92, y: 30 }, bend: { x: 0, y: 2 } },
      },
    },
    {
      name: 'O7 clears, O6 cuts under',
      notes:
        'O7 clears across to the break side, out of the open-side lane. O6 is now the back of the stack, and cuts under, out wide around the defenders, for the flick.',
      duration: 3.4,
      runs: {
        O7: { to: { x: 86, y: 10 }, bend: { x: 2, y: 0 } },
        O6: { to: { x: 50, y: 29 }, bend: { x: 6, y: 9 } },
      },
      throwTo: 'O6',
      release: 0.6,
    },
  ],
};

export const breakSideFromFront: PlayScript = {
  title: 'Vertical stack: break-side cut from the front',
  setup: {
    positions: setup,
    stack,
    notes:
      'The exception to cutting from the back: a break-side cut comes from the front of the stack, which is closest to the break-side space.',
  },
  steps: [
    {
      name: 'O3 cuts to the break side',
      notes:
        'The front of the stack cuts to the break side, toward the away sideline. O1 has to break the mark: a backhand bent around the mark.',
      duration: 2.4,
      runs: {
        O3: { to: { x: 47, y: 11 }, bend: { x: 1, y: -1 } },
      },
      throwTo: 'O3',
      release: 0.55,
      // Bend the backhand away from the mark so it goes around it.
      throwBend: { x: 4, y: 3 },
    },
  ],
};

export const dumpSwing: PlayScript = {
  title: 'Vertical stack: dump and swing',
  setup: {
    positions: setup,
    stack,
    notes:
      'The stall count is climbing and no cutter is open. The handlers reset the count and move the disc to the break side.',
  },
  steps: [
    {
      name: 'The dump comes back',
      notes: 'O2 cuts behind the thrower for an easy dump pass. The stall count starts over.',
      duration: 2,
      runs: {
        O2: { to: { x: 34, y: 25 }, bend: { x: -2, y: 0 } },
      },
      throwTo: 'O2',
      release: 0.6,
    },
    {
      name: 'Swing to the break side',
      notes:
        'O1 cuts up the break side and O2 swings it back. The disc is now on the side the defense was forcing away from, and the break-side lane is open.',
      duration: 2.2,
      runs: {
        O1: { to: { x: 45, y: 10 }, bend: { x: 2, y: 2 } },
      },
      throwTo: 'O1',
      release: 0.5,
      throwBend: { x: -1.5, y: -1 },
    },
  ],
};

export const verticalPlays: PlayScript[] = [underThenDeep, clearAndReCut, breakSideFromFront, dumpSwing];
