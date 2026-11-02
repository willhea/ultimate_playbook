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
| 16 | How will plays be built? | **Mostly by describing them to an AI and refining them in conversation. Editing by hand stays as an option.** | The play script becomes the main authoring format, with an authoring guide and a validate-and-picture loop (see the [plan](plan.md)). Good automatic behavior (defense, cutting, timing) matters more than editing controls. |
| 17 | Public or private? | **Public. The plays are fine to be public (recreational leagues), and anyone should be able to make their own plays.** | The repository goes public; plays in it form a public playbook; the app stays open to anyone with no login. |
| 18 | How will the team watch? | **Mostly on phones.** | A phone-friendly watch view comes before more editing features; share links open it. |
| 19 | Hosting | **GitHub Pages for now, at no cost. The coach owns `willhea.com` and could point it at the app later.** | CI publishes every merge to `main`. |
| 20 | Name | **Ultimate Playbook.** The coach renamed the repository `ultimate_playbook`; the app, docs, folders and browser storage follow (no one had used the app yet). | The app lives in `app/`; CI is `.github/workflows/ci.yml`. |
| 21 | Direction | **Plays in coaching language, built with AI.** The coach describes a play in the words they use for ultimate, an AI (Claude) builds it, the coach watches the result on a page, refinements happen in plain language in the chat and the AI makes the changes, then the play is published. Hand controls stay for people who like to be hands-on. "It doesn't make sense to build things like this by hand anymore." | The authoring loop (describe → draft share link → refine → pull request into the playbook) comes first. Plays store coaching words with defaults the app works out ("rules with knobs"). See [`strategy.md`](strategy.md). |
| 22 | Reviewing drafts | **On the computer, not a phone. A toggle shows a phone preview.** | Draft links open on the computer; the app gets a phone-preview toggle (the watch view in a phone-sized frame, portrait or landscape) to check what teammates will see. Part of the authoring loop in [`strategy.md`](strategy.md). |

### Strategy session (November 2026)

