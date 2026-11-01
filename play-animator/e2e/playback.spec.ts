// Watching a play: spec §6.4 (P-*). Uses a fake clock so time moves exactly.
import { test, expect } from './fixtures';
import { createDemoPlay } from '../src/plays';
import { evaluate, frameTimes, totalDuration } from '../src/model/engine';

const demo = createDemoPlay();
const times = frameTimes(demo);
const totalMs = totalDuration(demo) * 1000;
const lastStep = demo.frames.length - 1;
/** The scrubber moves in 0.01 s steps; give it a value already in the browser's own format. */
const scrubTo = (t: number) => String(Number(t.toFixed(2)));

test.describe('playback', () => {
  test.beforeEach(async ({ app }) => {
    await app.open({ plays: [demo], fakeClock: true });
    await app.stepChip(0).click();
  });

  test('Space plays the whole play and stops on the last step (P-1)', async ({ app, page }) => {
    await page.keyboard.press('Space');
    await expect(app.button('Pause')).toBeVisible();
    await page.clock.runFor(totalMs / 2);
    expect(await app.editingStep()).toBeNull();
    await page.clock.runFor(totalMs / 2 + 300);
    expect(await app.editingStep()).toBe(lastStep);
    await expect(app.button('Play')).toBeVisible();
    await expect(page.locator('.clock')).toHaveText(`${(totalMs / 1000).toFixed(1)} / ${(totalMs / 1000).toFixed(1)} s`);
  });

  test('Play from the end starts over', async ({ app, page }) => {
    await app.stepChip(lastStep).click();
    await app.button('Play').click();
    await page.clock.runFor(100);
    expect((await app.shownStep()).step).toBe(1);
  });

  test('→ plays exactly one step and stops on it; ← and Home go back (P-2)', async ({ app, page }) => {
    await page.keyboard.press('ArrowRight');
    await page.clock.runFor(times[1] * 1000 + 300);
    expect(await app.editingStep()).toBe(1);
    await page.clock.runFor(2000);
    expect(await app.editingStep()).toBe(1);

    await page.keyboard.press('ArrowRight');
    await page.clock.runFor((times[2] - times[1]) * 1000 + 300);
    expect(await app.editingStep()).toBe(2);

    await page.keyboard.press('ArrowLeft');
    expect(await app.editingStep()).toBe(1);
    await page.keyboard.press('Home');
    expect(await app.editingStep()).toBe(0);
  });

  test('the scrubber jumps to any moment (P-3)', async ({ app, page }) => {
    const mid = (times[1] + times[2]) / 2;
    await page.locator('#scrubber').fill(scrubTo(mid));
    const shown = await app.shownStep();
    expect(shown.step).toBe(2);
    expect(shown.u).toBeCloseTo(0.5, 1);
    expect(await app.editingStep()).toBeNull();
  });

  test('2× speed plays in half the time (P-4)', async ({ app, page }) => {
    await page.getByLabel('Speed').selectOption('2');
    await page.keyboard.press('Space');
    await page.clock.runFor(totalMs / 2 + 300);
    expect(await app.editingStep()).toBe(lastStep);
  });

  test('loop keeps playing from the start (P-5)', async ({ app, page }) => {
    await page.getByLabel('Loop').check();
    await page.keyboard.press('Space');
    await page.clock.runFor(totalMs + 500);
    await expect(app.button('Pause')).toBeVisible();
    expect((await app.shownStep()).step).toBe(1);
  });

  test('the disc is in the air halfway through the throw', async ({ app, page }) => {
    const f = demo.frames[2];
    const t = times[1] + f.duration * (f.release + (1 - f.release) / 2);
    await page.locator('#scrubber').fill(scrubTo(t));
    expect((await app.discState()).inFlight).toBe(true);
    await page.locator('#scrubber').fill(scrubTo(times[1] + f.duration * f.release * 0.5));
    expect((await app.discState()).inFlight).toBe(false);
  });

  test('what is drawn matches the animation engine at every moment (P-8)', async ({ app, page }) => {
    // Smoothness itself is proven by the property tests; this checks the app shows exactly what the engine computes.
    await page.keyboard.press('Space');
    for (let k = 0; k < 12; k++) {
      await page.clock.runFor(totalMs / 12);
      const shown = await app.snapshot();
      const expected = evaluate(demo, shown.time);
      for (const id of ['O1', 'O3', 'D3', 'O4', 'D4']) {
        const s = shown.players[id];
        expect(s.x, `${id} x at ${shown.time}s`).toBeCloseTo(expected.players[id].pos.x, 1);
        expect(s.y, `${id} y at ${shown.time}s`).toBeCloseTo(expected.players[id].pos.y, 1);
        const turn = Math.abs(((s.facing - expected.players[id].facing + 540) % 360) - 180);
        expect(turn, `${id} facing at ${shown.time}s`).toBeLessThan(0.2);
      }
      expect(shown.disc.x).toBeCloseTo(expected.disc.pos.x, 1);
      expect(shown.disc.inFlight).toBe(expected.disc.inFlight);
    }
  });

  test('"Show runs while playing" draws the current runs during playback (P-7)', async ({ app, page }) => {
    await page.keyboard.press('Space');
    await page.clock.runFor(500);
    await expect(app.field.getByTestId('route-O3')).toBeVisible();
    await page.getByLabel('Show runs while playing').uncheck();
    await expect(app.field.getByTestId('route-O3')).toHaveCount(0);
  });
});
