/** Example plays from a vertical stack. See docs/research/stacks.md. */
import { markSpot, verticalStack } from '../model/formations';
import type { PlayScript } from './script';

const setup = verticalStack({ disc: { x: 40, y: 20 } });
// Stack: O3 (52,20), O4 (57,20), O5 (62,20), O6 (67,20), O7 (72,20). Open side is the bottom (y → 40).

export const underThenDeep: PlayScript = {
  title: 'Vertical stack: under, then deep',
  setup: {
    positions: setup,
    notes:
      'A vertical stack: O1 has the disc, O2 is the dump behind, and five cutters line up down the middle. The mark forces throws to the open side, the bottom of the screen.',
  },
  steps: [
    {
      name: 'O3 cuts under',
      notes: 'The front of the stack plants and comes back toward the disc into the open-side lane.',
      duration: 2.2,
      runs: {
        O3: { to: { x: 46, y: 30 }, bend: { x: 3, y: -1.5 } },
        D3: { to: { x: 48.4, y: 29 }, bend: { x: 2.5, y: -1.5 } },
      },
      throwTo: 'O3',
      release: 0.55,
    },
    {
      name: 'O4 goes deep',
      notes: 'The next cutter attacks the space behind the defense, and O3 puts up the huck.',
      duration: 3.8,
      runs: {
        O4: { to: { x: 84, y: 29 }, bend: { x: -1, y: 4 } },
        D4: { to: { x: 81.5, y: 27.6 }, bend: { x: -1, y: 3.5 } },
        D3: markSpot({ x: 46, y: 30 }),
      },
      throwTo: 'O4',
      release: 0.45,
      throwBend: { x: -2, y: 5 },
    },
  ],
};

export const clearAndReCut: PlayScript = {
  title: 'Vertical stack: clear, then the next cut',
  setup: {
    positions: setup,
    notes: 'Same stack. Watch how a cutter who doesn’t get the disc gets out of the way.',
  },
  steps: [
    {
      name: 'O3 cuts under, but it’s covered',
      notes: 'O3 cuts under, but D3 stays between O3 and the disc, so there’s no throw.',
      duration: 1.8,
      runs: {
        O3: { to: { x: 47, y: 29 }, bend: { x: 2, y: -1 } },
        D3: { x: 45.2, y: 27.2 },
      },
    },
    {
      name: 'O3 clears, O4 cuts under',
      notes:
        'O3 clears out of the lane, away to the break side, which opens space for O4 to cut under on the open side behind them.',
      duration: 2.6,
      runs: {
        O3: { to: { x: 56, y: 9 }, bend: { x: 6, y: 4 } },
        D3: { to: { x: 54.6, y: 11.5 }, bend: { x: 5, y: 4 } },
        O4: { to: { x: 50, y: 29 }, bend: { x: 2.5, y: -2 } },
        D4: { to: { x: 52.4, y: 27.6 }, bend: { x: 2, y: -2 } },
      },
      throwTo: 'O4',
      release: 0.6,
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

export const verticalPlays: PlayScript[] = [underThenDeep, clearAndReCut, dumpSwing];
