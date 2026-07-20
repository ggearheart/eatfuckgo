/* eslint-disable @typescript-eslint/no-explicit-any */
// Split a legion into two: choose which species peel off into the NEW legion.
// Both the old and new legion must keep at least one species. The new legion
// spawns on the same hex and must move off it this turn.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PLAYERS, Legion } from '../game/humboldt';
import { SPECIES_BY_ID } from '../game/species';

export function SplitLegion({ legion, onConfirm, onCancel }: {
  legion: Legion; onConfirm: (keepIds: string[], moveIds: string[]) => void; onCancel: () => void;
}) {
  const [move, setMove] = useState<Set<string>>(new Set());
  const color = PLAYERS[legion.player].color;
  const keep = legion.species.filter((id) => !move.has(id));
  const moveIds = legion.species.filter((id) => move.has(id));
  const valid = keep.length > 0 && moveIds.length > 0;
  const toggle = (id: string) => setMove((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
      <motion.div className="bg-white rounded-2xl border-2 border-ink p-4 w-full max-w-sm shadow-comic" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.94 }} animate={{ scale: 1 }}>
        <div className="font-black text-sm mb-1" style={{ color }}>✂️ Split Legion {legion.n}</div>
        <div className="text-[11px] text-neutral-500 mb-2">Tap species to peel them into a <b>new legion</b>. It appears on this hex and must move this turn. Both legions keep at least one species.</div>
        <div className="flex flex-col gap-1">
          {legion.species.map((id) => { const s = SPECIES_BY_ID[id]; const on = move.has(id); return (
            <button key={id} onClick={() => toggle(id)}
              className="text-left text-[11px] px-2 py-1.5 rounded-lg border-2 flex items-center gap-1.5"
              style={on ? { borderColor: color, background: '#fffdf5' } : { borderColor: '#e2d8c6', background: '#fff' }}>
              <span className="text-base">{s?.emoji}</span>
              <span className="font-semibold flex-1 truncate">{s?.name}</span>
              <span className="text-[10px] font-black" style={{ color: on ? color : '#b8b0a2' }}>{on ? 'NEW ▶' : 'stays'}</span>
            </button>
          ); })}
        </div>
        <div className="text-[10px] text-neutral-500 mt-2 flex justify-between"><span>stays: {keep.length}</span><span>new legion: {moveIds.length}</span></div>
        <div className="flex gap-2 mt-2">
          <button onClick={onCancel} className="px-3 py-2 rounded-xl border-2 border-ink bg-white text-xs font-bold text-neutral-600">Cancel</button>
          <button disabled={!valid} onClick={() => onConfirm(keep, moveIds)}
            className="flex-1 py-2 rounded-xl border-2 border-ink text-white font-extrabold disabled:opacity-40" style={{ background: color }}>✂️ Split</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
