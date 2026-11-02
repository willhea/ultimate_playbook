/** The saved plays, which one is open, and undo/redo history for the open play. */
import type { Play } from '../model/types';
import { createPlay } from '../model/defaults';
import { newId } from '../model/edit';
import { loadCurrentId, loadPlays } from '../model/storage';
import { examplePlays } from '../plays';
import { scriptPlay } from '../plays/script';

const HISTORY_LIMIT = 200;

export interface LibraryState {
  plays: Play[];
  currentId: string;
  past: Play[];
  future: Play[];
  /** The play as it was when a drag started, so the whole drag undoes in one step. */
  dragBase: Play | null;
  /** Nothing was saved in this browser before: the app opens the playbook to watch. */
  firstVisit?: boolean;
  /** The play a first visit starts with. The next new play replaces it if it was never edited. */
  starterId?: string;
}

export type LibraryAction =
  | { type: 'edit'; play: Play }
  | { type: 'preview'; play: Play }
  | { type: 'endPreview' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'open'; id: string }
  | { type: 'create'; play?: Play }
  | { type: 'duplicate' }
  | { type: 'delete'; id: string };

export function initLibrary(): LibraryState {
  let plays = loadPlays();
  // First visit: a copy of the first playbook play, so the editor has something to show.
  const firstVisit = plays.length === 0;
  if (firstVisit) plays = [scriptPlay(examplePlays[0])];
  const savedId = loadCurrentId();
  const currentId = plays.some((p) => p.id === savedId) ? savedId! : plays[0].id;
  return { plays, currentId, past: [], future: [], dragBase: null, firstVisit, starterId: firstVisit ? plays[0].id : undefined };
}

/** Never edited since it was made, like the play a first visit starts with. */
function untouched(play: Play): boolean {
  return play.createdAt === play.updatedAt;
}

export function currentPlay(state: LibraryState): Play {
  return state.plays.find((p) => p.id === state.currentId) ?? state.plays[0];
}

function replaceCurrent(state: LibraryState, play: Play): Play[] {
  return state.plays.map((p) => (p.id === state.currentId ? play : p));
}

function fresh(state: LibraryState, plays: Play[], currentId: string): LibraryState {
  return { ...state, plays, currentId, past: [], future: [], dragBase: null };
}

export function libraryReducer(state: LibraryState, action: LibraryAction): LibraryState {
  const cur = currentPlay(state);
  switch (action.type) {
    case 'edit': {
      if (action.play === cur) return state;
      const before = state.dragBase ?? cur;
      return {
        ...state,
        plays: replaceCurrent(state, { ...action.play, updatedAt: Date.now() }),
        past: [...state.past, before].slice(-HISTORY_LIMIT),
        future: [],
        dragBase: null,
      };
    }
    case 'preview':
      return {
        ...state,
        plays: replaceCurrent(state, action.play),
        dragBase: state.dragBase ?? cur,
      };
    case 'endPreview': {
      if (!state.dragBase) return state;
      if (state.dragBase === cur) return { ...state, dragBase: null };
      return {
        ...state,
        plays: replaceCurrent(state, { ...cur, updatedAt: Date.now() }),
        past: [...state.past, state.dragBase].slice(-HISTORY_LIMIT),
        future: [],
        dragBase: null,
      };
    }
    case 'undo': {
      // An edit still in progress (e.g. typing a name) is undone first.
      if (state.dragBase && state.dragBase !== cur) {
        return { ...state, plays: replaceCurrent(state, state.dragBase), future: [cur, ...state.future], dragBase: null };
      }
      const prev = state.past[state.past.length - 1];
      if (!prev) return state;
      return {
        ...state,
        plays: replaceCurrent(state, prev),
        past: state.past.slice(0, -1),
        future: [cur, ...state.future],
        dragBase: null,
      };
    }
    case 'redo': {
      const next = state.future[0];
      if (!next) return state;
      return {
        ...state,
        plays: replaceCurrent(state, next),
        past: [...state.past, cur],
        future: state.future.slice(1),
        dragBase: null,
      };
    }
    case 'open':
      if (!state.plays.some((p) => p.id === action.id)) return state;
      return fresh(state, state.plays, action.id);
    case 'create': {
      const play = action.play ?? createPlay();
      // A new play replaces the untouched play a first visit starts with, so copies don't pile up.
      const keep = state.plays.filter((p) => !(p.id === state.starterId && untouched(p)));
      return { ...fresh(state, [play, ...keep], play.id), starterId: undefined };
    }
    case 'duplicate': {
      const now = Date.now();
      const copy: Play = { ...cur, id: newId('play'), title: `${cur.title} (copy)`, createdAt: now, updatedAt: now };
      return fresh(state, [copy, ...state.plays], copy.id);
    }
    case 'delete': {
      const remaining = state.plays.filter((p) => p.id !== action.id);
      if (remaining.length === 0) {
        const play = createPlay();
        return fresh(state, [play], play.id);
      }
      if (action.id !== state.currentId) return { ...state, plays: remaining };
      return fresh(state, remaining, remaining[0].id);
    }
  }
}
