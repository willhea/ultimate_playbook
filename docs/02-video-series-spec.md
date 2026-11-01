# Spec 2: Strategy video series

> **Status: parked.** The goal stands: make plays in the Ultimate Playbook and turn
> them into videos with voiceovers. How videos are made (format, voice, recording,
> editing) will be decided after the Ultimate Playbook MVP exists. This document is
> kept as a starting point for that.

## 1. Summary

Short instructional videos explaining ultimate strategy. Each one uses Ultimate
Playbook animations (Spec 1) with a voiceover, and some episodes also use 3D
technique clips (Spec 3).

## 2. Things to decide (each one affects the tool)

| Decision | Options | Why it matters |
|----------|---------|----------------|
| **Audience** | New players · developing club/college players · coaches | Sets vocabulary, pace, and depth. |
| **Format** | Long-form 16:9 (YouTube, 5–12 min) · short vertical 9:16 (Shorts/Reels/TikTok, 30–90 s) · both | Sets the tool's framing and camera requirements (R-2, R-3). |
| **Voice** | Your own recorded voice · AI voice from your script | Own voice builds trust; AI voice is faster to revise. |
| **Visual identity** | Colours, fonts, intro/outro, team colour convention | Should match the tool's themes (F-5). |
| **Cadence** | e.g. 1 per week / 2 per month | Sets how much the tool must speed up production. |

## 3. Episode template [ASSUMPTION]

1. **Hook (5–10 s):** the problem, e.g. "Your stack is clogging the lane. Here's why."
2. **Setup (15–30 s):** formation on screen, with the key players spotlighted.
3. **Walkthrough:** the play step by step, pausing at each read, with the voiceover explaining *why*.
4. **Real-speed replay:** the whole play at 1× with no pauses.
5. **Common mistake:** an animation of the wrong version compared with the right one.
6. *(Optional)* **Technique insert:** a 3D clip, e.g. how the mark sets the force here.
7. **Recap + call to action (10 s).**

A short-form version keeps steps 1, 3 (condensed), and 7.

## 4. Draft episode ideas

Strategy (Ultimate Playbook):
1. Field, positions, and how to read these diagrams (a "legend" episode the others can link to).
2. Vertical stack: cutting lanes and timing.
3. Horizontal stack: isolating cutters.
4. Side stack / end-zone sets.
5. Handler resets: dump and swing.
6. Force and the mark from above (combined with 3D marking clips).
7. Person defence: positioning, switching, and poaching.
8. Zone defence: cup, wings, and deep, and how to beat it.
9. Pull plays: the first three throws after the pull.
10. Transition: turnover to offence.

Technique (3D, see Spec 3):
- Marking stance and shuffling, stopping the break.
- Reading the defender's hips to choose an in-cut or out-cut.
- The pivot, faking, and the release.

## 5. Production pipeline

```
Script ─► Build play in Ultimate Playbook ─► Record voiceover ─► Record animation ─► Edit ─► Captions ─► Publish
            (match steps to script)         (or record first and fit the VO later)
```

| Stage | Tools (pick one) | Notes |
|-------|------------------|-------|
| Script | Google Docs / Notion | Write the script in "step" chunks that match the play's steps. |
| Voiceover | USB or lav mic in a quiet, soft room; record in the editor or with GarageBand / Audacity | Audio quality matters more than video quality to viewers. |
| Recording the animation | iPad screen recording · QuickTime / OBS on a computer · built-in export (tool V2+/Later) | Use clean mode and the correct aspect ratio. |
| Editing | DaVinci Resolve (free) · iMovie / Final Cut · CapCut · Descript (edit by editing the transcript) | Descript suits voiceover-led videos well. |
| Captions | Auto-captions in the editor, then corrected by hand | Many viewers watch muted, so captions should be on. |

**Syncing voice and animation.** Recording the voiceover *first* and then
fitting the animation to it (using step pauses, speed, and edit cuts) usually
sounds better than narrating live. The tool's **pause points** (P-6) and **step
timing** (S-5) exist to make this easy.

## 6. Pilot episode (recommended next step after the tool MVP)

- **Topic:** one narrow concept, e.g. "The dump-swing reset in 60 seconds".
- **Goal:** find out where the tool slows you down, not to make a perfect video.
- **Output:** one 16:9 cut and one 9:16 cut, plus a written list of friction points that feeds the tool's V2 priorities.
