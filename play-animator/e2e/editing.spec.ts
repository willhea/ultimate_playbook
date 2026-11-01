// Building a play in the editor. The editing rules themselves are unit-tested
// (src/model/edit.test.ts); these check that the editor wires them up.
import { test, expect } from './fixtures';
import { createPlay } from '../src/model/defaults';
import { createDemoPlay } from '../src/plays';

test('build a step: drag a run, bend it, and throw to the runner', async ({ app, page }) => {
  await app.open({ plays: [createPlay('Blank')] });
  await app.button('Add step').click();
  expect(await app.editingStep()).toBe(1);

  const start = await app.playerState('O5');
  const end = { x: start.x - 6, y: 32 };
  await app.dragPlayer('O5', end);
  expect(await app.playerState('O5')).toMatchObject({ x: expect.closeTo(end.x, 0), y: expect.closeTo(end.y, 0) });
  const route = app.field.getByTestId('route-O5');
  await expect(route).toBeVisible();

  const straight = await route.getAttribute('d');
  await app.dragHandle('O5', { x: (start.x + end.x) / 2 + 4, y: (start.y + end.y) / 2 - 4 });
  await expect(route).not.toHaveAttribute('d', straight!);
  await app.field.getByTestId('handle-O5').dblclick();
  await expect(route).toHaveAttribute('d', straight!);

  await app.dragDiscTo('O5');
  await expect(page.getByLabel(/Throw released/)).toBeVisible();
  const disc = await app.discState();
  expect(Math.hypot(disc.x - end.x, disc.y - end.y)).toBeLessThan(1.5);
});

test('undo and redo a drag from the keyboard and the toolbar', async ({ app, page }) => {
  await app.open({ plays: [createPlay('History')] });
  await expect(app.button('Undo')).toBeDisabled();
  const start = await app.playerState('O6');
  await app.dragPlayer('O6', { x: start.x + 8, y: 6 });

  await page.keyboard.press('Control+z');
  expect(await app.playerState('O6')).toMatchObject({ x: start.x, y: start.y });
  await app.button('Redo').click();
  expect((await app.playerState('O6')).y).toBeCloseTo(6, 0);
  await app.button('Undo').click();
  expect(await app.playerState('O6')).toMatchObject({ x: start.x, y: start.y });
});

test('set facing by hand and change who a defender guards', async ({ app, page }) => {
  await app.open({ plays: [createPlay('Blank')] });
  await page.keyboard.press('Digit4');
  const auto = (await app.playerState('O4')).facing;
  await page.keyboard.press('e'); // turn 15° to the right
  expect(((await app.playerState('O4')).facing - auto + 360) % 360).toBeCloseTo(15, 0);
  await app.button('Automatic').click();
  expect((await app.playerState('O4')).facing).toBeCloseTo(auto, 0);

  await page.keyboard.press('Shift+Digit3');
  await page.getByLabel('Guarding').selectOption({ label: 'Offense 7' });
  const d3 = await app.playerState('D3');
  const o7 = await app.playerState('O7');
  const toO7 = ((Math.atan2(o7.y - d3.y, o7.x - d3.x) * 180) / Math.PI + 360) % 360;
  expect(d3.facing).toBeCloseTo(toO7, 0);
});

test('rename, reorder and delete steps', async ({ app, page }) => {
  await app.open({ plays: [createDemoPlay()] });
  await app.stepChip(1).click();
  const name = page.getByLabel('Step name');
  await name.fill('First cut');
  await name.press('n'); // typing never triggers shortcuts ("n" adds a step)
  await name.press('Tab');
  await expect(app.stepChip(1)).toContainText('First cutn');

  await app.button('Move later').click();
  await expect(app.stepChip(2)).toContainText('First cutn');
  await app.button('Delete step').click();
  await app.button('Confirm delete').click();
  await expect(page.locator('.steps .step-chip')).toHaveCount(3); // setup, one step, "Add step"
});

test('the player with the disc cannot be removed', async ({ app, page }) => {
  await app.open({ plays: [createPlay('Blank')] });
  await app.button('Remove a offense player').click();
  await expect(app.player('O7')).toHaveCount(0);
  await page.keyboard.press('Digit1');
  await expect(app.button('Remove player')).toBeDisabled();
});
