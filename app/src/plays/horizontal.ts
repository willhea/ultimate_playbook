/** Example plays from a horizontal stack. See docs/research/stacks.md. */
import { DEFAULT_STACK, stackPositions } from '../model/formations';
import type { PlayScript } from './script';

const stack = DEFAULT_STACK.horizontal;
const setup = stackPositions(stack, { x: 40, y: 20 });
// Handlers: O1 (40,20) with the disc, O2 (37,8), O3 (37,32).
// Cutters 15 yd downfield: O4 (55,5) wing, O5 (55,15) popper, O6 (55,25) popper, O7 (55,35) wing.

export const poppersSplit: PlayScript = {
  title: 'Horizontal stack: poppers split',
  setup: {
    positions: setup,
    stack,
    notes:
      'A horizontal stack: three handlers across the field and four cutters in a line 15 yards downfield. The two middle cutters, the poppers, start the offense.',
  },
  steps: [
    {
      name: 'One popper under, one deep',
      notes:
        'The poppers always do opposite things. O6 cuts under on the open side while O5 goes deep, so the two defenders can’t help each other.',
      duration: 2.2,
      runs: {
        O6: { to: { x: 48, y: 27 }, bend: { x: 2, y: -1 } },
        O5: { to: { x: 70, y: 13 }, bend: { x: 0, y: -2 } },
      },
      throwTo: 'O6',
      release: 0.6,
    },
  ],
};

export const wingIso: PlayScript = {
  title: 'Horizontal stack: wing isolation',
  setup: {
    positions: setup,
    stack,
    notes: 'Same stack. This time the poppers clear out to give a wing the whole open side.',
  },
  steps: [
    {
      name: 'The poppers clear',
      notes: 'O5 and O6 run deep and toward the break side, taking their defenders with them.',
      duration: 2,
      runs: {
        O5: { to: { x: 68, y: 11 }, bend: { x: 0, y: -1 } },
        O6: { to: { x: 67, y: 19 }, bend: { x: 0, y: -2 } },
      },
    },
    {
      name: 'O7 cuts under the open side',
      notes: 'The bottom wing has the open side to themselves and cuts under for the throw.',
      duration: 2,
      runs: {
        O7: { to: { x: 47, y: 31 }, bend: { x: 2, y: 1 } },
      },
      throwTo: 'O7',
      release: 0.55,
    },
  ],
};

export const swingThenCut: PlayScript = {
  title: 'Horizontal stack: swing, then cut',
  setup: {
    positions: setup,
    stack,
    notes: 'Same stack. Moving the disc side to side between handlers gives the cutters a new throwing angle.',
  },
  steps: [
    {
      name: 'Swing to O2',
      notes: 'O1 swings the disc to the top handler.',
      duration: 1.6,
      throwTo: 'O2',
      release: 0.35,
    },
    {
      name: 'O5 cuts under toward the new angle',
      notes: 'D2 steps up to mark O2. With the disc on the top side, O5 cuts under into the space in front of O2.',
      duration: 2,
      runs: {
        O5: { to: { x: 46, y: 15 }, bend: { x: 2, y: -1 } },
      },
      throwTo: 'O5',
      release: 0.55,
    },
  ],
};

export const horizontalPlays: PlayScript[] = [poppersSplit, wingIso, swingThenCut];
