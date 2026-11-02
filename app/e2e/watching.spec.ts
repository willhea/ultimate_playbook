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
    await expect(app.button('Phone preview')).toHaveCount(0); // already on a phone

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

test('a link that was cut off when copied is explained, and the app still works', async ({ app, page }) => {
  const code = await encodePlay(createDemoPlay());
  await app.openLink(`play=${code.slice(0, code.length / 2)}`);
  await expect(page.getByRole('status')).toContainText('cut off');
  await app.button('Plays').click();
  await page.getByRole('button', { name: /Vertical stack: dump and swing/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vertical stack: dump and swing');
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

test('preview a play on a phone, upright and sideways, from a computer (decision #22)', async ({ app, page }) => {
  const play = { ...createDemoPlay(), title: 'Draft: dump and swing' };
  await app.openLink(`play=${await encodePlay(play)}`);
  await app.button('Phone preview').click();

  const preview = page.getByRole('dialog', { name: 'Phone preview' });
  const screen = preview.locator('iframe');
  const phone = page.frameLocator('.phone-screen');
  // The real app runs inside, laid out for a phone held upright.
  await expect(phone.getByRole('heading', { level: 1 })).toHaveText('Draft: dump and swing');
  await expect(phone.getByText('Turn your phone sideways for a bigger field.')).toBeVisible();
  await expect(phone.getByRole('button', { name: 'Phone preview' })).toHaveCount(0);
  await expect(screen).toHaveAttribute('width', '390');

  await preview.getByRole('button', { name: 'Sideways' }).click();
  await expect(screen).toHaveAttribute('width', '844');
  await expect(phone.getByRole('heading', { level: 1 })).toHaveText('Draft: dump and swing');
  await expect(phone.getByText('Turn your phone sideways for a bigger field.')).toBeHidden();

  await page.keyboard.press('Escape');
  await expect(preview).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Draft: dump and swing');
});
