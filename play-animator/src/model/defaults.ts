import type { Frame, Play, Player, Vec } from './types';
import { newId } from './edit';
import { horizontalStack, verticalStack } from './formations';

function sevenOnSeven(): Player[] {
  const players: Player[] = [];
  for (let n = 1; n <= 7; n++) players.push({ id: `O${n}`, team: 'O', number: n, guards: null });
  for (let n = 1; n <= 7; n++) players.push({ id: `D${n}`, team: 'D', number: n, guards: `O${n}` });
  return players;
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

export type Formation = 'vertical' | 'horizontal';

/** A new play: seven on seven, set up in a stack, with no steps yet. */
export function createPlay(title = 'Untitled play', formation: Formation = 'vertical'): Play {
  const now = Date.now();
  return {
    version: 1,
    id: newId('play'),
    title,
    createdAt: now,
    updatedAt: now,
    players: sevenOnSeven(),
    frames: [setupFrame(formation === 'horizontal' ? horizontalStack() : verticalStack())],
  };
}
