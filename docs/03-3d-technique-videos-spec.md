# Spec 3: 3D technique videos

> **Status: not started.** This is separate from the Ultimate Playbook and can be picked up at any time.

## 1. Summary

Short 3D animated clips of human-like figures showing body mechanics that an
overhead diagram can't show: marking, footwork, hip and shoulder orientation,
and reading a defender. They are made outside the Ultimate Playbook and edited into
the video series.

## 2. Why 3D (and when not to use it)

3D's main advantage is control: you can freeze a moment, orbit the camera
around it, show the cutter's point of view, slow it down, and draw overlays
(hip arrows, foot positions) that track the body exactly.

Before committing, compare it with a cheaper alternative: **film real players
and draw overlays on the footage** (telestration). For some topics, filmed
footage is quicker and more convincing. A good plan is to use 3D for topics that
need impossible camera angles, freeze-and-rotate, or clean side-by-side
comparisons, and filmed footage for the rest.

## 3. Topics (draft)

| Topic | What the viewer must see | Key overlays |
|-------|--------------------------|--------------|
| Marking stance | Low base, feet wider than shoulders, hands out, staying a disc's width away | Disc-space circle, foot positions |
| Setting the force | Body angle that takes away one side | Force arrow, shaded open/break side |
| Shuffling to stop the break | The mark mirrors the thrower's pivot without crossing feet | Footprint trail, pivot foot marker |
| Thrower's pivot and fakes | Pivot foot fixed, step-out width, fake vs release | Pivot foot glow, reach line |
| **Reading the defender's hips** | Which way the hips face and what that opens up (in vs out) | **Hip direction arrow**, shoulder line, open-lane cone |
| Defender positioning on a cutter | Under vs deep, force side vs break side | Lane shading, arrows |
| Cut mechanics | Plant step, drop of the hips, and change of direction | Centre-of-mass marker, speed trail |

## 4. Visual style [ASSUMPTION]

- **Stylized mannequin figures**, not realistic humans. They avoid the "uncanny valley", are cheaper to make, and keep attention on the mechanics.
- Offense and defense use the same team colours as the Ultimate Playbook, so the two styles feel like one series.
- A simple field (green plane with lines), a modelled disc, and soft lighting.
- Overlays are bright, high-contrast, and labelled in plain words.

## 5. Shot requirements

| ID | Requirement |
|----|-------------|
| T-1 | Clips of 5–30 s that loop cleanly. |
| T-2 | Camera angles: behind the thrower, behind the mark, side-on, overhead (to match the Ultimate Playbook), and cutter's POV. |
| T-3 | Slow motion and freeze frames with a camera orbit. |
| T-4 | Side-by-side or ghosted "wrong vs right" comparisons. |
| T-5 | Output at 1080p+ in 16:9 and 9:16, so it can drop into either video format. |

## 6. How to make them: pipeline options

| Option | How it works | Pros | Cons |
|--------|--------------|------|------|
| **A. Phone-video mocap → Blender** *(recommended to pilot)* | Film yourself or teammates doing the movement. AI mocap (e.g. **Rokoko Video**, **DeepMotion**, **Move.ai**) turns the video into 3D animation. Import into **Blender** (free), apply to a mannequin, add the field, disc, overlays, and cameras, then render. | Real ultimate movement captured by real players. Free or cheap tiers exist. | Mocap needs cleanup (foot sliding, jitter), and Blender has a learning curve. |
| B. Stock animation + hand-posing | Characters and generic animations from **Mixamo**, with sport-specific poses keyed by hand (e.g. in **Cascadeur**, which helps physically plausible posing). | Precise control. | Slow, and hand animation of athletic movement is hard to make look right. |
| C. Unreal Engine + MetaHumans | Photoreal humans in a game engine. | Looks impressive. | Steepest learning curve, needs a powerful computer, and is more realism than the teaching needs. |
| D. Filmed footage + overlays | Film real players and draw overlays in an editor or with the Ultimate Playbook telestrator. | Fastest, and real. | No freeze-and-orbit or impossible camera angles. |

**What you'd need for option A:** a phone and tripod, an open space,
a computer that runs Blender well (a recent Mac with Apple Silicon or a PC with
a decent graphics card), and roughly a few weeks of evenings learning Blender
basics. Claude can help write Blender Python scripts that automate repetitive
work such as placing overlays, setting up cameras, and batch rendering.

## 7. 3D pilot

- **Clip:** a mark shuffling to stop a break-side throw, about 15 s, with two figures (thrower and mark) and a disc.
- **Deliverables:** one rendered clip with a hip/foot overlay, a written list of what took the longest, and a go/no-go decision on the pipeline.
- **Success test:** a newer player watching it can explain what the mark's feet did.
