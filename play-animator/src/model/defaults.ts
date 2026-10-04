import type { Frame, Play, Player, Vec } from './types';
import { newId } from './edit';

function sevenOnSeven(): Player[] {
  const players: Player[] = [];
  for (let n = 1; n <= 7; n++) players.push({ id: `O${n}`, team: 'O', number: n, guards: null });
  for (let n = 1; n <= 7; n++) players.push({ id: `D${n}`, team: 'D', number: n, guards: `O${n}` });
  return players;
}

/**
 * A vertical stack in the offense's own half: handler O1 with the disc, dump O2
 * behind, O3–O7 stacked downfield. Defenders sit on the under/open side of
 * their player; D1 marks the thrower from the break side.
 */
function verticalStack(): Record<string, Vec> {
  const pos: Record<string, Vec> = {
    O1: { x: 35, y: 20 },
    O2: { x: 31, y: 25 },
    D1: { x: 36.6, y: 17.6 },
    D2: { x: 33.2, y: 23.1 },
  };
  for (let n = 3; n <= 7; n++) {
    const x = 45 + (n - 3) * 4;
    pos[`O${n}`] = { x, y: 20 };
    pos[`D${n}`] = { x: x - 1.5, y: 22.6 };
  }
  return pos;
}

function setupFrame(positions: Record<string, Vec>): Frame {
  return {
    id: newId('f'),
    name: 'Setup',
    notes: '',
    duration: 0,
    positions,
    facing: {},
    curves: {},
    discHolder: 'O1',
    throwCurve: null,
    release: 0.4,
  };
}

export function createPlay(title = 'Untitled play'): Play {
  const now = Date.now();
  return {
    version: 1,
    id: newId('play'),
    title,
    createdAt: now,
    updatedAt: now,
    players: sevenOnSeven(),
    frames: [setupFrame(verticalStack())],
  };
}

/** Example play loaded on first visit, so the app opens showing what it does. */
export function createDemoPlay(): Play {
  const play = createPlay('Example: under, then deep');
  const setup = play.frames[0];
  setup.notes = 'Vertical stack. The mark forces everything to the open side (bottom of the screen).';

  const under: Frame = {
    ...setup,
    id: newId('f'),
    name: 'O3 cuts under',
    notes: 'The front of the stack plants and comes back toward the disc on the open side.',
    duration: 2.2,
    positions: {
      ...setup.positions,
      O3: { x: 38, y: 31 },
      D3: { x: 40.4, y: 29.2 },
    },
    curves: { O3: { x: 3, y: -1 }, D3: { x: 2.6, y: -1.2 } },
    discHolder: 'O3',
    throwCurve: null,
    release: 0.55,
  };

  const deep: Frame = {
    ...under,
    id: newId('f'),
    name: 'O4 goes deep',
    notes: 'With the under taken, O4 clears to the open-side end zone and O3 puts up the huck.',
    duration: 3.6,
    positions: {
      ...under.positions,
      O4: { x: 93, y: 28 },
      D4: { x: 90.5, y: 25.5 },
      O1: { x: 39, y: 22 },
      D1: { x: 41.2, y: 20 },
    },
    curves: { O4: { x: 0, y: 6 }, D4: { x: 0, y: 5 } },
    discHolder: 'O4',
    throwCurve: { x: -2, y: 8 },
    release: 0.45,
  };

  play.frames = [setup, under, deep];
  return play;
}
