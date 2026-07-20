/* eslint-disable @typescript-eslint/no-explicit-any */
// Pre-game: a player distributes their six starting species across their two
// opening legions and picks each legion's firework emblem, before the first move.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PLAYERS, FACTION, legionsOf, BurstKind, MatchState, PlayerId } from '../game/humboldt';
import { SPECIES_BY_ID } from '../game/species';
import { BurstBadge, BURST_META } from './LegionBurst';

export function LegionArrange({ match, player, onConfirm }: {
  match: MatchState; player: PlayerId; onConfirm: (legA: string[], embA: BurstKind, legB: string[], embB: BurstKind) => void;
}) {
  const [a, b] = legionsOf(match, player);
  const all = [...a.species, ...b.species];
  const [assign, setAssign] = useState<Record<string, 'A' | 'B'>>(() => { const o: Record<string, 'A' | 'B'> = {}; a.species.forEach((id) => (o[id] = 'A')); b.species.forEach((id) => (o[id] = 'B')); return o; });
  const [embA, setEmbA] = useState<BurstKind>(a.emblem);
  const [embB, setEmbB] = useState<BurstKind>(b.emblem);
  const legA = all.filter((id) => assign[id] === 'A');
  const legB = all.filter((id) => assign[id] === 'B');
  const color = PLAYERS[player].color;
  const valid = legA.length > 0 && legB.length > 0 && embA !== embB;

  const Col = ({ side, ids, emb, setEmb }: { side: string; ids: string[]; emb: BurstKind; setEmb: (k: BurstKind) => void }) => (
    <div className="flex-1 rounded-xl border-2 p-2" style={{ borderColor: color, background: '#fffdf7' }}>
      <div className="flex items-center gap-1.5 mb-1">
        <BurstBadge color={color} kind={emb} size={20} />
        <b className="text-xs">Legion {side}</b>
        <span className="text-[10px] text-neutral-400">{ids.length} species</span>
      </div>
      <div className="flex gap-1 mb-2">
        {BURST_META.map((bm) => (
          <button key={bm.kind} onClick={() => setEmb(bm.kind)} title={bm.label}
            className="rounded border-2 p-0.5" style={emb === bm.kind ? { borderColor: color, background: '#fffdf5' } : { borderColor: '#e2e2e2' }}>
            <BurstBadge color={emb === bm.kind ? color : '#b8b0a2'} kind={bm.kind} size={15} />
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1 min-h-[3rem]">
        {ids.map((id) => { const s = SPECIES_BY_ID[id]; return (
          <button key={id} onClick={() => setAssign((x) => ({ ...x, [id]: side === 'A' ? 'B' : 'A' }))}
            className="text-left text-[11px] px-2 py-1 rounded-lg border-2 border-[#e2d8c6] bg-white hover:bg-neutral-50 flex items-center gap-1">
            <span className="text-base">{s?.emoji}</span> <span className="font-semibold flex-1 truncate">{s?.name}</span> <span className="text-neutral-400">{side === 'A' ? '→ B' : '← A'}</span>
          </button>
        ); })}
        {!ids.length && <div className="text-[10px] text-neutral-400 italic text-center py-2">empty — move a species here</div>}
      </div>
    </div>
  );

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="bg-white rounded-2xl border-2 border-ink p-4 w-full max-w-lg shadow-comic" initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }}>
        <div className="font-black text-sm mb-1" style={{ color }}>{PLAYERS[player].dot} {PLAYERS[player].name} — arrange your legions</div>
        <div className="text-[11px] text-neutral-500 mb-2">Split your six starting species between two legions and pick each legion's firework. Tap a species to move it. Each legion needs at least one species and a distinct emblem.</div>
        <div className="flex gap-3">
          <Col side="A" ids={legA} emb={embA} setEmb={setEmbA} />
          <Col side="B" ids={legB} emb={embB} setEmb={setEmbB} />
        </div>
        <button disabled={!valid} onClick={() => onConfirm(legA, embA, legB, embB)}
          className="mt-3 w-full py-2.5 rounded-xl border-2 border-ink text-white font-extrabold disabled:opacity-40" style={{ background: color }}>
          {embA === embB ? 'Pick two different emblems' : legA.length && legB.length ? '⚔️ Take the field' : 'Each legion needs a species'}
        </button>
      </motion.div>
    </motion.div>
  );
}
