# Plan and handoff

Where the project stands, what to build next, and how. Written so that work can
continue in a fresh session with no other context. Update it when a step lands.

## Where we are (November 2026)

- **Specs:** [`01-play-animator-spec.md`](01-play-animator-spec.md) for the tool (its §10 has a status table), plus [`02-video-series-spec.md`](02-video-series-spec.md) (parked) and [`03-3d-technique-videos-spec.md`](03-3d-technique-videos-spec.md) (not started). Decisions so far are in [`00-open-questions.md`](00-open-questions.md).
- **Research:** [`research/stacks.md`](research/stacks.md) covers the vertical and horizontal stack.
- **App:** [`play-animator/`](../play-animator/), a laptop-first web app (React, TypeScript, Vite, SVG field).
  - Building a play: numbered players with automatic facing, step-by-step plays, curved runs and throws.
  - Watching it: playback, a close-up view, and Present mode.
  - Keeping it: undo/redo, autosave, import/export.
  - Seven example plays: four vertical stack, three horizontal stack.
- **Prototype link:** https://claude.ai/artifact/HqEAW4ffwiQ3BZGMWdpdaJ (v0.3). Publishing steps are under "Working notes" below.
- **Tests:** 66 unit tests (about 2 s) and 16 browser tests (about 16 s). CI runs both on every push.
  - Mutation testing: Stryker catches 76.5% of its logic edits, and every hand-made breakage of the app is caught by the browser tests.
  - Testing rules are in the app README.
- **Branch:** all work is on `claude/wonderful-ptolemy-gluy7w`. It hasn't been merged to `main` yet.

### Coaching decisions to respect
- USA Ultimate field. Offense attacks left to right. **By default the open side is the bottom of the screen** (y → 40).
- Players are numbered circles 1–7 on each team, with a facing wedge. Offense is blue, defense orange. Defender *n* guards offense *n*.
- **Vertical stack: cuts come from the back of the stack. The exceptions are end-zone sets and break-side cuts, which come from the front.** A test in `src/plays/plays.test.ts` enforces this for the vertical examples.

## Next steps, in order

### 1. Defenders follow their player automatically (spec E-8). Highest value.

**Why:** today every run needs its defender moved by hand, which doubles the work of building a play. You can see it in `src/plays/*.ts`, where half of each step's `runs` are defenders.

**Design**
- A defender with someone to guard is **automatic** by default. Whenever the edit operations change positions or the disc holder, they recompute automatic defenders' spots and store them in `frame.positions`. The engine and saved-play format stay unchanged, apart from one new optional field.
- **Where an automatic defender stands in each step:**
  - If their player has the disc in that step, the defender **marks**: `markSpot(holder, open)` in `src/model/formations.ts`.
  - Otherwise they stand at the guard spot: `underSpot(player, open)`, the under/open side, about 2.7 yd away.
  - When their player runs, the defender's path copies the runner's curve (`frame.curves`), so they trail along the same line.
- **Dragging a defender** in a step makes them *manual* for that step. Store this as a new optional `Frame.manual?: Record<string, true>`. Old play files without it still load, because it's optional.
  - The player panel gets an "Automatic / By hand" control, the same as facing.
  - Manual carries forward like positions do: later steps where that defender hasn't moved stay manual.
- **Changing who a defender guards** (`setGuards`) re-places automatic defenders in every step.
- Set it up as a guard-spot function in `formations.ts` (it already has `markSpot`/`underSpot`) and a `placeDefenders(play, fromStep)` pass in `src/model/edit.ts`. Call that pass from `movePlayer`, `setHolder`, `setGuards`, `addStep` and `addPlayer`.
- **Then simplify the example plays:** delete the defender entries from the `runs` in `src/plays/vertical.ts` and `horizontal.ts`. Keep only deliberate ones, such as a defender fronting the under cut in "clear, then the next cut"; those become manual.

**Tests** (following the README rules: logic in unit tests, one browser test for the journey):
- **Unit:**
  - Moving a cutter moves their automatic defender.
  - A manual defender stays put.
  - A throw sends the receiver's defender to the mark.
  - `setGuards` re-places the defender.
  - Old plays without `manual` still load.
  - A property: automatic defenders never overlap anyone (`validatePlay` passes for random plays built only from offense moves).
