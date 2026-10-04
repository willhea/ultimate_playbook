# Spec 1: Play Animator (the tool)

## 1. One-sentence summary

A web app that runs on iPad and computers. You draw an ultimate frisbee play on
an overhead field, step through it, and play it back as a smooth animation of
players and the disc. It is designed to look good when recorded for videos.

## 2. Goals and non-goals

**Goals**
- Diagram a play quickly with familiar X's and O's conventions.
- Animate player movement and disc flight, including curved throws, so they read clearly.
- Play, pause, scrub, slow down, and step through a play.
- Look clean on camera for the video series.
- Work on iPad (touch and Apple Pencil) and in a laptop browser.
- Let you share plays with others.

**Non-goals (for now)** [ASSUMPTION]
- Realistic physics. Timing should be believable but is illustrative.
- 3D. The overhead view is 2D. 3D technique videos are a separate workstream (Spec 3).
- Live game stat tracking or video analysis of real footage.
- A native App Store app. The web app (PWA) covers iPad.

## 3. Users

| User | Need | Priority |
|------|------|----------|
| **You (creator)** | Build plays fast and record polished animations for videos. | Primary |
| **Viewers / players** | Open a shared play and watch it, with no account. | Secondary |
| **Other coaches** | Build their own playbooks. | Later, [ASSUMPTION] |

## 4. Core concepts (the data model, in plain language)

- **Play:** one saved diagram, e.g. "Vertical stack – first cut, deep look".
- **Field:** the surface and its dimensions (see §5.1).
- **Pieces:** the things on the field.
  - **Offense players** (default 7). Shape/colour A, with a label (number, name, or role such as H1, C3).
  - **Defense players** (default 7). Shape/colour B, often drawn as X's.
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
    { "id": "O1", "team": "offense", "label": "H1", "x": 20, "y": 30 },
    { "id": "D1", "team": "defense", "label": "1", "x": 21, "y": 31.5 }
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

## 5. Functional requirements

Priority key: **MVP** = first usable version · **V2** = needed for good videos · **Later** = nice to have.

### 5.1 Field

| ID | Requirement | Priority |
|----|-------------|----------|
| F-1 | Draw an overhead ultimate field with sidelines, goal lines, end zones, and brick marks. | MVP |
| F-2 | Field presets: **USA Ultimate** (70 × 40 yd playing field proper with end zones) and **WFDF** (metric). Exact dimensions are confirmed at build time against the current rules. | MVP: one preset, V2: both |
| F-3 | Beach / indoor / custom-size fields. | Later |
| F-4 | View: full field, half field, or a zoomed region, e.g. just the end zone. | V2 |
| F-5 | Visual themes: "chalkboard" (flat, high contrast), "grass", and "print" (white background for handouts). | V2 |
| F-6 | Optional yard-line grid to help place players. | V2 |

### 5.2 Placing and editing pieces

| ID | Requirement | Priority |
|----|-------------|----------|
| E-1 | Add/remove offense and defense players and drag them to position (finger, Pencil, or mouse). | MVP |
| E-2 | Label players (number, role, or name). Choose the shape, e.g. O/X or filled circles, and the team colours. | MVP |
| E-3 | Formation templates: vertical stack, horizontal stack, side stack, pull lineup, plus 7-person zone looks (cup, wall, deep). | V2 |
| E-4 | Save your own formations as templates. | Later |
| E-5 | Show which way a player is **facing** (small wedge/arrow). Useful for marks, force direction, and hip orientation from above. | V2 [confirm] |
| E-6 | Give the disc to any player. | MVP |
| E-7 | Undo/redo. | MVP |
| E-8 | Snap a defender to "marking" or "guarding" a chosen player, so the defender follows them automatically with an offset (e.g. "front side, under"). This saves a lot of manual work. | V2 |

### 5.3 Building the animation (steps)

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

### 5.4 Playback

| ID | Requirement | Priority |
|----|-------------|----------|
| P-1 | Play / pause / restart. | MVP |
| P-2 | Step forward/back one step at a time. | MVP |
| P-3 | Scrub to any moment with a slider. | V2 |
| P-4 | Speed control from 0.25× to 2×. | MVP |
| P-5 | Loop the whole play or one step. | V2 |
| P-6 | **Pause points:** the animation stops at chosen steps until you tap. Useful for live coaching and for narrating over the animation. | V2 |
| P-7 | Path trails: show the routes that will be run (dashed), routes already run (fading), or none. | MVP: on/off, V2: styles |
| P-8 | Smooth motion: players ease in/out rather than moving like robots. | MVP |

### 5.5 Annotations and teaching overlays

