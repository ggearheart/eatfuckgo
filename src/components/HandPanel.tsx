/* eslint-disable @typescript-eslint/no-explicit-any */
// The Hand: a player's LEGIONS and what each carries — its species and the
// strategies they bring, plus the shared weirdo pool anyone can summon in a
// clash. In pass-&-play this panel can peek at any player's legions.
import { useState } from 'react';
import { PLAYERS, FACTION, STACK_CAP, PlayerId, MatchState, legionsOf } from '../game/humboldt';
import { SPECIES_BY_ID, speciesCat, strategyCard } from '../game/species';
import { BOARDS, WEIRDO_STACKS } from '../engine/data';
import { BurstBadge } from './LegionBurst';

const DIE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function HandPanel({ match, viewer, onClose }: { match: MatchState; viewer: PlayerId; onClose: () => void }) {
  const [sel, setSel] = useState<PlayerId>(viewer);
  const [weird, setWeird] = useState(false);
  const legions = legionsOf(match, sel);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-3 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl border-2 border-ink p-4 w-full max-w-2xl shadow-comic my-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-2">
          <div className="font-black text-base">🎴 Legions</div>
          <span className="text-[10px] text-neutral-500">pass &amp; play — peek at any player's legions</span>
          <button onClick={onClose} className="ml-auto text-[11px] font-bold px-2 py-1 rounded-lg border-2 border-ink bg-white">✕ Close</button>
        </div>

        {/* player selector */}
        <div className="flex flex-wrap gap-1 mb-2">
          {match.players.map((pid) => (
            <button key={pid} onClick={() => setSel(pid)} className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-[11px] font-bold"
              style={sel === pid ? { borderColor: PLAYERS[pid].color, background: '#fffdf5' } : { borderColor: '#e2e2e2', background: '#fff', color: '#888' }}>
              {PLAYERS[pid].dot} {PLAYERS[pid].name}{pid === viewer ? ' (you)' : ''} · {legionsOf(match, pid).length}🎆
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {legions.map((l) => {
            const bySid: Record<string, string[]> = {};
            l.species.forEach((id) => { const s = SPECIES_BY_ID[id]; if (s) (bySid[s.strategy] ||= []).push(id); });
            return (
              <div key={l.id} className="rounded-xl border-2 p-2" style={{ borderColor: PLAYERS[l.player].color, background: '#fffdf7' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <BurstBadge color={PLAYERS[l.player].color} kind={l.emblem} size={20} />
                  <b className="text-xs">Legion {l.n}</b>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: l.team === 'eat' ? '#f6e1d3' : '#eadcf4', color: l.team === 'eat' ? '#8a4a20' : '#5a3a80' }}>{FACTION[l.team].icon} {FACTION[l.team].name}</span>
                  <span className="text-[10px] text-neutral-500">at {BOARDS[match.states[l.hex]] ? BOARDS[match.states[l.hex]].name : l.hex}</span>
                  <span className="ml-auto text-[10px] font-bold text-neutral-500">{l.species.length}/{STACK_CAP}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(bySid).map((sid) => { const c = strategyCard(sid) || {}; const s = SPECIES_BY_ID[bySid[sid][0]]; const cat = speciesCat(s); return (
                    <span key={sid} title={`${c.n} · ${bySid[sid].map((id) => SPECIES_BY_ID[id].name).join(', ')}`}
                      className="text-[10px] px-1.5 py-0.5 rounded-full border font-semibold flex items-center gap-0.5"
                      style={{ borderColor: cat === 'eat' ? '#e7c9b6' : '#dcccec', color: cat === 'eat' ? '#8a4a20' : '#5a3a80', background: '#fff' }}>
                      {c.art} {bySid[sid].map((id) => SPECIES_BY_ID[id].emoji).join('')} <span className="text-neutral-400">T{c.t ?? 0}</span>
                    </span>
                  ); })}
                  {!l.species.length && <span className="text-[10px] text-neutral-400 italic">empty stack</span>}
                </div>
              </div>
            );
          })}
          {!legions.length && <div className="text-[11px] text-neutral-400 italic text-center py-4">No legions — eliminated.</div>}
        </div>

        {/* weirdos reference */}
        <button onClick={() => setWeird((v) => !v)} className="mt-3 text-[11px] font-bold px-2 py-1 rounded-lg border-2 border-ink bg-white">🌀 Weirdos {weird ? '▲' : '▼'}</button>
        {weird && (
          <div className="mt-2">
            <div className="text-[10px] text-neutral-500 mb-1.5">Weirdos aren't owned — in a clash (round 3+) either fighter may summon one by rolling 1d6.</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {Object.keys(WEIRDO_STACKS).map((roll) => { const w = WEIRDO_STACKS[roll]; return (
                <div key={roll} className="rounded-lg border px-1.5 py-1" style={{ borderColor: '#e2d8c6', background: '#fbf7ee' }}>
                  <div className="text-[10px] font-black">{DIE[+roll]} {w.art} {w.n}</div>
                  <div className="text-[9px] text-neutral-500 truncate">{w.cards.map((c: any) => `${c.art} ${c.n}`).join(' · ')}</div>
                </div>
              ); })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
