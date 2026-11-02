/**
 * Share links (spec D-3): the whole play travels inside the link, compressed, so
 * sharing needs no server and stores nothing. A link looks like
 *   https://…/ultimate_playbook/#play=<code>
 * Playbook plays (the ones built into the app) get a short link instead:
 *   https://…/ultimate_playbook/#playbook=<slug>
 */
import type { Play } from './types';
import { readPlay } from './sanitize';
import { newId } from './edit';

/** Links longer than this aren't plays; the limit also caps the work done on a bad link. */
const MAX_CODE = 60_000;
const MAX_JSON = 500_000;

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): Uint8Array {
  const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function readAll(stream: ReadableStream<Uint8Array>, limit: number): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > limit) throw new Error('too big');
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/** Pack a play into a link-safe code. Positions are rounded to the centimetre, which nobody can see. */
export async function encodePlay(play: Play): Promise<string> {
  const json = JSON.stringify(play, (_key, v: unknown) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v));
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return toBase64Url(await readAll(stream, Infinity));
}

/** Unpack a code from a link. The play gets a fresh id, so opening a link never overwrites a saved play. */
export async function decodePlay(code: string): Promise<Play> {
  const broken = "That link doesn't contain a whole play. It may have been cut off when it was copied.";
  if (!code || code.length > MAX_CODE) throw new Error(broken);
  let parsed: unknown;
  try {
    const stream = new Blob([fromBase64Url(code) as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    parsed = JSON.parse(new TextDecoder().decode(await readAll(stream, MAX_JSON)));
  } catch {
    throw new Error(broken);
  }
  const play = readPlay(parsed);
  if (!play) throw new Error(broken);
  return { ...play, id: newId('play') };
}

/** A short, readable name for a playbook play, used in its link. */
export function slugOf(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export type Route = { kind: 'none' } | { kind: 'shared'; code: string } | { kind: 'playbook'; slug: string };

/** What a page address asks for: a shared play, a playbook play, or nothing in particular. */
export function parseHash(hash: string): Route {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const code = params.get('play');
  if (code) return { kind: 'shared', code };
  const slug = params.get('playbook');
  if (slug) return { kind: 'playbook', slug };
  return { kind: 'none' };
}

/** The page address without any #… part. */
export function pageAddress(): string {
  return window.location.href.split('#')[0];
}

/** The link that opens a play: short for a playbook play, otherwise with the whole play inside. */
export async function linkFor(play: Play, slug?: string): Promise<string> {
  return slug ? `${pageAddress()}#playbook=${slug}` : `${pageAddress()}#play=${await encodePlay(play)}`;
}
