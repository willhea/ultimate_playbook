# Ultimate Animations

Tools and a video series for teaching ultimate frisbee visually.

> **Status: first Play Animator prototype built** ([`play-animator/`](play-animator/)).
> Decisions so far, and the questions still open, are in
> [`docs/00-open-questions.md`](docs/00-open-questions.md). Anything still marked
> **[ASSUMPTION]** is a guess to confirm or change.
>
> **Current focus:** using the prototype on real plays and collecting what's slow or missing.

## The three workstreams

| # | Workstream | What it is | Spec | Status |
|---|------------|------------|------|--------|
| 1 | **Play Animator** (the tool) | A web app, laptop-first (iPad later), for drawing ultimate plays from overhead (X's and O's style) and animating players and the disc. | [`docs/01-play-animator-spec.md`](docs/01-play-animator-spec.md) | **Current focus** |
| 2 | **Strategy video series** | Instructional videos made by recording the Play Animator, with a voiceover. | [`docs/02-video-series-spec.md`](docs/02-video-series-spec.md) | Parked until the tool MVP |
| 3 | **3D technique videos** | Separate from the tool: 3D human-like figures showing body mechanics such as marking, footwork, and reading a defender's hips. | [`docs/03-3d-technique-videos-spec.md`](docs/03-3d-technique-videos-spec.md) | Not started |

How they fit together:

```
 Play Animator ──(screen record / export)──► Strategy videos ◄── voiceover
                                                  ▲
 3D technique clips ──(rendered video)────────────┘  (some episodes mix both)
```

Workstreams 1 and 2 depend on each other: the tool exists to make the videos,
so the video needs decide what the tool must do. Workstream 3 is separate and
can start whenever you want.

## Suggested order

1. **Confirm the specs.** ✅ First round done.
2. **Play Animator MVP.** Draw a play, animate it, save it, and replay it in a laptop browser. 🟡 Prototype built; see the status table in the spec.
3. **Use it.** Build a handful of real plays and note what's slow or missing.
4. **Revisit videos.** Decide the video workflow (Spec 2) and make a pilot episode.
5. **Tool V2.** Fix whatever slowed down steps 3–4. iPad support, annotations, and presentation features land here.
6. **3D pilot.** One 10–20 second clip, for example a mark shuffling to stop a break throw, to test the 3D pipeline before committing to it.
7. **Sharing.** Share links, a playbook library, and video export.

## Glossary (for non-developers)

- **MVP (minimum viable product):** the smallest version that is actually useful. You build it first and learn from it.
- **Web app / PWA:** a website that works like an app. A *Progressive Web App* can be added to the iPad home screen and can work offline. You don't need the App Store.
- **Keyframe:** a saved snapshot of where everything is at one moment. Animation fills in the motion between keyframes.
- **Interpolation:** calculating the in-between positions from one keyframe to the next.
- **Step / beat:** this project's word for one keyframe of a play, e.g. "Step 3: the under-cut and the throw to it."
- **SVG / Canvas:** two ways a browser can draw graphics. SVG stays sharp at any zoom level and is easy to make touchable.
- **Rigged character:** a 3D model with a skeleton, so it can be posed and animated.
- **Motion capture (mocap):** recording a real person's movement and applying it to a 3D character. You can now do this from ordinary phone video.
- **Render:** turning a 3D scene into video frames.
