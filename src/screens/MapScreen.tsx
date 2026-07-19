/* eslint-disable @typescript-eslint/no-explicit-any */
import { MapBoard } from '../components/MapBoard';
import { PLAYERS, heldBy, biomesControlledBy, MatchState } from '../game/humboldt';
import { STAGE_LABELS, MAX_WARMING } from '../game/board';

export function MapScreen({ match, onPick, onEnd, onHome, note }: {
  match: MatchState; onPick: (code: string) => void; onEnd: () => void; onHome: () => void; note?: string | null;
}) {
  const h1 = heldBy(match, 'p1'), h2 = heldBy(match, 'p2');
  const b1 = biomesControlledBy(match, 'p1'), b2 = biomesControlledBy(match, 'p2');
  const t = PLAYERS[match.turn];
  const warmPct = (match.warming / MAX_WARMING) * 100;
  return (
    <div className="min-h-full p-3 max-w-[1040px] mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="font-display text-2xl"><span className="text-eat">EAT</span> <span className="text-fk">FUCK</span> GO</div>
        <span className="text-[11px] text-neutral-500 italic hidden sm:inline">after Humboldt's Naturgemälde — biomes stacked by climate</span>
        <button onClick={onHome} className="ml-auto text-xs font-bold px-3 py-1 rounded-lg border-2 border-ink bg-white">⌂ Home</button>
      </div>

      <div className="rounded-xl border-2 py-2 px-3 mb-2 text-center font-extrabold text-sm"
        style={{ borderColor: t.color, background: match.turn === 'p1' ? '#fdf0ea' : '#f3ecfa' }}>
        {t.dot} {t.name}'s turn — the glowing hexes border your ground. Tap one to contest it; win the clash → you take that hex.
      </div>

      {/* warming clock */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-black whitespace-nowrap">🌡️ {STAGE_LABELS[match.warming]}</span>
        <div className="relative flex-1 h-3 rounded-full border-2 border-ink overflow-hidden bg-white">
          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{ width: `${warmPct}%`, background: 'linear-gradient(90deg,#f2c14e,#e8743b,#c0392b)' }} />
        </div>
        <span className="text-[10px] text-neutral-500 whitespace-nowrap hidden sm:inline">🔥 hexes flag what warms next</span>
      </div>

      {note && (
        <div className="rounded-lg border-2 border-red-400 bg-red-50 text-red-800 text-xs font-bold px-3 py-2 mb-2 text-center">
          {note}
        </div>
      )}

      <MapBoard match={match} turn={match.turn} onPick={onPick} />

      <div className="flex items-center gap-4 justify-center mt-3 flex-wrap text-sm font-bold">
        <span style={{ color: PLAYERS.p1.color }}>🟧 P1 — {h1} hex{h1 === 1 ? '' : 'es'} · {b1} biome{b1 === 1 ? '' : 's'} 👑</span>
        <span style={{ color: PLAYERS.p2.color }}>🟪 P2 — {h2} hex{h2 === 1 ? '' : 'es'} · {b2} biome{b2 === 1 ? '' : 's'} 👑</span>
        <button onClick={onEnd} className="px-3 py-1.5 rounded-lg border-2 border-ink bg-white font-extrabold text-xs">🏁 End match &amp; tally</button>
      </div>
      <p className="text-center text-[11px] text-neutral-500 mt-2 max-w-2xl mx-auto">
        Expand from your 🏠 home along adjacent hexes; hold every patch of a biome to control it (👑). Each turn the planet warms — 🔥 hexes transform to hotter states, dissolving biomes and forcing you to chase the shifting habitats.
      </p>
    </div>
  );
}
