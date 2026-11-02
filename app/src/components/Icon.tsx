const PATHS = {
  play: 'M7 4.5v15l12-7.5z',
  pause: 'M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z',
  stepForward: 'M5 4.5v15l10-7.5zM16 4.5h3v15h-3z',
  stepBack: 'M19 4.5v15L9 12zM5 4.5h3v15H5z',
  restart: 'M5 4.5h3v15H5zM20 4.5v15l-11-7.5z',
  undo: 'M9 7H5V3M5.5 7.5A8 8 0 1 1 4 13',
  redo: 'M15 7h4V3M18.5 7.5A8 8 0 1 0 20 13',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  present: 'M4 5h16v11H4zM9 20h6M12 16v4',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  close: 'M6 6l12 12M18 6L6 18',
  keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  share: 'M5 12v7h14v-7M12 3v12M7.5 7.5L12 3l4.5 4.5',
  phone: 'M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5zM11 18h2',
  watch: 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
} as const;

const FILLED = new Set(['play', 'pause', 'stepForward', 'stepBack', 'restart']);

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const filled = FILLED.has(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
