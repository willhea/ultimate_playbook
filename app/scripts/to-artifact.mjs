// Turns the single-file build (dist-single/index.html) into a page fragment for
// hosts that supply their own <html>/<head>/<body>, such as a claude.ai artifact.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-single/index.html', 'utf8');
const pick = (re) => [...html.matchAll(re)].map((m) => m[0]);

const title = pick(/<title>[\s\S]*?<\/title>/g);
const links = pick(/<link rel="(?:preconnect|stylesheet)"[^>]*>/g);
const styles = pick(/<style[\s\S]*?<\/style>/g);
const scripts = pick(/<script[\s\S]*?<\/script>/g);
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '';
const bodyWithoutScripts = body.replace(/<script[\s\S]*?<\/script>/g, '').trim();

const out = [...title, ...links, ...styles, bodyWithoutScripts, ...scripts].join('\n');
writeFileSync('dist-single/ultimate-playbook.html', out);
console.log(`dist-single/ultimate-playbook.html (${(out.length / 1024).toFixed(0)} KB)`);
