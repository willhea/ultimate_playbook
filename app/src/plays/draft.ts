/**
 * Drafts: a play script written as JSON (usually by an AI), checked before anyone
 * watches it. `npm run play -- <file.json>` uses this to read the script, build the
 * play, list what's wrong in plain words, and make a link to the live app.
 */
import type { Play, Vec } from '../model/types';
import { playLink } from '../model/share';
import { validatePlay, type Issue } from '../model/validate';
import { scriptPlay, type PlayScript, type Run, type StepScript } from './script';

/** The public app. Draft links open here, so the coach can watch a draft on any computer. */
export const LIVE_APP = 'https://willhea.github.io/ultimate_playbook/';

const PLAYER_IDS = new Set(['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']);

export type ParsedScript = { script: PlayScript; errors: [] } | { script: null; errors: string[] };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isVec = (v: unknown): v is Vec => isObject(v) && isNumber(v.x) && isNumber(v.y);

/**
 * Read a play script from JSON text. Explains every problem found, in words an
 * author can act on, rather than stopping at the first.
 */
export function parseScript(text: string): ParsedScript {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { script: null, errors: [`The file isn't valid JSON: ${(e as Error).message}`] };
  }
  const errors: string[] = [];
  if (!isObject(raw)) return { script: null, errors: ['A play script is a JSON object with a title, a setup and steps.'] };

  if (typeof raw.title !== 'string' || !raw.title.trim()) errors.push('The play needs a "title".');

  const player = (where: string, id: string) => {
    if (!PLAYER_IDS.has(id)) errors.push(`${where}: "${id}" isn't a player. Players are O1–O7 and D1–D7.`);
  };

  const setup = raw.setup;
  if (!isObject(setup)) {
    errors.push('The play needs a "setup" with "positions" and "notes".');
  } else {
    if (!isObject(setup.positions)) errors.push('The setup needs "positions": { "O1": { "x": …, "y": … }, … }.');
    else
      for (const [id, pos] of Object.entries(setup.positions)) {
        player('Setup', id);
        if (!isVec(pos)) errors.push(`Setup: ${id} needs a position with numbers "x" and "y".`);
      }
    if (typeof setup.notes !== 'string') errors.push('The setup needs "notes" (they can be empty).');
    if (setup.holder !== undefined) {
      if (typeof setup.holder !== 'string') errors.push('Setup: "holder" names a player, like "O1".');
      else player('Setup holder', setup.holder);
    }
  }

  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    errors.push('The play needs "steps": a list with at least one step.');
  } else {
    raw.steps.forEach((step: unknown, k: number) => {
      const where = `Step ${k + 1}`;
      if (!isObject(step)) {
        errors.push(`${where} isn't an object.`);
        return;
      }
      if (typeof step.name !== 'string' || !step.name.trim()) errors.push(`${where} needs a "name".`);
      if (typeof step.notes !== 'string') errors.push(`${where} needs "notes" (they can be empty).`);
      if (!isNumber(step.duration) || step.duration <= 0) errors.push(`${where} needs a "duration" in seconds, more than 0.`);
      if (step.runs !== undefined) {
        if (!isObject(step.runs)) errors.push(`${where}: "runs" maps players to where they run.`);
        else
          for (const [id, run] of Object.entries(step.runs)) {
            player(where, id);
            const ok = isVec(run) || (isObject(run) && isVec(run.to) && isVec(run.bend));
            if (!ok) errors.push(`${where}: ${id}'s run is { "x", "y" } or { "to": { "x", "y" }, "bend": { "x", "y" } }.`);
          }
      }
      if (step.throwTo !== undefined) {
        if (typeof step.throwTo !== 'string') errors.push(`${where}: "throwTo" names a player, like "O7".`);
        else player(where, step.throwTo);
      }
      if (step.release !== undefined && !isNumber(step.release)) errors.push(`${where}: "release" is a fraction of the step, like 0.6.`);
      if (step.throwBend !== undefined && !isVec(step.throwBend)) errors.push(`${where}: "throwBend" is { "x", "y" }.`);
      if (step.facing !== undefined) {
        if (!isObject(step.facing)) errors.push(`${where}: "facing" maps players to an angle in degrees.`);
        else
          for (const [id, angle] of Object.entries(step.facing)) {
            player(where, id);
            if (!isNumber(angle)) errors.push(`${where}: ${id}'s facing is an angle in degrees.`);
          }
      }
    });
  }

  if (errors.length) return { script: null, errors };
  return { script: raw as unknown as PlayScript, errors: [] };
}

/** Where a problem is, by the step's name, so the author doesn't have to count. */
function stepLabel(play: Play, frame: number): string {
  return frame === 0 ? 'Setup' : `Step ${frame} (${play.frames[frame].name})`;
}

export interface DraftCheck {
  play: Play;
  issues: Issue[];
  /** One line per issue, errors first. */
  lines: string[];
  /** True when nothing is an error (warnings are allowed). */
  ok: boolean;
}

/** Build the play from a checked script and run the same checks every built-in play passes. */
export function checkDraft(script: PlayScript): DraftCheck {
  const play = scriptPlay(script);
  const issues = validatePlay(play).sort((a, b) => (a.level === b.level ? a.frame - b.frame : a.level === 'error' ? -1 : 1));
  const lines = issues.map((i) => `${i.level === 'error' ? 'Error' : 'Warning'} · ${stepLabel(play, i.frame)}: ${i.message}`);
  return { play, issues, lines, ok: !issues.some((i) => i.level === 'error') };
}

/** The draft-preview link: the live app, with the whole play inside the link. */
export function draftLink(code: string): string {
  return playLink(LIVE_APP, code);
}

export type { PlayScript, Run, StepScript };
