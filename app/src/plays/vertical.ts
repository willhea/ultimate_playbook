/** Example plays from a vertical stack. See docs/research/stacks.md. */
import { DEFAULT_STACK, stackPositions } from '../model/formations';
import type { PlayScript } from './script';

const stack = DEFAULT_STACK.vertical;
const setup = stackPositions(stack, { x: 40, y: 20 });
// Stack (decision #28): O3 (52,15), O4 (57,14.6), O5 (62,14.2), O6 (67,13.8), O7 (72,13.4): the front
// 5 yd to the break side of O1 (40,20), angling slightly further. The dump O2 is at (38,10).
// Open side is the bottom (y → 40).
//
// A cutter separates before cutting (decision #31): a set-up of about 10 yd away from the
// stack, a hard plant, then the cut, in straight legs (#24). Their defender respects the
// deep threat and backs off on the set-up (placed by hand until the app does it).

// Coaching rule (see docs/research/stacks.md): cuts come from the back of the stack,
// where the cutter has the most room to build speed. The exceptions are end-zone sets
// and break-side cuts, which come from the front.

export const underThenDeep: PlayScript = {
  title: 'Vertical stack: back cuts under, then deep',
  setup: {
    positions: setup,
    stack,
    notes:
      'A vertical stack: O1 has the disc, O2 is the dump, well over on the break side, and five cutters line up downfield. The front of the stack stands to the break side of O1, so the open side is clear. The mark forces home: our right-handed thrower is forced to flick toward the home sideline, the bottom of the screen. Cuts start from the back of the stack.',
  },
  steps: [
    {
      name: 'O7 sets up',
      notes:
        'O7 takes about 10 yards, diagonally away from the stack into the open side. That opens the whole field for a deep cut or an in cut, and makes D7 choose. D7 respects the deep threat and backs off.',
      duration: 1.6,
      runs: {
        O7: { x: 79, y: 20 },
        // Placed by hand: D7 gives ground on the deep, open side.
        D7: { x: 83, y: 23.5 },
      },
    },
    {
      name: 'O7 plants and cuts in',
      notes: 'O7 plants hard and cuts back toward the disc in the open-side lane, away from the stack. O1 hits them with the flick.',
      duration: 3.4,
      runs: {
        O7: { x: 55, y: 28 },
      },
      throwTo: 'O7',
      release: 0.45,
      throwBend: { x: 1.5, y: 1.5 },
    },
    {
      name: 'O6 goes deep',
      notes: 'The next cutter from the back attacks the space behind the defense, and O7 puts up the huck.',
      duration: 3.8,
      runs: {
        O6: { to: { x: 93, y: 22 }, bend: { x: 0, y: 2 } },
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
      'Same stack. The downfield defenders line up on the open side and play deep, so they make their cutters come in. Watch how a cutter who doesn’t get the disc gets out of the way for the next one.',
  },
  steps: [
    {
      name: 'O7 goes deep, but it’s covered',
      notes: 'O7 cuts deep from the back of the stack, but D7 is already playing deep and stays with them, so there’s no huck.',
      duration: 3.2,
      runs: {
        O7: { to: { x: 90, y: 24 }, bend: { x: 0, y: 1 } },
        // Placed by hand: D7 runs step for step on the deep side.
        D7: { to: { x: 92.5, y: 27 }, bend: { x: 0, y: 1 } },
      },
    },
    {
      name: 'O7 clears, O6 sets up',
      notes:
        'O7 clears across to the break side, out of the open-side lane. O6 is now the back of the stack, and sets up deep to push D6 back.',
      duration: 2.4,
      runs: {
        O7: { x: 86, y: 6 },
        O6: { x: 76, y: 15 },
        // Placed by hand: D6 backs off on the deep, open side.
        D6: { x: 79.5, y: 18.5 },
      },
    },
    {
      name: 'O6 plants and cuts in',
      notes: 'O6 plants and cuts in, into the open-side lane O7 just cleared, for the flick.',
      duration: 2.8,
      runs: {
        O6: { x: 55, y: 27 },
      },
      throwTo: 'O6',
      release: 0.45,
      throwBend: { x: 1.5, y: 1.5 },
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
        'O1 throws as O3 starts the cut: a backhand bent around the mark, into the space on the break side. O3 runs onto it. It works on timing, not on beating D3.',
      duration: 1.8,
      runs: {
        O3: { x: 47, y: 6 },
      },
      throwTo: 'O3',
      release: 0.15,
      // Bend the backhand away from the mark so it goes around it.
      throwBend: { x: 4, y: 2 },
    },
  ],
};

export const dumpSwing: PlayScript = {
  title: 'Vertical stack: dump and swing',
  setup: {
    positions: setup,
    stack,
    notes:
      'The stall count is climbing and no cutter is open. The dump starts well over on the break side, a little behind the thrower, where they can cut upline or come back. The handlers reset the count and move the disc to the break side.',
  },
  steps: [
    {
      name: 'The dump comes back',
      notes: 'O2 comes back behind the thrower, and O1 throws as they start, in front of them. O2 runs onto the disc. The stall count starts over.',
      duration: 1.6,
      runs: {
        O2: { x: 33, y: 14 },
      },
      throwTo: 'O2',
      release: 0.25,
    },
    {
      name: 'Swing to the break side',
      notes:
        'O1 cuts up the break side, and O2 swings it as they go, into the space ahead of them. D2 steps up to mark O2. The disc is now on the side the defense was forcing away from, and the break-side lane is open.',
      duration: 2.2,
      runs: {
        O1: { to: { x: 47, y: 10 }, bend: { x: 3, y: 1 } },
      },
      throwTo: 'O1',
      release: 0.2,
      throwBend: { x: -1.5, y: -1 },
    },
  ],
};

export const verticalPlays: PlayScript[] = [underThenDeep, clearAndReCut, breakSideFromFront, dumpSwing];
