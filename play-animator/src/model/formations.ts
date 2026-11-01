/**
 * Starting formations. Each returns a position for all 14 players: offense 1–7
 * and the defender with the same number guarding them, person to person.
 *
 * Conventions (see docs/research/stacks.md):
 * - The offense attacks toward increasing x. O1 is the handler with the disc.
 * - The mark (D1) forces the throw to the open side, so the mark stands on the
 *   break side of the thrower. Downfield defenders take away the under cut on
 *   the open side.
 * - "bottom" means the open side is toward y = 40, the bottom of the screen, which is
 *   the home sideline.
 * - The default is the coach's: **force home**. For demos the thrower is right-handed,
 *   so facing downfield (to the right) they flick from their right side, toward the
 *   bottom: the mark forces flicks, and the open side is the home sideline.
 */
import type { Vec } from './types';
import { FIELD } from './field';

export type OpenSide = 'bottom' | 'top';

export interface FormationOptions {
  /** Where the disc (and O1) is. */
  disc?: Vec;
  open?: OpenSide;
}

export interface VerticalOptions extends FormationOptions {
  /** Yards from the disc to the front of the stack. Sources say 10–15. */
  depth?: number;
  /** Yards between players in the stack. Sources say 3–7. */
  spacing?: number;
}

export interface HorizontalOptions extends FormationOptions {
  /** Yards from the disc to the line of cutters. Sources say 10–20. */
  depth?: number;
}

/** +1 when the open side is toward y = 40, −1 when it's toward y = 0. */
export const openSign = (open: OpenSide = 'bottom'): number => (open === 'bottom' ? 1 : -1);

/** Where a mark stands: just downfield of the thrower, on the break side. */
export function markSpot(thrower: Vec, open: OpenSide = 'bottom'): Vec {
  return { x: thrower.x + 1.2, y: thrower.y - 2.4 * openSign(open) };
}

/** Where a downfield defender stands to take away the under cut on the open side. */
export function underSpot(cutter: Vec, open: OpenSide = 'bottom'): Vec {
  return { x: cutter.x - 1.7, y: cutter.y + 2.1 * openSign(open) };
}

/**
 * Vertical stack: O1 with the disc, O2 as the dump behind on the break side,
 * O3–O7 in a line down the middle of the field (O3 at the front).
 */
export function verticalStack(opts: VerticalOptions = {}): Record<string, Vec> {
  const disc = opts.disc ?? { x: 35, y: FIELD.width / 2 };
  const open = opts.open ?? 'bottom';
  const s = openSign(open);
  const depth = opts.depth ?? 12;
  const spacing = opts.spacing ?? 5;

  const pos: Record<string, Vec> = {
    O1: disc,
    O2: { x: disc.x - 5, y: disc.y - 7 * s },
  };
  pos.D1 = markSpot(disc, open);
  // The dump's defender sits between the two handlers.
  pos.D2 = { x: pos.O2.x + 1.8, y: pos.O2.y + 1.8 * s };
  for (let n = 3; n <= 7; n++) {
    const cutter = { x: disc.x + depth + (n - 3) * spacing, y: FIELD.width / 2 };
    pos[`O${n}`] = cutter;
    pos[`D${n}`] = underSpot(cutter, open);
  }
  return pos;
}

/**
 * Horizontal stack ("3-4"): three handlers across the field (O1 in the middle
 * with the disc, O2 and O3 either side) and four cutters in a line across the
 * field. O4 and O7 are the wings near the sidelines; O5 and O6 are the
 * "poppers" in the middle, who usually start the offense.
 */
export function horizontalStack(opts: HorizontalOptions = {}): Record<string, Vec> {
  const disc = opts.disc ?? { x: 40, y: FIELD.width / 2 };
  const open = opts.open ?? 'bottom';
  const depth = opts.depth ?? 15;
  const W = FIELD.width;

  const pos: Record<string, Vec> = {
    O1: disc,
    O2: { x: disc.x - 3, y: W * 0.2 },
    O3: { x: disc.x - 3, y: W * 0.8 },
  };
  pos.D1 = markSpot(disc, open);
  // Handler defenders stand a little downfield and inside, toward the disc.
  pos.D2 = { x: pos.O2.x + 1.6, y: pos.O2.y + 1.6 };
  pos.D3 = { x: pos.O3.x + 1.6, y: pos.O3.y - 1.6 };

  const lanes = [W * 0.125, W * 0.375, W * 0.625, W * 0.875];
  lanes.forEach((y, k) => {
    const cutter = { x: disc.x + depth, y };
    pos[`O${k + 4}`] = cutter;
    pos[`D${k + 4}`] = underSpot(cutter, open);
  });
  return pos;
}
