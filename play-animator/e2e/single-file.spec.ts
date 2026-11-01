// The one-file build used for the shareable claude.ai link works when a host wraps it in its own page.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures';

const root = fileURLToPath(new URL('..', import.meta.url));

test.describe('single-file build', () => {
  test.beforeAll(() => {
    execSync('npx vite build --mode single && node scripts/to-artifact.mjs', { cwd: root, stdio: 'pipe' });
  });

  test('loads, shows the examples and plays when wrapped by a host page', async ({ app, page }) => {
    const fragment = readFileSync(`${root}/dist-single/play-animator.html`, 'utf8');
    expect(fragment).not.toMatch(/<html|<body|<!doctype/i);
    expect(fragment).toMatch(/^<title>Ultimate Play Animator<\/title>/);
    const wrapped = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${fragment}</body></html>`;
    await page.route('https://artifact.test/**', (route) => route.fulfill({ contentType: 'text/html', body: wrapped }));
    await page.clock.install();
    await page.goto('https://artifact.test/page');
    await expect(app.field).toBeVisible();
    await expect(page.getByLabel('Ultimate Play Animator')).toHaveValue('Vertical stack: under, then deep');
    await page.keyboard.press('ArrowRight');
    await page.clock.runFor(3000);
    expect(await app.editingStep()).toBe(1);
  });
});
