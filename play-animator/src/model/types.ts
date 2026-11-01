/** Positions are in yards. x runs the length of the field (0–110), y the width (0–40). */
export interface Vec {
  x: number;
  y: number;
}

export type Team = 'O' | 'D';

/**
 * Which side of the field the mark leaves open: "bottom" is toward y = 40, the home
 * sideline. With the offense attacking to the right and a right-handed thrower,
 * bottom is force home (forced to flick) and top is force away (forced to backhand).
 */
export type OpenSide = 'bottom' | 'top';

export interface Player {
  /** Stable id, e.g. "O3" or "D3". */
  id: string;
  team: Team;
  /** Jersey-style number shown in the circle, 1–7. */
  number: number;
  /** Defense only: the offensive player this defender guards. */
  guards: string | null;
}

/**
 * One step of a play: where everyone is at the end of the step.
 * Frame 0 is the setup; frame i (i ≥ 1) is reached by animating from frame i − 1.
 */
export interface Frame {
  id: string;
  name: string;
  /** Free-text notes, e.g. what to say in the voiceover. */
  notes: string;
  /** Seconds to animate from the previous frame into this one (unused for frame 0). */
  duration: number;
  positions: Record<string, Vec>;
  /** Manual facing overrides in degrees (0 = toward the attacking end zone). Missing = automatic. */
  facing: Record<string, number>;
  /** Bend of each player's path into this frame, as an offset from the path's midpoint. */
  curves: Record<string, Vec>;
  discHolder: string;
  /** Bend of the throw into this frame (only used when the holder changes). */
  throwCurve: Vec | null;
  /** When the disc is released, as a fraction of the step (0–0.9). */
  release: number;
  /**
   * Defenders placed by hand in this step. Every other defender who guards someone
   * follows them automatically (see defenders.ts). Missing = all automatic.
   */
  manual?: Record<string, true>;
}

export interface Play {
  /** 2 since automatic defenders. Version 1 files are upgraded when they load. */
  version: 2;
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  players: Player[];
  frames: Frame[];
  /** The force for the whole play. Missing = 'bottom' (force home). */
  open?: OpenSide;
}
