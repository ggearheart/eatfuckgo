// Legion markers: a Japanese-fireworks "shell" burst per player. Each player
// picks a distinct hanabi shape (readable beyond colour alone) that blooms over
// the hexes their legion holds and brightens when they own a whole biome.
// Hand-drawn SVG — scales crisply, no licensing strings.
import { BurstKind } from '../game/humboldt';

const TAU = Math.PI * 2;

export const BURST_META: { kind: BurstKind; label: string; hint: string }[] = [
  { kind: 'chrysanthemum', label: 'Chrysanthemum', hint: 'straight rays, spark tips' },
  { kind: 'peony', label: 'Peony', hint: 'short rays, round heads' },
  { kind: 'kamuro', label: 'Kamuro ring', hint: 'ring + inner rays' },
  { kind: 'willow', label: 'Willow', hint: 'drooping curved rays' },
];

// The burst as bare SVG children — drop inside any <svg>/<g>.
export function LegionBurst({ cx, cy, r, color, kind, strong = false }: {
  cx: number; cy: number; r: number; color: string; kind: BurstKind; strong?: boolean;
}) {
  const op = strong ? 0.95 : 0.5;
  const rays = kind === 'peony' ? 8 : kind === 'willow' ? 8 : 12;
  const parts: JSX.Element[] = [];
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * TAU - Math.PI / 2;
    const dx = Math.cos(a), dy = Math.sin(a);
    if (kind === 'willow') {
      const ex = cx + dx * r, ey = cy + dy * r + r * 0.5;
      const mx = cx + dx * r * 0.55, my = cy + dy * r * 0.55;
      parts.push(<path key={i} d={`M${cx},${cy} Q${mx},${my} ${ex},${ey}`} fill="none" stroke={color} strokeWidth={strong ? 1.6 : 1.1} strokeLinecap="round" />);
      parts.push(<circle key={`t${i}`} cx={ex} cy={ey} r={strong ? 1.9 : 1.4} fill={color} />);
    } else {
      const len = kind === 'peony' ? r * 0.62 : r;
      const ex = cx + dx * len, ey = cy + dy * len;
      parts.push(<line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke={color} strokeWidth={strong ? 1.5 : 1} strokeLinecap="round" />);
      const tip = kind === 'peony' ? (strong ? 2.6 : 2) : (strong ? 1.8 : 1.3);
      parts.push(<circle key={`t${i}`} cx={ex} cy={ey} r={tip} fill={color} />);
    }
  }
  return (
    <g opacity={op} pointerEvents="none">
      {kind === 'kamuro' && <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={strong ? 1.8 : 1.2} />}
      {parts}
      <circle cx={cx} cy={cy} r={strong ? 3 : 2.2} fill={color} />
    </g>
  );
}

// Convenience: a self-contained badge (its own <svg>) for lobby/scoreboard.
export function BurstBadge({ color, kind, size = 22, strong = true }: { color: string; kind: BurstKind; size?: number; strong?: boolean }) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: 'none' }}>
      <LegionBurst cx={c} cy={c} r={c - 2} color={color} kind={kind} strong={strong} />
    </svg>
  );
}
