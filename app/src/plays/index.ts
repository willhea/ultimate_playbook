import type { Play } from '../model/types';
import { slugOf } from '../model/share';
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

export interface PlaybookEntry {
  /** Short name used in the play's link: …#playbook=<slug>. */
  slug: string;
  play: Play;
}

let built: PlaybookEntry[] | null = null;

/** The public playbook: every built-in play, always the latest version, with a short link each. */
export function playbook(): PlaybookEntry[] {
  built ??= examplePlays.map((s) => ({ slug: slugOf(s.title), play: scriptPlay(s) }));
  return built;
}
