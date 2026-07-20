/* eslint-disable @typescript-eslint/no-explicit-any */
// Recruit into a LEGION after it settles a hex. The legion's team is locked
// (EAT or F*CK — switchable only in a GM lab), so we show that team's ladder for
// this biome. A legion is full at STACK_CAP and must split to recruit more.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BOARDS, BIOME_AFFINITY } from '../engine/data';
import { curBiome } from '../game/board';
import { PLAYERS, FACTION, STACK_CAP, Legion, MatchState } from '../game/humboldt';
import { recruitOptions, strategyCard, SPECIES_BY_ID } from '../game/species';

export function MusterScreen({ match, legion, hex, onRecruit, onCancel }: {
  match: MatchState; legion: Legion; hex: string; onRecruit: (speciesId: string | null) => void; onCancel: () => void;
}) {
  const biome = curBiome(match.states, hex);
  const b = BOARDS[biome];
  const aff = BIOME_AFFINITY[biome];
  const color = PLAYERS[legion.player].color;
  const full = legion.species.length >= STACK_CAP;
  const opts = recruitOptions(legion.species, biome, legion.team);
  const [pick, setPick] = useState<string | null>(null);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
      <motion.div className="bg-white rounded-2xl border-2 border-ink p-4 w-full max-w-lg shadow-comic max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <div className="font-black text-sm" style={{ color }}>{PLAYERS[legion.player].dot} Legion {legion.n} settles {b.icon} {b.name}</div>
          <div className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: legion.team === 'eat' ? '#f6e1d3' : '#eadcf4', color: legion.team === 'eat' ? '#8a4a20' : '#5a3a80' }}>
            Team {FACTION[legion.team].icon} {FACTION[legion.team].name}{legion.team === aff ? ' ★' : ''}
          </div>
        </div>
        <div className="text-[11px] text-neutral-500 mt-0.5">Stack {legion.species.length}/{STACK_CAP} {legion.species.map((id) => SPECIES_BY_ID[id]?.emoji).join('')}</div>

        {full ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-1">🈵</div>
            <div className="font-bold text-sm">This legion is full.</div>
            <div className="text-[11px] text-neutral-500 mt-1">Split it at the start of a turn to keep recruiting.</div>
            <button onClick={() => onRecruit(null)} className="mt-3 px-4 py-2 rounded-xl border-2 border-ink bg-white font-bold text-sm">Done</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {opts.map((o) => {
                const c = strategyCard(o.species.strategy) || {};
                const sel = pick === o.species.id;
                const disabled = o.owned || !o.unlocked;
                return (
                  <button key={o.species.id} disabled={disabled} onClick={() => setPick(o.species.id)}
                    className="text-left p-2 rounded-xl border-2 disabled:cursor-not-allowed"
                    style={sel ? { borderColor: color, background: '#fffdf5', boxShadow: `0 0 0 2px ${color}` }
                      : { borderColor: legion.team === 'eat' ? '#e7c9b6' : '#dcccec', background: '#fff', opacity: disabled ? 0.5 : 1 }}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{c.art}</span>
                      <span className="text-xs font-black leading-tight flex-1 min-w-0 truncate">{c.n}{sel ? ' ⭐' : ''}</span>
                      <span className="text-[9px] font-black" style={{ color }}>T{o.tier}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">{o.species.emoji} {o.species.name}{o.owned ? ' · ✓ held' : ''}</div>
                    <div className="mt-1 flex gap-1 flex-wrap">
                      <span className="px-1 rounded text-[9px] font-bold bg-[#ffe1b0] text-[#7a4800]">OFF {c.off}</span>
                      <span className="px-1 rounded text-[9px] font-bold bg-[#e7d9f2] text-[#5a3a80]">REP {c.rep}</span>
                      <span className="px-1 rounded text-[9px] font-bold bg-[#f2ead9] text-[#5a4830]">ADA {c.ada}</span>
                    </div>
                    {!o.owned && !o.unlocked && <div className="text-[9px] text-[#c02018] mt-0.5">🔒 needs a lower-tier {FACTION[legion.team].name} species here</div>}
                  </button>
                );
              })}
              {!opts.length && <div className="text-[11px] text-neutral-500 col-span-2 py-4 text-center">No {FACTION[legion.team].name} species in this biome.</div>}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => onRecruit(null)} className="px-3 py-2.5 rounded-xl border-2 border-ink bg-white text-xs font-bold text-neutral-600">Skip</button>
              <button disabled={!pick} onClick={() => onRecruit(pick)}
                className="flex-1 py-2.5 rounded-xl border-2 border-ink text-white font-extrabold disabled:opacity-40" style={{ background: color }}>
                🌱 Recruit {pick ? strategyCard(opts.find((o) => o.species.id === pick)!.species.strategy)?.art : ''} into legion {legion.n}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
