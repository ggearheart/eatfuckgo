/* eslint-disable @typescript-eslint/no-explicit-any */
// The Hand: what a player is holding — their SPECIES collection, the STRATEGY
// arsenal those species carry (with Red Queen fatigue), and the shared WEIRDO
// stacks anyone can summon mid-clash. In pass-&-play this one panel can peek at
// any player's stack via the tabs; in future online play it would show only you.
import { useState } from 'react';
import { PLAYERS, FACTION, Faction, PlayerId, MatchState } from '../game/humboldt';
import { strategyPortfolio, SPECIES_BY_ID, speciesCat } from '../game/species';
import { BOARDS, WEIRDO_STACKS } from '../engine/data';
import { BurstBadge } from './LegionBurst';

const DIE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function StrategyList({ match, pid }: { match: MatchState; pid: PlayerId }) {
  const port = strategyPortfolio(match.collection[pid]);
  const adapt = match.adapt[pid] || {};
  return (
    <div className="grid grid-cols-2 gap-2">
      {(['eat', 'fk'] as Faction[]).map((f) => (
        <div key={f}>
          <div className="text-[10px] font-black uppercase tracking-wide mb-1" style={{ color: f === 'eat' ? '#c4561e' : '#7b4fa0' }}>
            {FACTION[f].icon} {FACTION[f].name} · {port[f].length}
          </div>
          <div className="space-y-1">
            {port[f].length ? port[f].map((e) => {
              const fatigue = adapt[e.strategy] || 0; // Red Queen: champion bonus erodes with reuse
              return (
                <div key={e.strategy} className="flex items-center gap-1.5 rounded-lg border px-1.5 py-1" style={{ borderColor: f === 'eat' ? '#e7c9b6' : '#dcccec', background: '#fffdf7' }}>
                  <span className="text-base leading-none">{e.art}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold leading-tight truncate">{e.name} <span className="text-neutral-400 font-normal">T{e.tier}</span></div>
                    <div className="text-[9px] text-neutral-500 truncate">{e.species.map((s) => s.emoji).join(' ')} {e.species.length > 1 ? `×${e.species.length}` : ''}</div>
                  </div>
                  {fatigue > 0 && <span title={`adapted ×${fatigue} — champion bonus reduced`} className="text-[8px] font-bold text-[#b06a1e] shrink-0">😮‍💨{fatigue}</span>}
                </div>
              );
            }) : <div className="text-[9px] text-neutral-400 italic">none yet</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SpeciesList({ match, pid }: { match: MatchState; pid: PlayerId }) {
  const ids = match.collection[pid];
  // group species by biome for a legible roster
  const byBiome: Record<string, string[]> = {};
  ids.forEach((id) => { const s = SPECIES_BY_ID[id]; if (s) (byBiome[s.biome] ||= []).push(id); });
  const biomes = Object.keys(byBiome).sort((a, b) => BOARDS[a].name.localeCompare(BOARDS[b].name));
  return (
    <div className="space-y-1.5">
      {biomes.map((code) => (
        <div key={code}>
          <div className="text-[9px] font-black uppercase tracking-wide text-neutral-500 mb-0.5">{BOARDS[code].icon} {BOARDS[code].name}</div>
          <div className="flex flex-wrap gap-1">
            {byBiome[code].map((id) => {
              const s = SPECIES_BY_ID[id];
              const cat = speciesCat(s);
              return (
                <span key={id} title={s.name} className="text-[10px] px-1.5 py-0.5 rounded-full border font-semibold flex items-center gap-0.5"
                  style={{ borderColor: cat === 'eat' ? '#e7c9b6' : '#dcccec', color: cat === 'eat' ? '#8a4a20' : '#5a3a80', background: '#fff' }}>
                  {s.emoji} {s.name}
                </span>
              );
            })}
          </div>
        </div>
      ))}
      {!biomes.length && <div className="text-[10px] text-neutral-400 italic">No species yet — muster a biome to recruit.</div>}
    </div>
  );
}

function WeirdoList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {Object.keys(WEIRDO_STACKS).map((roll) => {
        const w = WEIRDO_STACKS[roll];
        return (
          <div key={roll} className="rounded-lg border px-1.5 py-1" style={{ borderColor: '#e2d8c6', background: '#fbf7ee' }}>
            <div className="text-[10px] font-black flex items-center gap-1">
              <span className="text-neutral-500">{DIE[+roll]}</span> {w.art} {w.n}
            </div>
            <div className="text-[9px] text-neutral-500 truncate">{w.cards.map((c: any) => `${c.art} ${c.n}`).join(' · ')}</div>
          </div>
        );
      })}
    </div>
  );
}

export function HandPanel({ match, viewer, onClose }: { match: MatchState; viewer: PlayerId; onClose: () => void }) {
  const [sel, setSel] = useState<PlayerId>(viewer);
  const [tab, setTab] = useState<'strat' | 'species' | 'weirdo'>('strat');
  const p = PLAYERS[sel];
  const nSpecies = match.collection[sel].length;
  const TABS: { id: typeof tab; label: string }[] = [
    { id: 'strat', label: '🧬 Strategies' },
    { id: 'species', label: `🦴 Species · ${nSpecies}` },
    { id: 'weirdo', label: '🌀 Weirdos' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-3 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl border-2 border-ink p-4 w-full max-w-2xl shadow-comic my-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-2">
          <div className="font-black text-base">🎴 Hands</div>
          <span className="text-[10px] text-neutral-500">pass &amp; play — peek at any stack; online play would keep these private</span>
          <button onClick={onClose} className="ml-auto text-[11px] font-bold px-2 py-1 rounded-lg border-2 border-ink bg-white">✕ Close</button>
        </div>

        {/* player selector */}
        <div className="flex flex-wrap gap-1 mb-2">
          {match.players.map((pid) => (
            <button key={pid} onClick={() => setSel(pid)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-[11px] font-bold"
              style={sel === pid ? { borderColor: PLAYERS[pid].color, background: '#fffdf5' } : { borderColor: '#e2e2e2', background: '#fff', color: '#888' }}>
              <BurstBadge color={sel === pid ? PLAYERS[pid].color : '#b8b0a2'} kind={PLAYERS[pid].emblem} size={15} />
              {PLAYERS[pid].name}{pid === viewer ? ' (you)' : ''}{pid === match.turn ? ' •' : ''}
            </button>
          ))}
        </div>

        <div className="rounded-xl border-2 p-2.5" style={{ borderColor: p.color }}>
          <div className="flex items-center gap-1.5 mb-2 font-black text-sm" style={{ color: p.color }}>
            <BurstBadge color={p.color} kind={p.emblem} size={20} /> {p.dot} {p.name}
            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: p.fac === 'eat' ? '#f6e1d3' : '#eadcf4', color: p.fac === 'eat' ? '#8a4a20' : '#5a3a80' }}>
              Team {FACTION[p.fac].icon} {FACTION[p.fac].name}
            </span>
          </div>

          <div className="flex gap-1 mb-2">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 py-1 rounded-lg border-2 text-[10px] font-extrabold"
                style={tab === t.id ? { borderColor: '#1a0e04', background: '#1a0e04', color: '#fff' } : { borderColor: '#d4d4d4', background: '#fff', color: '#888' }}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'strat' && <StrategyList match={match} pid={sel} />}
          {tab === 'species' && <SpeciesList match={match} pid={sel} />}
          {tab === 'weirdo' && (
            <div>
              <div className="text-[10px] text-neutral-500 mb-1.5">Weirdos aren't owned — in a clash (round 3+) either fighter may <b>summon</b> one by rolling 1d6, bringing its 3-card stack. Shared by all players:</div>
              <WeirdoList />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
