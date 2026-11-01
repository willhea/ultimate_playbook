// Present mode for recording: spec R-1.
import { test, expect } from './fixtures';
import { createDemoPlay } from '../src/plays';

test.describe('Present mode', () => {
  test('shows only the field, is driven by the keyboard, and Esc leaves it', async ({ app, page }) => {
    await app.open({ plays: [createDemoPlay()], fakeClock: true });
    await app.stepChip(0).click();
    await page.keyboard.press('p');
    const presenter = page.locator('.presenter');
    await expect(presenter).toBeVisible();
    const box = (await presenter.boundingBox())!;
    expect(box.width).toBe(1440);
    expect(box.height).toBe(900);
    // No editing handles, routes or selection in the recorded view.
    await expect(presenter.locator('[data-testid^="handle-"]')).toHaveCount(0);

    await page.keyboard.press('ArrowRight');
    await page.clock.runFor(4000);
    await expect(presenter.getByTestId('field')).toHaveAttribute('data-step', '1');

    await page.keyboard.press('Escape');
    await expect(presenter).toHaveCount(0);
  });

  test('can be opened from the toolbar and closed with its Exit button', async ({ app, page }) => {
    await app.open({ plays: [createDemoPlay()] });
    await app.button('Present').click();
    await expect(page.locator('.presenter')).toBeVisible();
    await page.mouse.move(700, 450);
    await page.locator('.presenter').getByRole('button', { name: 'Exit' }).click();
    await expect(page.locator('.presenter')).toHaveCount(0);
  });
});
