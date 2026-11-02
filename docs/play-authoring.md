# Writing plays: a guide for Claude

How an AI session (Claude, working in this repository) turns the coach's description of a
play into a draft the coach can watch, and then into a playbook play. The direction is
decision #21: the coach describes a play in their own words, Claude builds it, the coach
watches it from a link and asks for changes in the chat.

**Read first:** the coaching decisions in [`00-open-questions.md`](00-open-questions.md)
(they're rules), the words in [`glossary.md`](glossary.md) (write "open side" and "break
side"), and [the first vocabulary](strategy.md#the-first-vocabulary-vertical-stack).
Focus for now: **the vertical stack** (decision #23).

## The loop

1. The coach describes a play.
2. Write it as a script in `app/drafts/<name>.json` (the folder is ignored by git).
3. In `app/`, run `npm run play -- drafts/<name>.json`. It:
   - explains anything malformed in the script, in plain words;
   - runs the same checks as every built-in play (`validatePlay`): players on the field,
     nobody on top of anyone or running through anyone, believable running and throwing
     speeds;
   - saves a picture of each step to `app/drafts/pictures/`;
   - prints a **draft link** to the live app, with the whole play inside the link.
4. **Look at every picture** and fix the errors and warnings before the coach sees anything.
   Check it against the coach's rules below too; the checks don't know them all yet.
5. Send the coach the draft link and a one-line summary of each step. They watch it on their
   computer, and use **Phone preview** (in the watch view) to see it as teammates will
   (decision #22).
6. Change the script from the coach's notes, run the check again, send the new link. Repeat.
7. When the coach is happy, add the play to `app/src/plays/vertical.ts` as a `PlayScript`
   (it's the same shape, written in TypeScript), list it in `verticalPlays`, run
   `npm run check` and `npm run screenshots`, and open a pull request.

## The field

All positions are in **yards**, as `{ "x": …, "y": … }`.
- **x runs along the field, 0 to 110,** and the offense attacks to the **right**. The left
  end zone is x 0–20, the central zone x 20–90, and the end zone being attacked x 90–110.
  The brick marks are at x 40 and x 70, y 20.
- **y runs across the field, 0 to 40.** y = 0 is the **away** sideline (top of the screen);
  y = 40 is the **home** sideline (bottom). The middle is y = 20.
- With the default force (home, decision #8) the **open side is toward y = 40** and the
  **break side toward y = 0**.

## The script

```json
{
  "title": "Vertical stack: back cuts in",
  "setup": {
    "notes": "What to say over the starting positions.",
    "positions": {},
    "holder": "O1"
  },
  "steps": [
    {
      "name": "O7 sets up",
      "notes": "What to say over this step.",
      "duration": 1.6,
      "runs": {
        "O7": { "from": "O7", "open": 9, "ahead": 4 },
        "D7": { "from": "O7", "open": 3.5, "ahead": 3.5 }
      }
    },
    {
      "name": "O7 plants and cuts in",
      "notes": "What to say over this step.",
      "duration": 3.4,
      "runs": { "O7": { "from": "disc", "ahead": 15, "open": 8 } },
      "throwTo": "O7",
      "release": 0.45,
      "throwBend": { "x": 1.5, "y": 1.5 }
    }
  ]
}
```

- **Players** are `O1`–`O7` (offense, blue) and `D1`–`D7` (defense, orange). D*n* guards O*n*.
- **A spot** is either field yards, `{ "x": 50, "y": 28 }`, or **relative to a player**, the
  way the coach thinks (decision #30): `{ "from": "O1", "break": 10, "back": 2 }` is 10 yd to
  the break side of O1 and 2 yd behind. Use `open` or `break`, and `ahead` (downfield) or
  `back`. They flip with the force. `"from": "disc"` means whoever has the disc at the start
  of the step. **Prefer relative spots:** they say what the coach means, and survive a change
  to the setup.
  - In a step, a spot is relative to where that player **ends** the step, so
    `"D7": { "from": "O7", … }` follows O7's new spot. A player placed from **themselves**
    moves from where they started the step: `"O7": { "from": "O7", "open": 9, "ahead": 4 }`
    is a 10 yd set-up, mostly across into the open side.
- **`setup.positions`** only needs the players that differ from the default vertical stack
  (decision #28), with O1 at (35, 20):
  - O2, the dump: 10 yd to the break side and 2 yd behind O1, at (33, 10);
  - O3–O7 at x = 50, 55, 60, 65, 70 (the stack is 15 yd deep, decision #38): O3 5 yd to the
    break side of O1 (y = 15), and each cutter
    behind 0.4 yd further over (y = 14.6, 14.2, 13.8, 13.4);
  - the defenders on the open side of their player, about 2 yd of grass between them; D2
    downfield of O2, shaded toward O1 (guarding the upline); the mark on the break side of O1.

  Moving an offensive player in the setup brings their defender along, unless the script
  places that defender too. `holder` is who has the disc (default O1).
- **A step** is one coaching beat. Everyone moves from where they were to where the step
  says, over `duration` seconds. Players not in `runs` stay where they are.
- **`runs`**: where a player ends the step, either a spot or `{ "to": spot, "bend": { "x", "y" } }`.
  The bend is an offset from the middle of the straight path, which curves the run. No bend
  means a straight run.
- **`throwTo`**: who catches the disc in this step. **`release`**: when the disc leaves the
  thrower's hand, as a fraction of the step (default 0.4). **`throwBend`** curves the throw
  the same way `bend` curves a run.
- **`facing`** (rare): `{ "D7": 90 }` fixes a player's facing in degrees at the end of the
  step (0 = toward the attacking end zone, 90 = toward the home sideline).

## What the app does by itself

So a script describes the offense, and any deliberate defense, and nothing else:
- **Defenders** trail a step behind a player who runs, and otherwise keep their spacing.
  While the disc is in the air to their player they stay with them; they **mark in the step
  after the catch** (decision #27), so a play whose last step is a catch ends without a new
  mark. Nobody marks after a score. Moving a defender in `runs` places them by hand for that
  step only.
- **The force** shows on the mark, and only for a thrower who had the disc when the step
  began.
- **The setup's defenders** line up on the open side: even with their player near the disc,
  deep further downfield (decision #12). The dump's defender guards the upline: downfield of
  the dump, shaded toward the thrower, taking away the upline cut and the around swing.
- **Defenders run straight**, like cutters, unless a straight line would take them through
  their player; then they go round.
- **Facing:** runners face where they run, defenders face their player, the offense faces
  the disc.

## The coach's rules (from the decisions)

- **Vertical stack: cuts come from the back of the stack.** End-zone sets and break-side
  cuts come from the front (decision #7; a test enforces it for the built-in plays).
- **A cutter separates before cutting:** from the back of the stack, a set-up of about 10 yd,
  **mostly across**, out into the open-side space and away from the stack, then the cut (#31).
  Too far downfield and it doesn't clear the stack or open up angles. Never run through the
  stack: that's a pick. The defender stays deep and on the open side of the cutter: place
  them by hand (see the example).
- **Cuts are straight legs with hard changes of direction**, not smooth arcs. Until the app
  has plant points, write a set-up and a cut as **two steps**, with no bend (#24).
- **Throws lead the receiver to space,** on the side away from their defender, at a good
  angle. Most throws bend slightly (#25).
- **Timing throws** (a break-side cut from the front, the dump and swing) go up as the cut
  starts or before, and the receiver runs onto the disc: use an early `release`, about 0.2
  (#26).
- **The break-side cut from the front** is flat across, and the throw is an inside-out flick
  past the mark's low hand: it leaves toward the break side and flattens into the cutter's path
  (a bend toward the break side and downfield, like `{ "x": 4, "y": -6.4 }` for an 8 yd cut).
  A backhand would have to go around the mark. Don't draw step-outs (#38).
- **Talk to the coach in relative terms** too: "O2 is 10 yd break side, 2 yd behind O1",
  not coordinates (#30).

Some of these the app doesn't do yet (plant points, reaction timing, lead passes).
The order they'll arrive in is in [`strategy.md`](strategy.md#recommended-order-updated-after-the-strategy-session).
