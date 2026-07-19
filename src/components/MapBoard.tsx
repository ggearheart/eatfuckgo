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
      {/* the original 1807 Naturgemälde plate as the board background */}
      <image href={`${import.meta.env.BASE_URL}img/naturgemalde.jpg`} x="0" y="0" width="1000" height="620"
        preserveAspectRatio="xMidYMid slice" opacity="0.9" />
      {/* parchment scrim so the hex spots stay legible over the engraving */}
      <rect width="1000" height="620" fill="#f4ead0" opacity="0.32" />

      {/* Humboldt-style zone labels down the left margin */}
      <g fontFamily="Georgia,'Times New Roman',serif" opacity="0.95"
        style={{ paintOrder: 'stroke' } as any} stroke="#f6eed6" strokeWidth="3">
        <text x="16" y="120" fontSize="13" fontStyle="italic" fontWeight="800" fill="#4a3a22">Nival · snow &amp; fire</text>
        <text x="16" y="252" fontSize="13" fontStyle="italic" fontWeight="800" fill="#4a3a22">Montane · forest &amp; rock</text>
        <text x="16" y="384" fontSize="13" fontStyle="italic" fontWeight="800" fill="#4a3a22">Lowland · plains &amp; swamp</text>
        <text x="16" y="512" fontSize="13" fontStyle="italic" fontWeight="800" fill="#4a3a22">Coastal · sea &amp; ocean</text>
      </g>
      <text x="984" y="606" textAnchor="end" fontSize="10.5" fontFamily="Georgia,serif" fontStyle="italic" fill="#4a3a22"
        style={{ paintOrder: 'stroke' } as any} stroke="#f6eed6" strokeWidth="2.5">Naturgemälde (1807), A. v. Humboldt — Zentralbibliothek Zürich · public domain</text>

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
