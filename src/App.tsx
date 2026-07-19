/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattle } from './store';
import { BattleScreen } from './screens/BattleScreen';
import { MapScreen } from './screens/MapScreen';
import { EAT, FK, BOARDS } from './engine/data';
import { freshMatch, otherPlayer, heldBy, biomesControlledBy, setPlayerNames, PLAYERS, MatchState } from './game/humboldt';
import { curBiome, hexesOfBiome, tickClock, STAGE_LABELS } from './game/board';
import { BiomeDossier } from './components/BiomeDossier';

const rand = (n: number) => Math.floor(Math.random() * n);
function randStack(deck: any[], n: number): string[] {
  const pool = [...deck]; const out: string[] = [];
  for (let k = 0; k < n && pool.length; k++) out.push(pool.splice(rand(pool.length), 1)[0].id);
  return out;
}
const TERRAINS = Object.keys(BOARDS);

type Phase = 'home' | 'map' | 'battle';

export default function App() {
  const [state, dispatch] = useBattle();
  const [phase, setPhase] = useState<Phase>('home');
  const [match, setMatch] = useState<MatchState>(freshMatch);
  const [pending, setPending] = useState<string | null>(null); // hex id awaiting battle-type choice
  const [activeHex, setActiveHex] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [warmingNote, setWarmingNote] = useState<string | null>(null);
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');

  // ── free-play skirmish (no map) ──
  function skirmish(bt?: 'eat' | 'fk') {
    const battleType = bt ?? (Math.random() < 0.5 ? 'eat' : 'fk');
    const terrain = TERRAINS[rand(TERRAINS.length)];
    const deck = battleType === 'eat' ? EAT : FK;
    setActiveHex(null);
    dispatch({ t: 'new', battleType, terrain, atkIds: randStack(deck, 2 + rand(4)), defIds: randStack(deck, 2 + rand(4)) });
    setPhase('battle');
  }

  // ── Humboldt match ──
  function startMatch() { setPlayerNames(p1Name, p2Name); setMatch(freshMatch()); setResult(null); setWarmingNote(null); setPhase('map'); }
  function pickBiome(id: string) { setWarmingNote(null); setPending(id); }
  function chooseType(bt: 'eat' | 'fk') {
    const hex = pending!; setPending(null); setActiveHex(hex);
    const deck = bt === 'eat' ? EAT : FK;
    dispatch({ t: 'new', battleType: bt, terrain: curBiome(match.states, hex), atkIds: randStack(deck, 2 + rand(4)), defIds: randStack(deck, 2 + rand(4)) });
    setPhase('battle');
  }
  function claimAndReturn() {
    const owners = { ...match.owners };
    if (state?.winner && activeHex) {
      const atk = match.turn, def = otherPlayer(match.turn);
      if (state.winner === 'atk') owners[activeHex] = atk;
      else if (state.winner === 'def') owners[activeHex] = def;
    }
    const tick = tickClock(match); // every turn advances the warming clock
    setMatch({ ...match, owners, states: tick.states, warming: tick.warming, turns: tick.turns, turn: otherPlayer(match.turn) });
    setWarmingNote(tick.changed.length
      ? `🔥 The planet warmed to ${STAGE_LABELS[tick.warming]} — ${tick.changed.length} hex${tick.changed.length > 1 ? 'es' : ''} transformed as habitats shifted.`
      : null);
    setActiveHex(null); setPhase('map');
  }
  function endMatch() {
    const p1 = biomesControlledBy(match, 'p1'), p2 = biomesControlledBy(match, 'p2');
    const h1 = heldBy(match, 'p1'), h2 = heldBy(match, 'p2');
    const lead = p1 === p2
      ? `Even at ${p1} biome${p1 === 1 ? '' : 's'} each — ${h1 > h2 ? PLAYERS.p1.name : h2 > h1 ? PLAYERS.p2.name : 'nobody'} leads on hexes (${h1}–${h2}).`
      : `${p1 > p2 ? PLAYERS.p1.name : PLAYERS.p2.name} leads, controlling ${Math.max(p1, p2)} full biome${Math.max(p1, p2) === 1 ? '' : 's'} to ${Math.min(p1, p2)}.`;
    setResult(`🌡️ The planet reached ${STAGE_LABELS[match.warming]}. ${lead}`);
  }

  if (phase === 'battle' && state) {
    return (
      <BattleScreen state={state} dispatch={dispatch}
        mapMode={activeHex != null}
        biomeName={activeHex ? BOARDS[curBiome(match.states, activeHex)].name : undefined}
        attackerName={activeHex ? PLAYERS[match.turn].name : undefined}
        defenderName={activeHex ? PLAYERS[otherPlayer(match.turn)].name : undefined}
        onClaim={activeHex ? claimAndReturn : undefined}
        onExit={() => (activeHex ? setPhase('map') : location.reload())}
        onNewRandom={() => skirmish(undefined)} />
    );
  }

  if (phase === 'map') {
    return (
      <>
        <MapScreen match={match} onPick={pickBiome} onEnd={endMatch} onHome={() => setPhase('home')} note={warmingNote} />
        <AnimatePresence>
          {pending && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPending(null)}>
              <motion.div className="bg-white rounded-2xl border-2 border-ink p-5 max-w-sm w-full shadow-comic max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }}>
                <div className="font-black text-sm mb-1 text-center" style={{ color: PLAYERS[match.turn].color }}>{PLAYERS[match.turn].dot} {PLAYERS[match.turn].name} contests this hex</div>
                {(() => {
                  const code = curBiome(match.states, pending); const hs = hexesOfBiome(code, match.states);
                  const mine = hs.filter((id) => match.owners[id] === match.turn).length;
                  return (
                    <div className="text-[11px] text-neutral-500 mb-2 text-center">
                      {BOARDS[code].icon} {BOARDS[code].name} · patch {hs.indexOf(pending) + 1} of {hs.length}
                      {hs.length > 1 && <> — you hold {mine}/{hs.length}. Take them all to control the biome 👑</>}
                    </div>
                  );
                })()}
                <BiomeDossier code={curBiome(match.states, pending)} />
                <div className="text-[11px] text-neutral-500 mt-3 mb-2 text-center">Choose how you'll fight for it — match your strategies to what the biome supplies.</div>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => chooseType('eat')} className="px-5 py-3 rounded-xl border-2 border-ink bg-eat text-white font-extrabold shadow-comic">🦷 EAT IT</button>
                  <button onClick={() => chooseType('fk')} className="px-5 py-3 rounded-xl border-2 border-ink bg-fk text-white font-extrabold shadow-comic">🧬 F*CK IT</button>
                </div>
                <button onClick={() => setPending(null)} className="mt-3 text-xs text-neutral-500 underline block mx-auto">cancel</button>
              </motion.div>
            </motion.div>
          )}
          {result && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div className="bg-white rounded-2xl border-2 border-ink p-6 text-center max-w-md w-full" initial={{ scale: 0.8, y: 24 }} animate={{ scale: 1, y: 0 }}>
                <div className="font-display text-2xl mb-1">🏁 Match tally</div>
                <div className="text-sm text-neutral-600 mb-4">{result}</div>
                <div className="flex gap-2 justify-center">
                  <button onClick={startMatch} className="px-4 py-2 rounded-lg border-2 border-ink bg-eat text-white font-extrabold">↺ New match</button>
                  <button onClick={() => { setResult(null); setPhase('home'); }} className="px-4 py-2 rounded-lg border-2 border-ink bg-white font-extrabold">⌂ Home</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── Lobby ──
  return (
    <div className="min-h-full flex flex-col items-center p-6 pb-12">
      <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 font-display text-5xl sm:text-6xl tracking-tight text-center">
        <span className="text-eat">EAT</span> <span className="text-fk">FUCK</span> <span className="text-ink">GO</span>
      </motion.h1>
      <p className="mt-3 max-w-md text-neutral-600 text-sm text-center">
        A duel of evolutionary strategies across the biomes of a single mountain — after Humboldt's <i>Naturgemälde</i>. Contest niches, win clashes, and hold your ground as the climate shifts.
      </p>

      {/* player setup */}
      <div className="mt-7 w-full max-w-md bg-white/70 rounded-2xl border-2 border-ink p-4 shadow-comic">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500 mb-2 text-center">Players</div>
        <div className="flex gap-3">
          <label className="flex-1">
            <span className="text-xs font-bold" style={{ color: PLAYERS.p1.color }}>🟧 Side 1</span>
            <input value={p1Name} onChange={(e) => setP1Name(e.target.value)} placeholder="Player 1" maxLength={16}
              className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-ink text-sm font-bold outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: PLAYERS.p1.color }} />
          </label>
          <label className="flex-1">
            <span className="text-xs font-bold" style={{ color: PLAYERS.p2.color }}>🟪 Side 2</span>
            <input value={p2Name} onChange={(e) => setP2Name(e.target.value)} placeholder="Player 2" maxLength={16}
              className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-ink text-sm font-bold outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: PLAYERS.p2.color }} />
          </label>
        </div>
      </div>

      {/* game modes */}
      <div className="mt-4 w-full max-w-md grid gap-3">
        <button onClick={startMatch} className="text-left rounded-2xl border-2 border-ink bg-ink text-white p-4 shadow-comic hover:translate-y-[-1px] transition-transform">
          <div className="font-extrabold text-lg">🎭 Pass &amp; Play</div>
          <div className="text-xs opacity-80">Two players, one device — take turns claiming biomes across the warming board.</div>
        </button>

        <button disabled className="text-left rounded-2xl border-2 border-dashed border-neutral-300 bg-white/60 text-neutral-500 p-4 cursor-not-allowed relative">
          <span className="absolute top-3 right-3 text-[9px] font-black uppercase bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">Coming soon</span>
          <div className="font-extrabold text-lg">🔗 Invite a friend</div>
          <div className="text-xs">Share a code or link to play someone remotely. Networking to come.</div>
        </button>

        <button disabled className="text-left rounded-2xl border-2 border-dashed border-neutral-300 bg-white/60 text-neutral-500 p-4 cursor-not-allowed relative">
          <span className="absolute top-3 right-3 text-[9px] font-black uppercase bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">Coming soon</span>
          <div className="font-extrabold text-lg">🤖 Vs Computer</div>
          <div className="text-xs">Face an AI ecologist. Reserved until the core mechanics settle.</div>
        </button>
      </div>

      {/* quick skirmish */}
      <div className="mt-6 w-full max-w-md text-center">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500 mb-2">Quick skirmish — a single clash, no board</div>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={() => skirmish('eat')} className="px-4 py-2 rounded-xl border-2 border-ink bg-eat text-white font-extrabold shadow-comic text-sm">🦷 EAT</button>
          <button onClick={() => skirmish('fk')} className="px-4 py-2 rounded-xl border-2 border-ink bg-fk text-white font-extrabold shadow-comic text-sm">🧬 F*CK</button>
          <button onClick={() => skirmish(undefined)} className="px-4 py-2 rounded-xl border-2 border-ink bg-white font-extrabold shadow-comic text-sm">🎲 Random</button>
        </div>
      </div>

      <a href="/eatfuckgo/infographic/" target="_blank" rel="noopener" className="mt-7 inline-block px-5 py-2.5 rounded-xl border-2 border-ink bg-white font-extrabold text-sm shadow-comic">📖 How to play — the illustrated guide ↗</a>
      <a className="mt-5 text-xs text-neutral-500 underline" href="/eatfuckgo/legacy/index.html" target="_blank" rel="noopener">view the original prototype →</a>
    </div>
  );
}
