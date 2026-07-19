/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import { BOARDS } from '../engine/data';
import { TERRAIN_ELEMENTS, ELEMENTS } from '../engine/elements';
import { BIOME_POS, ALL_BIOMES, PLAYERS, PlayerId, MatchState } from '../game/humboldt';

export function MapBoard({ match, turn, onPick }: { match: MatchState; turn: PlayerId; onPick: (code: string) => void }) {
  const ownerColor = (o: PlayerId | null) => (o ? PLAYERS[o].color : '#b6a892');
  return (
    <svg viewBox="0 0 1000 560" className="w-full h-auto rounded-xl border-4 border-ink" style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.85)' }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfe6f5" /><stop offset="1" stopColor="#eaf3e8" />
        </linearGradient>
      </defs>
      {/* sky + sea */}
      <rect width="1000" height="560" fill="url(#sky)" />
      <rect y="440" width="1000" height="120" fill="#7fb6c4" />
      <rect y="440" width="1000" height="120" fill="#4f96a8" opacity="0.5" />
      {/* mountain massif */}
      <polygon points="0,460 200,430 356,300 452,190 566,110 640,210 742,330 860,410 1000,470 1000,560 0,560" fill="#b79a72" stroke="#4a3a22" strokeWidth="3" strokeLinejoin="round" />
      {/* forested lower flank */}
      <polygon points="200,432 356,300 470,360 430,470 200,470" fill="#3f8a46" stroke="#1f5a26" strokeWidth="2.5" opacity="0.92" />
      {/* snow cap */}
      <polygon points="452,190 566,110 640,210 590,235 505,235" fill="#f4f7fb" stroke="#b9c6d4" strokeWidth="2" />
      {/* volcanic smoke */}
      <g fill="#8a8072" opacity="0.55">
        <circle cx="576" cy="96" r="10" /><circle cx="588" cy="78" r="13" /><circle cx="600" cy="58" r="16" />
      </g>
      {/* zone labels (Humboldt data-column nod) */}
      <g fontFamily="'Segoe UI',system-ui" fill="#5a4a30" opacity="0.85">
        <text x="14" y="112" fontSize="13" fontWeight="800">❄️ Nival — snow &amp; fire</text>
        <text x="14" y="300" fontSize="13" fontWeight="800">🌲 Montane cloud forest</text>
        <text x="640" y="315" fontSize="13" fontWeight="800">🏜️ Arid rain-shadow</text>
        <text x="14" y="418" fontSize="13" fontWeight="800">🌾 Tropical lowlands</text>
        <text x="14" y="530" fontSize="13" fontWeight="800" fill="#0e3d4a">🌊 Coastal &amp; marine</text>
        <text x="792" y="410" fontSize="12" fontWeight="800">🏭 Anthropocene</text>
      </g>

      {/* biome nodes */}
      {ALL_BIOMES.map((code) => {
        const [x, y] = BIOME_POS[code];
        const b = BOARDS[code];
        const owner = match.owners[code];
        const els = TERRAIN_ELEMENTS[code] || [];
        const attackable = owner !== turn;
        return (
          <motion.g key={code} style={{ cursor: attackable ? 'pointer' : 'not-allowed' }}
            onClick={() => attackable && onPick(code)} whileHover={attackable ? { scale: 1.08 } : {}}>
            <circle cx={x} cy={y} r="27" fill="#fffdf7" stroke={ownerColor(owner)} strokeWidth="5" />
            <circle cx={x} cy={y} r="27" fill="none" stroke="#1a0e04" strokeWidth="1.5" />
            <text x={x} y={y + 6} textAnchor="middle" fontSize="24">{b.icon}</text>
            {owner && <text x={x + 20} y={y - 18} fontSize="18">👑</text>}
            <text x={x} y={y + 45} textAnchor="middle" fontSize="11" fontWeight="900" fill="#1a0e04"
              style={{ paintOrder: 'stroke' } as any} stroke="#fffdf7" strokeWidth="3">{b.short}</text>
            <text x={x} y={y + 59} textAnchor="middle" fontSize="13">{els.map((e) => ELEMENTS[e].icon).join('')}</text>
          </motion.g>
        );
      })}
    </svg>
  );
}
