# Plan and handoff

Where the project stands, what to build next, and how. Written so that work can
continue in a fresh session with no other context. Update it when a step lands.

## Where we are (November 2026)

- **Specs:** [`01-app-spec.md`](01-app-spec.md) for the tool (its §10 has a status table), plus [`02-video-series-spec.md`](02-video-series-spec.md) (parked) and [`03-3d-technique-videos-spec.md`](03-3d-technique-videos-spec.md) (not started). Decisions so far are in [`00-open-questions.md`](00-open-questions.md).
- **Research:** [`research/stacks.md`](research/stacks.md) covers the vertical and horizontal stack.
- **App:** [`app/`](../app/), a laptop-first web app (React, TypeScript, Vite, SVG field).
  - Building a play: numbered players with automatic facing, defenders who follow their player, step-by-step plays, curved runs and throws.
  - Watching it: playback, a close-up view, and Present mode.
  - Keeping it: undo/redo, autosave, import/export.
  - Seven example plays: four vertical stack, three horizontal stack.
- **Prototype link:** https://claude.ai/artifact/HqEAW4ffwiQ3BZGMWdpdaJ (v0.7). Publishing steps are under "Working notes" below.
- **Tests:** 87 unit tests (about 2 s) and 21 browser tests (about 16 s). CI runs both on every push.
  - Mutation testing: Stryker catches 76.5% of its logic edits, and every hand-made breakage of the app is caught by the browser tests.
  - Testing rules are in the app README.
- **Branches:** `main` holds the released code (v0.7) and is protected; work happens on `claude/wonderful-ptolemy-gluy7w` and reaches `main` through pull requests.

### Coaching decisions to respect
- USA Ultimate field, with the stack spacing the coach confirmed (12 yd and 5 yd vertical; 15 yd horizontal). Offense attacks left to right. **Force home**, with a right-handed thrower forced to flick for demos: the open side is the home sideline at the bottom of the screen (y → 40), and the mark stands on the top (backhand) side. The field labels the home and away sidelines.
- Players are numbered circles 1–7 on each team, with a facing wedge. Offense is blue, defense orange. Defender *n* guards offense *n*.
- **Downfield defenders line up on the open side:** deep far downfield (forcing the cut under), even near the disc.
- **Vertical stack: cuts come from the back of the stack. The exceptions are end-zone sets and break-side cuts, which come from the front.** A test in `src/plays/plays.test.ts` enforces this for the vertical examples.

**Words:** [`glossary.md`](glossary.md) defines the ultimate terms we use (open side, break side, mark, around and inside breaks, and so on). Use them in plays, notes and the UI.

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

### Done: show the force (spec A-2/A-3), and flip it

The coach's design (decision #10), built in `src/model/force.ts` and `Field.tsx`:
- **Only the mark has arms:** straight out to each side, 180° apart, at right angles to the way the mark faces, each one player radius past the body.
- **The break side is shaded:** a half circle (10 yd) around the thrower on the mark's side, split from the open side by a dashed line through the thrower, parallel to the mark's arms. So moving the mark by hand (straight up, flat mark) turns the shading with it.
- **The mark** is the defender guarding the player with the disc. The force fades in as they arrive (from 4.5 yd to 3.2 yd away) and disappears while the disc is in the air.
- **The label** reads "Force home (flick)" or "Force away (backhand)", under "Attacking →".
- **Show force** (on by default) sits next to "Show runs while playing", and Present mode follows it.
- **`Play.open`** ('bottom' = force home, the default) is used by automatic marks. **Flip force** mirrors the whole play top to bottom (positions, bends, facing) and is undoable.
- Next ideas, if the coach wants to experiment: a narrower angle than 180°, an arrow for the force, or hatching instead of shading.

