import { describe, expect, it } from 'vitest';
import { checkDraft, draftLink, LIVE_APP, parseScript } from './draft';
import { underThenDeep, verticalPlays } from './vertical';
import { playLink } from '../model/share';

const json = (v: unknown) => JSON.stringify(v);

describe('parseScript', () => {
  it('reads every built-in vertical play written as JSON, unchanged', () => {
    for (const script of verticalPlays) {
      const parsed = parseScript(json(script));
      expect(parsed.errors).toEqual([]);
      expect(parsed.script).toEqual(script);
    }
  });

  it('explains text that is not JSON', () => {
    const parsed = parseScript('{ "title": ');
    expect(parsed.script).toBeNull();
    expect(parsed.errors[0]).toMatch(/isn't valid JSON/);
  });

  it('explains a script that is not an object', () => {
    expect(parseScript('[]').errors).toEqual(['A play script is a JSON object with a title, a setup and steps.']);
  });

  it('lists every problem, not just the first', () => {
    const parsed = parseScript(json({ title: '', setup: { positions: { O9: { x: 1, y: 2 } } }, steps: [] }));
    expect(parsed.script).toBeNull();
    expect(parsed.errors).toEqual([
      'The play needs a "title".',
      'Setup: "O9" isn\'t a player. Players are O1–O7 and D1–D7.',
      'The setup needs "notes" (they can be empty).',
      'The play needs "steps": a list with at least one step.',
    ]);
  });

  it('names the step and player for a bad step', () => {
    const script = {
      ...underThenDeep,
      steps: [
        {
          name: 'Cut',
          notes: '',
          duration: 0,
          runs: { O7: { to: { x: 50 } }, X1: { x: 1, y: 1 } },
          throwTo: 7,
          release: 'late',
          throwBend: [1, 2],
          facing: { O7: 'up' },
        },
        'not a step',
      ],
    };
    expect(parseScript(json(script)).errors).toEqual([
      'Step 1 needs a "duration" in seconds, more than 0.',
      'Step 1: O7\'s run is { "x", "y" } or { "to": { "x", "y" }, "bend": { "x", "y" } }.',
      'Step 1: "X1" isn\'t a player. Players are O1–O7 and D1–D7.',
      'Step 1: "throwTo" names a player, like "O7".',
      'Step 1: "release" is a fraction of the step, like 0.6.',
      'Step 1: "throwBend" is { "x", "y" }.',
      'Step 1: O7\'s facing is an angle in degrees.',
      "Step 2 isn't an object.",
    ]);
  });

  it('rejects positions that are not numbers, which would put players nowhere', () => {
    const script = { ...underThenDeep, setup: { ...underThenDeep.setup, positions: { O1: { x: '40', y: 20 } } } };
    expect(parseScript(json(script)).errors).toEqual(['Setup: O1 needs a position with numbers "x" and "y".']);
  });

  it('checks the setup holder', () => {
    const script = { ...underThenDeep, setup: { ...underThenDeep.setup, holder: 'Q1' } };
    expect(parseScript(json(script)).errors).toEqual(['Setup holder: "Q1" isn\'t a player. Players are O1–O7 and D1–D7.']);
  });
});

describe('checkDraft', () => {
  it('passes every built-in vertical play', () => {
    for (const script of verticalPlays) {
      const check = checkDraft(script);
      expect(check.ok).toBe(true);
      expect(check.play.title).toBe(script.title);
      expect(check.play.frames).toHaveLength(script.steps.length + 1);
    }
  });

  it('fails a play whose disc goes to a defender, naming the step', () => {
    const script = { ...underThenDeep, steps: [{ ...underThenDeep.steps[0], throwTo: 'D7' }] };
    const check = checkDraft(script);
    expect(check.ok).toBe(false);
    expect(check.lines[0]).toBe("Error · Step 1 (O7 cuts under from the back): The disc is held by D7, who isn't on offense.");
  });

  it('lists errors before warnings, and passes a play with only warnings', () => {
    // O7 runs 60 yd in a second: too fast, but only a warning.
    const fast = { ...underThenDeep, steps: [{ ...underThenDeep.steps[0], duration: 1, runs: { O7: { x: 12, y: 30 } } }] };
    expect(checkDraft(fast).ok).toBe(true);
    expect(checkDraft(fast).lines.some((l) => l.startsWith('Warning · Step 1 (O7 cuts under from the back): O7 runs'))).toBe(true);

    const both = { ...fast, steps: [{ ...fast.steps[0], throwTo: 'D7' }] };
    const levels = checkDraft(both).lines.map((l) => l.split(' ')[0]);
    expect(levels[0]).toBe('Error');
    expect(levels.indexOf('Warning')).toBeGreaterThan(levels.lastIndexOf('Error'));
  });

  it('calls problems in the starting positions "Setup"', () => {
    const script = { ...underThenDeep, setup: { ...underThenDeep.setup, positions: { ...underThenDeep.setup.positions, O5: { x: 200, y: 20 } } } };
    expect(checkDraft(script).lines).toContain('Error · Setup: O5 is off the edge of the field.');
  });
});

describe('links', () => {
  it('a draft link opens the live app with the play inside', () => {
    expect(draftLink('abc')).toBe(`${LIVE_APP}#play=abc`);
    expect(LIVE_APP).toBe('https://willhea.github.io/ultimate_playbook/');
  });

  it('a play link replaces anything after # in the page address', () => {
    expect(playLink('https://example.com/app/#playbook=x', 'code')).toBe('https://example.com/app/#play=code');
  });
});
