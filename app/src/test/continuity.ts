/**
 * Finds a real jump in a play's animation: a change in a player's position or
 * facing, or the disc's position, that stays big however closely we look.
 * Fast but smooth motion shrinks when the interval is halved again and again;
 * a jump doesn't. Facing is skipped for a player whose facing target passes
 * within a yard of them, because there the direction genuinely flips.
 */
import type { Play } from '../model/types';
import { evaluate, totalDuration, type PlayView } from '../model/engine';
import { angleDiff, dist } from '../model/geometry';

type Probe = { name: string; limit: number; change: (a: PlayView, b: PlayView) => number };

export function findJump(play: Play, dt = 1 / 120): string | null {
  const total = totalDuration(play);
  const at = (t: number) => evaluate(play, Math.min(Math.max(t, 0), total));
  const targetDistance = (v: PlayView, id: string) => {
    const p = play.players.find((x) => x.id === id)!;
    return dist(v.players[id].pos, p.team === 'D' && p.guards ? v.players[p.guards].pos : v.disc.pos);
  };

  const probes: Probe[] = [{ name: 'disc', limit: 0.5, change: (a, b) => dist(a.disc.pos, b.disc.pos) }];
  for (const p of play.players) {
    probes.push({ name: `${p.id} position`, limit: 0.5, change: (a, b) => dist(a.players[p.id].pos, b.players[p.id].pos) });
    probes.push({
      name: `${p.id} facing`,
      limit: 10,
      change: (a, b) =>
        targetDistance(a, p.id) > 1 && targetDistance(b, p.id) > 1 ? Math.abs(angleDiff(a.players[p.id].facing, b.players[p.id].facing)) : 0,
    });
  }

  const staysBig = (probe: Probe, a: number, b: number, depth: number): boolean => {
    if (probe.change(at(a), at(b)) < probe.limit) return false;
    if (depth === 0) return true;
    const m = (a + b) / 2;
    return staysBig(probe, a, m, depth - 1) || staysBig(probe, m, b, depth - 1);
  };

  let prev = at(0);
  for (let t = 0; t < total; t += dt) {
    const t1 = Math.min(t + dt, total);
    const next = at(t1);
    for (const probe of probes) {
      if (probe.change(prev, next) >= probe.limit && staysBig(probe, t, t1, 16)) return `${probe.name} near ${t.toFixed(3)}s`;
    }
    prev = next;
  }
  return null;
}
