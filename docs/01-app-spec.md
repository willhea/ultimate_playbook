# Spec 1: Ultimate Playbook (the tool)

## 1. One-sentence summary

A web app that runs in a laptop browser (iPad later). You draw an ultimate frisbee play on
an overhead field, step through it, and play it back as a smooth animation of
players and the disc. It is designed to look good when recorded for videos.

## 2. Confirmed decisions

These come from [00-open-questions.md](00-open-questions.md):

- **Users:** anyone should eventually be able to build plays. For now, you are the target user.
- **Device:** laptop browser first. iPad is nice to have (V2).
- **Field:** USA Ultimate only.
- **Editing model:** steps ("magic move"). You set positions per step and the app animates between them.
- **Players:** Option A from the [mockup](mockups/player-styles.svg): numbered circles (1–7 on each team) with a facing wedge.
- **Videos:** the mechanics are parked. The tool only has to make a play easy to record and talk over.

## 3. Goals and non-goals

**Goals**
- Diagram a play quickly with familiar X's and O's conventions.
- Animate player movement and disc flight, including curved throws, so they read clearly.
- Play, pause, slow down, and step through a play.
- Produce plays that are easy to turn into narrated videos later.
- Work well in a laptop browser with mouse/trackpad and keyboard.
- Be usable by anyone at a public web address with no login, even though you are the only user for now.

**Non-goals (for now)**
- Realistic physics. Timing should be believable but is illustrative.
- 3D. The overhead view is 2D. 3D technique videos are a separate workstream (Spec 3).
- Live game stat tracking or video analysis of real footage.
- A native App Store app.
- Fields other than USA Ultimate outdoor.
- Video production features beyond "clean, recordable playback" (see §6.6).

## 4. Users

| User | Need | Priority |
|------|------|----------|
| **You (creator)** | Build plays fast and play them back cleanly for narrated videos. | Primary, now |
| **Anyone building plays** | Open the site, build a play without reading instructions, and keep it. | Design for it now; polish it later |
| **Viewers / players** | Open a shared play and watch it, with no account. | V2 |
| **Teams** | Shared team playbooks with logins. | Later |

Designing for "anyone" now means three things:
- The app works at a public URL with no login.
- The UI uses plain labels rather than private shorthand.
- The saved play format is stable, so that sharing can be added later without breaking old plays.

## 5. Core concepts (the data model, in plain language)

- **Play:** one saved diagram, e.g. "Vertical stack – first cut, deep look".
- **Field:** the surface and its dimensions (see §6.1).
- **Pieces:** the things on the field.
  - **Offense players** (default 7), numbered **1–7**. Colour A. An optional name or role (H1, C3) can be shown alongside the number.
  - **Defense players** (default 7), numbered **1–7**. Colour B. By default, defender *n* guards offense player *n*.
  - Every player has a **facing direction**, set automatically (see E-5) or by hand.
  - **The disc** is always held by a player or in flight.
  - Optional **cones/markers** for drills.
- **Step:** one beat of the play. In each step, some players move along paths and the disc may be thrown. A play is an ordered list of steps.
- **Path:** the route a player runs during a step. It can be straight or curved, and the speed can be adjusted.
- **Throw:** the disc moves from a thrower to a receiver (or to an open spot) during a step. It has a throw type and a curve.
- **Annotation:** text, arrows, shaded zones, or highlights that appear at a given step.
- **Playbook:** a named collection of plays.

Example of how a saved play might look internally (shown only to make the idea concrete):

```json
{
  "title": "Vert stack – reset dump",
  "field": "usau-outdoor",
  "players": [
    { "id": "O1", "team": "offense", "number": 1, "role": "H1", "x": 20, "y": 30, "facing": "auto" },
    { "id": "D1", "team": "defense", "number": 1, "guards": "O1", "x": 21, "y": 31.5, "facing": "auto" }
  ],
  "disc": { "holder": "O1" },
  "steps": [
    {
      "name": "Dump cuts up-line",
      "moves": [ { "player": "O2", "to": [26, 34], "curve": 0.3, "start": 0, "duration": 1.2 } ],
      "throw": { "from": "O1", "to": "O2", "type": "backhand", "curve": -0.2, "release": 0.8 },
      "annotations": [ { "type": "text", "text": "Stall 7: look to the dump", "at": [10, 40] } ]
    }
  ]
}
```

