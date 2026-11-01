/** Example plays from a vertical stack. See docs/research/stacks.md. */
import { markSpot, verticalStack } from '../model/formations';
import type { PlayScript } from './script';

const setup = verticalStack({ disc: { x: 40, y: 20 } });
// Stack: O3 (52,20), O4 (57,20), O5 (62,20), O6 (67,20), O7 (72,20). Open side is the bottom (y → 40).

// Coaching rule (see docs/research/stacks.md): cuts come from the back of the stack,
// where the cutter has the most room to build speed. The exceptions are end-zone sets
// and break-side cuts, which come from the front.

export const underThenDeep: PlayScript = {
  title: 'Vertical stack: back cuts under, then deep',
  setup: {
    positions: setup,
    notes:
      'A vertical stack: O1 has the disc, O2 is the dump behind, and five cutters line up down the middle. The mark forces throws to the open side, the bottom of the screen. Cuts start from the back of the stack.',
  },
  steps: [
    {
      name: 'O7 cuts under from the back',
      notes:
        'The back of the stack has the most room. O7 builds speed down the open-side lane and comes under toward the disc.',
      duration: 3.4,
      runs: {
        O7: { to: { x: 50, y: 30 }, bend: { x: 2, y: 4 } },
        D7: { to: { x: 52.3, y: 28.6 }, bend: { x: 2, y: 3.5 } },
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
        D6: { to: { x: 89.5, y: 26.4 }, bend: { x: -1, y: 3.5 } },
        D7: markSpot({ x: 50, y: 30 }),
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
    notes: 'Same stack. Watch how a cutter who doesn’t get the disc gets out of the way for the next one.',
  },
  steps: [
    {
      name: 'O7 cuts under, but it’s covered',
      notes: 'O7 cuts from the back, but D7 stays between O7 and the disc, so there’s no throw.',
      duration: 3.2,
      runs: {
        O7: { to: { x: 52, y: 30 }, bend: { x: 2, y: 4 } },
        D7: { to: { x: 49.8, y: 28.6 }, bend: { x: 2, y: 3.5 } },
      },
    },
    {
      name: 'O7 clears, O6 cuts under',
      notes:
        'O7 clears out of the lane, deep and toward the sideline, which leaves the under space empty for the next cutter from the back, O6.',
      duration: 3.4,
      runs: {
        O7: { to: { x: 80, y: 36 }, bend: { x: -2, y: 1 } },
        D7: { to: { x: 78.3, y: 34.1 }, bend: { x: -2, y: 1 } },
        O6: { to: { x: 50, y: 29 }, bend: { x: 2, y: 3 } },
        D6: { to: { x: 52.3, y: 27.8 }, bend: { x: 2, y: 3 } },
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
    notes:
      'The exception to cutting from the back: a break-side cut comes from the front of the stack, which is closest to the break-side space.',
  },
  steps: [
    {
      name: 'O3 cuts to the break side',
      notes:
        'The front of the stack cuts to the break side, away from where the mark is forcing. O1 has to throw around the mark to reach it.',
      duration: 2.4,
      runs: {
        O3: { to: { x: 47, y: 11 }, bend: { x: 1, y: -1 } },
        D3: { to: { x: 49.5, y: 13.5 }, bend: { x: 1, y: -1 } },
      },
      throwTo: 'O3',
      release: 0.55,
      // Bend the throw away from the mark, like an inside-out break.
      throwBend: { x: 4, y: 3 },
    },
  ],
};

export const dumpSwing: PlayScript = {
  title: 'Vertical stack: dump and swing',
  setup: {
    positions: setup,
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
        D2: { to: { x: 36.2, y: 23.3 }, bend: { x: -1.5, y: 0 } },
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
        D2: markSpot({ x: 34, y: 25 }),
        O1: { to: { x: 45, y: 10 }, bend: { x: 2, y: 2 } },
        D1: { to: { x: 46.4, y: 12.2 }, bend: { x: 2, y: 2 } },
      },
      throwTo: 'O1',
      release: 0.5,
      throwBend: { x: -1.5, y: -1 },
    },
  ],
};

export const verticalPlays: PlayScript[] = [underThenDeep, clearAndReCut, breakSideFromFront, dumpSwing];
