/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import { BOARDS } from '../engine/data';
import { HEXES, hexPoints, HEX_R, HOME, BIOME_COLORS, contestableFor, biomeOwner, curBiome, vulnerableHexes } from '../game/board';
import { PLAYERS, PlayerId, MatchState } from '../game/humboldt';

const HOME_HEXES = new Set([...HOME.p1, ...HOME.p2]);

export function MapBoard({ match, turn, onPick }: { match: MatchState; turn: PlayerId; onPick: (id: string) => void }) {
  const contestable = contestableFor(match.owners, turn);
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
        const isHome = HOME_HEXES.has(h.id);
        const atRisk = vulnerable.has(h.id);
        const b = BOARDS[code];
        const fill = BIOME_COLORS[code] || '#c9bfa6';
        const ring = owner ? PLAYERS[owner].color : '#6f5f3e';
        const wholeBiome = controlled[code];
        return (
          <motion.g key={h.id} style={{ cursor: canPick ? 'pointer' : 'default' }}
            onClick={() => canPick && onPick(h.id)}
            whileHover={canPick ? { scale: 1.06 } : {}} initial={false}>
            {/* contestable pulse halo */}
            {canPick && (
              <motion.polygon points={hexPoints(h.x, h.y, HEX_R + 3)} fill="none" stroke={PLAYERS[turn].color} strokeWidth="2.5"
                animate={{ opacity: [0.2, 0.95, 0.2] }} transition={{ duration: 1.6, repeat: Infinity }} />
            )}
            {/* translucent fill lets the engraving show through; strong outline keeps the grid crisp */}
            <polygon points={hexPoints(h.x, h.y)} fill={fill} fillOpacity={owner ? 0.6 : 0.42}
              stroke={ring} strokeWidth={owner ? 4 : 1.75} />
            <text x={h.x} y={h.y + 5} textAnchor="middle" fontSize="20"
              style={{ paintOrder: 'stroke' } as any} stroke="#fffdf5" strokeWidth="0.6">{b.icon}</text>
            {isHome && <text x={h.x} y={h.y - 17} textAnchor="middle" fontSize="12">🏠</text>}
            {wholeBiome && <text x={h.x + 19} y={h.y - 13} textAnchor="middle" fontSize="13">👑</text>}
            {atRisk && <text x={h.x - 19} y={h.y - 13} textAnchor="middle" fontSize="11">🔥</text>}
          </motion.g>
        );
      })}
    </svg>
  );
}
