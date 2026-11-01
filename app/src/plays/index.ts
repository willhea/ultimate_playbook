import type { Play } from '../model/types';
import { scriptPlay, type PlayScript } from './script';
import { verticalPlays } from './vertical';
import { horizontalPlays } from './horizontal';

import { underThenDeep } from './vertical';

export const examplePlays: PlayScript[] = [...verticalPlays, ...horizontalPlays];

/** Fresh copies of every example play, ready to put in someone's library. */
export function buildExamplePlays(): Play[] {
  return examplePlays.map(scriptPlay);
}

/** The play used in tests and docs as "the example": a vertical stack under cut, then a huck. */
export function createDemoPlay(): Play {
  return scriptPlay(underThenDeep);
}