The coach watched the vertical-stack plays and set direction. Details and the feedback, play by play, are in [`strategy.md`](strategy.md#strategy-session-november-2026).

| # | Question | Decision | Effect on the spec |
|---|----------|----------|--------------------|
| 23 | Focus | **The vertical stack only, for now.** Horizontal stack and other concepts come back later. | The horizontal plays stay as they are until then. |
| 24 | How cuts look | **Straight legs with hard changes of direction ("triangles"), to shake the defender. Curves are adjustments to the disc in the air, not the planned route.** | A cut becomes legs joined by plant points instead of one curve. The example cuts that swing wide around defenders get redrawn. |
| 25 | How throws look | **Most throws curve: a slight bend by default; some straight, some very curved. A good throw leads the receiver to space, on the side away from their defender. Plays show good angles and good timing.** | Throws get a type, a shape and a lead (the vocabulary below). Interceptions aren't modelled; instead a check flags a throw that passes too close to a defender or lands on the defender's side of the receiver. |
| 26 | Who moves first | **The offense is scripted and the defense reacts, a beat late. That's the normal pattern; a play can still place a defender by hand.** Timing throws (break-side cut from the front, dump and swing) go up as the cut starts, or before, and the receiver runs onto the disc. | Defenders get a reaction delay and lose ground on a plant. The coach picks the values on a comparison page (the same cut side by side with different settings). The values live in one place in the code, not as settings in the app. |
| 27 | Defenders while the disc is in the air | **A defender stays on the open side of their player until the catch, then shifts to the mark. No mark after a score: the play is over.** | Today a defender heads for the mark spot as soon as their player is the catcher, crossing over before the catch. |
| 28 | Vertical stack setup | **Dump: 10 yd to the break side, 2 yd behind the thrower. O3 (front of the stack) 5 yd to the break side of the thrower, which keeps D3 about in line with the thrower and clears the open side. The stack angles from O3 toward the break side, about 0.4 yd per cutter (O7 about 6.6 yd over). When the disc is near the break sideline the angle reverses, into the open side; the aim is always to open the main cutting lane.** About 2 yd of grass between a downfield defender and their player (today they overlap). | New defaults in `verticalStack` and `guardSpot`. Fixed defaults, not new sliders. How near the break sideline flips the angle is still to settle (about 10–12 yd?). Only the setup follows this for now; re-shaping the stack mid-play is part of the later offense work. |
| 29 | Player circles | **Keep the big circles** (2.9 yd across, option A of the comparison), spaced further apart. | Positions and the "too close" checks use the bigger gap. |
| 30 | Positions | **Relative positions are how the coach thinks: in relation to other players and the disc.** Plays say "10 yd break side, 2 yd behind O1", not field coordinates. No grid on the field. | The play script gains relative positions (they flip with the force). Field coordinates in yards stay underneath. |
| 31 | Back-of-stack cut | **The cutter takes about 10 yd, usually diagonally away from the stack into the open side, to open the field for a deep or an in cut and make the defender choose. Then they take what the defender gives them.** | The default set-up leg for a cut from the back of the stack. |
| 32 | Close-up view | **Drop the yardage from the sideline labels; keep the arrows.** | "↓ HOME SIDELINE", no "3 YD". |
| 33 | Who builds plays | **The coach, for now. Later: coaches, motivated players and college captains, who may not use AI or may object to it. The app must stay complete without AI.** | Build for the coach through the AI loop first. The coaching words should later reach the app's own controls (menus), so hand users get the same knowledge. AI is optional help, not the product's face. |
| 34 | How often plays are made | **A lot in a short burst, then a few a season, plus refining. "There aren't that many plays in ultimate."** | No hosted connector (MCP). Revisit only if other coaches ask for one. |
| 35 | Name | **Keep "Ultimate Playbook" for now.** The originality check found no trademark for it in software or sports (the coach found one for bibles), an abandoned open-source app of the same name (2009–2013), and an iPad app "VReps Ultimate Playbook". | Add a credits page and a "not affiliated with USA Ultimate" line; never copy code, text or images from other apps. See [`strategy.md`](strategy.md#3-being-like-other-playbook-apps-without-copying-them). |
| 36 | The first coaching vocabulary | **The table in [`strategy.md`](strategy.md#the-first-vocabulary-vertical-stack), with its defaults.** Cut kinds: in, deep, break, upline, dump. Throws: flick, backhand, overhead (hammer, scoober: drawn the same). Shape: straight, slight (default), big, inside-out, outside-in. Defender stance: auto, even, front, deep. Poach, switch, help and sprint versus jog stay out until a play needs them. | Words are added one at a time as behaviors land. Release "on the plant" is the proposed default; the coach wants to see it before confirming. Terminology differs between teams, so the glossary lists synonyms; no per-team vocabulary for now. |
| 37 | Checks | **Checks are code, so they cost nothing to run.** | Bad throw angles and cuts through the stack (picks) are flagged by `validatePlay`, with deliberately bad plays in the tests to prove the checks catch them. |

## Proposed defaults (say if you disagree)

- **Automatic facing,** so you rarely have to set it by hand:
  - A player who is **moving** faces the direction they're running.
  - A **stationary defender** faces the player they're guarding. A **marker** faces the thrower.
  - A **stationary offensive player** faces the disc.
  - You can override any of these for a step, e.g. a defender "opening hips" toward the deep space.
- **Defender numbering:** defender *n* guards offense player *n* by default, so D3 is on O3. You can change who guards whom.

## Still open (none of these block the MVP)

- **Reaction delay and ground lost on a plant** (decision #26): chosen on a comparison page once the new motion exists.
- **Release "on the plant" as the default** (decision #36): the coach wants to see it first.
- **How near the break sideline the stack's angle flips** (decision #28).
- **Fronting:** merged into the stance "front" (fully between the cutter and the disc). The coach can rename it.

8. **Sharing:** *Mostly settled by #17–#19:* share links for any play, plus a public playbook in the repository. Team logins only if those turn out not to be enough.
9. **Budget:** *$0 so far (GitHub Pages is free for public repositories).* A budget only matters for paid services, such as calling Claude from inside the app.

## Parked (revisit when we get to videos / 3D)

- Video audience, format (16:9 vs 9:16), own voice vs AI voice, recording workflow, built-in export. See [Spec 2](02-video-series-spec.md).
- 3D style and how much Blender you want to learn. See [Spec 3](03-3d-technique-videos-spec.md).
