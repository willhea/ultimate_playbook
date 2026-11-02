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
    "positions": { "O2": { "x": 33, "y": 10 } },
    "holder": "O1"
  },
  "steps": [
    {
      "name": "O7 cuts in from the back",
      "notes": "What to say over this step.",
      "duration": 3.4,
      "runs": {
        "O7": { "to": { "x": 50, "y": 30 }, "bend": { "x": 6, "y": 8 } },
        "O6": { "x": 70, "y": 12 }
      },
      "throwTo": "O7",
      "release": 0.65,
      "throwBend": { "x": -2, "y": 5 }
    }
  ]
}
```

- **Players** are `O1`–`O7` (offense, blue) and `D1`–`D7` (defense, orange). D*n* guards O*n*.
- **`setup.positions`** only needs the players that differ from the default vertical stack:
  O1 (the thrower) at (35, 20), O2 (the dump) at (30, 13), and O3–O7 down the middle at
  x = 47, 52, 57, 62, 67. Moving an offensive player in the setup brings their defender along.
  `holder` is who has the disc (default O1).
- **A step** is one coaching beat. Everyone moves from where they were to where the step
  says, over `duration` seconds. Players not in `runs` stay where they are.
- **`runs`**: where a player ends the step, either a spot or a spot with a `bend`: an offset
  from the middle of the straight path, which curves the run.
- **`throwTo`**: who catches the disc in this step. **`release`**: when the disc leaves the
  thrower's hand, as a fraction of the step (default 0.4). **`throwBend`** curves the throw
  the same way `bend` curves a run.
- **`facing`** (rare): `{ "D7": 90 }` fixes a player's facing in degrees at the end of the
  step (0 = toward the attacking end zone, 90 = toward the home sideline).

## What the app does by itself

So a script describes the offense, and any deliberate defense, and nothing else:
- **Defenders** mark their player when that player catches the disc, trail a step behind a
  player who runs, and otherwise keep their spacing. Moving a defender in `runs` places them
  by hand for that step only.
- **The setup's defenders** line up on the open side: even with their player near the disc,
  deep further downfield (decision #12).
- **Facing:** runners face where they run, defenders face their player, the offense faces
  the disc.
- **The force** is drawn on the mark.

## The coach's rules (from the decisions)

- **Vertical stack: cuts come from the back of the stack.** End-zone sets and break-side
  cuts come from the front (decision #7; a test enforces it for the built-in plays).
- **A cutter separates before cutting:** from the back of the stack, a set-up of about 10 yd,
  diagonally away from the stack into the open side, then the cut (#31). Never run through
  the stack: that's a pick.
- **Cuts are straight legs with hard changes of direction**, not smooth arcs. Until the app
  has plant points, write a set-up and a cut as **two steps**, with little or no bend (#24).
- **Throws lead the receiver to space,** on the side away from their defender, at a good
  angle. Most throws bend slightly (#25).
- **Timing throws** (a break-side cut from the front, the dump and swing) go up as the cut
  starts or before, and the receiver runs onto the disc: use an early `release` (#26).
- **The dump** stands about 10 yd to the break side and 2 yd behind the thrower (#28).
- **Positions are relative** in the coach's head: "10 yd break side, 2 yd behind O1" (#30).
  Until the script has relative positions, work the numbers out from the thrower's spot,
  and say them in relative terms when you talk to the coach.

Some of these the app doesn't do yet (the new stack setup, plant points, reaction timing).
The order they'll arrive in is in [`strategy.md`](strategy.md#recommended-order-updated-after-the-strategy-session).
