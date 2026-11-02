import { describe, expect, it } from 'vitest';
import { checkDraft, draftLink, LIVE_APP, parseScript } from './draft';
import { resolveRelative } from './script';
import { createPlay } from '../model/defaults';
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
      'Step 1: O7 runs to a spot: a spot is { "x", "y" } in yards, or relative to a player, like { "from": "O1", "break": 10, "back": 2 }.',
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
    expect(parseScript(json(script)).errors).toEqual([
      'Setup: O1: a spot is { "x", "y" } in yards, or relative to a player, like { "from": "O1", "break": 10, "back": 2 }.',
    ]);
  });

  it('checks the setup holder', () => {
    const script = { ...underThenDeep, setup: { ...underThenDeep.setup, holder: 'Q1' } };
    expect(parseScript(json(script)).errors).toEqual(['Setup holder: "Q1" isn\'t a player. Players are O1–O7 and D1–D7.']);
  });

  it('reads relative spots, and explains bad ones', () => {
    const good = {
      title: 'Relative',
      setup: { notes: '', positions: { O2: { from: 'O1', break: 10, back: 2 } } },
      steps: [{ name: 'Cut', notes: '', duration: 3, runs: { O7: { to: { from: 'disc', open: 8, ahead: 15 }, bend: { x: 0, y: 1 } } } }],
    };
    expect(parseScript(json(good)).errors).toEqual([]);

    const bad = {
      ...good,
      setup: {
        notes: '',
        positions: {
          O2: { from: 'O9', break: 10 },
          O3: { from: 'O1', open: 2, break: 3 },
          O4: { from: 'O1', ahead: 1, back: 1 },
          O5: { from: 'O1', left: 4 },
          O6: { from: 'O1', ahead: '5' },
        },
      },
    };
    expect(parseScript(json(bad)).errors).toEqual([
      'Setup: O2: "from" is a player (O1–O7, D1–D7) or "disc", not "O9".',
      'Setup: O3: a spot is to the open side or the break side, not both.',
      'Setup: O4: a spot is ahead or back, not both.',
      'Setup: O5: a relative spot uses "open" or "break", and "ahead" or "back", not "left".',
      'Setup: O6: "ahead" is a number of yards.',
    ]);
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
    const script = { ...underThenDeep, steps: [{ ...underThenDeep.steps[0], name: 'Throw it away', throwTo: 'D7' }] };
    const check = checkDraft(script);
    expect(check.ok).toBe(false);
    expect(check.lines[0]).toBe("Error · Step 1 (Throw it away): The disc is held by D7, who isn't on offense.");
  });

  it('lists errors before warnings, and passes a play with only warnings', () => {
    // O7 runs 60 yd in a second: too fast, but only a warning.
    const fast = { ...underThenDeep, steps: [{ name: 'Sprint', notes: '', duration: 1, runs: { O7: { x: 12, y: 30 } } }] };
    expect(checkDraft(fast).ok).toBe(true);
    expect(checkDraft(fast).lines.some((l) => l.startsWith('Warning · Step 1 (Sprint): O7 runs'))).toBe(true);

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

describe('relative positions (decision #30)', () => {
  it('place the dump from the thrower, bring their defender along, and flip with the force', () => {
    const script = {
      title: 'Relative',
      setup: { notes: '', positions: { O2: { from: 'O1', break: 10, back: 2 } } },
      steps: [{ name: 'Wait', notes: '', duration: 1 }],
    };
    const play = checkDraft(parseScript(json(script)).script!).play;
    const { O1, O2, D2 } = play.frames[0].positions;
    expect(O2).toEqual({ x: O1.x - 2, y: O1.y - 10 }); // force home: the break side is up the screen
    const before = createPlay().frames[0].positions;
    expect(D2.x - O2.x).toBeCloseTo(before.D2.x - before.O2.x, 6); // D2 came along
    expect(D2.y - O2.y).toBeCloseTo(before.D2.y - before.O2.y, 6);
    expect(resolveRelative({ from: 'O1', break: 10 }, O1, 'top')).toEqual({ x: O1.x, y: O1.y + 10 });
  });

  it('in a step, are taken from where that player ends the step, in any order', () => {
    const script = {
      title: 'Relative',
      setup: { notes: '', positions: {} },
      steps: [
        {
          name: 'Cut',
          notes: '',
          duration: 3,
          // O6 is placed from O7, who is placed from the disc: written in the "wrong" order on purpose.
          runs: { O6: { from: 'O7', ahead: 5 }, O7: { from: 'disc', open: 8, ahead: 15 } },
          throwTo: 'O7',
        },
      ],
    };
    const play = checkDraft(parseScript(json(script)).script!).play;
    const { O1, O6, O7 } = play.frames[1].positions;
    expect(O7).toEqual({ x: O1.x + 15, y: O1.y + 8 });
    expect(O6).toEqual({ x: O7.x + 5, y: O7.y });
  });

  it('a player placed from themselves moves from where they started the step', () => {
    const script = {
      title: 'Set-up',
      setup: { notes: '', positions: { O2: { from: 'O2', open: 1 } } },
      steps: [{ name: 'Set up', notes: '', duration: 2, runs: { O7: { from: 'O7', ahead: 7, open: 7 }, D7: { from: 'O7', ahead: 4, open: 3.5 } } }],
    };
    const play = checkDraft(parseScript(json(script)).script!).play;
    const [setup, step] = play.frames;
    expect(setup.positions.O2).toEqual({ x: createPlay().frames[0].positions.O2.x, y: createPlay().frames[0].positions.O2.y + 1 });
    expect(step.positions.O7).toEqual({ x: setup.positions.O7.x + 7, y: setup.positions.O7.y + 7 });
    expect(step.positions.D7).toEqual({ x: step.positions.O7.x + 4, y: step.positions.O7.y + 3.5 });
  });

  it('explain positions that refer to each other in a circle', () => {
    const script = {
      title: 'Circle',
      setup: { notes: '', positions: { O2: { from: 'O3', back: 2 }, O3: { from: 'O2', ahead: 2 } } },
      steps: [{ name: 'Wait', notes: '', duration: 1 }],
    };
    expect(() => checkDraft(parseScript(json(script)).script!)).toThrow('These positions refer to each other in a circle: O2, O3.');
  });
});
