# Decisions and open questions

## Decided

| # | Question | Decision | Effect on the spec |
|---|----------|----------|--------------------|
| 1 | Who uses the tool? | **Anyone should eventually be able to build plays; for now the target user is you.** | Public web app with no login needed to use it. Accounts and team features stay "Later". The tool needs to be self-explanatory to strangers, but polish for strangers is not MVP. |
| 2 | Where are plays built? | **Mostly laptop. iPad is nice to have.** | Desktop-first: mouse/trackpad and keyboard shortcuts are MVP. Touch/Pencil and iPad layout move to V2. |
| 3 | Rules / field | **USA Ultimate.** | One field preset (USAU outdoor). WFDF/beach/indoor move to "Later". |
| 4 | Step model ("magic move": set positions per step, app animates between) | **Yes.** | Steps-first editor. A detailed timeline stays V2. |
| 5 | Player look | **Option A: numbered circles (1–7 per team) with a facing wedge.** Offense blue, defense orange. | Numbers and facing wedge are MVP. See the [player style mockup](mockups/player-styles.svg). |
| 6 | Video mechanics | **Ignore for now.** The goal stays: make plays, then turn them into videos with voiceovers. | Spec 2 is parked. The tool keeps only what makes a play *recordable* (clean mode, speed control, pause points). |
| 7 | Vertical stack: where do cuts start? | **From the back of the stack. Exceptions: end-zone sets, and break-side cuts, which come from the front.** | The vertical example plays start from the back (or cut break side from the front), and a test enforces it for every vertical example. See [research](research/stacks.md). |

## Proposed defaults (say if you disagree)

- **Automatic facing,** so you rarely have to set it by hand:
  - A player who is **moving** faces the direction they're running.
  - A **stationary defender** faces the player they're guarding. A **marker** faces the thrower.
  - A **stationary offensive player** faces the disc.
  - You can override any of these for a step, e.g. a defender "opening hips" toward the deep space.
- **Defender numbering:** defender *n* guards offense player *n* by default, so D3 is on O3. You can change who guards whom.

## Still open (none of these block the MVP)

7. **Branching plays** ("if the under is taken, go deep"): essential, or later? *Current assumption: Later.*
8. **Sharing:** for "anyone can build plays", is "send a link, they watch or copy the play" enough, or do you eventually want team playbooks with logins? *Current assumption: links first (V2), logins Later.*
9. **Budget:** any monthly budget for hosting or services? *Current assumption: $0 for MVP (free static hosting).*
10. **Your role in building:** do you want to learn to code along the way, or mostly direct while Claude writes the code? *This changes how the code is explained, not what gets built.*
11. **Name:** "Play Animator" is a placeholder.

## Parked (revisit when we get to videos / 3D)

- Video audience, format (16:9 vs 9:16), own voice vs AI voice, recording workflow, built-in export. See [Spec 2](02-video-series-spec.md).
- 3D style and how much Blender you want to learn. See [Spec 3](03-3d-technique-videos-spec.md).
