# Plan and handoff

Where the project stands, what to build next, and how. Written so that work can
continue in a fresh session with no other context. Update it when a step lands.

## Where we are (November 2026)

- **Specs:** [`01-play-animator-spec.md`](01-play-animator-spec.md) for the tool (its §10 has a status table), plus [`02-video-series-spec.md`](02-video-series-spec.md) (parked) and [`03-3d-technique-videos-spec.md`](03-3d-technique-videos-spec.md) (not started). Decisions so far are in [`00-open-questions.md`](00-open-questions.md).
- **Research:** [`research/stacks.md`](research/stacks.md) covers the vertical and horizontal stack.
- **App:** [`play-animator/`](../play-animator/), a laptop-first web app (React, TypeScript, Vite, SVG field).
  - Building a play: numbered players with automatic facing, defenders who follow their player, step-by-step plays, curved runs and throws.
  - Watching it: playback, a close-up view, and Present mode.
  - Keeping it: undo/redo, autosave, import/export.
  - Seven example plays: four vertical stack, three horizontal stack.
- **Prototype link:** https://claude.ai/artifact/HqEAW4ffwiQ3BZGMWdpdaJ (v0.5). Publishing steps are under "Working notes" below.
- **Tests:** 75 unit tests (about 2 s) and 17 browser tests (about 16 s). CI runs both on every push.
  - Mutation testing: Stryker catches 76.5% of its logic edits, and every hand-made breakage of the app is caught by the browser tests.
  - Testing rules are in the app README.
- **Branch:** all work is on `claude/wonderful-ptolemy-gluy7w`. It hasn't been merged to `main` yet.

### Coaching decisions to respect
- USA Ultimate field. Offense attacks left to right. **Force home**, with a right-handed thrower forced to flick for demos: the open side is the home sideline at the bottom of the screen (y → 40), and the mark stands on the top (backhand) side. The field labels the home and away sidelines.
- Players are numbered circles 1–7 on each team, with a facing wedge. Offense is blue, defense orange. Defender *n* guards offense *n*.
- **Vertical stack: cuts come from the back of the stack. The exceptions are end-zone sets and break-side cuts, which come from the front.** A test in `src/plays/plays.test.ts` enforces this for the vertical examples.

**Words:** [`glossary.md`](glossary.md) defines the ultimate terms we use (open side, break side, mark, around and inside breaks, and so on). Use them in plays, notes and the UI, and check its open questions.

## Next steps, in order

### Done: defenders follow their player automatically (spec E-8)

How it works (`src/model/defenders.ts`; the rules are in its header comment):
- A defender who guards someone is **automatic** in every step unless placed by hand. In each step they:
  - **mark** their player if that player catches the disc in that step (`markSpot`);
  - **trail** a step behind (2.7 yd, angled 45° toward the side they started on) if their player runs;
  - otherwise **keep the same spacing** they had at the end of the last step.
- Their path is curved so the spacing turns smoothly, and swings round *behind* a runner rather than through them.
- The edit operations call `placeDefenders(play)` after every change, and the results are stored in `frame.positions` and `frame.curves`. The engine didn't change.
- **The setup is always by hand.** Moving a player in the setup brings their defender along. Changing who a defender guards moves them next to their new player.
- **Dragging a defender in a step** (or bending their run) places them by hand in that step: `Frame.manual`. The player panel has **Position: Automatic / By hand**. This differs from the earlier design: "by hand" doesn't carry forward. The next step's automatic defender just keeps the spacing you set.
- **Plays saved before this are version 1.** Loading or importing one marks a defender as placed by hand wherever automatic placement would have moved them, so old plays look exactly as they did (`upgradeDefenders`). New plays are version 2.
- The example plays no longer script defenders, except the fronting D7 in "clear, then the next cut".
- `validatePlay` now also flags players who **run through each other** partway through a step (`run-through`, closer than 1.8 yd). The hand-placed defenders in the old example plays did this; the automatic ones don't.

### 1. Show the force: open and break sides (spec A-2/A-3), and flip the field

**Why:** the stack plays, especially the break-side cut, only make sense when viewers can see which side is open.

**The coach's design (November 2026):**
- The force is shown as a **shaded angle**.
- **Only the mark** gets **arms**: straight out to each side, 180° apart (a line through the mark, at right angles to the way the mark faces), each arm as long as the player's radius (`PLAYER_RADIUS`).
- Open question in [`glossary.md`](glossary.md#questions-for-you): does the shading cover the open side (a wedge from the thrower that lines up with the mark's arms) or the break side the mark takes away? Ask before building.

**Design**
- Add `Play.open?: 'bottom' | 'top'`, defaulting to `'bottom'` (force home), and pass it to the formation functions. Automatic defenders mark with `markSpot` in `src/model/defenders.ts` (`guardMove`), so pass it there too. Show the force in the coach's words, e.g. "Force home (flick)"; flipping makes it "Force away (backhand)" for a right-handed thrower.
- `Field.tsx` draws the shaded angle and the mark's arms (above). The mark is whoever guards the disc holder; arms show while they stand within a few yards of the thrower, including during playback. A "Show force" toggle sits next to "Show runs while playing" and is on by default.
- A **Flip force** button mirrors the play top to bottom: y → 40 − y, bends mirrored, facing angle → −angle. That gives each play for both forces.

**Tests:**
- Unit: flipping twice gives the original play; flipping keeps `validatePlay` passing; marks end up on the new break side.
- Browser: none needed, unless the toggle gets a journey of its own.

### 2. An end-zone example play

Your rule says end-zone cuts come from the front of the stack. Add "Vertical stack: end zone, front cuts first", with the disc around the brick and the stack in the end zone. Extend the cut-from-the-back test so end-zone plays are exempt; the simplest way is a title or tag check.

### 3. Remaining question for the coach
- Do the spacing defaults match your whiteboard? Vertical: 12 yd to the stack, 5 yd apart. Horizontal: cutters 15 yd deep. (Force is decided: force home, right-handed flick.)

### 4. Then
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
- **Publishing the prototype link** (https://claude.ai/artifact/HqEAW4ffwiQ3BZGMWdpdaJ). Run `npm run build:single`, then use whichever publishing tool the session has:
  - **The `Artifact` tool:** publish `dist-single/play-animator.html` (a page fragment) with `url` set to the link. If it refuses because the live version came from a different tool, Read the saved copy it names, confirm it's only an older build of this app, and publish again.
  - **The claude-artifacts connector:** publish `dist-single/index.html` as `index.html` with `publish_files`, slug `884e0831-9ebb-4784-a3bf-b182a257c5d3`, and `base_version` from `get_artifact`. First change the doctype to `<!DOCTYPE html>` and remove `viewport-fit=cover`.
  - Either way, the artifact keeps its `downloads` capability, so Export's Download button works.
- **Network:** ultiworld.com and flikulti.com are blocked in cloud sessions, so research uses search results only.
