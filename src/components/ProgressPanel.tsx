/* eslint-disable @typescript-eslint/no-explicit-any */
// Right column: live match progress — turn, warming clock, per-biome control,
// running player log, and the end-match button.
import { PLAYERS, heldBy, biomesControlledBy, ALL_BIOMES, MatchState } from '../game/humboldt';
import { BOARDS } from '../engine/data';
import { biomeOwner, hexesOfBiome, STAGE_LABELS, MAX_WARMING } from '../game/board';

export function ProgressPanel({ match, log, onEnd }: { match: MatchState; log: string[]; onEnd: () => void }) {
  const warmPct = (match.warming / MAX_WARMING) * 100;
  const t = PLAYERS[match.turn];
  return (
    <div className="rounded-2xl border-2 border-ink bg-white/70 p-2.5 text-left flex flex-col gap-2.5" style={{ maxHeight: '74vh' }}>
      <div className="font-black text-sm">📊 Progress</div>

      {/* turn */}
      <div className="rounded-lg border-2 px-2 py-1.5 text-xs font-bold" style={{ borderColor: t.color, background: match.turn === 'p1' ? '#fdf0ea' : '#f3ecfa' }}>
        Turn <b>{match.turns}</b> · <span style={{ color: t.color }}>{t.dot} {t.name}</span> to move
      </div>

      {/* warming */}
      <div>
        <div className="text-[11px] font-bold flex justify-between mb-0.5"><span>🌡️ {STAGE_LABELS[match.warming]}</span><span className="text-neutral-400">New Planet</span></div>
        <div className="h-2.5 rounded-full border-2 border-ink overflow-hidden bg-white">
          <div className="h-full transition-all duration-500" style={{ width: `${warmPct}%`, background: 'linear-gradient(90deg,#f2c14e,#e8743b,#c0392b)' }} />
        </div>
      </div>

      {/* biome control */}
      <div>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500 mb-1">🌍 Biome control</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          {ALL_BIOMES.map((code) => {
            const hs = hexesOfBiome(code, match.states);
            const own = biomeOwner(match.owners, code, match.states);
            const held = hs.filter((id) => match.owners[id]).length;
            return (
              <div key={code} className="text-[10px] flex items-center gap-1">
                <span>{BOARDS[code].icon}</span>
                <span className="flex-1 truncate">{BOARDS[code].name}</span>
                {hs.length === 0
                  ? <span className="text-neutral-300" title="transformed away">✕</span>
                  : own
                    ? <span style={{ color: PLAYERS[own].color }} title={`${PLAYERS[own].name} controls`}>👑</span>
                    : <span className="text-neutral-400 tabular-nums">{held}/{hs.length}</span>}
              </div>
            );
          })}
        </div>
        <div className="text-[11px] font-bold flex justify-between mt-1.5 pt-1.5 border-t border-neutral-200">
          <span style={{ color: PLAYERS.p1.color }}>🟧 {heldBy(match, 'p1')} hex · {biomesControlledBy(match, 'p1')} 👑</span>
          <span style={{ color: PLAYERS.p2.color }}>🟪 {heldBy(match, 'p2')} hex · {biomesControlledBy(match, 'p2')} 👑</span>
        </div>
      </div>

      {/* log */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500 mb-1">📜 Log</div>
        <div className="flex-1 overflow-y-auto text-[10px] leading-snug space-y-1 pr-1" style={{ minHeight: '4rem' }}>
          {log.length === 0
            ? <div className="text-neutral-400 italic">No moves yet — contest a hex to begin.</div>
            : [...log].reverse().map((e, i) => <div key={log.length - i} className="border-b border-neutral-100 pb-1">{e}</div>)}
        </div>
      </div>

      <button onClick={onEnd} className="px-3 py-1.5 rounded-lg border-2 border-ink bg-white font-extrabold text-xs">🏁 End match &amp; tally</button>
    </div>
  );
}
