// Saving, the plays list, and play files. Storage and file parsing are unit-tested
// (src/model/storage.test.ts); these check the app around them.
import { test, expect } from './fixtures';
import { createPlay } from '../src/model/defaults';
import { createDemoPlay, examplePlays } from '../src/plays';

test('a first visit opens the example plays, and edits survive a reload', async ({ app, page }) => {
  await app.open();
  await expect(page.getByLabel('Ultimate Playbook')).toHaveValue(examplePlays[0].title);
  const start = await app.playerState('O7');
  await app.dragPlayer('O7', { x: start.x + 4, y: 6 });
  await expect.poll(async () => (await app.savedPlays()).length).toBe(examplePlays.length);
  await expect.poll(async () => (await app.savedPlays())[0].frames[0].positions.O7.y).toBeCloseTo(6, 0);
  await page.reload();
  expect((await app.playerState('O7')).y).toBeCloseTo(6, 0);
});

test('the plays list starts new plays, copies examples and deletes plays', async ({ app, page }) => {
  await app.open({ plays: [createPlay('Mine')] });
  const dialog = page.getByRole('dialog');
  const title = page.getByLabel('Ultimate Playbook');

  await app.button('Plays').click();
  await dialog.getByRole('button', { name: 'New horizontal stack' }).click();
  await expect(title).toHaveValue('Horizontal stack play');

  await app.button('Plays').click();
  await dialog.getByRole('button', { name: `Add a copy of ${examplePlays[4].title}` }).click();
  await expect(title).toHaveValue(examplePlays[4].title);

  await app.button('Plays').click();
  const mine = dialog.locator('.play-list li').filter({ hasText: 'Mine' });
  await mine.getByRole('button', { name: 'Delete' }).click();
  await dialog.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(dialog.locator('.play-list li')).toHaveCount(2);
});

test('an exported play imports back, and a bad file is explained', async ({ app, page }) => {
  await app.open({ plays: [createDemoPlay()] });
  await app.button('Export').click();
  const text = await page.getByLabel('Play file contents').inputValue();
  await page.keyboard.press('Escape');

  await app.button('Import').click();
  const paste = page.getByLabel('Or paste it here');
  const importButton = page.getByRole('dialog').getByRole('button', { name: 'Import' });
  await paste.fill('my notes about the zone');
  await importButton.click();
  await expect(page.getByRole('alert')).toContainText("isn't a play file");
  await paste.fill(text);
  await importButton.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await app.savedPlays()).length).toBe(2);
});

test('the app still works when browser storage is blocked', async ({ app, page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
  });
  await app.open();
  const start = await app.playerState('O7');
  await app.dragPlayer('O7', { x: start.x + 4, y: 6 });
  expect((await app.playerState('O7')).y).toBeCloseTo(6, 0);
});
