// Watching and sharing plays (decisions #17–#18): teammates mostly watch on phones,
// from links. Link packing is unit-tested (src/model/share.test.ts); these check the journeys.
import { test, expect } from './fixtures';
import { encodePlay } from '../src/model/share';
import { createDemoPlay } from '../src/plays';

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('open a shared play, step through it, keep a copy, and browse the playbook', async ({ app, page }) => {
    const play = createDemoPlay();
    await app.openLink(`play=${await encodePlay(play)}`, { fakeClock: true });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(play.title);
    await expect(page.getByText(play.frames[0].notes)).toBeVisible();

    await app.button('Next step').click();
    await page.clock.runFor(4000);
    await expect(page.getByText(`Step 1 of ${play.frames.length - 1}`)).toBeVisible();
    await expect(page.getByText(play.frames[1].notes)).toBeVisible();

    await app.button('Make my own copy').click();
    await expect(page.getByRole('status')).toContainText('Saved to your plays');
    await expect.poll(async () => (await app.savedPlays()).map((p) => p.title)).toContain(play.title);

    await app.button('Plays').click();
    await page.getByRole('button', { name: /Horizontal stack: poppers split/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Horizontal stack: poppers split');
    await expect(page).toHaveURL(/#playbook=horizontal-stack-poppers-split$/);
  });
});

test('share a play from the editor; the link opens it for anyone', async ({ app, page }) => {
  const play = { ...createDemoPlay(), title: 'Our end-of-game play' };
  await app.open({ plays: [play] });
  await app.button('Share').click();
  const link = page.getByLabel('Link to this play');
  await expect(link).toHaveValue(/#play=[A-Za-z0-9_-]+$/);
  const url = await link.inputValue();

  await page.goto(url);
  await expect(app.watchField).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Our end-of-game play');
  await app.button('Make my own copy').click();
  await expect(page.getByLabel('Ultimate Playbook')).toHaveValue('Our end-of-game play'); // on a computer, straight into the editor
});
