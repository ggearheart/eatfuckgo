/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import { MapBoard } from '../components/MapBoard';
import { ZonePanel } from '../components/ZonePanel';
import { ProgressPanel } from '../components/ProgressPanel';
import { PLAYERS, matchThreat, MatchState } from '../game/humboldt';

const DIE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
export function MapScreen({ match, onPick, onEnd, onHome, note, log, reach, onRoll }: {
  match: MatchState; onPick: (code: string) => void; onEnd: () => void; onHome: () => void; note?: string | null; log: string[]; reach: number | null; onRoll: () => void;
}) {
  const t = PLAYERS[match.turn];
  const threat = matchThreat(match);
  return (
    <div className="min-h-full p-3 max-w-[1440px] mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="font-display text-2xl"><span className="text-eat">EAT</span> <span className="text-fk">FUCK</span> GO</div>
        <span className="text-[11px] text-neutral-500 italic hidden md:inline">after Humboldt's Naturgemälde — biomes stacked by climate</span>
        <button onClick={onHome} className="ml-auto text-xs font-bold px-3 py-1 rounded-lg border-2 border-ink bg-white">⌂ Home</button>
      </div>

      <div className="grid gap-3 lg:grid-cols-12 items-start">
        {/* left — codex */}
        <aside className="lg:col-span-3 order-2 lg:order-1"><ZonePanel /></aside>

        {/* center — the board */}
        <main className="lg:col-span-6 order-1 lg:order-2">
          <div className="rounded-xl border-2 py-2 px-3 mb-2 text-center font-extrabold text-sm"
            style={{ borderColor: t.color, background: match.turn === 'p1' ? '#fdf0ea' : '#f3ecfa' }}>
            {reach == null ? (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span>{t.dot} {t.name}'s turn — roll to move:</span>
                <button onClick={onRoll} className="px-3 py-1 rounded-lg border-2 border-ink bg-[#ffd21a] text-ink font-black">🎲 Roll 1d6</button>
              </div>
            ) : (
              <span>{t.dot} {t.name} rolled <span className="text-lg">{DIE[reach]}</span> — reach <b>{reach}</b>. Tap <span style={{ color: '#2a9d4a' }}>🌱 green</span> to muster (free) or <span style={{ color: '#c0392b' }}>⚔️ red</span> to clash a rival's hex.</span>
            )}
          </div>
          {threat && (
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              className="rounded-lg border-2 text-xs font-black px-3 py-2 mb-2 text-center"
              style={{ borderColor: PLAYERS[threat].color, background: threat === 'p1' ? '#fdece2' : '#f1e7fa', color: PLAYERS[threat].color }}>
              ⚠️ {PLAYERS[threat].dot} {PLAYERS[threat].name} is one biome from victory — deny them!
            </motion.div>
          )}
          {note && (
            <div className="rounded-lg border-2 border-red-400 bg-red-50 text-red-800 text-xs font-bold px-3 py-2 mb-2 text-center">{note}</div>
          )}
          <MapBoard match={match} turn={match.turn} reach={reach} onPick={onPick} />
          <p className="text-center text-[11px] text-neutral-500 mt-2">
            Roll to move, then <b style={{ color: '#2a9d4a' }}>muster</b> a neutral hex (free — settle the niche, grow your collection) or <b style={{ color: '#c0392b' }}>clash</b> a rival's hex. Only clashes heat the planet. Hold every patch of a biome to control it (👑).
          </p>
        </main>

        {/* right — progress */}
        <aside className="lg:col-span-3 order-3"><ProgressPanel match={match} log={log} onEnd={onEnd} /></aside>
      </div>
    </div>
  );
}
