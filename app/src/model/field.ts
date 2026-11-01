/**
 * USA Ultimate outdoor field, in yards: a 70 × 40 playing field proper with
 * 20-yard end zones, and brick marks 20 yards from each goal line on the midline.
 * The offense attacks toward increasing x (left to right on screen).
 */
export const FIELD = {
  length: 110,
  width: 40,
  endZone: 20,
  brick: 20,
} as const;

export const GOAL_LINES = [FIELD.endZone, FIELD.length - FIELD.endZone] as const;
export const BRICKS = [
  { x: FIELD.endZone + FIELD.brick, y: FIELD.width / 2 },
  { x: FIELD.length - FIELD.endZone - FIELD.brick, y: FIELD.width / 2 },
] as const;

/** How far outside the field lines a player can be dragged. */
export const FIELD_MARGIN = 3;

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The whole field plus a margin. Every view keeps this aspect ratio. */
export const FULL_VIEW: ViewBox = {
  x: -FIELD_MARGIN,
  y: -FIELD_MARGIN - 1,
  w: FIELD.length + FIELD_MARGIN * 2,
  h: FIELD.width + FIELD_MARGIN * 2 + 1,
};

export const VIEW_ASPECT = FULL_VIEW.w / FULL_VIEW.h;

/** Drawn radius of a player, in yards. Bigger than life so the numbers are readable. */
export const PLAYER_RADIUS = 1.45;
