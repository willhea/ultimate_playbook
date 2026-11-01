// Screenshot baselines, for reviewing how things look. Run with `npm run test:visual`
// (not in CI: rendering differs slightly between machines). Refresh with `npm run test:visual:update`.
import { test, expect } from './fixtures';
import { buildExamplePlays, createDemoPlay } from '../src/plays';
import { frameTimes } from '../src/model/engine';

test.describe('how it looks', { tag: '@visual' }, () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-01T09:00:00') });
  });

  for (const play of buildExamplePlays()) {
    const slug = play.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    test(`${play.title}: setup and each step`, async ({ app, page }) => {
      await app.open({ plays: [play] });
      for (let i = 0; i < play.frames.length; i++) {
        await app.stepChip(i).click();
        await expect(page.locator('.stage')).toHaveScreenshot(`${slug}-step-${i}.png`);
      }
    });
  }

  test('editor with a defender selected', async ({ app, page }) => {
    await app.open({ plays: [createDemoPlay()] });
    await app.stepChip(1).click();
    await page.keyboard.press('Shift+Digit3');
    await expect(page).toHaveScreenshot('editor-defender-selected.png');
  });

  test('a huck in the air', async ({ app, page }) => {
    const play = createDemoPlay();
    const t = frameTimes(play)[1] + play.frames[2].duration * 0.75;
    await app.open({ plays: [play] });
    await page.locator('#scrubber').fill(t.toFixed(2));
    await expect(page.locator('.stage')).toHaveScreenshot('huck-in-the-air.png');
  });

  test('dark mode', async ({ app, page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await app.open({ plays: [createDemoPlay()] });
    await app.stepChip(1).click();
    await expect(page).toHaveScreenshot('editor-dark.png');
  });

  test('narrow window', async ({ app, page }) => {
    await page.setViewportSize({ width: 820, height: 1100 });
    await app.open({ plays: [createDemoPlay()] });
    await expect(page).toHaveScreenshot('editor-narrow.png', { fullPage: true });
  });

  test('present mode', async ({ app, page }) => {
    await app.open({ plays: [createDemoPlay()] });
    await app.stepChip(1).click();
    await page.keyboard.press('p');
    await page.clock.runFor(4000); // let the hint fade
    await expect(page).toHaveScreenshot('present.png');
  });

  test('plays list', async ({ app, page }) => {
    await app.open();
    await app.button('Plays').click();
    await expect(page.getByRole('dialog')).toHaveScreenshot('plays-list.png', { mask: [page.locator('.play-meta')] });
  });
});
