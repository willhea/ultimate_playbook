import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Play, Player, Vec } from '../model/types';
import type { PlayView } from '../model/engine';
import { throwGeometry } from '../model/engine';
import { BRICKS, FIELD, FIELD_MARGIN, FULL_VIEW, GOAL_LINES, PLAYER_RADIUS, type ViewBox } from '../model/field';
import { bendFromHandle, clamp, controlPoint, dist, handlePoint, quad } from '../model/geometry';
import { movePlayer, setCurve, setHolder, setThrowCurve } from '../model/edit';

const R = PLAYER_RADIUS;
/** Runs shorter than this (yards) aren't drawn, so tiny adjustments don't clutter the field. */
const MIN_PATH = 1;
const CATCH_RADIUS = 3;

type Drag =
  | { kind: 'player'; id: string; base: Play; grab: Vec }
  | { kind: 'curve'; id: string; base: Play }
  | { kind: 'throw'; base: Play }
  | { kind: 'disc'; base: Play };

interface Props {
  play: Play;
  view: PlayView;
  /** Frame being edited, or null when the field is only showing playback. */
  editIndex: number | null;
  selectedId: string | null;
  showRoutes: boolean;
  viewBox?: ViewBox;
  onSelect?: (id: string | null) => void;
  onPreview?: (play: Play) => void;
  onEndPreview?: () => void;
  onEdit?: (play: Play) => void;
  /** Called when the user tries to edit while the animation is between steps. */
  onNeedFrame?: () => void;
  className?: string;
}

const round = (n: number, digits: number) => Number(n.toFixed(digits));

/** A path from a to b with its end trimmed so the arrowhead stops at the player's edge. */
function trimmedPath(p0: Vec, c: Vec, p1: Vec, trim: number): string {
  const len = dist(p0, p1);
  const t = len > trim * 1.5 ? 1 - trim / Math.max(len, 1e-6) : 1;
  const c2 = { x: p0.x + (c.x - p0.x) * t, y: p0.y + (c.y - p0.y) * t };
  const e = quad(p0, c, p1, t);
  return `M${p0.x},${p0.y} Q${c2.x},${c2.y} ${e.x},${e.y}`;
}

