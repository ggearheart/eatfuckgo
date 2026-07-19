/* eslint-disable @typescript-eslint/no-explicit-any */
import { MapBoard } from '../components/MapBoard';
import { PLAYERS, heldBy, MatchState } from '../game/humboldt';

export function MapScreen({ match, onPick, onEnd, onHome }: {
  match: MatchState; onPick: (code: string) => void; onEnd: () => void; onHome: () => void;
}) {
  const p1 = heldBy(match, 'p1'), p2 = heldBy(match, 'p2');
  const t = PLAYERS[match.turn];
  return (
    <div className="min-h-full p-3 max-w-[1040px] mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="font-display text-2xl"><span className="text-eat">EAT</span> <span className="text-fk">FUCK</span> GO</div>
        <span className="text-[11px] text-neutral-500 italic hidden sm:inline">after Humboldt's Naturgemälde — biomes stacked by climate</span>
        <button onClick={onHome} className="ml-auto text-xs font-bold px-3 py-1 rounded-lg border-2 border-ink bg-white">⌂ Home</button>
      </div>

      <div className="rounded-xl border-2 py-2 px-3 mb-2 text-center font-extrabold text-sm"
        style={{ borderColor: t.color, background: match.turn === 'p1' ? '#fdf0ea' : '#f3ecfa' }}>
        {t.dot} {t.name}'s turn — tap a biome to contest it. Win the clash → 👑 you hold that niche.
      </div>

      <MapBoard match={match} turn={match.turn} onPick={onPick} />

      <div className="flex items-center gap-4 justify-center mt-3 flex-wrap text-sm font-bold">
        <span style={{ color: PLAYERS.p1.color }}>🟧 Player 1 holds {p1}</span>
        <span style={{ color: PLAYERS.p2.color }}>🟪 Player 2 holds {p2}</span>
        <button onClick={onEnd} className="px-3 py-1.5 rounded-lg border-2 border-ink bg-white font-extrabold text-xs">🏁 End match &amp; tally</button>
      </div>
      <p className="text-center text-[11px] text-neutral-500 mt-2 max-w-2xl mx-auto">
        Prototype slice: win a clash to claim the biome. Next up — the warming clock that transforms each biome, and scoring the niches you hold as the planet changes.
      </p>
    </div>
  );
}
