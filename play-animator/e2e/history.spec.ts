// Undo and redo: spec E-7.
import { test, expect } from './fixtures';
import { createPlay } from '../src/model/defaults';

test.describe('undo and redo', () => {
  test.beforeEach(async ({ app }) => {
    await app.open({ plays: [createPlay('History')] });
  });

  test('a drag undoes in one step, from the keyboard or the buttons', async ({ app, page }) => {
    await expect(app.button('Undo')).toBeDisabled();
    const start = await app.playerState('O6');
    await app.dragPlayer('O6', { x: start.x + 8, y: 6 });
    await expect(app.button('Undo')).toBeEnabled();

    await page.keyboard.press('Control+z');
    expect(await app.playerState('O6')).toMatchObject({ x: start.x, y: start.y });
    await expect(app.button('Redo')).toBeEnabled();

    await page.keyboard.press('Control+Shift+z');
    expect((await app.playerState('O6')).y).toBeCloseTo(6, 0);

    await app.button('Undo').click();
    expect(await app.playerState('O6')).toMatchObject({ x: start.x, y: start.y });
    await app.button('Redo').click();
    expect((await app.playerState('O6')).y).toBeCloseTo(6, 0);
    await expect(app.button('Redo')).toBeDisabled();
  });

  test('renaming the play undoes in one step', async ({ page }) => {
    const title = page.getByLabel('Ultimate Play Animator');
    await title.fill('Ho stack, side');
    await title.press('Enter');
    await page.keyboard.press('Control+z');
    await expect(title).toHaveValue('History');
  });

  test('a throw and a new step undo one at a time', async ({ app, page }) => {
    await app.button('Add step').click();
    await app.dragDiscTo('O3');
    await expect(page.locator('#step-release')).toBeVisible();
    await page.keyboard.press('Control+z');
    await expect(page.locator('#step-release')).toHaveCount(0);
    await page.keyboard.press('Control+z');
    await expect(page.locator('.steps .step-chip')).toHaveCount(2); // setup and "Add step"
  });

  test('keyboard shortcuts are ignored while typing', async ({ app, page }) => {
    await app.button('Add step').click();
    const notes = page.getByLabel('Notes for the voiceover');
    await notes.fill('Watch the hips');
    await notes.press('Space');
    await notes.press('n');
    await expect(notes).toHaveValue('Watch the hips n');
    await expect(page.locator('.steps .step-chip')).toHaveCount(3);
  });
});
