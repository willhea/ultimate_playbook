// Watching a play. Timing rules are unit-tested (src/state/playbackClock.test.ts);
// these use a fake clock to check the controls and what's drawn.
import { test, expect } from './fixtures';
import { createDemoPlay } from '../src/plays';
import { evaluate, frameTimes, totalDuration } from '../src/model/engine';

const demo = createDemoPlay();
const times = frameTimes(demo);
const totalMs = totalDuration(demo) * 1000;

test.beforeEach(async ({ app }) => {
  await app.open({ plays: [demo], fakeClock: true });
  await app.stepChip(0).click();
});

test('Space plays to the end; arrow keys step forward and back', async ({ app, page }) => {
  await page.keyboard.press('Space');
  await page.clock.runFor(totalMs + 300);
  expect(await app.editingStep()).toBe(demo.frames.length - 1);

  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await page.clock.runFor(times[1] * 1000 + 300);
  expect(await app.editingStep()).toBe(1); // stops after one step
  await page.keyboard.press('ArrowLeft');
  expect(await app.editingStep()).toBe(0);
});

test('what is drawn matches the animation engine as it plays', async ({ app, page }) => {
  await page.keyboard.press('Space');
  for (let k = 0; k < 10; k++) {
    await page.clock.runFor(totalMs / 10);
    const shown = await app.snapshot();
    const expected = evaluate(demo, shown.time);
    for (const p of demo.players) {
      const s = shown.players[p.id];
      expect(s.x, `${p.id} at ${shown.time}s`).toBeCloseTo(expected.players[p.id].pos.x, 1);
      expect(s.y, `${p.id} at ${shown.time}s`).toBeCloseTo(expected.players[p.id].pos.y, 1);
      expect(Math.abs(((s.facing - expected.players[p.id].facing + 540) % 360) - 180), `${p.id} facing`).toBeLessThan(0.2);
    }
    expect(shown.disc.inFlight).toBe(expected.disc.inFlight);
  }
});

test('clicking a player mid-animation jumps to that step for editing', async ({ app, page }) => {
  await page.keyboard.press('ArrowRight');
  await page.clock.runFor(700);
  expect(await app.editingStep()).toBeNull();
  await app.player('O5').click();
  expect(await app.editingStep()).toBe(1);
});
