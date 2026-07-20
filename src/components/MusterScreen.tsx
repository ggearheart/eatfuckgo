/* eslint-disable @typescript-eslint/no-explicit-any */
// The heart of the game: settle a neutral hex and build your STRATEGY arsenal.
// Strategies (EAT vs F*CK) are the currency; species are the carriers. Higher
// tiers unlock once you hold a lower rung of that biome's ladder. A pinned
// "muster map" shows your whole strategy portfolio.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BOARDS, BIOME_AFFINITY } from '../engine/data';
import { curBiome } from '../game/board';
import { PLAYERS, FACTION, Faction, PlayerId, MatchState } from '../game/humboldt';
import { recruitOptions, strategyPortfolio, strategyCard } from '../game/species';

function Stat({ l, v, cls }: { l: string; v: any; cls: string }) {
  return <span className={`px-1 rounded text-[9px] font-bold ${cls}`}>{l} {v}</span>;
}

export function MusterScreen({ match, hex, player, onRecruit, onCancel }: {
  match: MatchState; hex: string; player: PlayerId; onRecruit: (speciesId: string | null) => void; onCancel: () => void;
}) {
  const biome = curBiome(match.states, hex);
  const b = BOARDS[biome];
  const aff = BIOME_AFFINITY[biome];
  const color = PLAYERS[player].color;
  const owned = match.collection[player];

  const [cat, setCat] = useState<Faction>(PLAYERS[player].fac);
  const [pick, setPick] = useState<string | null>(null);
  const opts = recruitOptions(owned, biome, cat);
  const port = strategyPortfolio(owned);
  const [showMap, setShowMap] = useState(true);

  const catBtn = (f: Faction) => {
    const n = recruitOptions(owned, biome, f).filter((o) => o.unlocked && !o.owned).length;
    return (
      <button key={f} onClick={() => { setCat(f); setPick(null); }}
        className="flex-1 py-1.5 rounded-lg border-2 font-extrabold text-xs"
        style={cat === f ? { borderColor: '#1a0e04', background: f === 'eat' ? '#c4561e' : '#7b4fa0', color: '#fff' }
          : { borderColor: '#d4d4d4', color: '#888', background: '#fff' }}>
        {FACTION[f].icon} Build {FACTION[f].name}{f === aff ? ' ★' : ''} {n ? `· ${n} new` : ''}
      </button>
    );
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
      <motion.div className="bg-white rounded-2xl border-2 border-ink p-4 w-full max-w-3xl shadow-comic max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <div className="font-black text-sm" style={{ color }}>{PLAYERS[player].dot} {PLAYERS[player].name} settles {b.icon} {b.name}</div>
          <div className="text-[10px] text-neutral-500">favors {FACTION[aff].icon} {FACTION[aff].name}</div>
          <button onClick={() => setShowMap((v) => !v)} className="ml-auto text-[10px] font-bold px-2 py-1 rounded-lg border-2 border-ink bg-white">🗺️ {showMap ? 'hide' : 'muster map'}</button>
        </div>
        <div className="text-[11px] text-neutral-500 mt-0.5">Grow a <b>strategy</b> — EAT or F*CK — carried by a species of this biome. Higher tiers unlock once you hold a lower rung.</div>

        <div className="grid gap-3 mt-2" style={{ gridTemplateColumns: showMap ? 'minmax(0,1fr) 220px' : '1fr' }}>
          {/* ── recruit (strategy-first) ── */}
          <div>
            <div className="flex gap-2 mb-2">{catBtn('eat')}{catBtn('fk')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {opts.map((o) => {
                const c = strategyCard(o.species.strategy) || {};
                const sel = pick === o.species.id;
                const disabled = o.owned || !o.unlocked;
                return (
                  <button key={o.species.id} disabled={disabled} onClick={() => setPick(o.species.id)}
                    className="text-left p-2 rounded-xl border-2 disabled:cursor-not-allowed"
                    style={sel ? { borderColor: color, background: '#fffdf5', boxShadow: `0 0 0 2px ${color}` }
                      : { borderColor: cat === 'eat' ? '#e7c9b6' : '#dcccec', background: '#fff', opacity: disabled ? 0.5 : 1 }}>
                    {/* strategy first */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{c.art}</span>
                      <span className="text-xs font-black leading-tight flex-1 min-w-0 truncate">{c.n}{sel ? ' ⭐' : ''}</span>
                      <span className="text-[9px] font-black" style={{ color: cat === 'eat' ? '#c4561e' : '#7b4fa0' }}>{FACTION[cat].icon}T{o.tier}</span>
                    </div>
                    {/* species carrier, secondary */}
                    <div className="text-[10px] text-neutral-500 mt-0.5">{o.species.emoji} {o.species.name}{o.owned ? ' · ✓ held' : ''}</div>
                    <div className="mt-1 flex gap-1 flex-wrap">
                      <Stat l="OFF" v={c.off} cls="bg-[#ffe1b0] text-[#7a4800]" /><Stat l="REP" v={c.rep} cls="bg-[#e7d9f2] text-[#5a3a80]" /><Stat l="ADA" v={c.ada} cls="bg-[#f2ead9] text-[#5a4830]" />
                    </div>
                    {!o.owned && !o.unlocked && <div className="text-[9px] text-[#c02018] mt-0.5">🔒 needs a lower-tier {FACTION[cat].name} species here</div>}
                  </button>
                );
              })}
              {!opts.length && <div className="text-[11px] text-neutral-500 col-span-2 py-4 text-center">No {FACTION[cat].name} species in this biome.</div>}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => onRecruit(null)} className="px-3 py-2.5 rounded-xl border-2 border-ink bg-white text-xs font-bold text-neutral-600">Claim only</button>
              <button disabled={!pick} onClick={() => onRecruit(pick)}
                className="flex-1 py-2.5 rounded-xl border-2 border-ink text-white font-extrabold disabled:opacity-40" style={{ background: color }}>
                🌱 Recruit {pick ? strategyCard(opts.find((o) => o.species.id === pick)!.species.strategy)?.art : ''} into your {FACTION[cat].name} arsenal
              </button>
            </div>
          </div>

          {/* ── the muster map: your strategy portfolio ── */}
          {showMap && (
            <aside className="rounded-xl border-2 border-[#e2d8c6] bg-[#faf5ea] p-2 text-left self-start">
              <div className="text-[11px] font-black mb-1">🗺️ Your arsenal</div>
              {(['eat', 'fk'] as Faction[]).map((f) => (
                <div key={f} className="mb-2">
                  <div className="text-[10px] font-black uppercase tracking-wide mb-0.5" style={{ color: f === 'eat' ? '#c4561e' : '#7b4fa0' }}>
                    {FACTION[f].icon} {FACTION[f].name} · {port[f].length}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {port[f].length ? port[f].map((e) => (
                      <span key={e.strategy} title={`${e.name} — tier ${e.tier} · ${e.species.map((s) => s.name).join(', ')}`}
                        className="text-[9px] px-1 py-0.5 rounded border font-semibold leading-none"
                        style={{ borderColor: f === 'eat' ? '#e7c9b6' : '#dcccec', color: f === 'eat' ? '#8a4a20' : '#5a3a80' }}>
                        {e.art}T{e.tier}
                      </span>
                    )) : <span className="text-[9px] text-neutral-400 italic">none yet</span>}
                  </div>
                </div>
              ))}
              <div className="text-[9px] text-neutral-400 mt-1 leading-snug">Hover a chip for its strategy &amp; species. Build a balanced arsenal — you can only fight in a mode you hold species for.</div>
            </aside>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
