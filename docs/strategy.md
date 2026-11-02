# Strategy: where Ultimate Playbook goes next

Written at the end of the first build session (November 2026), then updated after the
strategy session with the coach (decisions #23–#37). The coach's six priorities are below,
each with the options, a recommendation, and what was decided. Decisions go into
[`00-open-questions.md`](00-open-questions.md) as usual.

## Where we are

- A working, tested, public app: build a play step by step, automatic defenders and facing,
  the force on the mark, a phone watch view, share links, and a seven-play public
  playbook. Live at https://willhea.github.io/ultimate_playbook/, v0.8.
- The engineering setup is solid (protected `main`, tests on every pull request,
  publishing on merge, an audit that tried to break it). The next limits are about
  **ultimate**, not software.
- **The biggest realism gap, found while writing this:** every step eases in and out, so
  **every player stops dead at the end of every step**, and a throw always lands exactly
  where the receiver ends that step. That's why multi-step plays look robotic, whatever
  the defense does. It sits underneath priorities 4, 5 and 6.

## The direction (decision #21): plays in coaching language, built with AI

**Chosen by the coach.** How they'll work: describe a play in their own coaching words,
Claude builds it, they watch it on a page, refine it in plain language in the chat (Claude
makes the changes), then publish it. Hand controls stay for people who like to be
hands-on. In the coach's words: it doesn't make sense to build things like this by hand
anymore.

### How it was proposed

Other playbook tools (UltiPlays, Playspedia and general play-diagram apps) are drawing
tools: you place dots and draw arrows. Ultimate Playbook already does something different:
it knows what a mark, a force, an open side and a trailing defender are, and fills them in.

**Proposed direction: you describe a play the way you'd coach it, and the app knows
enough ultimate to make it look right.** "O7 cuts under from the back to the open side,
D7 is beaten by a step, a hard flick leads them." That one idea answers several priorities
at once:

- It's what makes AI authoring work (priority 2): an AI is good at coaching language and
  bad at coordinates.
- It's the answer to "hard-coded or adjustable" (priority 1): the app's rules give a
  sensible default for each coaching word, and each play can say otherwise.
- It's original, which settles priority 3 in practice: the value is the ultimate
  knowledge, not the drawing.
- It suits a rec team: watched on phones, shared by link, free and open.

## Strategy session (November 2026)

The coach watched the vertical-stack plays, answered the questions below and agreed the
first vocabulary. Decisions #23–#37 in [`00-open-questions.md`](00-open-questions.md)
record it. **Focus: the vertical stack only, for now.**

### What looks wrong, in the coach's words

General:
- **Cuts are too curved.** Real cuts look like triangles: hard changes of direction to
  shake the defender. Curves happen as adjustments to the disc in the air, not as the plan.
- **Throws should curve** (that part is right): some are straight, most curve slightly,
  some a lot.
- **Throws should lead the receiver to space,** on the opposite side from their defender.
- **Cutter, defender and disc are too in sync.** The defender reacts to the cutter.
- **Defenders should stay on the open side.** In "back cuts under, then deep", D6 gives
  up the throw and crosses over to where they'll mark. They should shift after the catch.
- **No mark after the score.** The play is over.
- **"Home sideline 3 yd"** (close-up view) wasn't clear: drop the number, keep the arrow.

Play by play:
- **Back cuts under, then deep:** the dump is too close (should be about 10 yd to the
  break side and 2 yd back, so they can cut upline or fake it and come back). The front of
  the stack should be lined up for fast break throws, and the stack angled to open the open
  side. O7 cuts through the stack: a pick. They need to separate first. D7 plays it so well
  that they'd arguably intercept, because O7 didn't separate.
- **Clear, then the next cut:** defenders and offense are too close in the stack (1–3 yd
  of space is right). Otherwise the same issues.
- **Break-side cut from the front:** mostly right, but undone by timing. The disc should
  go up before or just as O3 starts moving; as drawn it relies on D3 overrunning O3.
- **Dump and swing:** both passes would be intercepted. The dump alignment is wrong (as
  above), and both throws should go out in front of O2 and then O1, who run onto the disc,
  rather than cutting first.

What these mean: interceptions aren't modelled. The point is that plays should show
**good angles and good timing**, and checks flag throws that pass too close to a defender.
The offense is scripted and the defense reacts; hand placement stays for exceptions.

Setup decided with comparison pictures: the big player circles stay (with about 2 yd of
grass between a defender and their player); O3 sits 5 yd to the break side of the thrower,
and the stack angles further, about 0.4 yd per cutter.

### Answers to the questions

1. **What looks most wrong?** Above.
2. **Coaching language?** Yes (decision #21).
3. **Which coaching words?** The vocabulary below.
4. **Who builds plays?** The coach now; later coaches, motivated players and college
   captains, who may not use AI or may object to it. **The app must stay complete without
   AI.** Build for the coach first.
5. **How often?** A burst, then a few a season. **No MCP**; revisit if other coaches ask.

Also: **relative positions are central.** The coach thinks about every position in
relation to other players and the disc, so the script says "10 yd break side, 2 yd behind
O1" (decision #30).

### The first vocabulary (vertical stack)

A word gets in only when a vertical-stack play needs it. Each has a default the app works
out; a play overrides it per play, step or player, and dragging by hand still wins.

| # | Word | Meaning | Default |
|---|------|---------|---------|
| 1 | **Force** home / away | Which sideline is the open side | Home (decision #8) |
| 2 | **Relative position** | "N yd open side / break side, M yd ahead / behind *a player or the disc*" | The basis for the rest |
| 3 | **Vert stack** | The starting shape | 12 yd deep, 5 yd apart; O3 5 yd to the break side of the thrower; each cutter 0.4 yd further toward the break side. Angles the other way when the disc is near the break sideline |
| 4 | **Dump spot** | Where the dump stands | 10 yd to the break side, 2 yd behind the thrower |
| 5 | **Stance** auto / even / front / deep | Where a defender plays their player | **Auto:** open side, about 2 yd of grass, even near the disc, deep by about 24 yd downfield; marks only after the catch. **Front:** fully between the cutter and the disc |
| 6 | **Beaten by N yd** | Ground a defender loses on the plant | Chosen on the comparison page |
| 7 | **Reaction delay** | How late a defender reacts | Chosen on the comparison page |
| 8 | **Cut** (legs and plant points) | A set-up leg, a hard plant, then the cut. Straight legs; curves only to adjust to the disc | From the back of the stack: a set-up of about 10 yd, diagonally into the open side away from the stack, then take what the defender gives |
| 9 | **Cut kind** in / deep / break / upline / dump | The direction of the cut | The play gives the spot |
| 10 | **Clear** | Leave the lane after a cut that didn't get the disc | Toward the break side, out of the open-side lane |
| 11 | **Throw** flick / backhand / overhead; **shape** straight / slight / big / inside-out / outside-in | Which throw, and its curve | Flick to the open side, slight bend. Overhead throws (hammer, scoober) are drawn the same way |
| 12 | **Pace** hard / normal / floaty / huck | Speed and height | Normal; huck for deep cuts |
| 13 | **Lead and timing** | To space or to the body; released early (as the cut starts), on the plant, or late | To space, on the opposite side from the defender; released on the plant (to confirm once the coach sees it). Early for timing throws |

**Left out until a play needs them:** the defensive words poach, switch and help; sprint
versus jog. Teams use different words for the same things, so the glossary lists synonyms;
no per-team vocabulary for now.

## The six priorities

### 1. Theory: rules, knobs, or hand-placement?

Three ways to decide where players go:
- **All hand-placed** (classic drawing tools): flexible, but every play is lots of work and
  nothing stays consistent between plays.
- **All rules** (a simulation): consistent, but never quite right for a teaching point, and
  it grows into a big, fragile engine. This is the overengineering to avoid.
- **Rules with knobs (recommended):** a small vocabulary of coaching words, each with a
  default the app works out, and each overridable per play, per step or per player:
  - *Play:* force (home/away), stack spacing, how deep the defense plays by default.
  - *Step:* throw type (hard, normal, floaty, huck), when it's released, lead or to the body.
  - *Player:* a defender's stance (automatic, even, front, deep, beaten by N yards); a
    cutter's cut (legs with plant points).

  Plays store the **words**, not just positions. The app turns words into positions, and
  a hand drag still works and wins.

**Decided:** rules with knobs, starting with [the first vocabulary](#the-first-vocabulary-vertical-stack)
(decision #36). Rule of thumb: add a word only when a real play needs it.

### 2. Working with AI: CLI, MCP or neither?

The play script (the text format the example plays are already written in) is the
contract. Every AI path builds on it. In order of cost:

**Updated after decision #21:** the coach's main loop is a conversation with Claude working
in this repository, so path 2 comes first, with one addition: **draft previews as share
links**. A share link carries the whole play, so Claude can send a link to the live app for
any draft; the coach opens it on their computer (with a phone preview toggle to see what
teammates will see), asks for changes, and only finished plays
go into a pull request for the playbook. Path 1 follows, for other coaches and other AIs.

1. **Neither.** Publish an AI guide on the site: the format, the coaching
   words, the field coordinates and your rules. You paste it into ChatGPT, Claude or Grok,
   describe a play, and paste the result into the app's Import, which explains anything
   wrong in plain language. Then Share. It works with every AI, costs nothing, and needs
   no keys or servers.
2. **CLI, for building the public playbook in the repository.** A command that checks a
   play and makes a picture of each step, so an AI coding session (like this one) can
   check its own work and open a pull request with pictures you can review.
3. **MCP, later and only if the paste loop is painful.** A connector that lets Claude or
   ChatGPT check a play, draw it and hand back a share link inside the chat. It needs a
   hosted server (a cost and something to maintain), and it only pays off once the format
   stops changing.

**Decided:** 2 first (the coach's loop), then 1. Not 3: plays come in a burst, then a few a
season (decision #34). Revisit only if other coaches ask for it. Whatever the AI path, the
app stays complete without AI (decision #33).

### 3. Being like other playbook apps without copying them

*Not legal advice; a sensible checklist.*
- **Ideas aren't owned.** Diagramming plays, animating them and sharing links are common
  ideas. Code, graphics, written text, logos and names can be.
- **What we've done is our own.** This app was written from scratch. No code, images or
  text came from UltiPlays or Playspedia (this project never opened their apps, only saw
  search results). Formations like the vertical stack are common ultimate knowledge, and
  our research cites its sources.
- **Still worth checking next session:** that the name "Ultimate Playbook" isn't someone's
  trademark or app name; that our look isn't a near-copy of theirs (compare screenshots);
  and a short credits page (sources, fonts, open-source libraries and their licenses).

**The check (November 2026),** from web search results (the trademark office's search and
the App Store were outside this session's network):
- **Trademark:** nothing for "Ultimate Playbook" in software or sports. The coach found a
  registration for bibles, a different kind of product.
- **Same name, same idea:** [UltimatePlayBook on SourceForge](https://sourceforge.net/p/upb/),
  a Java desktop app "to compose and view Ultimate Frisbee plays", 2009–2013, pre-alpha,
  abandoned. It's GPLv2, so its code must never be copied into ours (MIT). We've never
  looked at it.
- **Same words, other sport:** "VReps Ultimate Playbook", an iPad app from Virtual
  Repetitions (football training, as far as we know).
- **Books** titled *Ultimate Frisbee Playbook* (diagram notebooks and a coaching book).
- **The tools we're like:** Playspedia, Sports Board, Disc In, Tactical Board, Ultimate
  Frisbee Toolbox. None uses our name.

The name is descriptive: unlikely to be owned by anyone, and hard for us to own. Fine for a
free, open-source rec tool; if it grows, add a distinctive word.

**To do:** a short credits page (research sources, open-source libraries and their
licenses, fonts); a line saying we're not affiliated with USA Ultimate (no logos); never
look at or copy other apps' code, text, images or plays.

**Decided:** keep the name for now (decision #35).

### 4. Moving while the disc is in the air

What it needs, and roughly in this order:
- **No stopping between steps.** Players carry their speed from one step into the next and
  only stop where the play says so. This is the one change that most improves every play.
- **Timing within a step.** A cutter starts when they choose; a defender reacts a beat
  later; a clear finishes before the next cut.
- **Throws with a type** (hard, normal, floaty, huck): speed and height come from the
  type, and the disc is caught where the receiver will be (a lead pass) rather than where
  they finish.

**Decide:** whether steps stay the way plays are built (recommended: yes, as coaching
beats, with smooth motion through them).

### 5. Offense

Start with **checks before automation**: teach the app to flag what a coach would yell
about, then make the defaults avoid it.
- *Checks* (like the "run through each other" check we already have): a pick (a defender's
  path blocked by another player); a cutter running through the stack; two cutters in one
  lane; a cut that doesn't clear.
- *Defaults* after that: a cutter steps out of the stack before cutting; a cutter who
  doesn't get it clears; the stack re-forms.

**Decided, in the coach's words:** a cutter must separate from the stack before cutting (a cut
through the stack is a pick); throws at bad angles or with bad timing; defenders and offense
too close in the stack. Checks first (decision #37), then defaults.

### 6. Defense

Today a defender keeps the spacing they started with. The next step is a **stance that's
worked out again every moment** from where their player is, where the disc is, and the
force:
- open side by default; deep far downfield, even near the disc (decision #12);
- switch sides as the disc swings; mark when their player has it; recover when it's thrown;
- per-defender overrides from the vocabulary (front, deep, beaten by N yards; poaching
  later).

**Decided so far:** open side by default, about 2 yd of grass from their player; stay on the
open side while the disc is in the air and shift to the mark only after the catch (decision
#27); react a beat late (#26). When a defender switches sides as the disc swings is still to
decide, with the motion work.

## Recommended order (updated after the strategy session)

Vertical stack only. Each step is small enough to review in one sitting and merges on its own.

1. ~~**Strategy session.**~~ Done (decisions #23–#37).
2. ~~**The authoring loop, with today's format**~~ (built, November 2026; see the
   [plan](plan.md)):
   - a command that checks a play script, saves a picture of each step, and prints a
     share link to the live app (the draft preview);
   - a **phone preview** toggle in the app (decision #22): the watch view in a phone-sized
     frame, portrait or landscape, on the computer;
   - a short authoring guide for Claude (`docs/play-authoring.md`): coordinates, the
     script format, the coach's rules, what the app does automatically.
3. **Vertical stack setup and quick fixes:** the new dump spot, O3 off to the break side and
   the angled stack, about 2 yd of grass between defenders and their players (decisions
   #28, #29); defenders stay on the open side until the catch and there's no mark after a
   score (#27); the close-up sideline labels lose their yardage (#32). **Relative
   positions** in the script (#30), since the dump spot and stack are already relative.
4. **Motion and throws** (priority 4): cuts as legs with plant points (#24), no stopping
   between steps, defenders reacting a beat late, lead passes to space, throw type, shape
   and pace (#25). Includes the **comparison page** for reaction delay and ground lost on
   a plant (#26), and a look at "released on the plant".
5. **Checks** (#37): a throw too close to a defender or on the defender's side, a cut
   through the stack (a pick), two cutters in one lane.
6. **Rebuild the four vertical plays** through the loop, with the coach, in the new
   vocabulary, starting with the coach's play-by-play notes. Then the end-zone play
   (front cuts first).
7. **Later:** the credits page; the horizontal stack; defensive words (poach, switch,
   help); the coaching words in the app's own controls (#33); the public AI guide (path 1);
   the video pilot.

## Questions for the next sessions

- Reaction delay and ground lost on a plant: pick on the comparison page.
- "Released on the plant" as the default throw timing: confirm after seeing it.
- How near the break sideline the stack's angle flips (about 10–12 yd?).
- In portrait on a phone the field fills only a strip of the screen: turn it so the offense
  attacks up the screen?
- Steps stay the way plays are built (coaching beats, with smooth motion through them)?
  Recommended: yes; confirm with the motion work.
