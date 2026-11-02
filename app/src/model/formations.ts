/**
 * Starting formations. Each returns a position for all 14 players: offense 1–7
 * and the defender with the same number guarding them, person to person.
 *
 * Conventions (see docs/research/stacks.md):
 * - The offense attacks toward increasing x. O1 is the handler with the disc.
 * - The mark (D1) forces the throw to the open side, so the mark stands on the
 *   break side of the thrower.
 * - The coach's rule for downfield defenders (decision #12): they line up on the
 *   open side, defending the open-side throw. Far downfield they play deep, to force
 *   their player to cut under; closer to the disc they play even.
 * - "bottom" means the open side is toward y = 40, the bottom of the screen, which is
 *   the home sideline.
 * - The default is the coach's: **force home**. For demos the thrower is right-handed,
 *   so facing downfield (to the right) they flick from their right side, toward the
 *   bottom: the mark forces flicks, and the open side is the home sideline.
 */
import type { OpenSide, StackSpacing, Vec } from './types';
import { FIELD } from './field';
import { smoothstep } from './geometry';

export type { OpenSide, StackSpacing };

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

/** How far a downfield defender starts from their player. */
export const GUARD_GAP = 2.7;

/**
 * Where a downfield defender lines up: on the open side of their player. Level
 * with them near the disc, turning to 45° deep by about 24 yd downfield.
 */
export function guardSpot(cutter: Vec, disc: Vec, open: OpenSide = 'bottom'): Vec {
  const deep = (Math.PI / 4) * smoothstep(8, 24, cutter.x - disc.x);
  return { x: cutter.x + GUARD_GAP * Math.sin(deep), y: cutter.y + GUARD_GAP * Math.cos(deep) * openSign(open) };
}

/** The spacing new plays start with. The coach confirmed these match the whiteboard. */
export const DEFAULT_STACK: { vertical: StackSpacing; horizontal: StackSpacing } = {
  vertical: { kind: 'vertical', depth: 12, spacing: 5 },
  horizontal: { kind: 'horizontal', depth: 15 },
};

/** The cutters a stack lines up; the handlers stay put when the stack is re-spaced. */
export const STACK_CUTTERS: Record<StackSpacing['kind'], string[]> = {
  vertical: ['O3', 'O4', 'O5', 'O6', 'O7'],
  horizontal: ['O4', 'O5', 'O6', 'O7'],
};

/** Everyone's starting spot for a stack, with the disc at `disc`. */
export function stackPositions(stack: StackSpacing, disc?: Vec, open?: OpenSide): Record<string, Vec> {
  return stack.kind === 'vertical'
    ? verticalStack({ disc, open, depth: stack.depth, spacing: stack.spacing })
    : horizontalStack({ disc, open, depth: stack.depth });
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
    pos[`D${n}`] = guardSpot(cutter, disc, open);
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
    pos[`D${k + 4}`] = guardSpot(cutter, disc, open);
  });
  return pos;
}
