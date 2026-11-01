// Accessibility: no serious problems axe can find, and the main flow works from the keyboard.
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';
import { createDemoPlay } from '../src/plays';

async function seriousViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
}

test.describe('accessibility', () => {
  test('the editor has no serious accessibility problems', async ({ app, page }) => {
    await app.open({ plays: [createDemoPlay()] });
    expect(await seriousViolations(page)).toEqual([]);
    await page.keyboard.press('Shift+Digit2');
    expect(await seriousViolations(page)).toEqual([]);
  });

  test('dialogs have no serious accessibility problems', async ({ app, page }) => {
    await app.open({ plays: [createDemoPlay()] });
    for (const name of ['Plays', 'Export', 'Import', 'Keyboard shortcuts']) {
      await app.button(name).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await seriousViolations(page), name).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
  });

  test('dark mode has no serious accessibility problems', async ({ app, page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await app.open({ plays: [createDemoPlay()] });
    expect(await seriousViolations(page)).toEqual([]);
  });

  test('steps, playback and dialogs work from the keyboard alone', async ({ app, page }) => {
    await app.open({ plays: [createDemoPlay()] });
    await app.stepChip(1).focus();
    await page.keyboard.press('Enter');
    expect(await app.editingStep()).toBe(1);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    expect(await app.editingStep()).toBe(2);

    await app.button('Plays').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('button', { name: 'New play' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
