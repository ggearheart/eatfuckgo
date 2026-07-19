/* eslint-disable @typescript-eslint/no-explicit-any */
// Right column: live match progress — turn, warming clock, per-biome control,
// running player log, and the end-match button.
import { PLAYERS, heldBy, biomesControlledBy, biomeWinThreshold, livingBiomes, ALL_BIOMES, MatchState } from '../game/humboldt';
import { BOARDS } from '../engine/data';
import { biomeOwner, hexesOfBiome, degLabel, MAX_C } from '../game/board';

// Humboldt & Bonpland shed clothing as their isotherm climbs.
function look(deg: number) {
  if (deg >= 4) return { face: '🥵', wear: '🩳', caption: 'stripped to shorts' };
  if (deg >= 3) return { face: '😅', wear: '👕', caption: 'shirtsleeves' };
  if (deg >= 2) return { face: '🙂', wear: '👔', caption: 'coats off' };
  if (deg >= 1) return { face: '😐', wear: '🧥', caption: 'coats on' };
  return { face: '🥶', wear: '🧣', caption: 'bundled in furs' };
}
function ThermalScale({ warming }: { warming: number }) {
  const pct = (warming / MAX_C) * 100;
  const l = look(warming);
  const Explorer = ({ name }: { name: string }) => (
    <div className="leading-none flex flex-col items-center">
      <div className="text-2xl">{l.face}</div><div className="text-base -mt-0.5">{l.wear}</div>
      <div className="text-[8px] text-neutral-500 mt-0.5">{name}</div>
    </div>
  );
  return (
    <div className="flex gap-2 items-stretch">
      {/* vertical isotherm bar — 0.0 (bottom) to +4 °C (top) */}
      <div className="relative w-5 rounded-full border-2 border-ink bg-white overflow-hidden" style={{ height: 118 }}>
        <div className="absolute bottom-0 left-0 right-0 transition-all duration-500" style={{ height: `${pct}%`, background: 'linear-gradient(0deg,#3b6fa0,#8fbf6f,#f2c14e,#e8743b,#c0392b)' }} />
      </div>
      <div className="flex flex-col justify-between text-[9px] font-bold text-neutral-400 py-0.5" style={{ height: 118 }}>
        <span>+4 °C</span><span>+2 °C</span><span>0.0</span>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="text-[11px] font-black">🌡️ {degLabel(warming)}</div>
        <div className="flex gap-3 mt-1"><Explorer name="Humboldt" /><Explorer name="Bonpland" /></div>
        <div className="text-[9px] italic text-neutral-500 mt-1">{l.caption}</div>
      </div>
    </div>
  );
}

export function ProgressPanel({ match, log, onEnd }: { match: MatchState; log: string[]; onEnd: () => void }) {
  const t = PLAYERS[match.turn];
  const need = biomeWinThreshold(match), living = livingBiomes(match).length;
  return (
    <div className="rounded-2xl border-2 border-ink bg-white/70 p-2.5 text-left flex flex-col gap-2.5" style={{ maxHeight: '74vh' }}>
      <div className="font-black text-sm">📊 Progress</div>

      {/* turn */}
      <div className="rounded-lg border-2 px-2 py-1.5 text-xs font-bold" style={{ borderColor: t.color, background: match.turn === 'p1' ? '#fdf0ea' : '#f3ecfa' }}>
        Turn <b>{match.turns}</b> · <span style={{ color: t.color }}>{t.dot} {t.name}</span> to move
      </div>

      {/* warming — vertical isotherm + explorers */}
      <ThermalScale warming={match.warming} />

      {/* victory goal */}
      <div className="rounded-lg bg-amber-50 border border-amber-300 px-2 py-1 text-[11px] font-bold text-amber-800 text-center">
        🎯 First to control <b>{need}</b> of {living} living biomes wins
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
        <div className="text-[10px] flex justify-between text-neutral-500 mt-0.5">
          <span>🧬 {match.collection.p1.length} species</span>
          <span>{match.collection.p2.length} species 🧬</span>
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
