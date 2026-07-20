/* eslint-disable @typescript-eslint/no-explicit-any */
// Mustering a neutral hex: you claim it, then recruit ONE of the biome's team
// species. Higher-tier species are locked until you own a lower rung of that
// biome's ladder — your hand unlocks better recruits (Titan-style).
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BOARDS, BIOME_AFFINITY } from '../engine/data';
import { curBiome } from '../game/board';
import { PLAYERS, FACTION, PlayerId, MatchState } from '../game/humboldt';
import { recruitOptions, strategyCard } from '../game/species';

export function MusterScreen({ match, hex, player, onRecruit, onCancel }: {
  match: MatchState; hex: string; player: PlayerId; onRecruit: (speciesId: string | null) => void; onCancel: () => void;
}) {
  const biome = curBiome(match.states, hex);
  const b = BOARDS[biome];
  const fac = PLAYERS[player].fac;
  const opts = recruitOptions(match.collection[player], biome, fac);
  const [pick, setPick] = useState<string | null>(null);
  const color = PLAYERS[player].color;
  const anyRecruitable = opts.some((o) => o.unlocked && !o.owned);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
      <motion.div className="bg-white rounded-2xl border-2 border-ink p-5 max-w-md w-full shadow-comic max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }}>
        <div className="text-center font-black text-sm" style={{ color }}>{PLAYERS[player].dot} {PLAYERS[player].name} settles {b.icon} {b.name}</div>
        <div className="text-[11px] text-neutral-500 text-center mb-1">Recruit one {FACTION[fac].icon} {FACTION[fac].name} species — higher tiers unlock once you hold a lower rung of this niche.</div>

        <div className="grid grid-cols-2 gap-2 my-3">
          {opts.map((o) => {
            const c = strategyCard(o.species.strategy) || {};
            const sel = pick === o.species.id;
            const disabled = o.owned || !o.unlocked;
            return (
              <button key={o.species.id} disabled={disabled} onClick={() => setPick(o.species.id)}
                className="text-left p-2 rounded-xl border-2 disabled:cursor-not-allowed"
                style={sel ? { borderColor: color, background: '#fffdf5', boxShadow: `0 0 0 2px ${color}` }
                  : { borderColor: '#e2d8c6', background: '#fff', opacity: disabled ? 0.5 : 1 }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl">{o.species.emoji}</span>
                  <span className="leading-tight min-w-0">
                    <span className="block text-xs font-black truncate">{o.species.name}{o.owned ? ' ✓' : sel ? ' ⭐' : ''}</span>
                    <span className="block text-[9px] text-neutral-500 truncate">{c.n}</span>
                  </span>
                  <span className="ml-auto text-[9px] font-black text-neutral-400">T{o.tier}</span>
                </div>
                <div className="mt-1 text-[9px] font-bold flex gap-1 flex-wrap">
                  <span className="px-1 rounded bg-[#ffe1b0] text-[#7a4800]">OFF {c.off}</span>
                  <span className="px-1 rounded bg-[#e7d9f2] text-[#5a3a80]">REP {c.rep}</span>
                  <span className="px-1 rounded bg-[#f2ead9] text-[#5a4830]">ADA {c.ada}</span>
                </div>
                {o.owned && <div className="text-[9px] text-neutral-400 mt-0.5">already in your collection</div>}
                {!o.owned && !o.unlocked && <div className="text-[9px] text-[#c02018] mt-0.5">🔒 needs a lower-tier {b.name} species</div>}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button onClick={() => onRecruit(null)} className="px-3 py-2.5 rounded-xl border-2 border-ink bg-white text-xs font-bold text-neutral-600">Claim only</button>
          <button disabled={!pick} onClick={() => onRecruit(pick)}
            className="flex-1 py-2.5 rounded-xl border-2 border-ink text-white font-extrabold disabled:opacity-40" style={{ background: color }}>
            🌱 Recruit {pick ? (opts.find((o) => o.species.id === pick)!.species.emoji) : ''}
          </button>
        </div>
        {!anyRecruitable && <div className="text-[10px] text-neutral-500 text-center mt-2">Nothing new to recruit here — claim the hex and move on.</div>}
        <div className="text-[10px] text-neutral-500 text-center mt-1">🎯 This biome favors {FACTION[BIOME_AFFINITY[biome]].icon} {FACTION[BIOME_AFFINITY[biome]].name}.</div>
      </motion.div>
    </motion.div>
  );
}
