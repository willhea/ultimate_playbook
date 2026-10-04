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
| `npm test` | Runs the model tests (timing, smooth motion, facing, editing, play files). |
| `npm run typecheck` | Checks the TypeScript. |
| `npm run build` | Builds a static site into `dist/` that any static host (e.g. GitHub Pages) can serve. |
| `npm run build:single` | Builds everything into one HTML file, `dist-single/play-animator.html`, for sharing as a single page. |

## How the code is organized

- `src/model/` has no UI code. It holds the data format (`types.ts`), the USAU field (`field.ts`), the animation engine (`engine.ts`), the editing operations (`edit.ts`), and saving/loading (`storage.ts`). Tests live in `model.test.ts`.
- `src/state/` holds the saved-plays library with undo/redo (`library.ts`) and the playback clock (`usePlayback.ts`).
- `src/components/` holds the React UI: the SVG field, side panel, timeline, and dialogs.

Positions are in yards. x runs along the field (0–110, attacking toward 110) and y across it (0–40).