export function Field({
  play,
  view,
  editIndex,
  selectedId,
  showRoutes,
  viewBox = FULL_VIEW,
  onSelect,
  onPreview,
  onEndPreview,
  onEdit,
  onNeedFrame,
  className,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const [discDrag, setDiscDrag] = useState<{ pos: Vec; target: string | null } | null>(null);
  const editable = Boolean(onEdit);
  const editing = editable && editIndex !== null;
  const stepIndex = editIndex ?? view.index;
  const frame = play.frames[stepIndex];
  const prevFrame = stepIndex > 0 ? play.frames[stepIndex - 1] : null;

  const toField = (e: { clientX: number; clientY: number }): Vec => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return {
      x: clamp(p.x, -FIELD_MARGIN + 0.5, FIELD.length + FIELD_MARGIN - 0.5),
      y: clamp(p.y, -FIELD_MARGIN + 0.5, FIELD.width + FIELD_MARGIN - 0.5),
    };
  };

  const begin = (e: ReactPointerEvent, d: Drag) => {
    e.stopPropagation();
    if (!editing) {
      onNeedFrame?.();
      return;
    }
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    drag.current = d;
  };

  const catcherNear = (p: Vec): string | null => {
    let best: string | null = null;
    let bestD = CATCH_RADIUS;
    for (const pl of play.players) {
      if (pl.team !== 'O') continue;
      const d = dist(frame.positions[pl.id], p);
      if (d < bestD) {
        best = pl.id;
        bestD = d;
      }
    }
    return best;
  };

  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d || editIndex === null) return;
    const p = toField(e);
    if (d.kind === 'player') {
      const to = { x: p.x - d.grab.x, y: p.y - d.grab.y };
      onPreview?.(movePlayer(d.base, editIndex, d.id, to));
    } else if (d.kind === 'curve') {
      const f = d.base.frames[editIndex];
      const p0 = d.base.frames[editIndex - 1].positions[d.id];
      onPreview?.(setCurve(d.base, editIndex, d.id, bendFromHandle(p0, f.positions[d.id], p)));
    } else if (d.kind === 'throw') {
      const g = throwGeometry(d.base, editIndex);
      if (g) onPreview?.(setThrowCurve(d.base, editIndex, bendFromHandle(g.from, g.to, p)));
    } else {
      setDiscDrag({ pos: p, target: catcherNear(p) });
    }
  };

  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.kind === 'disc') {
      const target = discDrag?.target;
      setDiscDrag(null);
      if (target && editIndex !== null) onEdit?.(setHolder(d.base, editIndex, target));
    } else {
      onEndPreview?.();
    }
  };

  const movers = prevFrame
    ? play.players.filter((p) => dist(prevFrame.positions[p.id], frame.positions[p.id]) > MIN_PATH)
    : [];
  const showPaths = editing || (showRoutes && view.u < 1 && view.index > 0);
  const throwGeo = stepIndex > 0 ? throwGeometry(play, stepIndex) : null;

  const playersInOrder: Player[] = [
    ...play.players.filter((p) => p.team === 'D'),
    ...play.players.filter((p) => p.team === 'O'),
  ];

  const cursorClass = editing ? 'is-editing' : editable ? 'is-viewing' : '';

  return (
    <svg
      ref={svgRef}
      className={`field ${cursorClass} ${className ?? ''}`}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerDown={() => onSelect?.(null)}
      role="img"
      aria-label={`Ultimate field showing ${play.title}`}
      data-testid="field"
      data-frame={editIndex ?? ''}
      data-step={view.index}
      data-u={round(view.u, 3)}
    >
      <defs>
        {(['O', 'D', 'disc'] as const).map((k) => (
          <marker
            key={k}
            id={`arrow-${k}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="3.2"
            markerHeight="3.2"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className={`arrowhead arrowhead-${k}`} />
          </marker>
        ))}
      </defs>

      <FieldMarkings view={viewBox} />

      {showPaths && prevFrame && (
        <g className={editing ? 'routes' : 'routes routes-faint'}>
          {movers.map((p) => {
            const p0 = prevFrame.positions[p.id];
            const p1 = frame.positions[p.id];
            const c = controlPoint(p0, p1, frame.curves[p.id]);
            return (
              <path
                key={p.id}
                d={trimmedPath(p0, c, p1, R + 0.3)}
                className={`route route-${p.team}`}
                data-testid={`route-${p.id}`}
                markerEnd={`url(#arrow-${p.team})`}
              />
            );
          })}
          {throwGeo && (
            <path
              d={trimmedPath(throwGeo.from, controlPoint(throwGeo.from, throwGeo.to, frame.throwCurve), throwGeo.to, 0.8)}
              className="route route-throw"
              data-testid="route-throw"
              markerEnd="url(#arrow-disc)"
            />
          )}
        </g>
      )}

      {editing && prevFrame && (
        <g className="ghosts" aria-hidden="true">
          {movers.map((p) => (
            <g key={p.id} data-testid={`ghost-${p.id}`} transform={`translate(${prevFrame.positions[p.id].x} ${prevFrame.positions[p.id].y})`}>
              <circle r={R} className={`ghost ghost-${p.team}`} />
              <text className="ghost-number" dy="0.5">
                {p.number}
              </text>
            </g>
          ))}
        </g>
      )}

      <g className="players">
        {playersInOrder.map((p) => {
          const pv = view.players[p.id];
          if (!pv) return null;
          const selected = p.id === selectedId;
          const hoverCatch = discDrag?.target === p.id;
          return (
            <g
              key={p.id}
              className={`player player-${p.team} ${selected ? 'is-selected' : ''}`}
              transform={`translate(${pv.pos.x} ${pv.pos.y})`}
              data-testid={`player-${p.id}`}
              data-x={round(pv.pos.x, 2)}
              data-y={round(pv.pos.y, 2)}
              data-facing={round(pv.facing, 1)}
              data-selected={selected || undefined}
              onPointerDown={(e) => {
                onSelect?.(p.id);
                const pos = frame.positions[p.id];
                const at = svgRef.current ? toField(e) : pos;
                begin(e, { kind: 'player', id: p.id, base: play, grab: { x: at.x - pos.x, y: at.y - pos.y } });
              }}
            >
              {(selected || hoverCatch) && <circle r={R + 0.7} className={hoverCatch ? 'catch-ring' : 'select-ring'} />}
              <g transform={`rotate(${pv.facing})`}>
                <path d={`M${R * 0.78},${-0.75} L${R + 1},0 L${R * 0.78},0.75 Z`} className="wedge" />
              </g>
              <circle r={R} className="body" />
              <text className="number" dy="0.6">
                {p.number}
              </text>
            </g>
          );
        })}
      </g>

      <g
        className={`disc ${view.disc.inFlight ? 'in-flight' : ''}`}
        transform={`translate(${(discDrag?.pos ?? view.disc.pos).x} ${(discDrag?.pos ?? view.disc.pos).y})`}
        data-testid="disc"
        data-x={round(view.disc.pos.x, 2)}
        data-y={round(view.disc.pos.y, 2)}
        data-in-flight={view.disc.inFlight}
        onPointerDown={(e) => {
          begin(e, { kind: 'disc', base: play });
          if (editing) setDiscDrag({ pos: view.disc.pos, target: null });
        }}
      >
        {view.disc.height > 0 && <ellipse className="disc-shadow" rx="0.55" ry="0.4" cx={view.disc.height * 0.9} cy={view.disc.height * 1.1} />}
        <circle r={0.58 * (1 + view.disc.height * 0.5)} className="disc-body" />
        <circle r={0.3 * (1 + view.disc.height * 0.5)} className="disc-ring" />
      </g>

      {editing && prevFrame && (
        <g className="handles">
          {movers.map((p) => {
            const h = handlePoint(prevFrame.positions[p.id], frame.positions[p.id], frame.curves[p.id]);
            return (
              <circle
                key={p.id}
                cx={h.x}
                cy={h.y}
                r={0.55}
                className={`handle handle-${p.team}`}
                data-testid={`handle-${p.id}`}
                onPointerDown={(e) => begin(e, { kind: 'curve', id: p.id, base: play })}
                onDoubleClick={() => onEdit?.(setCurve(play, stepIndex, p.id, null))}
              >
                <title>Drag to bend this run. Double-click to straighten it.</title>
              </circle>
            );
          })}
          {throwGeo && (
            <circle
              cx={handlePoint(throwGeo.from, throwGeo.to, frame.throwCurve).x}
              cy={handlePoint(throwGeo.from, throwGeo.to, frame.throwCurve).y}
              r={0.55}
              className="handle handle-throw"
              data-testid="handle-throw"
              onPointerDown={(e) => begin(e, { kind: 'throw', base: play })}
              onDoubleClick={() => onEdit?.(setThrowCurve(play, stepIndex, null))}
            >
              <title>Drag to curve this throw. Double-click to straighten it.</title>
            </circle>
          )}
        </g>
      )}
    </svg>
  );
}

