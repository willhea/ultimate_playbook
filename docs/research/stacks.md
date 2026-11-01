# Research: the vertical and horizontal stack

The two most common offensive formations in ultimate, and how the Play Animator
models them. This document is where the formation templates and example plays
in `play-animator/src/model/formations.ts` and `play-animator/src/plays/` come from.

> **How this was researched.** These notes come from web search summaries of
> coaching articles. Two of the best sources, Ultiworld and Flik, are blocked
> in this cloud session's network settings, so they appear below as search
> results only, not as fully read pages. Where sources disagree, the range is
> given along with the value the app uses. Please correct anything that doesn't
> match how you teach it; the numbers are easy to change.

## Terms used here

| Term | Meaning |
|------|---------|
| **Handler** | A player whose main job is to throw and keep possession: the thrower, the dump and the swing. |
| **Cutter** | A player whose job is to get open downfield. |
| **Force / mark** | The defender on the thrower (the *mark*) stands to one side so throws to that side are hard. The side they take away is the **break side**; the side they leave is the **open side**. |
| **Under cut** | A cut back toward the disc. |
| **Deep cut** | A cut away from the disc, toward the end zone. |
| **Clear** | Getting out of a lane after a cut that didn't get the disc, so the next cutter has space. |
| **Dump / swing** | A short backwards pass to reset the stall count (the dump), then a sideways pass to move the disc to the other side of the field (the swing). |

## Vertical stack

**The idea.** Cutters line up in a column down the middle of the field, which
leaves two open lanes, one on each side of the stack. One cutter at a time
attacks a lane, one on one, while the rest stay out of the way.

**Who stands where**
- **Handlers:** usually 2, the thrower and a dump who stands behind. Some teams use 1 handler and 6 cutters.
- **Cutters:** 5, in a line through the middle of the field.

**Spacing**

| What | What sources say | What the app uses |
|------|------------------|-------------------|
| Disc to the front of the stack | 5–10 yd (one guide), 10 yd (Ultimate Rob, to keep the stack from drifting deep), 15–20 yd (others) | **12 yd** |
| Gap between players in the stack | about 3 yd, about 5 yd (a drill guide), 5–7 yd | **5 yd** |
| The dump | Behind the thrower, on the break side | **5 yd behind, 7 yd to the break side** |

**How it runs**
1. **The first cut comes from the back.** The cutter at the back of the stack has the most room to build speed down the open-side lane. This is the rule the app follows (your coaching decision; Ultimate Rob argues the same, to avoid picks and gain yards). Some sources start from the front instead.
   - **Exceptions:** in **end-zone sets**, and for **break-side cuts**, the cut comes from the front of the stack, which is closest to that space.
2. **Continuation.** After a catch, the next cutter from the back attacks, often deep, into the space the first cut left.
3. **Clearing.** A cutter who doesn't get the disc clears out of the lane, back to the stack or away to the break side, so the lane is empty for the next cutter.
4. **Reset.** When the stall count climbs and nobody is open, the dump cuts for an easy pass, and then a swing moves the disc to the break side.

**Defense.** Person to person. The mark sets the force. The defender on the
dump lines up between the two handlers. Downfield defenders position themselves
against their cutter according to the force; the app puts them on the
under/open side, taking away the easy under cut.

**Teaching points worth animating**
- Spacing matters more than crowding the disc. A cramped stack clogs the lanes.
- The stack can shift sideways to make more space on the side the disc is going.
- Clearing well is as important as cutting well.

## Horizontal stack ("ho stack", "3-4")

**The idea.** Cutters spread across the width of the field in a line, which
leaves big open spaces both under them and deep behind them. Each cutter has a
lot of room to work one on one.

**Who stands where**
- **Handlers:** 3, spread across the field: one in the middle with the disc, one either side.
- **Cutters:** 4, in a line across the field downfield of the handlers. The two in the middle are the **poppers**; the two near the sidelines are the **wings** (or rail cutters).

**Spacing**

| What | What sources say | What the app uses |
|------|------------------|-------------------|
| Disc to the line of cutters | 10–15 yd, about 15 yd, 8–12 m, up to 15–20 yd | **15 yd** |
| Cutters across the field | Equally spaced across the full width | **5, 15, 25 and 35 yd from the top sideline** |
| Side handlers | Either side of the disc, a little behind | **3 yd behind, 12 yd either side** |

**How it runs**
1. **The poppers start.** One of the two middle cutters cuts under while the other goes deep. Cutters do the opposite of the cutter next to them, so the defenders can't help each other.
2. **The wings come second.** Wings stay wide until a secondary cut, often attacking the space a popper just cleared.
3. **Swings.** Handlers move the disc side to side to reset the stall count and give cutters a new throwing angle.