## 6. Functional requirements

Priority key: **MVP** = first usable version · **V2** = next round, after using the MVP · **Later** = nice to have.

### 6.1 Field

| ID | Requirement | Priority |
|----|-------------|----------|
| F-1 | Draw an overhead ultimate field with sidelines, goal lines, end zones, and brick marks. | MVP |
| F-2 | **USA Ultimate** outdoor field (70 × 40 yd playing field proper plus end zones). Exact dimensions and brick-mark positions are checked against the current USAU rules at build time. All positions are stored in yards. | MVP |
| F-3 | WFDF, beach, indoor, or custom-size fields. | Later |
| F-4 | View: full field, half field, or a zoomed region, e.g. just the end zone. | V2 |
| F-5 | Visual themes: "chalkboard" (flat, high contrast), "grass", and "print" (white background for handouts). | V2 |
| F-6 | Optional yard-line grid to help place players. | V2 |

### 6.2 Placing and editing pieces

| ID | Requirement | Priority |
|----|-------------|----------|
| E-1 | Add/remove offense and defense players and drag them to position with mouse/trackpad. | MVP (touch/Pencil: V2) |
| E-2 | Players are auto-numbered 1–7 per team. Default style: filled circle, number inside, team colour ([mockup](mockups/player-styles.svg), Option A). | MVP |
| E-2b | Optional role/name label next to the number; custom team colours. | V2 |
| E-2c | Alternative O/X player style. | Later |
| E-3 | Formation templates: vertical stack, horizontal stack, side stack, pull lineup, plus 7-person zone looks (cup, wall, deep). | V2 |
| E-4 | Save your own formations as templates. | Later |
| E-5 | Show which way each player is **facing** with a small wedge on the edge of the circle. Facing is **automatic by default**: a moving player faces where they run; a stationary defender faces the player they guard (the marker faces the thrower); a stationary offensive player faces the disc. Facing turns smoothly during animation. | MVP |
| E-5b | Override facing for any player in any step, e.g. a defender opening their hips to the deep space before the cut. | MVP |
| E-5c | Choose who guards whom (defaults to defender *n* on offense *n*). | MVP |
| E-6 | Give the disc to any player. | MVP |
| E-7 | Undo/redo. | MVP |
| E-8 | Snap a defender to "marking" or "guarding" a chosen player, so the defender follows them automatically with an offset (e.g. "front side, under"). This saves a lot of manual work. | V2 |
| E-9 | Keyboard shortcuts: Space = play/pause, ←/→ = previous/next step, Ctrl/Cmd+Z = undo, Delete = remove the selected item, number keys select a player. | MVP |

### 6.3 Building the animation (steps)

| ID | Requirement | Priority |
|----|-------------|----------|
| S-1 | Add a step. Drag players to new spots, and the app draws their path. | MVP |
| S-2 | Bend a path into a curve or add waypoints, e.g. a cut that plants and changes direction. | MVP: one bend point, V2: multiple waypoints |
| S-3 | Draw a throw from the disc holder to a player or a spot in space. The disc travels along the throw path. | MVP |
| S-4 | Throw types with sensible default shapes and speeds: backhand, forehand/flick, inside-out, outside-in, hammer, scoober, blade, huck, pull. A curve control overrides the default. | MVP: straight + one curve control, V2: named types |
| S-5 | Timing within a step: each move/throw has a start delay and duration, e.g. "the cutter starts at 0.0 s, the throw is released at 0.8 s". | V2 |
| S-6 | Lead passes: the receiver's path and the disc arrive at the catch point together. | V2 |
| S-7 | Visual timeline: steps as blocks, each move shown as a bar whose length and offset you can drag. | V2 |
| S-8 | Duplicate, reorder, and delete steps. | MVP |
| S-9 | **Branches/options**: from a given step, "If the under is denied → Option A: go deep, Option B: swing". Ultimate is read-and-react, so this matters. | Later [confirm priority] |
| S-10 | Stall count display that can be tied to steps. | V2 |

