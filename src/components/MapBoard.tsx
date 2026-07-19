/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import { BOARDS } from '../engine/data';
import { HEXES, hexPoints, HOME, BIOME_COLORS, contestableFor, biomeOwner } from '../game/board';
import { PLAYERS, PlayerId, MatchState } from '../game/humboldt';

const HOME_HEXES = new Set([...HOME.p1, ...HOME.p2]);

export function MapBoard({ match, turn, onPick }: { match: MatchState; turn: PlayerId; onPick: (id: string) => void }) {
  const contestable = contestableFor(match.owners, turn);
  const controlled: Record<string, PlayerId | null> = {};
  new Set(HEXES.map((h) => h.biome)).forEach((c) => (controlled[c] = biomeOwner(match.owners, c)));

  return (
    <svg viewBox="0 0 1000 620" className="w-full h-auto rounded-xl border-4 border-ink"
      style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.85)', background: '#f2e7cf' }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dcecf3" /><stop offset="1" stopColor="#eee3c6" />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fb9c4" /><stop offset="1" stopColor="#5f97a6" />
        </linearGradient>
      </defs>

      {/* parchment sky + sea backdrop */}
      <rect width="1000" height="620" fill="url(#sky)" />
      <rect y="470" width="1000" height="150" fill="url(#sea)" opacity="0.55" />
      {/* the mountain silhouette behind the hexes */}
      <polygon points="60,540 500,70 940,540" fill="#c9b78e" opacity="0.5" stroke="#8a734a" strokeWidth="2" />
      <polygon points="430,150 500,70 570,150 540,175 460,175" fill="#f3f6fa" opacity="0.7" />
      {/* faint sun + smoke plume */}
      <circle cx="150" cy="120" r="30" fill="#f0d98a" opacity="0.6" />
      <g fill="#9a9080" opacity="0.4"><circle cx="512" cy="70" r="9" /><circle cx="522" cy="52" r="12" /><circle cx="534" cy="34" r="15" /></g>

      {/* Humboldt-style zone labels down the left margin */}
      <g fontFamily="Georgia,'Times New Roman',serif" fill="#5a4a30" opacity="0.9">
        <text x="16" y="120" fontSize="13" fontStyle="italic" fontWeight="700">Nival · snow &amp; fire</text>
        <text x="16" y="252" fontSize="13" fontStyle="italic" fontWeight="700">Montane · forest &amp; rock</text>
        <text x="16" y="384" fontSize="13" fontStyle="italic" fontWeight="700">Lowland · plains &amp; swamp</text>
        <text x="16" y="512" fontSize="13" fontStyle="italic" fontWeight="700">Coastal · sea &amp; ocean</text>
      </g>
      <text x="984" y="600" textAnchor="end" fontSize="11" fontFamily="Georgia,serif" fontStyle="italic" fill="#7a6947" opacity="0.7">Tableau physique — after A. v. Humboldt</text>

      {/* hex spots */}
      {HEXES.map((h) => {
        const owner = match.owners[h.id];
        const canPick = contestable.has(h.id);
        const isHome = HOME_HEXES.has(h.id);
        const b = BOARDS[h.biome];
        const fill = BIOME_COLORS[h.biome] || '#c9bfa6';
        const ring = owner ? PLAYERS[owner].color : '#6f5f3e';
        const wholeBiome = controlled[h.biome];
        return (
          <motion.g key={h.id} style={{ cursor: canPick ? 'pointer' : 'default' }}
            onClick={() => canPick && onPick(h.id)}
            whileHover={canPick ? { scale: 1.06 } : {}} initial={false}>
            {/* contestable pulse halo */}
            {canPick && (
              <motion.polygon points={hexPoints(h.x, h.y, 46)} fill="none" stroke={PLAYERS[turn].color} strokeWidth="3"
                animate={{ opacity: [0.25, 0.9, 0.25] }} transition={{ duration: 1.6, repeat: Infinity }} />
            )}
            <polygon points={hexPoints(h.x, h.y)} fill={fill} stroke={ring} strokeWidth={owner ? 5 : 2.5}
              opacity={owner ? 1 : 0.82} />
            {/* owner tint wash */}
            {owner && <polygon points={hexPoints(h.x, h.y)} fill={PLAYERS[owner].color} opacity="0.16" />}
            <text x={h.x} y={h.y + 6} textAnchor="middle" fontSize="26">{b.icon}</text>
            <text x={h.x} y={h.y + 26} textAnchor="middle" fontSize="9" fontWeight="900" fill="#241708"
              style={{ paintOrder: 'stroke' } as any} stroke="#fffdf5" strokeWidth="2.5">{b.short}</text>
            {isHome && <text x={h.x} y={h.y - 24} textAnchor="middle" fontSize="13">🏠</text>}
            {wholeBiome && <text x={h.x + 26} y={h.y - 18} textAnchor="middle" fontSize="16">👑</text>}
          </motion.g>
        );
      })}
    </svg>
  );
}
