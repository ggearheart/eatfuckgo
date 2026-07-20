/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import { BOARDS } from '../engine/data';
import { HEXES, hexPoints, HEX_R, BIOME_COLORS, reachableFor, biomeOwner, curBiome, vulnerableHexes } from '../game/board';
import { PLAYERS, PlayerId, MatchState } from '../game/humboldt';

// ── legion markers: a Japanese-fireworks "shell" burst per player ──
// Each player gets a distinct hanabi shape (readable beyond colour alone),
// blooming over the hexes their legion holds. It brightens when they own the
// whole biome. Hand-drawn SVG — scales crisply, no licensing strings.
const TAU = Math.PI * 2;
type BurstKind = 'chrysanthemum' | 'peony' | 'kamuro' | 'willow';
const BURST_OF: Record<PlayerId, BurstKind> = { p1: 'chrysanthemum', p2: 'peony', p3: 'kamuro', p4: 'willow' };

function LegionBurst({ cx, cy, r, color, kind, strong }: { cx: number; cy: number; r: number; color: string; kind: BurstKind; strong: boolean }) {
  const op = strong ? 0.95 : 0.5;
  const rays = kind === 'peony' ? 8 : kind === 'willow' ? 8 : 12;
  const parts: JSX.Element[] = [];
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * TAU - Math.PI / 2;
    const dx = Math.cos(a), dy = Math.sin(a);
    if (kind === 'willow') {
      // drooping curved rays (gravity-pulled sparks)
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

export function MapBoard({ match, turn, reach, onPick }: { match: MatchState; turn: PlayerId; reach: number | null; onPick: (id: string) => void }) {
  const contestable = reachableFor(match.owners, turn, reach ?? 0);
  const homeSet = new Set(match.homes);
  const vulnerable = vulnerableHexes(match);
  const controlled: Record<string, PlayerId | null> = {};
  new Set(Object.values(match.states)).forEach((c) => (controlled[c] = biomeOwner(match.owners, c, match.states)));

  return (
    <svg viewBox="0 0 1000 620" className="w-full h-auto rounded-xl border-4 border-ink"
      style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.85)', background: '#f2e7cf' }}>
      {/* the original 1807 Naturgemälde plate as the board background */}
      <image href={`${import.meta.env.BASE_URL}img/naturgemalde.jpg`} x="0" y="0" width="1000" height="620"
        preserveAspectRatio="xMidYMid slice" opacity="1" />
      {/* light parchment scrim — just enough to seat the hexes without hiding the plate */}
      <rect width="1000" height="620" fill="#f4ead0" opacity="0.14" />

      <text x="984" y="606" textAnchor="end" fontSize="10.5" fontFamily="Georgia,serif" fontStyle="italic" fill="#4a3a22"
        style={{ paintOrder: 'stroke' } as any} stroke="#f6eed6" strokeWidth="2.5">Naturgemälde (1807), A. v. Humboldt — Zentralbibliothek Zürich · public domain</text>

      {/* hex spots */}
      {HEXES.map((h) => {
        const code = curBiome(match.states, h.id);
        const owner = match.owners[h.id];
        const canPick = contestable.has(h.id);
        const isClash = canPick && owner != null; // enemy-held → clash; neutral → muster
        const isHome = homeSet.has(h.id);
        const atRisk = vulnerable.has(h.id);
        const b = BOARDS[code];
        const fill = BIOME_COLORS[code] || '#c9bfa6';
        const ring = owner ? PLAYERS[owner].color : '#6f5f3e';
        const wholeBiome = controlled[code];
        return (
          <motion.g key={h.id} style={{ cursor: canPick ? 'pointer' : 'default' }}
            onClick={() => canPick && onPick(h.id)}
            whileHover={canPick ? { scale: 1.06 } : {}} initial={false}>
            {/* reachable pulse halo — green = muster (free claim), red = clash (enemy-held) */}
            {canPick && (
              <motion.polygon points={hexPoints(h.x, h.y, HEX_R + 3)} fill="none" stroke={isClash ? '#c0392b' : '#2a9d4a'} strokeWidth="2.5"
                animate={{ opacity: [0.2, 0.95, 0.2] }} transition={{ duration: 1.6, repeat: Infinity }} />
            )}
            {/* translucent fill lets the engraving show through; strong outline keeps the grid crisp */}
            <polygon points={hexPoints(h.x, h.y)} fill={fill} fillOpacity={owner ? 0.6 : 0.42}
              stroke={ring} strokeWidth={owner ? 4 : 1.75} />
            {/* legion marker: owner's firework shell blooms over held ground */}
            {owner && (
              <LegionBurst cx={h.x} cy={h.y} r={wholeBiome === owner ? 26 : 20} color={PLAYERS[owner].color}
                kind={BURST_OF[owner]} strong={wholeBiome === owner} />
            )}
            <text x={h.x} y={h.y + 5} textAnchor="middle" fontSize="20"
              style={{ paintOrder: 'stroke' } as any} stroke="#fffdf5" strokeWidth="0.6">{b.icon}</text>
            {isHome && <text x={h.x} y={h.y - 17} textAnchor="middle" fontSize="12">🏠</text>}
            {wholeBiome && <text x={h.x + 19} y={h.y - 13} textAnchor="middle" fontSize="13">👑</text>}
            {atRisk && <text x={h.x - 19} y={h.y - 13} textAnchor="middle" fontSize="11">🔥</text>}
            {canPick && <text x={h.x} y={h.y + 24} textAnchor="middle" fontSize="12">{isClash ? '⚔️' : '🌱'}</text>}
          </motion.g>
        );
      })}
    </svg>
  );
}