### 6.4 Playback

| ID | Requirement | Priority |
|----|-------------|----------|
| P-1 | Play / pause / restart. | MVP |
| P-2 | Step forward/back one step at a time. | MVP |
| P-3 | Scrub to any moment with a slider. | V2 |
| P-4 | Speed control from 0.25× to 2×. | MVP |
| P-5 | Loop the whole play or one step. | V2 |
| P-6 | **Pause points:** the animation stops at chosen steps until you click or press a key. Useful for live coaching and for narrating over the animation. | V2 |
| P-7 | Path trails: show the routes that will be run (dashed), routes already run (fading), or none. | MVP: on/off, V2: styles |
| P-8 | Smooth motion: players ease in/out rather than moving like robots. | MVP |

### 6.5 Annotations and teaching overlays

| ID | Requirement | Priority |
|----|-------------|----------|
| A-1 | Text labels and arrows that appear on chosen steps. | V2 |
| A-2 | Shaded zones, e.g. "open side", "break side", "throwing lane", "poach zone". | V2 |
| A-3 | **Force indicator:** a shaded region or arrow showing which side the mark is forcing. | V2 |
| A-4 | **Spotlight:** highlight one or two players and dim the rest. | V2 |
| A-5 | **Telestrator:** draw freehand on screen during playback (mouse, or Apple Pencil on iPad); the drawing is cleared on the next step. | V2 |
| A-6 | Distance callouts, e.g. "15 yd". | Later |

### 6.6 Presentation mode (making plays recordable)

The video mechanics are parked. These requirements only make sure a finished
play can be recorded and narrated over. Everything about how videos get made
waits until we revisit [Spec 2](02-video-series-spec.md).

| ID | Requirement | Priority |
|----|-------------|----------|
| R-1 | **Clean mode** hides all editing UI so only the field and animation show. | MVP |
| R-5 | Readable when shrunk into a video: large pieces and text, high-contrast colour, colour-blind-safe team colours. | MVP |
| R-2 | Frame/aspect presets: 16:9, 9:16, 1:1. | Parked |
| R-3 | **Camera moves:** zoom and pan per step, or "follow the disc". | Parked |
| R-4 | Title card and caption bar overlays with the play name and step name. | Parked |
| R-6 | **Export video** (MP4/WebM) at a fixed resolution and frame rate, without screen recording. | Parked |
| R-7 | Export a still image (PNG) of any step. | V2 |
| R-8 | Export an animated GIF. | Parked |

### 6.7 Saving and sharing

| ID | Requirement | Priority |
|----|-------------|----------|
| D-0 | The app is hosted at a public web address that anyone can open and use without signing up. | MVP |
| D-1 | Plays save automatically in the browser. A list of saved plays lets you open, rename, duplicate, and delete them. | MVP |
| D-2 | Export/import a play or playbook as a file you own, for backup and for moving between computers. | MVP |
| D-3 | **Share link** that opens a play read-only, with a "make a copy" button so others can build from it. | V2 |
| D-4 | Embed a play in a web page or blog. | Later |
| D-5 | Accounts, cloud sync across devices, and team playbooks with permissions. | Later |
| D-6 | Comments on a shared play. | Later |

## 7. Non-functional requirements

| ID | Requirement |
|----|-------------|
| N-1 | **MVP:** runs in current Chrome, Safari, Firefox, and Edge on a laptop (screens 1280 px wide and up). **V2:** Safari on iPad. |
| N-2 | **MVP:** mouse, trackpad, and keyboard. **V2:** touch and Apple Pencil, with finger-sized touch targets. |
| N-3 | Animation runs smoothly (60 fps) with 14 players, the disc, and overlays on an ordinary laptop that is a few years old. |
| N-4 | Works offline and can be added to the iPad home screen (PWA). (V2, alongside iPad support.) |
| N-5 | The MVP needs no login and no server costs. It is hosted as a free static site. |
| N-6 | Play files are versioned so that old saved plays still open after the app is updated. |
| N-7 | Usable by someone who has never seen it: a first play can be drawn in under 5 minutes. |

