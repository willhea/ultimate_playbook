// Building a play: spec §6.2 (E-*) and §6.3 (S-*).
import { test, expect } from './fixtures';
import { createPlay } from '../src/model/defaults';
import { createDemoPlay } from '../src/plays';

test.describe('editing a play', () => {
  test('moving a player in the setup carries into later steps (E-1)', async ({ app }) => {
    await app.open({ plays: [createDemoPlay()] });
    await app.stepChip(0).click();
    await app.dragPlayer('O7', { x: 78, y: 8 });
    expect(await app.playerState('O7')).toMatchObject({ x: expect.closeTo(78, 0), y: expect.closeTo(8, 0) });
    for (const step of [1, 2]) {
      await app.stepChip(step).click();
      expect(await app.playerState('O7')).toMatchObject({ x: expect.closeTo(78, 0), y: expect.closeTo(8, 0) });
    }
  });

  test('adding a step and dragging a player draws their run (S-1)', async ({ app }) => {
    await app.open({ plays: [createPlay('Blank')] });
    await expect(app.page.getByText('Set up your starting positions')).toBeVisible();
    await app.button('Add step').click();
    expect(await app.editingStep()).toBe(1);
    const start = await app.playerState('O5');
    await app.dragPlayer('O5', { x: start.x - 6, y: 32 });
    expect(await app.playerState('O5')).toMatchObject({ x: expect.closeTo(start.x - 6, 0), y: expect.closeTo(32, 0) });
    await expect(app.field.getByTestId('route-O5')).toBeVisible();
    await expect(app.field.getByTestId('ghost-O5')).toBeVisible();
    await expect(app.field.getByTestId('handle-O5')).toBeVisible();
    // Players who didn't move get no route.
    await expect(app.field.getByTestId('route-O4')).toHaveCount(0);
  });

  test('a run can be bent and straightened again (S-2)', async ({ app }) => {
    await app.open({ plays: [createPlay('Blank')] });
    await app.button('Add step').click();
    const start = await app.playerState('O6');
    const end = { x: start.x + 10, y: 32 };
    await app.dragPlayer('O6', end);
    const route = app.field.getByTestId('route-O6');
    const straight = await route.getAttribute('d');
    await app.dragHandle('O6', { x: (start.x + end.x) / 2 + 4, y: (start.y + end.y) / 2 - 4 });
    await expect(route).not.toHaveAttribute('d', straight!);
    await expect(app.button('Straighten run')).toBeVisible();
    await app.field.getByTestId('handle-O6').dblclick();
    await expect(route).toHaveAttribute('d', straight!);
  });

  test('dragging the disc onto a teammate makes a throw (S-3)', async ({ app }) => {
    await app.open({ plays: [createPlay('Blank')] });
    await app.button('Add step').click();
    await expect(app.page.locator('#step-release')).toHaveCount(0);
    await app.dragDiscTo('O3');
    await expect(app.page.locator('#step-release')).toBeVisible();
    await expect(app.field.getByTestId('route-throw')).toBeVisible();
    await expect(app.field.getByTestId('handle-throw')).toBeVisible();
    const disc = await app.discState();
    const o3 = await app.playerState('O3');
    expect(Math.hypot(disc.x - o3.x, disc.y - o3.y)).toBeLessThan(1.5);
  });

  test('dropping the disc away from any teammate changes nothing', async ({ app }) => {
    await app.open({ plays: [createPlay('Blank')] });
    await app.button('Add step').click();
    const before = await app.discState();
    await app.drag(before, { x: before.x, y: 2 });
    expect(await app.discState()).toEqual(before);
    await expect(app.page.locator('#step-release')).toHaveCount(0);
  });

  test('facing is automatic until set by hand, and can go back to automatic (E-5)', async ({ app, page }) => {
    await app.open({ plays: [createPlay('Blank')] });
    await page.keyboard.press('Digit4');
    await expect(app.player('O4')).toHaveAttribute('data-selected', 'true');
    const auto = (await app.playerState('O4')).facing;
    await expect(app.button('Automatic')).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('e');
    await page.keyboard.press('e');
    const turned = (await app.playerState('O4')).facing;
    expect((turned - auto + 360) % 360).toBeCloseTo(30, 0);
    await expect(app.button('By hand')).toHaveAttribute('aria-pressed', 'true');

    // Click the left edge of the dial: face back toward your own end zone.
    const dial = page.getByRole('slider', { name: 'Facing direction' });
    const box = (await dial.boundingBox())!;
    await page.mouse.click(box.x + 4, box.y + box.height / 2);
    expect((await app.playerState('O4')).facing).toBeCloseTo(180, 0);

    await app.button('Automatic').click();
    expect((await app.playerState('O4')).facing).toBeCloseTo(auto, 0);
  });

  test('changing who a defender guards turns them toward their new player (E-5c)', async ({ app, page }) => {
    await app.open({ plays: [createPlay('Blank')] });
    await page.keyboard.press('Shift+Digit3');
    await expect(page.getByText('Defender 3')).toBeVisible();
    await page.getByLabel('Guarding').selectOption({ label: 'Offense 7' });
    const d3 = await app.playerState('D3');
    const o7 = await app.playerState('O7');
    const expected = ((Math.atan2(o7.y - d3.y, o7.x - d3.x) * 180) / Math.PI + 360) % 360;
    expect(d3.facing).toBeCloseTo(expected, 0);
  });

  test('players can be removed and added back, but not the one with the disc', async ({ app, page }) => {
    await app.open({ plays: [createPlay('Blank')] });
    await app.button('Remove a offense player').click();
    await expect(app.player('O7')).toHaveCount(0);
    await expect(app.button('Add a offense player')).toBeEnabled();
    await app.button('Add a offense player').click();
    await expect(app.player('O7')).toHaveCount(1);
    await expect(app.button('Add a offense player')).toBeDisabled();

    await page.keyboard.press('Digit1');
    await expect(app.button('Remove player')).toBeDisabled();
  });

  test('steps can be renamed, reordered and deleted (S-8)', async ({ app, page }) => {
    await app.open({ plays: [createDemoPlay()] });
    await app.stepChip(1).click();
    await page.getByLabel('Step name').fill('First cut');
    await page.getByLabel('Step name').press('Tab');
    await expect(app.stepChip(1)).toContainText('First cut');

    await app.button('Move later').click();
    await expect(app.stepChip(2)).toContainText('First cut');
    expect(await app.editingStep()).toBe(2);

    await app.button('Delete step').click();
    await app.button('Confirm delete').click();
    await expect(page.locator('.steps .step-chip')).toHaveCount(3); // setup, one step, "Add step"
    expect(await app.editingStep()).toBe(1);
  });

  test('trying to edit mid-animation jumps to the step being played', async ({ app, page }) => {
    await app.open({ plays: [createDemoPlay()], fakeClock: true });
    await page.keyboard.press('ArrowRight');
    await page.clock.runFor(700);
    expect(await app.editingStep()).toBeNull();
    await app.player('O5').click();
    expect(await app.editingStep()).toBe(1);
  });
});