### Done: coach's feedback, November 2026
- **Stack spacing in the app:** in the setup step, with nothing selected, a panel has sliders for the thrower to the front of the stack, and the space between cutters (horizontal: the thrower to the cutters). `Play.stack` records the spacing; `setStack` in `edit.ts` lines the cutters and their defenders up again. Old plays without `Play.stack` don't show the panel.
- **Downfield defenders** line up on the open side: even near the disc, deep further downfield to force the cut under (decision #12, `guardSpot`). The old `underSpot` is gone. Back-of-stack under cuts in the examples now curve out wide around the defenders, and "clear, then the next cut" starts with a covered deep cut (a defender playing deep doesn't cover the under).
- **Force shading** uses a light orange tint that reads more clearly on the green.

### Direction: plays are described to an AI (decision #16)

The coach expects to build plays mostly by describing them to an AI like Claude, then refining them in conversation; editing by hand stays as an option. What that means for the work:
- **The play script is the main format.** `PlayScript` in `src/plays/script.ts` is already what an AI writes: a stack, then steps of runs (with bends), throws, release times and narration notes. The example plays are written this way.
- **Automatic behavior is the multiplier.** The more the app fills in by itself (defense, how cuts look, timing), the less an AI or a person has to spell out, and the more real every play looks. That is the next step.
- **An AI needs to check its own work,** because the coach reviews from a phone: `validatePlay` plus pictures of each step (as `npm run screenshots` does for the examples).

### 1. Version control and CI (November 2026; owner steps pending)

The coach asked for tighter version control: `main` is protected and every change goes through a pull request.
- **`main`** was created from the v0.7 code. This session's branch keeps working and opens pull requests into it.
- **CI** (`.github/workflows/ci.yml`) runs lint, types, unit and browser tests on every pull request (no path filters, so required checks never hang) and on every push to `main`. After the tests pass it builds the app as one downloadable HTML file: `ultimate-playbook-pr-<number>` on a pull request (kept 14 days, to try before merging) and `ultimate-playbook-<commit>` on `main` (kept 90 days).
- **Dependabot** (`.github/dependabot.yml`) opens grouped weekly updates into `main`. It skips `@playwright/test` (pinned) and TypeScript 7.
- **Pull request template** (`.github/pull_request_template.md`): what changes for the coach, how it was checked, and decisions.
- **Owner steps (only the repository owner can do these, in GitHub's settings on the website):**
  1. Settings → General → Default branch: switch to `main`.
  2. Settings → Rules → Rulesets → New branch ruleset for `main`: restrict deletions, require a pull request before merging (0 approvals, since the coach is the only reviewer and can't approve their own pull requests), require status checks "Lint, types and unit tests" and "Browser tests", and block force pushes.
  3. Releases → Draft a new release → new tag `v0.7` on `main`. The cloud session's connection refuses tag pushes, so tags are made on GitHub.
  4. Close Dependabot pull request #1 (it targets the old default branch); the new config reopens updates against `main`.
- **The repository is public and was renamed `willhea/ultimate_playbook`** (November 2026), and everything followed the new name (decision #20): the app is "Ultimate Playbook" in `app/`, CI is `.github/workflows/ci.yml`, and browser storage keys start `ultimate-playbook:`. The cloud session's clone may still sit in a folder with the old name, and GitHub forwards the old repository name.
- **Repository check before going public (November 2026):** every file and the whole history of every branch were checked: no secrets, keys or tokens, no personal email or names (all commits are by "Claude <noreply@anthropic.com>" or Dependabot), and no private hosts. The only private things are claude.ai links (the prototype and session links), which only the owner can open.

### 2. Go public: a web address, share links, and a phone watch view (built, November 2026)

Decisions #17–#19: the plays are public (recreational league), anyone can make their own plays, most teammates will watch on phones, and GitHub Pages hosts it for free (`https://willhea.github.io/ultimate_playbook/`; the coach's `willhea.com` can be pointed at it later).

1. **Publish on every merge.** The `deploy` job in `.github/workflows/ci.yml` publishes `npm run build` to GitHub Pages after the tests pass on `main`. Owner step: Settings → Pages → Source: "GitHub Actions". Licensed MIT (`LICENSE`), the coach's choice.
2. **Watch view** (`src/components/Watch.tsx`). The field, play/pause and step buttons sized for thumbs, the step's notes, step dots, and Share. Phones open it by default (`(max-width: 760px), (pointer: coarse) and (max-height: 520px)`); portrait puts the controls at the bottom, landscape puts the field on the left. The editor's **Watch** button opens it on a computer. Open question: in portrait, turn the field so the offense attacks up the screen.
3. **Share links** (`src/model/share.ts`, spec D-3). `#play=<code>`: the play, rounded to the centimetre, deflate-compressed and base64url-encoded (about 2 KB for an example play). No server, nothing stored. Opening a link shows the watch view with **Make my own copy**. Broken or cut-off links get a plain explanation. The editor and the watch view both have **Share** (the phone's share sheet when there is one, otherwise Copy link).
4. **The public playbook** (`playbook()` in `src/plays/index.ts`). The built-in plays, always the latest version, each with a short link: `#playbook=<slug>`. The watch view's **Plays** list shows the playbook, then the plays saved in this browser. **First visits** now start with one copy of the first playbook play (not all of them); a phone's first visit watches the playbook. The next new play replaces that starter copy if it was never edited. Still to come: adding playbook plays through the AI authoring loop (step 4 below).

### 3. Cutting: refine how offense and defense move (with the coach)

Today every player in a step starts and stops together, along one smooth curve, and defenders react instantly. Candidates, to rank with the coach:
1. **Timing within a step** (spec S-5): a cutter starts, their defender reacts a beat late; a clear finishes before the next cut starts; the receiver keeps running through the catch.
2. **Cut shape:** a set-up (jab, or walking the defender away) and then a sharp change of direction, rather than one smooth arc. Probably a run with a plant point.
3. **Defender reaction:** hip to hip with the cutter versus trailing, and who gets beaten by how much.
4. **Lead passes** (spec S-6): the throw goes to space ahead of a running receiver.
5. **The new mark** arrives after the catch, and the force shows once they're set.
6. **Automatic clears:** a cutter who doesn't get the disc clears out to a sensible spot by themselves.
7. **Speed:** sprints versus jogs; deep cuts flat out.

### 4. AI authoring tools
- **Authoring guide** (`docs/play-authoring.md`): field coordinates (yards; attacking to the right; home sideline at the bottom, y = 40), the script format, the coaching rules from the decisions, and what the app does automatically (so a script only describes the offense and any deliberate defense).
- **Import a script:** the app's Import accepts a play script as well as a full play file, so a play an AI wrote can be pasted straight in.
- **A review command:** `npm run play <script>` validates a script and saves a picture of each step, so an AI session can check a play and send the pictures to the coach.
- **First play through the loop:** "Vertical stack: end zone, front cuts first" (the coach's rule: end-zone cuts come from the front). The cut-from-the-back test then needs an end-zone exemption, by title or tag.
- **Later:** a "describe a play" box in the app that calls Claude directly. That needs an API key and a budget, so it waits.

### 5. Then
- **Video pilot (Spec 2):** record one stack play with a voiceover, to learn what the tool still needs for video.
- **Later:** iPad and touch editing, a stall count, the 3D pilot, and branching plays (decision #14).

## Working notes (gotchas we've hit)

- **Commands** (run in `app/`): `npm run check` before every push. It runs lint, types, unit tests and browser tests. `npm run screenshots` saves pictures to `screenshots/` for checking plays by eye; look at them after changing a play. `npm run test:mutation` runs Stryker (about 10 min, report in `reports/mutation/`).
- **Playwright is pinned to 1.56.1** because that version matches the Chromium pre-installed in cloud sessions (`/opt/pw-browsers/chromium-1194`). CI runs browser tests in the `mcr.microsoft.com/playwright:v1.56.1-noble` container, because GitHub's `ubuntu-latest` (26.04) can't install Playwright 1.56's browser. If you upgrade Playwright, update both.
- **TypeScript is 6.0**, not 7, because `typescript-eslint` doesn't support 7 yet.
- **Property tests use a fixed seed** (`src/test/setup.ts`). `FC_SEED=random npm test` explores new cases.
- **Browser tests read what's drawn,** not test-only attributes: positions come from SVG transforms, and facing from the wedge's rotation. `e2e/fixtures.ts` `snapshot()` reads a whole frame in one go; don't read attributes one at a time while an animation runs.
- **The playbook is always current; saved copies aren't.** Playbook plays (watch view → Plays, or `#playbook=` links) always show the latest version. A copy saved in a browser keeps whatever version was copied.
- **Publishing the prototype link** (https://claude.ai/artifact/HqEAW4ffwiQ3BZGMWdpdaJ). Run `npm run build:single`, then use whichever publishing tool the session has:
  - **The `Artifact` tool:** publish `dist-single/ultimate-playbook.html` (a page fragment) with `url` set to the link. If it refuses because the live version came from a different tool, Read the saved copy it names, confirm it's only an older build of this app, and publish again.
  - **The claude-artifacts connector:** publish `dist-single/index.html` as `index.html` with `publish_files`, slug `884e0831-9ebb-4784-a3bf-b182a257c5d3`, and `base_version` from `get_artifact`. First change the doctype to `<!DOCTYPE html>` and remove `viewport-fit=cover`.
  - Either way, the artifact keeps its `downloads` capability, so Export's Download button works.
- **Network:** ultiworld.com and flikulti.com are blocked in cloud sessions, so research uses search results only.
