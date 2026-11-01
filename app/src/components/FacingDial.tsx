import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { polar } from '../model/geometry';

interface Props {
  angle: number;
  manual: boolean;
  color: string;
  onChange: (angle: number) => void;
  onCommit: () => void;
}

/** A small compass: drag around it to set which way the player faces. */
export function FacingDial({ angle, manual, color, onChange, onCommit }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const angleAt = (e: ReactPointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    return (((Math.atan2(dy, dx) * 180) / Math.PI) + 360) % 360;
  };

  const tip = polar(angle, 30);
  const snap = (a: number) => Math.round(a / 5) * 5;

  return (
    <svg
      ref={ref}
      className={`dial ${manual ? 'is-manual' : ''}`}
      viewBox="-44 -44 88 88"
      role="slider"
      tabIndex={0}
      aria-label="Facing direction"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={Math.round(angle)}
      aria-valuetext={`${Math.round(angle)} degrees`}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        onChange(snap(angleAt(e)));
      }}
      onPointerMove={(e) => dragging.current && onChange(snap(angleAt(e)))}
      onPointerUp={() => {
        dragging.current = false;
        onCommit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange((angle + 345) % 360);
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange((angle + 15) % 360);
        else return;
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyUp={onCommit}
    >
      <circle r="40" className="dial-face" />
      {[0, 90, 180, 270].map((a) => {
        const p = polar(a, 35);
        return <circle key={a} cx={p.x} cy={p.y} r="1.6" className="dial-tick" />;
      })}
      <text x="36" y="-30" className="dial-label">
        EZ →
      </text>
      <line x1="0" y1="0" x2={tip.x} y2={tip.y} stroke={color} strokeWidth="4" strokeLinecap="round" />
      <circle r="9" fill={color} />
    </svg>
  );
}