- **Browser:** one test in `e2e/editing.spec.ts`: drag a cutter and their defender follows; drag the defender and it stays; click "Automatic" and it snaps back.
- Every example play must still pass `validatePlay` and the cut-from-the-back test.

### 2. Show the force: open and break sides (spec A-2/A-3), and flip the field

**Why:** the stack plays, especially the break-side cut, only make sense when viewers can see which side is open.

**Design**
- Add `Play.open?: 'bottom' | 'top'`, defaulting to `'bottom'`, and pass it to the formation functions.
- `Field.tsx` draws a light shading on the open side downfield of the disc, and a short arrow from the mark showing the force. A "Show force" toggle sits next to "Show runs while playing" and is on by default.
- A **Flip force** button mirrors the play top to bottom: y → 40 − y, bends mirrored, facing angle → −angle. That gives each play for both forces.

**Tests:**
- Unit: flipping twice gives the original play; flipping keeps `validatePlay` passing; marks end up on the new break side.
- Browser: none needed, unless the toggle gets a journey of its own.

### 3. An end-zone example play

Your rule says end-zone cuts come from the front of the stack. Add "Vertical stack: end zone, front cuts first", with the disc around the brick and the stack in the end zone. Extend the cut-from-the-back test so end-zone plays are exempt; the simplest way is a title or tag check.

### 4. Remaining questions for the coach
- Which force do you usually teach (forehand/flick or backhand)? That sets the default open side.
- Do the spacing defaults match your whiteboard? Vertical: 12 yd to the stack, 5 yd apart. Horizontal: cutters 15 yd deep.

### 5. Then
- **Video pilot (Spec 2):** record one stack play with a voiceover, to learn what the tool still needs for video.
- **Go public:**
  - Open a pull request from this branch into `main`.
  - Host on GitHub Pages: the owner turns Pages on in the repository settings, and then a workflow publishes `npm run build`.
  - Deal with Dependabot pull request #1 (a Vite bump) after the merge.
- **Later:** iPad and touch, a stall count, branching plays, and the 3D pilot.

## Working notes (gotchas we've hit)

- **Commands** (run in `play-animator/`): `npm run check` before every push. It runs lint, types, unit tests and browser tests. `npm run screenshots` saves pictures to `screenshots/` for checking plays by eye; look at them after changing a play. `npm run test:mutation` runs Stryker (about 10 min, report in `reports/mutation/`).
- **Playwright is pinned to 1.56.1** because that version matches the Chromium pre-installed in cloud sessions (`/opt/pw-browsers/chromium-1194`). CI runs browser tests in the `mcr.microsoft.com/playwright:v1.56.1-noble` container, because GitHub's `ubuntu-latest` (26.04) can't install Playwright 1.56's browser. If you upgrade Playwright, update both.
- **TypeScript is 6.0**, not 7, because `typescript-eslint` doesn't support 7 yet.
- **Property tests use a fixed seed** (`src/test/setup.ts`). `FC_SEED=random npm test` explores new cases.
- **Browser tests read what's drawn,** not test-only attributes: positions come from SVG transforms, and facing from the wedge's rotation. `e2e/fixtures.ts` `snapshot()` reads a whole frame in one go; don't read attributes one at a time while an animation runs.
- **First visit seeds the example plays.** A browser that already has saved plays keeps them, so tell the user to use Plays → "Add a copy" to see new or changed examples.
- **Publishing the prototype link:**
  1. Run `npm run build:single`.
  2. Take `dist-single/index.html`. It must start with `<!DOCTYPE html>`; remove `viewport-fit=cover` from its viewport meta.
  3. Republish it as `index.html` to the artifact (slug `884e0831-9ebb-4784-a3bf-b182a257c5d3`) with the claude-artifacts `publish_files` tool, passing the current version from `get_artifact` as `base_version`. The artifact has the `downloads` capability, so Export's Download button works.
- **Network:** ultiworld.com and flikulti.com are blocked in cloud sessions, so research uses search results only.
