// Not a test: `npm run play -- <script.json>` runs this to check a draft play,
// save a picture of each step, and make a draft link to the live app.
// It writes what it found to DRAFT_RESULT for scripts/play.mjs to print.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from './fixtures';
import { checkDraft, draftLink, parseScript } from '../src/plays/draft';
import { decodePlay, encodePlay, slugOf } from '../src/model/share';

const file = process.env.DRAFT_FILE;
const resultFile = process.env.DRAFT_RESULT;
const pictures = process.env.DRAFT_PICTURES ?? 'drafts/pictures';

test('check a draft play', { tag: '@draft' }, async ({ app, page }) => {
  test.skip(!file || !resultFile, 'Run through `npm run play -- <script.json>`.');
  const save = (result: object) => writeFileSync(resultFile!, JSON.stringify(result, null, 2));

  const parsed = parseScript(readFileSync(file!, 'utf8'));
  if (!parsed.script) {
    save({ ok: false, errors: parsed.errors });
    return;
  }
  const check = checkDraft(parsed.script);
  const code = await encodePlay(check.play);
  // The link has to survive the same checks any shared link goes through.
  await decodePlay(code);

  const slug = slugOf(check.play.title) || 'play';
  mkdirSync(pictures, { recursive: true });
  const saved: string[] = [];
  await app.open({ plays: [check.play] });
  for (let i = 0; i < check.play.frames.length; i++) {
    await app.stepChip(i).click();
    const path = join(pictures, `${slug}-step-${i}.png`);
    await page.locator('.stage').screenshot({ path });
    saved.push(path);
  }
  save({ ok: check.ok, title: check.play.title, steps: check.play.frames.length - 1, lines: check.lines, pictures: saved, link: draftLink(code) });
});
