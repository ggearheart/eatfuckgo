/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import { BOARDS } from '../engine/data';
import { HEXES, hexPoints, HEX_R, BIOME_COLORS, curBiome, vulnerableHexes, legionMoves } from '../game/board';
import { PLAYERS, PlayerId, MatchState, legionAt, occupiedHexes } from '../game/humboldt';
import { LegionBurst } from './LegionBurst';

export function MapBoard({ match, selLegion, reach, onPick }: { match: MatchState; selLegion: string | null; reach: number | null; onPick: (id: string) => void }) {
  const vulnerable = vulnerableHexes(match);
  const sel = selLegion ? match.legions[selLegion] : null;
  // legal endpoints for the selected legion this turn
  let moves = new Set<string>();
  if (sel && reach != null) { const occ = occupiedHexes(match); occ.delete(sel.hex); moves = legionMoves(sel.hex, reach, occ); }

  return (
    <svg viewBox="0 0 1000 620" className="w-full h-auto rounded-xl border-4 border-ink"
      style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.85)', background: '#f2e7cf' }}>
      <image href={`${import.meta.env.BASE_URL}img/naturgemalde.jpg`} x="0" y="0" width="1000" height="620" preserveAspectRatio="xMidYMid slice" opacity="1" />
      <rect width="1000" height="620" fill="#f4ead0" opacity="0.14" />
      <text x="984" y="606" textAnchor="end" fontSize="10.5" fontFamily="Georgia,serif" fontStyle="italic" fill="#4a3a22"
        style={{ paintOrder: 'stroke' } as any} stroke="#f6eed6" strokeWidth="2.5">Naturgemälde (1807), A. v. Humboldt — Zentralbibliothek Zürich · public domain</text>

      {HEXES.map((h) => {
        const code = curBiome(match.states, h.id);
        const owner = match.owners[h.id];
        const legion = legionAt(match, h.id);
        const b = BOARDS[code];
        const fill = BIOME_COLORS[code] || '#c9bfa6';
        const ring = owner ? PLAYERS[owner].color : '#6f5f3e';
        const atRisk = vulnerable.has(h.id);
        const isSel = sel?.hex === h.id;
        // classify a legal endpoint for the selected legion
        const canMove = moves.has(h.id);
        const tgtLegion = canMove ? legionAt(match, h.id) : null;
        const enemyLegion = tgtLegion && tgtLegion.player !== match.turn;
        const enemyClaim = canMove && !tgtLegion && owner && owner !== match.turn;
        const allyBlock = tgtLegion && tgtLegion.player === match.turn; // can't stack
        const highlight = canMove && !allyBlock;
        const halo = enemyLegion ? '#c0392b' : enemyClaim ? '#d4a017' : '#2a9d4a';
        const clickable = highlight || (legion && legion.player === match.turn);
        return (
          <motion.g key={h.id} style={{ cursor: clickable ? 'pointer' : 'default' }}
            onClick={() => onPick(h.id)} whileHover={clickable ? { scale: 1.05 } : {}} initial={false}>
            {highlight && (
              <motion.polygon points={hexPoints(h.x, h.y, HEX_R + 3)} fill="none" stroke={halo} strokeWidth="3"
                animate={{ opacity: [0.25, 0.95, 0.25] }} transition={{ duration: 1.5, repeat: Infinity }} />
            )}
            <polygon points={hexPoints(h.x, h.y)} fill={fill} fillOpacity={owner ? 0.62 : 0.4}
              stroke={ring} strokeWidth={owner ? 4 : 1.75} />
            {isSel && <polygon points={hexPoints(h.x, h.y, HEX_R - 3)} fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="4 3" />}
            {!legion && <text x={h.x} y={h.y + 6} textAnchor="middle" fontSize="20" style={{ paintOrder: 'stroke' } as any} stroke="#fffdf5" strokeWidth="0.6">{b.icon}</text>}
            {/* legion marker: its firework shell + a number badge for the stack */}
            {legion && (
              <g>
                <LegionBurst cx={h.x} cy={h.y} r={22} color={PLAYERS[legion.player].color} kind={legion.emblem} strong />
                <circle cx={h.x + 15} cy={h.y - 14} r={9} fill={PLAYERS[legion.player].color} stroke="#fff" strokeWidth="1.5" />
                <text x={h.x + 15} y={h.y - 10.5} textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff">{legion.species.length}</text>
                {legion.moved && legion.player === match.turn && <text x={h.x - 16} y={h.y - 10} textAnchor="middle" fontSize="10">💤</text>}
              </g>
            )}
            {atRisk && <text x={h.x - 18} y={h.y + 20} textAnchor="middle" fontSize="11">🔥</text>}
          </motion.g>
        );
      })}
    </svg>
  );
}
