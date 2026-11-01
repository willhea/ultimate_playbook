/**
 * Shared test setup: an `app` page object that speaks in field yards and
 * player ids, seeded plays, and a guard that fails any test that logs an error.
 */
import { test as base, expect, type Locator, type Page } from '@playwright/test';
import type { Play, Vec } from '../src/model/types';

export { expect };

const PLAYS_KEY = 'ultimate-playbook:plays';
const CURRENT_KEY = 'ultimate-playbook:current';

export interface PlayerState {
  x: number;
  y: number;
  facing: number;
}

export interface OpenOptions {
  /** Plays to put in the browser's storage before the app loads. Omit for a first visit. */
  plays?: Play[];
  /** Which seeded play is open. Defaults to the first. */
  current?: string;
  /** Use a fake clock so animation tests can move time forward exactly. */
  fakeClock?: boolean;
}

export class AppPage {
  constructor(readonly page: Page) {}

  /** The editor's field (Present mode adds a second one). */
  get field(): Locator {
    return this.page.locator('.stage').getByTestId('field');
  }

  player(id: string): Locator {
    return this.field.getByTestId(`player-${id}`);
  }

  get disc(): Locator {
    return this.field.getByTestId('disc');
  }

  stepChip(i: number): Locator {
    return this.page.locator('.steps .step-chip').nth(i);
  }

  button(name: string | RegExp): Locator {
    return this.page.getByRole('button', { name, exact: typeof name === 'string' });
  }

  /** The watch view's field. */
  get watchField(): Locator {
    return this.page.locator('.watch-stage').getByTestId('field');
  }

  /** Open a link to a play (the part after #), which shows the watch view. */
  async openLink(hash: string, opts: { fakeClock?: boolean } = {}) {
    if (opts.fakeClock) await this.page.clock.install();
    await this.page.goto(`/#${hash}`);
    await expect(this.watchField).toBeVisible();
  }

  async open(opts: OpenOptions = {}) {
    if (opts.fakeClock) await this.page.clock.install();
    if (opts.plays) {
      const plays = opts.plays;
      const current = opts.current ?? plays[0].id;
      // Seed once per tab, so a reload keeps whatever the app saved.
      await this.page.addInitScript(
        ({ plays, current, keys }) => {
          if (sessionStorage.getItem('seeded')) return;
          localStorage.setItem(keys.plays, JSON.stringify(plays));
          localStorage.setItem(keys.current, current);
          sessionStorage.setItem('seeded', '1');
        },
        { plays, current, keys: { plays: PLAYS_KEY, current: CURRENT_KEY } },
      );
    }
    await this.page.goto('/');
    await expect(this.field).toBeVisible();
  }

  /**
   * The playhead time, and where every player and the disc are actually drawn, read
   * from the SVG's own transforms in a single pass over one rendered frame. Reading
   * what's drawn (not a separate test attribute) means a drawing bug can't hide.
   */
  async snapshot(): Promise<{ time: number; players: Record<string, PlayerState>; disc: { x: number; y: number; inFlight: boolean } }> {
    return this.field.evaluate((svg) => {
      const matrix = (el: Element | null) => (el as SVGGraphicsElement | null)?.transform.baseVal.consolidate()?.matrix;
      const at = (el: Element | null) => ({ x: matrix(el)?.e ?? 0, y: matrix(el)?.f ?? 0 });
      const players: Record<string, { x: number; y: number; facing: number }> = {};
      for (const el of svg.querySelectorAll('[data-testid^="player-"]')) {
        const m = matrix(el.querySelector(':scope > g')); // the facing wedge's rotation
        const facing = m ? ((Math.atan2(m.b, m.a) * 180) / Math.PI + 360) % 360 : 0;
        players[el.getAttribute('data-testid')!.slice('player-'.length)] = { ...at(el), facing };
      }
      const disc = svg.querySelector('[data-testid="disc"]');
      return {
        time: Number(svg.getAttribute('data-time')),
        players,
        disc: { ...at(disc), inFlight: disc?.classList.contains('in-flight') ?? false },
      };
    });
  }

  async playerState(id: string): Promise<PlayerState> {
    return (await this.snapshot()).players[id];
  }

  async discState() {
    return (await this.snapshot()).disc;
  }

  /** Index of the step being edited, or null while between steps. */
  async editingStep(): Promise<number | null> {
    const v = await this.field.getAttribute('data-frame');
    return v === '' || v === null ? null : Number(v);
  }

  /** Screen coordinates for a point on the field, in yards. Works whatever the zoom. */
  async toScreen(p: Vec): Promise<Vec> {
    return this.field.evaluate((svg, p) => {
      const s = svg as SVGSVGElement;
      const pt = s.createSVGPoint();
      pt.x = p.x;
      pt.y = p.y;
      const out = pt.matrixTransform(s.getScreenCTM()!);
      return { x: out.x, y: out.y };
    }, p);
  }

  /** Drag from one field point to another. Both points are converted before the drag starts. */
  async drag(from: Vec, to: Vec) {
    const a = await this.toScreen(from);
    const b = await this.toScreen(to);
    await this.page.mouse.move(a.x, a.y);
    await this.page.mouse.down();
    await this.page.mouse.move(b.x, b.y, { steps: 6 });
    await this.page.mouse.up();
  }

  async dragPlayer(id: string, to: Vec) {
    const s = await this.playerState(id);
    await this.drag(s, to);
  }

  async dragDiscTo(id: string) {
    const d = await this.discState();
    const target = await this.playerState(id);
    await this.drag(d, target);
  }

  /** Drag the bend handle of a run (or 'throw') to a field point. */
  async dragHandle(id: string, to: Vec) {
    const handle = this.field.getByTestId(`handle-${id}`);
    const box = (await handle.boundingBox())!;
    const b = await this.toScreen(to);
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(b.x, b.y, { steps: 6 });
    await this.page.mouse.up();
  }

  /** The plays saved in the browser right now. */
  async savedPlays(): Promise<Play[]> {
    return this.page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]'), PLAYS_KEY);
  }
}

export const test = base.extend<{ app: AppPage }>({
  page: async ({ page }, use) => {
    // Web fonts are blocked in some environments; block them everywhere so text renders the same.
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      if (/Failed to load resource/.test(m.text())) return; // the blocked fonts above
      problems.push(`console error: ${m.text()}`);
    });
    await use(page);
    expect(problems, 'the page logged errors').toEqual([]);
  },
  app: async ({ page }, use) => {
    await use(new AppPage(page));
  },
});
