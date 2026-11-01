// Not a test: `npm run screenshots` saves pictures of every example play step,
// dark mode and a narrow window to screenshots/, for looking over by eye.
import { test } from './fixtures';
import { buildExamplePlays, createDemoPlay } from '../src/plays';

test.describe('screenshots', { tag: '@screenshots' }, () => {
  for (const play of buildExamplePlays()) {
    const slug = play.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    test(play.title, async ({ app, page }) => {
      await app.open({ plays: [play] });
      for (let i = 0; i < play.frames.length; i++) {
        await app.stepChip(i).click();
        await page.locator('.stage').screenshot({ path: `screenshots/${slug}-step-${i}.png` });
      }
    });
  }

  test('editor, dark mode and narrow window', async ({ app, page }) => {
    await app.open({ plays: [createDemoPlay()] });
    await app.stepChip(1).click();
    await page.screenshot({ path: 'screenshots/editor.png' });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({ path: 'screenshots/editor-dark.png' });
    await page.setViewportSize({ width: 820, height: 1100 });
    await page.screenshot({ path: 'screenshots/editor-narrow.png', fullPage: true });
  });
});
