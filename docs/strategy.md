# Strategy: where Ultimate Playbook goes next

Written at the end of the first build session (November 2026), for a fresh session
that starts with the coach to set direction. The coach's six priorities are below,
each with the options, a recommendation, and what to decide. Recommendations are
proposals; the coach decides, and decisions go into
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

## A direction worth choosing: "plays in coaching language"

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
  - *Player:* a defender's stance (automatic, even, under, deep, fronting, trailing, beaten
    by N yards, poaching); a cutter's cut (sharp plant, rounded, jab first).

  Plays store the **words**, not just positions. The app turns words into positions, and
  a hand drag still works and wins.

**Decide:** the first, small vocabulary (about 10–15 words), and the defaults for each.
Rule of thumb: add a word only when a real play needs it.

### 2. Working with AI: CLI, MCP or neither?

The play script (the text format the example plays are already written in) is the
contract. Every AI path builds on it. In order of cost:

1. **Neither (start here).** Publish an AI guide on the site: the format, the coaching
   words, the field coordinates and your rules. You paste it into ChatGPT, Claude or Grok,
   describe a play, and paste the result into the app's Import, which explains anything
   wrong in plain language. Then Share. It works with every AI, costs nothing, and needs
   no keys or servers.
2. **CLI, for building the public playbook in the repository.** A command that checks a
   play and makes a picture of each step, so an AI coding session (like this one) can
   check its own work and open a pull request with pictures you review on your phone.
3. **MCP, later and only if the paste loop is painful.** A connector that lets Claude or
   ChatGPT check a play, draw it and hand back a share link inside the chat. It needs a
   hosted server (a cost and something to maintain), and it only pays off once the format
   stops changing.

**Decide:** start with 1 and 2; set what would make 3 worth it (for example, the team
building plays weekly).

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

**Decide:** keep the name or adjust it after the check.

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

**Decide:** the nitpicks that matter most for the vertical stack first, in your words.

### 6. Defense

Today a defender keeps the spacing they started with. The next step is a **stance that's
worked out again every moment** from where their player is, where the disc is, and the
force:
- open side by default; deep far downfield, even near the disc (decision #12);
- switch sides as the disc swings; mark when their player has it; recover when it's thrown;
- per-defender overrides from the vocabulary (fronting, trailing, beaten, poaching).

**Decide:** the default stances and when a defender switches sides.

## Recommended order

1. **Strategy session (next session, mostly talking).** Watch the plays on a phone and list
   what looks wrong. Agree the direction above, the first vocabulary, the defense
   defaults, the offense checks, and the AI path. Run the originality check (priority 3).
2. **Smooth motion and throw types** (priority 4). This is the foundation: offense and
   defense behavior depend on timing and on where the disc is mid-flight.
3. **Defense stances** (priority 6), then **offense checks and defaults** (priority 5).
   They use the new timing; each lands as its own pull request with pictures.
4. **The AI guide and script import** (priority 2, path 1), written in the vocabulary once
   it has settled. Then the CLI for the repository playbook (path 2).
5. **Rebuild the example plays in the new vocabulary,** add the end-zone play, and run a
   video pilot.

Each step should be small enough to watch on a phone and merge on its own.

## Questions to bring to the strategy session

1. What looks most wrong today when you watch the stack plays?
2. Do you agree with "plays in coaching language" as the direction?
3. Which coaching words do you use for defender positioning and throw types?
4. Who builds plays: just you, or your teammates and other coaches too (the AI guide
   should be written for them)?
5. How often do you expect to make new plays? That decides whether MCP is ever worth it.
