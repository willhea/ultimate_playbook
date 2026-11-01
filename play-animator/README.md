# Ultimate Play Animator (prototype)

A browser app for drawing ultimate plays on a USA Ultimate field and animating
them step by step. See [`../docs/01-play-animator-spec.md`](../docs/01-play-animator-spec.md)
for what it's meant to become.

## Using it

- **Setup** is the starting position. Drag players and the disc where you want them.
- **Add step**, then drag players to where they end up. The app animates the run.
- Drag the **disc onto a teammate** to throw to them during that step.
- Drag the **dot in the middle of a run or throw** to bend it. Double-click it to straighten it.
- Click a player to set their **facing** (automatic by default) or who a defender **guards**.
- **Space** plays, **→** plays just the next step, **←** goes back. Press **?** for all shortcuts.
- **Present** hides everything except the field, for screen recording.
- Plays save in the browser automatically. **Export** gives you a file (or text) you can keep or import elsewhere.

## Running it locally

Requires Node.js 20 or later.

```sh
cd play-animator
npm install
npm run dev        # open the printed http://localhost:5173 link
```

Other commands:

| Command | What it does |
|---------|--------------|
| `npm run check` | Everything CI runs: lint, typecheck, unit tests, browser tests. Run this before pushing. |
| `npm test` | Unit and property tests (Vitest, about 2 s). |
| `npm run test:e2e` | Browser tests (Playwright) against the production build. |
| `npm run test:visual` | Screenshot comparisons. Not run in CI, because rendering differs between machines. |
| `npm run test:visual:update` | Re-take the screenshots after an intended visual change. Look at the new images before committing them. |
| `npm run test:deep` | A long random search (2,000 generated plays) for animation glitches. |
| `npm run lint` / `npm run typecheck` | ESLint (including React hook rules) / TypeScript. |
| `npm run build` | Builds a static site into `dist/` that any static host (e.g. GitHub Pages) can serve. |
| `npm run build:single` | Builds everything into one HTML file, `dist-single/play-animator.html`, for sharing as a single page. |

## Tests

The tests are layered so that each kind of mistake is caught by the cheapest test that can catch it.

| Layer | Where | What it proves |
|-------|-------|----------------|
| **Unit** | `src/**/*.test.ts` | The pieces work: geometry, timing, editing, saving, undo/redo, the playback clock. |
| **Property** | the same files, using [fast-check](https://fast-check.dev) | Rules that must hold for *any* play, checked on hundreds of generated plays. For example, no player or disc ever jumps, export → import loses nothing, and the close-up always contains every player. When one fails, fast-check shrinks it to the smallest failing play. |
| **Ultimate rules** | `src/model/validate.ts` | `validatePlay()` flags plays that make no sense as ultimate: players on top of each other, faster-than-human runs, floating or impossible throws, defenders far from their player. Every built-in play must pass. |
| **Browser** | `e2e/*.spec.ts` | The real app in Chromium: dragging, throwing, playback on a fake clock, saving, import/export, Present mode, the stack plays, layout at several window sizes, accessibility (axe), and the single-file build. Any console error fails a test. |
| **Visual** | `e2e/visual.spec.ts` | Screenshots of every stack-play step, dark mode, narrow windows and dialogs, compared pixel by pixel. |

Property tests use a fixed random seed, so results repeat. `FC_SEED=random npm test` explores new cases; `FC_SEED=<n>` replays one that fast-check reported.

Browser tests read state from `data-testid`, `data-x`, `data-y` and `data-facing` attributes on the field's SVG elements, so they don't depend on pixels. Helpers live in `e2e/fixtures.ts`.

## How the code is organized

- `src/model/` has no UI code. It holds the data format (`types.ts`), the USAU field (`field.ts`), the animation engine (`engine.ts`), the editing operations (`edit.ts`), and saving/loading (`storage.ts`). Tests live in `model.test.ts`.
- `src/model/formations.ts` builds the vertical and horizontal stack starting positions; `src/plays/` holds the example plays, written as scripts.
- `src/state/` holds the saved-plays library with undo/redo (`library.ts`) and the playback clock (`playbackClock.ts`, used by `usePlayback.ts`).
- `src/components/` holds the React UI: the SVG field, side panel, timeline, and dialogs.

Positions are in yards. x runs along the field (0–110, attacking toward 110) and y across it (0–40).
