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
| 8 | Which force? | **Force home. For demos, a right-handed thrower forced to flick.** | Default open side is the home sideline at the bottom of the screen; the mark stands on the backhand side (top). The field labels the home and away sidelines. Easy to change per play later (see "Flip force" in the [plan](plan.md)). |
| 9 | How do we talk about the force? | **Name it home or away; the default thrower is right-handed; "force side" means where the disc is allowed to go.** | The force is where the throw is forced to go. Teams call home/away because it doesn't change with the thrower's hand; forehand/backhand would. A flick (forehand) force on a righty is the most common. So the **force side = the open side** (the forehand side for a righty forced to flick), and the **break side** is where you don't want the disc thrown (the backhand side). Left-handed throwers: the force stays home or away. |
| 10 | How is the force drawn? | **Shade the break side, the area the mark takes away. Only the mark has arms, out straight, 180° apart, each one player radius long.** | A half circle (180°) is the simple start; real break throws can bend round it, so this is open to experiment. Built in v0.6: the split runs through the thrower, parallel to the mark's arms. |
| 11 | Words | **"Cut in" = "under cut"; "flick" = "forehand"; "vert" = "vertical stack"; "ho stack" = "horizontal stack".** | Either word is fine in notes and narration. |
| 12 | Where do downfield defenders line up? | **On the open side, defending the open-side throw. Far downfield they play deep to force their player under (make them cut in); closer to the disc they play even.** | `guardSpot` in `formations.ts`: always on the open side, level with the cutter near the disc, turning to 45° deep by about 24 yd downfield. Example cuts from the back now curve out wide around the defenders. |
| 13 | Stack spacing | **The defaults are right (vertical: 12 yd to the stack, 5 yd apart; horizontal: 15 yd deep), and the coach wants to change them in the app.** | The setup step has sliders for the stack's depth and spacing. |
| 14 | Branching plays | **Later.** "We can always add more complexity." | Not in V1/V2. |
| 15 | What the coach wants from the project | **A good tool for sharing plays with their team, not learning to code.** | Claude writes the code; explanations stay at the level of what the app does. |

## Proposed defaults (say if you disagree)

- **Automatic facing,** so you rarely have to set it by hand:
  - A player who is **moving** faces the direction they're running.
  - A **stationary defender** faces the player they're guarding. A **marker** faces the thrower.
  - A **stationary offensive player** faces the disc.
  - You can override any of these for a step, e.g. a defender "opening hips" toward the deep space.
- **Defender numbering:** defender *n* guards offense player *n* by default, so D3 is on O3. You can change who guards whom.

## Still open (none of these block the MVP)

8. **Sharing:** for "anyone can build plays" and sharing with a team, is "send a link, they watch or copy the play" enough, or do you eventually want team playbooks with logins? *TBD (November 2026). Current assumption: links first (V2), logins Later.*
9. **Budget:** any monthly budget for hosting or services? *Not sure yet. Current assumption: $0 for MVP (free static hosting).*
11. **Name:** "Play Animator" is a placeholder. *Later.*

## Parked (revisit when we get to videos / 3D)

- Video audience, format (16:9 vs 9:16), own voice vs AI voice, recording workflow, built-in export. See [Spec 2](02-video-series-spec.md).
- 3D style and how much Blender you want to learn. See [Spec 3](03-3d-technique-videos-spec.md).
