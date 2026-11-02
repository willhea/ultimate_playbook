#!/usr/bin/env node
// `npm run play -- <script.json>`: check a play script, save a picture of each step
// and print a draft link to the live app. Exits 1 if the play has errors.
// The work happens in e2e/draft.spec.ts, which runs in a browser.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: npm run play -- <script.json>');
  process.exit(2);
}
const file = resolve(process.env.INIT_CWD ?? process.cwd(), arg);
if (!existsSync(file)) {
  console.error(`No such file: ${file}`);
  process.exit(2);
}

const dir = mkdtempSync(join(tmpdir(), 'play-'));
const resultFile = join(dir, 'result.json');
const run = spawnSync('npx', ['playwright', 'test', 'e2e/draft.spec.ts', '--grep', '@draft', '--reporter=line'], {
  env: { ...process.env, DRAFT_FILE: file, DRAFT_RESULT: resultFile },
  encoding: 'utf8',
});
if (!existsSync(resultFile)) {
  console.error('The check could not run:\n');
  console.error(run.stdout, run.stderr);
  process.exit(1);
}
const result = JSON.parse(readFileSync(resultFile, 'utf8'));
rmSync(dir, { recursive: true, force: true });

if (result.errors) {
  console.log('The script has problems, so no play was made:');
  for (const e of result.errors) console.log(`  - ${e}`);
  process.exit(1);
}
console.log(`${result.title} (${result.steps} step${result.steps === 1 ? '' : 's'})`);
console.log(result.lines.length ? result.lines.map((l) => `  - ${l}`).join('\n') : '  No problems found.');
console.log('\nPictures:');
for (const p of result.pictures) console.log(`  ${p}`);
console.log(`\nDraft link:\n${result.link}`);
process.exit(result.ok ? 0 : 1);
