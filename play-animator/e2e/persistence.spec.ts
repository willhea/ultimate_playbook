// Saving and sharing: spec §6.7 (D-*).
import { test, expect } from './fixtures';
import { createPlay } from '../src/model/defaults';
import { createDemoPlay, examplePlays } from '../src/plays';

test.describe('saving plays', () => {
  test('a first visit opens the example plays', async ({ app, page }) => {
    await app.open();
    await expect(page.getByLabel('Ultimate Play Animator')).toHaveValue(examplePlays[0].title);
    await app.button('Plays').click();
    for (const p of examplePlays) await expect(page.getByRole('dialog').getByText(p.title, { exact: true })).toBeVisible();
  });

  test('changes are saved automatically and survive a reload (D-1)', async ({ app, page }) => {
    await app.open({ plays: [createPlay('Saved')] });
    const start = await app.playerState('O5');
    await app.dragPlayer('O5', { x: start.x + 5, y: 35 });
    await expect.poll(async () => (await app.savedPlays())[0]?.frames[0].positions.O5.y).toBeCloseTo(35, 0);
    await page.reload();
    expect((await app.playerState('O5')).y).toBeCloseTo(35, 0);
  });

  test('new, duplicate, switch and delete plays from the Plays list', async ({ app, page }) => {
    await app.open({ plays: [createDemoPlay()] });
    const dialog = page.getByRole('dialog');
    const title = page.getByLabel('Ultimate Play Animator');

    await app.button('Plays').click();
    await dialog.getByRole('button', { name: 'New play' }).click();
    await expect(title).toHaveValue('Untitled play');
    await expect(page.locator('.steps .step-chip')).toHaveCount(2);

    await app.button('Plays').click();
    await dialog.getByRole('button', { name: /Vertical stack: under, then deep/ }).click();
    await expect(title).toHaveValue('Vertical stack: under, then deep');

    await app.button('Plays').click();
    await dialog.getByRole('button', { name: 'Duplicate this play' }).click();
    await expect(title).toHaveValue('Vertical stack: under, then deep (copy)');

    await app.button('Plays').click();
    await expect(dialog.locator('.play-list li')).toHaveCount(3);
    await dialog.locator('.play-list li').filter({ hasText: 'Untitled play' }).getByRole('button', { name: 'Delete' }).click();
    await dialog.getByRole('button', { name: 'Confirm delete' }).click();
    await expect(dialog.locator('.play-list li')).toHaveCount(2);
  });

  test('an exported play imports back as a new copy (D-2)', async ({ app, page }) => {
    await app.open({ plays: [createDemoPlay()] });
    await app.button('Export').click();
    const text = await page.getByLabel('Play file contents').inputValue();
    expect(JSON.parse(text).title).toBe('Vertical stack: under, then deep');
    await page.keyboard.press('Escape');

    await app.button('Import').click();
    await page.getByLabel('Or paste it here').fill(text);
    await page.getByRole('dialog').getByRole('button', { name: 'Import' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.steps .step-chip')).toHaveCount(createDemoPlay().frames.length + 1);
    await expect.poll(async () => (await app.savedPlays()).length).toBe(2);
  });

  test('a play file can be imported from disk', async ({ app, page }) => {
    await app.open({ plays: [createPlay('Only')] });
    await app.button('Import').click();
    await page.getByLabel('Play file').setInputFiles({
      name: 'demo.play.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(createDemoPlay())),
    });
    await expect(page.getByLabel('Ultimate Play Animator')).toHaveValue('Vertical stack: under, then deep');
  });

  test('importing something that is not a play explains the problem', async ({ app, page }) => {
    await app.open({ plays: [createPlay('Only')] });
    await app.button('Import').click();
    await page.getByLabel('Or paste it here').fill('my notes about the zone');
    await page.getByRole('dialog').getByRole('button', { name: 'Import' }).click();
    await expect(page.getByRole('alert')).toContainText("isn't a play file");
  });

  test('the export can be downloaded as a file', async ({ app, page }) => {
    await app.open({ plays: [createDemoPlay()] });
    await app.button('Export').click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download file' }).click();
    expect((await download).suggestedFilename()).toBe('vertical-stack-under-then-deep.play.json');
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
    await expect(page.getByLabel('Ultimate Play Animator')).toHaveValue(examplePlays[0].title);
    const start = await app.playerState('O7');
    await app.dragPlayer('O7', { x: start.x + 4, y: 6 });
    expect((await app.playerState('O7')).y).toBeCloseTo(6, 0);
  });
});