## 8. Recommended technology [ASSUMPTION — recommendation, open to change]

The goal is a stack that is popular and well documented, cheap to host, and easy
for Claude to help build and maintain.

| Concern | Recommendation | Why |
|---------|----------------|-----|
| Language | TypeScript | Catches mistakes early; standard for web apps. |
| UI framework | React + Vite | Very common, with lots of examples and help available. |
| Drawing | SVG | Sharp at any zoom; each player is a clickable/touchable element; easy to export as an image. |
| Animation | A small custom timeline engine (requestAnimationFrame + easing) | The play model is simple, and owning it makes timing, scrubbing, and export reliable. |
| State / undo | Zustand (or similar) with a history stack | Simple, and undo/redo is straightforward. |
| Storage (MVP) | IndexedDB in the browser + file export/import | No server needed. |
| Sharing (V2) | Play data encoded in the link, or a small backend such as Supabase | Start with no server, and add one only if needed. |
| Hosting | GitHub Pages, Netlify, or Vercel (free tiers) | Deploys automatically from this repo. |
| Video export (Later) | Render frames in the browser → MP4 | Pixel-perfect output with no screen-recording artefacts. |

## 9. Existing tools worth trying first

Some tools already do part of this. Spend 30 minutes with each, to steal ideas
or to decide whether building is worth it:

- **Ultisimulator**: community tool for frame-by-frame ultimate play animations.
- **Ultimate Frisbee Toolbox** (iOS): includes a keyframe-animated playbook.
- **FastDraw** (FastModel Sports): a general sports play drawer with an animation timeline.
- Football apps such as **Playmaker X** show the X's-and-O's interaction style you described.

Questions to ask while trying them: What's missing for *video-quality* output?
Do they show facing direction? Do they handle curved throws, force, and marks well?

## 10. Prototype status (v0.2)

Built in [`app/`](../app/). Covered by unit tests for the logic and a small set of browser tests (one per user journey) that run on every push; see the app's README.

| Area | Done in the prototype | Not yet |
|------|----------------------|---------|
| Field | F-1, F-2. Also an early F-4: a **close-up** view that frames the area the play uses, plus a whole-field view. | F-5 themes, F-6 grid |
| Pieces | E-1 (mouse), E-2, **E-3 vertical and horizontal stack formations** (see [research](research/stacks.md)), E-5/5b/5c automatic and by-hand facing, who guards whom, E-6, E-7 undo/redo, **E-8 defenders follow their player** (trail a runner, mark a catcher, or place by hand), **A-2/A-3 the force**: break side shaded, arms on the mark, flip home/away, E-9 shortcuts, add/remove players | E-4 saving your own formations |
| Steps | S-1, S-2 (one bend point), S-3, S-4 (curve control, no named throw types yet), S-8 (add, reorder, delete), release timing for each throw | S-5 per-player timing, S-6 automatic lead passes, S-7 timeline bars, S-9 branches, S-10 stall count |
| Playback | P-1, P-2, P-3 scrubbing, P-4, P-5 loop, P-7 runs on/off, P-8 easing | P-6 pause points (→ "play the next step" covers most of it) |
| Recording | R-1 Present mode (full screen), R-5 readable sizes and colours | Parked items |
| Saving | D-1 autosave in the browser, D-2 export/import (file or copied text), six example stack plays to copy from | D-0 a public web address (the prototype is shared as a private claude.ai link for now), D-3 share links |

## 11. MVP definition of done

The MVP is done when you can, in a laptop browser:
1. Open the app from a public link, with no sign-up.
2. Place offense 1–7, defense 1–7, and the disc on a USAU field, with each defender guarding the matching offense player.
3. Build a 4–6 step play with cuts (including one curved path) and throws (including one curved throw).
4. See every player's facing direction update automatically as they move, and override one by hand (e.g. a defender opening their hips).
5. Play it back at 0.5× and 1×, and step through it with the arrow keys.
6. Switch to clean mode and get a clean full-screen playback that you could record.
7. Close the browser, reopen the app, and find the play still there; export it as a file and import it in another browser.
