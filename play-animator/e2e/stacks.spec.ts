// The built-in vertical and horizontal stack plays, played in the real app.
import { test, expect } from './fixtures';
import { buildExamplePlays } from '../src/plays';
import { totalDuration } from '../src/model/engine';

for (const play of buildExamplePlays()) {
  test(`${play.title} plays from start to finish`, async ({ app, page }) => {
    await app.open({ plays: [play], fakeClock: true });
    await app.stepChip(0).click();
    await page.keyboard.press('Space');
    await page.clock.runFor(totalDuration(play) * 1000 + 300);
    const last = play.frames.length - 1;
    expect(await app.editingStep()).toBe(last);

    // The disc ends in the hands of the last receiver.
    const holder = play.frames[last].discHolder;
    const disc = await app.discState();
    const h = await app.playerState(holder);
    expect(Math.hypot(disc.x - h.x, disc.y - h.y)).toBeLessThan(1.5);

    // Every player is on screen in the close-up.
    const field = (await app.field.boundingBox())!;
    for (const p of play.players) {
      const box = (await app.player(p.id).boundingBox())!;
      expect(box.x, `${p.id} off the left`).toBeGreaterThanOrEqual(field.x - 1);
      expect(box.y, `${p.id} off the top`).toBeGreaterThanOrEqual(field.y - 1);
      expect(box.x + box.width, `${p.id} off the right`).toBeLessThanOrEqual(field.x + field.width + 1);
      expect(box.y + box.height, `${p.id} off the bottom`).toBeLessThanOrEqual(field.y + field.height + 1);
    }

    // Every step has notes to read over it.
    for (let i = 0; i <= last; i++) {
      await app.stepChip(i).click();
      await expect(page.getByLabel('Notes for the voiceover')).not.toHaveValue('');
    }
  });
}