function FieldMarkings({ view }: { view: ViewBox }) {
  const { length: L, width: W } = FIELD;
  // Keep the direction label in the top-right corner of whatever part of the field is shown.
  const labelSize = view.w * 0.014;
  const labelX = Math.min(L, view.x + view.w - labelSize);
  const labelY = view.y + labelSize * 1.6;
  const hashes: number[] = [];
  for (let x = GOAL_LINES[0] + 10; x < GOAL_LINES[1]; x += 10) hashes.push(x);
  return (
    <g className="markings" aria-hidden="true">
      <rect x={-FIELD_MARGIN} y={-FIELD_MARGIN - 1} width={L + FIELD_MARGIN * 2} height={W + FIELD_MARGIN * 2 + 1} className="surround" />
      {Array.from({ length: L / 5 }, (_, k) => (
        <rect key={k} x={k * 5} y={0} width={5} height={W} className={k % 2 ? 'turf turf-b' : 'turf turf-a'} />
      ))}
      <rect x={0} y={0} width={GOAL_LINES[0]} height={W} className="endzone" />
      <rect x={GOAL_LINES[1]} y={0} width={L - GOAL_LINES[1]} height={W} className="endzone" />
      <rect x={0} y={0} width={L} height={W} className="line boundary" />
      {GOAL_LINES.map((x) => (
        <line key={x} x1={x} y1={0} x2={x} y2={W} className="line" />
      ))}
      {hashes.map((x) => (
        <g key={x}>
          <line x1={x} y1={0} x2={x} y2={0.8} className="line hash" />
          <line x1={x} y1={W - 0.8} x2={x} y2={W} className="line hash" />
        </g>
      ))}
      {BRICKS.map((b) => (
        <g key={b.x} transform={`translate(${b.x} ${b.y})`} className="brick">
          <line x1={-0.5} y1={-0.5} x2={0.5} y2={0.5} className="line" />
          <line x1={-0.5} y1={0.5} x2={0.5} y2={-0.5} className="line" />
        </g>
      ))}
      <text x={GOAL_LINES[0] / 2} y={W / 2} className="endzone-label" transform={`rotate(-90 ${GOAL_LINES[0] / 2} ${W / 2})`}>
        END ZONE
      </text>
      <text x={(L + GOAL_LINES[1]) / 2} y={W / 2} className="endzone-label" transform={`rotate(90 ${(L + GOAL_LINES[1]) / 2} ${W / 2})`}>
        END ZONE
      </text>
      <text x={labelX} y={labelY} className="attack-label" style={{ fontSize: labelSize }}>
        ATTACKING →
      </text>
      {view.x <= 0 && view.y <= -1 && (
        <text x={0} y={-1.3} className="scale-label">
          USA Ultimate · 70 × 40 yd + 20 yd end zones
        </text>
      )}
    </g>
  );
}