**Common weakness.** Without good spacing the first cut becomes the only
option, and a team that can't get that first cut open keeps turning the disc
over.

## What's in the app

| Example play | What it shows |
|--------------|---------------|
| Vertical stack: back cuts under, then deep | The back of the stack cuts under; the next cutter from the back goes deep for the huck. |
| Vertical stack: clear, then the next cut | A covered under cut from the back; the cutter clears deep and wide; the next cutter from the back cuts under. |
| Vertical stack: break-side cut from the front | The exception: the front of the stack cuts to the break side, and the throw goes around the mark. |
| Vertical stack: dump and swing | The dump cuts back for the reset, then a swing to the break side. |
| Horizontal stack: poppers split | One popper under, one deep; the throw goes to the under. |
| Horizontal stack: wing isolation | The poppers clear and a wing has the open side to themselves. |
| Horizontal stack: swing, then cut | A swing to a side handler, then a popper cuts under toward the new angle. |

Every example passes the app's ultimate checks (`validatePlay`), and every vertical example follows the cut-from-the-back rule (checked by a test). No one stands on
top of anyone, runs are at human speed (≤ 9 yd/s), throws travel at believable
speeds, defenders start near their player, and nobody travels with the disc.
"New vertical stack" and "New horizontal stack" in the Plays list start a play
from these formations.

## What this means for the tool

Building these six plays by hand in the editor surfaced several features worth
adding next. They're listed in priority order, as a suggestion:

1. **Defenders follow their player automatically** (spec E-8). Every run currently needs its defender moved by hand, which doubles the work of every play.
2. **A force indicator** (spec A-3): shading or an arrow for the open and break sides. Both stacks only make sense once you know which side is open.
3. **Lanes** (spec A-2): shade the open-side and break-side lanes of a vertical stack, and the under and deep spaces of a horizontal stack.
4. **Flip the field.** A one-click mirror of the force side, so each play works for both forehand and backhand forces.
5. **Stall count** (spec S-10), for showing why a dump and swing happens.

## Questions for you

- ~~Where do vertical-stack cuts start?~~ Answered: from the back, except end-zone sets and break-side cuts.
- ~~Which force?~~ Answered: force home; for demos, a right-handed thrower forced to flick, so the open side is the home sideline at the bottom of the screen.
- Do you set downfield defenders on the under/open side as the app does, or another way (for example, on the deep side for a team that hucks)?
- Are the spacing defaults (vertical: 12 yd to the stack, 5 yd apart; horizontal: 15 yd deep) what you'd draw on a whiteboard?

## Sources

From web search results (titles and summaries):

- [Running The Vertical Stack Offense (CoachUp Nation)](https://www.coachup.com/nation/articles/running-the-stack-offense)
- [Vertical Stack Revisited Part 1 (Ultimate Rob)](https://ultimaterob.com/2013/02/04/rethinking-the-vertical-stack-part-1/)
- [Vertical Stack Revisited Part 2 (Ultimate Rob)](https://ultimaterob.com/2013/02/26/vertical-stack-revisited-part-2/)
- [Vertical Stack with disc on trap sideline (Playspedia)](https://playspedia.com/play/1536)
- [Vertical Stack Spacing Drill (Playspedia)](https://playspedia.com/play/3014)
- [Tuesday Tips: The Vertical Stack for Beginners (Ultiworld)](https://ultiworld.com/2015/12/22/the-vertical-stack-its-goal-and-your-role/)
- [Vertical Stack: How does it work? (Flik)](https://www.flikulti.com/theory/vertical-stack/how-does-it-work/)
- [Offense (Vancouver Ultimate League)](https://www.vul.ca/content/players/offense)
- [Theory: Horizontal Stack (Flik)](https://www.flikulti.com/theory/horizontal-stack/)
- [Davide's Doctrines: Horizontal Stack (Ultiworld)](https://ultiworld.com/feature/davides-doctrines-horizontal-stack/)
- [Excelling In The Horizontal Stack (CoachUp Nation)](https://www.coachup.com/nation/?p=436)
- [Horizontal (Ho) Stack (Playspedia)](https://playspedia.com/play/16663)
- [Ultimate strategies (University of Georgia open textbook)](https://open.online.uga.edu/ultimate/chapter/strategies)
- [Ultimate Frisbee 101 (Kansas City Ultimate)](https://www.kcultimate.com/ultimate-frisbee-101)
