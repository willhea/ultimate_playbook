// The page fits the window: no sideways scrolling, and the field keeps its shape.
import { test, expect } from './fixtures';
import { createDemoPlay } from '../src/plays';

const sizes = [
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'small laptop', width: 1280, height: 720 },
  { name: 'narrow window', width: 820, height: 1100 },
];

for (const size of sizes) {
  test(`fits a ${size.name} (${size.width}×${size.height})`, async ({ app, page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await app.open({ plays: [createDemoPlay()] });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    const field = (await app.field.boundingBox())!;
    const stage = (await page.locator('.stage').boundingBox())!;
    expect(field.width / field.height).toBeCloseTo(116 / 47, 1);
    expect(field.x).toBeGreaterThanOrEqual(stage.x);
    expect(field.x + field.width).toBeLessThanOrEqual(stage.x + stage.width + 0.5);
    expect(field.y + field.height).toBeLessThanOrEqual(stage.y + stage.height + 0.5);
    // The field uses most of the room it has.
    expect(Math.max(field.width / stage.width, field.height / stage.height)).toBeGreaterThan(0.85);
  });
}

test('the whole-field view shows both end zones', async ({ app, page }) => {
  await app.open({ plays: [createDemoPlay()] });
  const closeUp = await app.field.getAttribute('viewBox');
  // The vertical-stack close-up cuts off both sidelines, so it says where they are.
  await expect(app.field.getByTestId('sideline-top')).toContainText('SIDELINE');
  await expect(app.field.getByTestId('sideline-bottom')).toContainText('SIDELINE');
  await page.getByRole('button', { name: 'Whole field' }).click();
  await expect(app.field).toHaveAttribute('viewBox', '-3 -4 116 47');
  await expect(app.field.getByTestId('sideline-top')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close-up' }).click();
  await expect(app.field).toHaveAttribute('viewBox', closeUp!);
});