| ID | Requirement | Priority |
|----|-------------|----------|
| A-1 | Text labels and arrows that appear on chosen steps. | V2 |
| A-2 | Shaded zones, e.g. "open side", "break side", "throwing lane", "poach zone". | V2 |
| A-3 | **Force indicator:** a shaded region or arrow showing which side the mark is forcing. | V2 |
| A-4 | **Spotlight:** highlight one or two players and dim the rest. | V2 |
| A-5 | **Telestrator:** draw freehand on screen during playback (Apple Pencil); the drawing is cleared on the next step. | V2 |
| A-6 | Distance callouts, e.g. "15 yd". | Later |

### 5.6 Presentation and recording mode (for the video series)

| ID | Requirement | Priority |
|----|-------------|----------|
| R-1 | **Clean mode** hides all editing UI so only the field and animation show. | MVP |
| R-2 | Frame/aspect presets: 16:9 (YouTube), 9:16 (Shorts/Reels/TikTok), 1:1. | V2 |
| R-3 | **Camera moves:** zoom and pan per step, or "follow the disc". | V2 |
| R-4 | Title card and caption bar overlays with the play name and step name. | V2 |
| R-5 | Readable on a phone screen: large pieces and text, high-contrast colour, colour-blind-safe team colours. | MVP |
| R-6 | **Export video** (MP4/WebM) at a fixed resolution and frame rate, without screen recording. | Later (screen recording covers it before then) |
| R-7 | Export a still image (PNG) of any step, for thumbnails, handouts, and printing. | V2 |
| R-8 | Export an animated GIF. | Later |

### 5.7 Saving and sharing

| ID | Requirement | Priority |
|----|-------------|----------|
| D-1 | Plays save automatically on the device. | MVP |
| D-2 | Export/import a play or playbook as a file you own, for backup and for moving between iPad and laptop. | MVP |
| D-3 | **Share link** that opens a read-only viewer with no account. | V2 |
| D-4 | Embed a play in a web page or blog. | Later |
| D-5 | Accounts, cloud sync across devices, and team playbooks with permissions. | Later [confirm whether needed at all] |
| D-6 | Comments on a shared play. | Later |

## 6. Non-functional requirements

| ID | Requirement |
|----|-------------|
| N-1 | Runs in Safari on iPad (current and previous iPadOS) and in current Chrome, Safari, Firefox, and Edge on desktop. |
| N-2 | Works with touch, Apple Pencil, mouse, and trackpad. Touch targets are big enough for fingers. |
| N-3 | Animation runs smoothly (60 fps) with 14 players, the disc, and overlays on an iPad that is a few years old. |
| N-4 | Works offline once loaded (PWA) and can be added to the iPad home screen. |
| N-5 | The MVP needs no login and no server costs. It is hosted as a free static site. |
| N-6 | Play files are versioned so that old saved plays still open after the app is updated. |
| N-7 | Usable by someone who has never seen it: a first play can be drawn in under 5 minutes. |

## 7. Recommended technology [ASSUMPTION — recommendation, open to change]

The goal is a stack that is popular and well documented, cheap to host, and easy
for Claude to help build and maintain.

| Concern | Recommendation | Why |
|---------|----------------|-----|
| Language | TypeScript | Catches mistakes early; standard for web apps. |
| UI framework | React + Vite | Very common, with lots of examples and help available. |
| Drawing | SVG | Sharp at any zoom; each player is a touchable element; easy to export as an image. |
| Animation | A small custom timeline engine (requestAnimationFrame + easing) | The play model is simple, and owning it makes timing, scrubbing, and export reliable. |
| State / undo | Zustand (or similar) with a history stack | Simple, and undo/redo is straightforward. |
| Storage (MVP) | IndexedDB in the browser + file export/import | No server needed. |
| Sharing (V2) | Play data encoded in the link, or a small backend such as Supabase | Start with no server, and add one only if needed. |
| Hosting | GitHub Pages, Netlify, or Vercel (free tiers) | Deploys automatically from this repo. |
| Video export (Later) | Render frames in the browser → MP4 | Pixel-perfect output with no screen-recording artefacts. |

## 8. Existing tools worth trying first

Some tools already do part of this. Spend 30 minutes with each, to steal ideas
or to decide whether building is worth it:

- **Ultisimulator**: community tool for frame-by-frame ultimate play animations.
- **Ultimate Frisbee Toolbox** (iOS): includes a keyframe-animated playbook.
- **FastDraw** (FastModel Sports): a general sports play drawer with an animation timeline.
- Football apps such as **Playmaker X** show the X's-and-O's interaction style you described.

Questions to ask while trying them: What's missing for *video-quality* output?
What's slow or awkward on iPad? Do they handle curved throws, force, and marks well?

## 9. MVP definition of done

The MVP is done when you can, on an iPad **and** a laptop:
1. Open the app from a link (and add it to the home screen).
2. Place 7 offense, 7 defense, and the disc on a USAU field.
3. Build a 4–6 step play with cuts (including one curved path) and throws (including one curved throw).
4. Play it back at 0.5× and 1×, and step through it.
5. Switch to clean mode and screen-record it.
6. Close the app, reopen it, and find the play still there; export it as a file and open that file on the other device.
