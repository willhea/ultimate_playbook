# Ultimate Playbook (prototype)

A browser app for drawing ultimate plays on a USA Ultimate field and animating
them step by step. See [`../docs/01-app-spec.md`](../docs/01-app-spec.md)
for what it's meant to become.

## Using it

- **Setup** is the starting position. Drag players and the disc where you want them.
- **Add step**, then drag players to where they end up. The app animates the run.
- Drag the **disc onto a teammate** to throw to them during that step.
- Drag the **dot in the middle of a run or throw** to bend it. Double-click it to straighten it.
- **Defenders follow the player they guard**: they trail a step behind a runner and step up to mark whoever catches the disc. Drag a defender to place them by hand in that step; click them and choose **Automatic** to undo that.
- **Stack spacing:** on the setup step, with no player selected, sliders set the distance to the stack and the space between cutters.
- **The force:** the mark holds out their arms and the break side is shaded. **Flip force** switches force home and force away; **Show force** hides it.
- Click a player to set their **facing** (automatic by default) or who a defender **guards**.
- **Space** plays, **→** plays just the next step, **←** goes back. Press **?** for all shortcuts.
- **Present** hides everything except the field, for screen recording.
- Plays save in the browser automatically. **Export** gives you a file (or text) you can keep or import elsewhere.

## Running it locally

Requires Node.js 20 or later.

```sh
cd app
npm install
npm run dev        # open the printed http://localhost:5173 link
```

Other commands:

| Command | What it does |
|---------|--------------|
| `npm run check` | Everything CI runs: lint, typecheck, unit tests, browser tests. Run it before pushing. |
| `npm test` | Unit tests (Vitest, about 2 s). |
| `npm run test:e2e` | Browser tests (Playwright) against the production build (about 15 s). |
| `npm run test:mutation` | Mutation testing with [Stryker](https://stryker-mutator.io), about 15 min. It makes hundreds of small changes to the logic and reports any that no unit test notices; see `reports/mutation/index.html`. Run it after big changes to the logic. Not part of CI. |
| `npm run screenshots` | Saves pictures of every example play step, dark mode and a narrow window to `screenshots/` for looking over. It never fails. |
| `npm run build` | Builds a static site into `dist/` that any static host (e.g. GitHub Pages) can serve. |
| `npm run build:single` | Builds everything into one HTML file, `dist-single/ultimate-playbook.html`, for sharing as a single page. |

## Tests

Two layers, each with one job.

**Unit tests** (`src/**/*.test.ts`, next to the code they test) cover all the logic: the animation engine, editing, the playback clock, undo/redo, saving, formations, and the ultimate checks in `validatePlay()`. A few are **property tests** ([fast-check](https://fast-check.dev)), which check a rule against many generated plays. For example, nothing in an animation ever jumps (`src/test/continuity.ts`), and moving a player never changes earlier steps. They use a fixed seed, so results repeat. `FC_SEED=random npm test` explores new cases.

**Browser tests** (`e2e/`) check that the app wires that logic up, with one test per thing a person does: building a step, undo, facing and guarding, managing steps, playing, saving and reloading, the plays list, import/export, Present mode, accessibility, small windows, and the one-file build. Helpers are in `e2e/fixtures.ts`. Tests read positions from `data-testid`, `data-x`, `data-y` and `data-facing` on the field's SVG, never from pixels. Any console error fails a test.

**Do the tests actually catch bugs?** Mutation testing checks. Hand-made breakages of the app's wiring (drawing players in the wrong place, the Undo button redoing, autosave not saving, and so on) are all caught by the browser tests. Stryker's report on the logic lists what's left uncaught. Most of it is changes no one could notice, like `<` vs `<=` on a measurement or the exact arc height of the disc.

When adding a test:
- Put rules in unit tests. Add a browser test only for a new thing a person can do, and keep it to that one journey.
- Test behaviour and shape, not exact numbers that are meant to be tuned (e.g. "the stack is evenly spaced", not "the stack starts 12 yd out").
- Don't add screenshot comparisons. To check how something looks, run `npm run screenshots` and look.

## How the code is organized

- `src/model/` has no UI code. It holds the data format (`types.ts`), the USAU field (`field.ts`), the animation engine (`engine.ts`), the editing operations (`edit.ts`), and saving/loading (`storage.ts`). Tests live in `model.test.ts`.
- `src/model/formations.ts` builds the vertical and horizontal stack starting positions; `src/plays/` holds the example plays, written as scripts.
- `src/state/` holds the saved-plays library with undo/redo (`library.ts`) and the playback clock (`playbackClock.ts`, used by `usePlayback.ts`).
- `src/components/` holds the React UI: the SVG field, side panel, timeline, and dialogs.

Positions are in yards. x runs along the field (0–110, attacking toward 110) and y across it (0–40).
