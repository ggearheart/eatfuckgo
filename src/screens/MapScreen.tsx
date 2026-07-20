/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import { MapBoard } from '../components/MapBoard';
import { ZonePanel } from '../components/ZonePanel';
import { ProgressPanel } from '../components/ProgressPanel';
import { PLAYERS, FACTION, matchThreat, legionsOf, legionAt, occupiedHexes, MAX_LEGIONS, STACK_CAP, MatchState, PlayerId } from '../game/humboldt';
import { curBiome, legionMoves } from '../game/board';
import { BOARDS } from '../engine/data';
import { SPECIES_BY_ID } from '../game/species';
import { BurstBadge } from '../components/LegionBurst';

const DIE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const GM_LAB = 'G';

export function MapScreen({ match, reach, selLegion, activePlayer, interactive, onPick, onRoll, onEndTurn, onSplit, onSwitchTeam, onEnd, onHome, note, log }: {
  match: MatchState; reach: number | null; selLegion: string | null; activePlayer: PlayerId; interactive: boolean;
  onPick: (id: string) => void; onRoll: () => void; onEndTurn: () => void; onSplit: (id: string) => void; onSwitchTeam: (id: string) => void;
  onEnd: () => void; onHome: () => void; note?: string | null; log: string[];
}) {
  const t = PLAYERS[activePlayer];
  const threat = matchThreat(match);
  const myLegions = legionsOf(match, activePlayer);
  const canSplit = myLegions.length < MAX_LEGIONS;
  const sel = selLegion ? match.legions[selLegion] : null;
  const selMoves = sel && reach != null ? (() => { const o = occupiedHexes(match); o.delete(sel.hex); return legionMoves(sel.hex, reach, o); })() : null;
  const selBiome = sel ? curBiome(match.states, sel.hex) : null;
  const onLab = sel ? selBiome === GM_LAB : false;

  return (
    <div className="min-h-full p-3 max-w-[1440px] mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="font-display text-2xl"><span className="text-eat">EAT</span> <span className="text-fk">FUCK</span> GO</div>
        <span className="text-[11px] text-neutral-500 italic hidden md:inline">legions muster across Humboldt's Naturgemälde</span>
        <button onClick={onHome} className="ml-auto text-xs font-bold px-3 py-1 rounded-lg border-2 border-ink bg-white">⌂ Home</button>
      </div>

      <div className="grid gap-3 lg:grid-cols-12 items-start">
        <aside className="lg:col-span-3 order-2 lg:order-1"><ZonePanel /></aside>

        <main className="lg:col-span-6 order-1 lg:order-2">
          {/* turn bar */}
          <div className="rounded-xl border-2 py-2 px-3 mb-2 text-center font-extrabold text-sm"
            style={{ borderColor: t.color, background: activePlayer === 'p1' ? '#fdf0ea' : '#f3ecfa' }}>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span>{t.dot} {t.name}'s turn{reach == null ? '' : <> — rolled <span className="text-lg">{DIE[reach] || `d${reach}`}</span>, move up to <b>{reach}</b></>}</span>
              {interactive && reach == null && (
                <button onClick={onRoll} className="px-3 py-1 rounded-lg border-2 border-ink bg-[#ffd21a] text-ink font-black">🎲 Roll 1d6</button>
              )}
              {interactive && reach == null && canSplit && sel && (
                <button onClick={() => onSplit(sel.id)} className="px-3 py-1 rounded-lg border-2 border-ink bg-white font-black text-[11px]">✂️ Split legion {sel.n}</button>
              )}
              {interactive && reach != null && (
                <button onClick={onEndTurn} className="px-3 py-1 rounded-lg border-2 border-ink bg-white font-black text-[11px]">↻ End turn</button>
              )}
              {!interactive && <span className="text-[11px] text-neutral-500">🤖 computer is moving…</span>}
            </div>
            {interactive && reach == null && (
              <div className="text-[10px] text-neutral-500 mt-1">Tap one of your legions to select it{canSplit ? ', optionally split it,' : ''} then roll. {sel ? `Legion ${sel.n} selected.` : ''}</div>
            )}
            {interactive && reach != null && !sel && <div className="text-[10px] text-neutral-500 mt-1">Tap a legion, then a highlighted hex to move it (🟢 settle · 🟡 enemy ground · 🔴 clash).</div>}
          </div>

          {/* selected legion detail */}
          {sel && (
            <div className="rounded-lg border-2 px-3 py-1.5 mb-2 text-[11px] flex items-center gap-2 flex-wrap" style={{ borderColor: PLAYERS[sel.player].color, background: '#fffdf7' }}>
              <BurstBadge color={PLAYERS[sel.player].color} kind={sel.emblem} size={18} />
              <b>Legion {sel.n}</b> · Team {FACTION[sel.team].icon} {FACTION[sel.team].name} · {sel.species.length}/{STACK_CAP} <span className="text-neutral-400">{sel.species.map((id) => SPECIES_BY_ID[id]?.emoji).join('')}</span>
              <span className="text-neutral-500">in {BOARDS[selBiome!].icon} {BOARDS[selBiome!].name}</span>
              {selMoves && <span className="text-neutral-400">· {selMoves.size} reachable</span>}
              {onLab && interactive && <button onClick={() => onSwitchTeam(sel.id)} className="ml-auto px-2 py-0.5 rounded border-2 border-ink bg-white font-black text-[10px]">🧪 Switch to {FACTION[sel.team === 'eat' ? 'fk' : 'eat'].name}</button>}
            </div>
          )}

          {threat && (
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              className="rounded-lg border-2 text-xs font-black px-3 py-2 mb-2 text-center"
              style={{ borderColor: PLAYERS[threat].color, background: threat === 'p1' ? '#fdece2' : '#f1e7fa', color: PLAYERS[threat].color }}>
              ⚠️ {PLAYERS[threat].dot} {PLAYERS[threat].name} is one kill from wiping out the last rival!
            </motion.div>
          )}
          {note && <div className="rounded-lg border-2 border-red-400 bg-red-50 text-red-800 text-xs font-bold px-3 py-2 mb-2 text-center">{note}</div>}

          <MapBoard match={match} selLegion={selLegion} reach={reach} onPick={onPick} />
          <p className="text-center text-[11px] text-neutral-500 mt-2">
            Move legions to <b style={{ color: '#2a9d4a' }}>settle</b> and recruit, <b style={{ color: '#c0392b' }}>clash</b> where they meet, and <b>split</b> to spread. Last player with a legion standing wins.
          </p>
        </main>

        <aside className="lg:col-span-3 order-3"><ProgressPanel match={match} log={log} onEnd={onEnd} /></aside>
      </div>
    </div>
  );
}
