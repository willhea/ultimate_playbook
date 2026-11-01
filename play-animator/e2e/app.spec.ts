// Whole-app checks: Present mode, accessibility, small windows and the one-file build.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';
import { createDemoPlay } from '../src/plays';

test('Present mode shows only the field, plays from the keyboard, and Esc leaves it', async ({ app, page }) => {
  await app.open({ plays: [createDemoPlay()], fakeClock: true });
  await app.stepChip(0).click();
  await page.keyboard.press('p');
  const presenter = page.locator('.presenter');
  await expect(presenter).toBeVisible();
  await expect(presenter.locator('[data-testid^="handle-"]')).toHaveCount(0);
  await page.keyboard.press('ArrowRight');
  await page.clock.runFor(4000);
  await expect(presenter.getByTestId('field')).toHaveAttribute('data-step', '1');
  await page.keyboard.press('Escape');
  await expect(presenter).toHaveCount(0);
});

test('no serious accessibility problems in the editor or a dialog', async ({ app, page }) => {
  const serious = async () =>
    (await new AxeBuilder({ page }).analyze()).violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}: ${v.help}`);
  await app.open({ plays: [createDemoPlay()] });
  expect(await serious()).toEqual([]);
  await app.button('Plays').click();
  await expect(page.getByRole('button', { name: 'New vertical stack' })).toBeFocused();
  expect(await serious()).toEqual([]);
});

test('laptop and narrow windows never scroll sideways', async ({ app, page }) => {
  await app.open({ plays: [createDemoPlay()] });
  for (const size of [{ width: 1280, height: 720 }, { width: 820, height: 1100 }]) {
    await page.setViewportSize(size);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${size.width} px wide`).toBeLessThanOrEqual(0);
  }
});

test('the one-file build works when a host page wraps it (the shareable link)', async ({ app, page }) => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  execSync('npx vite build --mode single && node scripts/to-artifact.mjs', { cwd: root, stdio: 'pipe' });
  const fragment = readFileSync(`${root}/dist-single/play-animator.html`, 'utf8');
  const page_ = `<!doctype html><html><head><meta charset="utf-8"></head><body>${fragment}</body></html>`;
  await page.route('https://artifact.test/**', (route) => route.fulfill({ contentType: 'text/html', body: page_ }));
  await page.goto('https://artifact.test/');
  await expect(app.field).toBeVisible();
  await expect(app.player('O1')).toBeVisible();
});
