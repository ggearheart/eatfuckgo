/* eslint-disable @typescript-eslint/no-explicit-any */
import { MapBoard } from '../components/MapBoard';
import { ZonePanel } from '../components/ZonePanel';
import { ProgressPanel } from '../components/ProgressPanel';
import { PLAYERS, MatchState } from '../game/humboldt';

export function MapScreen({ match, onPick, onEnd, onHome, note, log }: {
  match: MatchState; onPick: (code: string) => void; onEnd: () => void; onHome: () => void; note?: string | null; log: string[];
}) {
  const t = PLAYERS[match.turn];
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
            {t.dot} {t.name}'s turn — the glowing hexes border your ground. Tap one to contest it.
          </div>
          {note && (
            <div className="rounded-lg border-2 border-red-400 bg-red-50 text-red-800 text-xs font-bold px-3 py-2 mb-2 text-center">{note}</div>
          )}
          <MapBoard match={match} turn={match.turn} onPick={onPick} />
          <p className="text-center text-[11px] text-neutral-500 mt-2">
            Expand from your 🏠 home along adjacent hexes; hold every patch of a biome to control it (👑). 🔥 hexes transform as the planet warms.
          </p>
        </main>

        {/* right — progress */}
        <aside className="lg:col-span-3 order-3"><ProgressPanel match={match} log={log} onEnd={onEnd} /></aside>
      </div>
    </div>
  );
}
