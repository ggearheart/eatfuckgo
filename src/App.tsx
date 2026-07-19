/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattle } from './store';
import { BattleScreen } from './screens/BattleScreen';
import { MapScreen } from './screens/MapScreen';
import { EAT, FK, BOARDS } from './engine/data';
import { freshMatch, otherPlayer, heldBy, PLAYERS, MatchState, PlayerId } from './game/humboldt';

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
  const [pending, setPending] = useState<string | null>(null); // biome awaiting battle-type choice
  const [activeBiome, setActiveBiome] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // ── free-play skirmish (no map) ──
  function skirmish(bt?: 'eat' | 'fk') {
    const battleType = bt ?? (Math.random() < 0.5 ? 'eat' : 'fk');
    const terrain = TERRAINS[rand(TERRAINS.length)];
    const deck = battleType === 'eat' ? EAT : FK;
    setActiveBiome(null);
    dispatch({ t: 'new', battleType, terrain, atkIds: randStack(deck, 2 + rand(4)), defIds: randStack(deck, 2 + rand(4)) });
    setPhase('battle');
  }

  // ── Humboldt match ──
  function startMatch() { setMatch(freshMatch()); setResult(null); setPhase('map'); }
  function pickBiome(code: string) { setPending(code); }
  function chooseType(bt: 'eat' | 'fk') {
    const biome = pending!; setPending(null); setActiveBiome(biome);
    const deck = bt === 'eat' ? EAT : FK;
    dispatch({ t: 'new', battleType: bt, terrain: biome, atkIds: randStack(deck, 2 + rand(4)), defIds: randStack(deck, 2 + rand(4)) });
    setPhase('battle');
  }
  function claimAndReturn() {
    if (state?.winner && activeBiome) {
      const atk = match.turn, def = otherPlayer(match.turn);
      const owners = { ...match.owners };
      if (state.winner === 'atk') owners[activeBiome] = atk;
      else if (state.winner === 'def') owners[activeBiome] = def;
      setMatch({ owners, turn: otherPlayer(match.turn) });
    }
    setActiveBiome(null); setPhase('map');
  }
  function endMatch() {
    const p1 = heldBy(match, 'p1'), p2 = heldBy(match, 'p2');
    setResult(p1 === p2 ? `Dead heat — ${p1} biomes each.` : `${p1 > p2 ? PLAYERS.p1.name : PLAYERS.p2.name} leads, holding ${Math.max(p1, p2)} biomes to ${Math.min(p1, p2)}.`);
  }

  if (phase === 'battle' && state) {
    return (
      <BattleScreen state={state} dispatch={dispatch}
        mapMode={activeBiome != null}
        biomeName={activeBiome ? BOARDS[activeBiome].name : undefined}
        attackerName={activeBiome ? PLAYERS[match.turn].name : undefined}
        onClaim={activeBiome ? claimAndReturn : undefined}
        onExit={() => (activeBiome ? setPhase('map') : location.reload())}
        onNewRandom={() => skirmish(undefined)} />
    );
  }

  if (phase === 'map') {
    return (
      <>
        <MapScreen match={match} onPick={pickBiome} onEnd={endMatch} onHome={() => setPhase('home')} />
        <AnimatePresence>
          {pending && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPending(null)}>
              <motion.div className="bg-white rounded-2xl border-2 border-ink p-5 text-center max-w-sm w-full shadow-comic" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }}>
                <div className="font-black text-lg mb-1">{PLAYERS[match.turn].dot} {PLAYERS[match.turn].name} attacks {BOARDS[pending].icon} {BOARDS[pending].name}</div>
                <div className="text-xs text-neutral-500 mb-4">Choose how you'll fight for this niche.</div>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => chooseType('eat')} className="px-5 py-3 rounded-xl border-2 border-ink bg-eat text-white font-extrabold shadow-comic">🦷 EAT IT</button>
                  <button onClick={() => chooseType('fk')} className="px-5 py-3 rounded-xl border-2 border-ink bg-fk text-white font-extrabold shadow-comic">🧬 F*CK IT</button>
                </div>
                <button onClick={() => setPending(null)} className="mt-4 text-xs text-neutral-500 underline">cancel</button>
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

  // ── Home ──
  return (
    <div className="min-h-full flex flex-col items-center justify-center text-center p-6">
      <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-5xl sm:text-6xl tracking-tight">
        <span className="text-eat">EAT</span> <span className="text-fk">FUCK</span> <span className="text-ink">GO</span>
      </motion.h1>
      <p className="mt-3 max-w-md text-neutral-600 text-sm">
        A duel of evolutionary strategies across the biomes of a single mountain — after Humboldt's <i>Naturgemälde</i>. Contest niches, win clashes, and hold your ground as the climate shifts.
      </p>
      <button onClick={startMatch} className="mt-8 px-7 py-3.5 rounded-xl border-2 border-ink bg-ink text-white font-extrabold shadow-comic text-lg">🏔️ Start a match (claim biomes)</button>
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        <button onClick={() => skirmish('eat')} className="px-5 py-2.5 rounded-xl border-2 border-ink bg-eat text-white font-extrabold shadow-comic text-sm">🦷 EAT skirmish</button>
        <button onClick={() => skirmish('fk')} className="px-5 py-2.5 rounded-xl border-2 border-ink bg-fk text-white font-extrabold shadow-comic text-sm">🧬 F*CK skirmish</button>
        <button onClick={() => skirmish(undefined)} className="px-5 py-2.5 rounded-xl border-2 border-ink bg-white font-extrabold shadow-comic text-sm">🎲 Random</button>
      </div>
      <a href="/eatfuckgo/infographic/" target="_blank" rel="noopener" className="mt-7 inline-block px-5 py-2.5 rounded-xl border-2 border-ink bg-white font-extrabold text-sm shadow-comic">📖 How to play — the illustrated guide ↗</a>
      <a className="mt-6 text-xs text-neutral-500 underline" href="/eatfuckgo/legacy/index.html" target="_blank" rel="noopener">view the original prototype →</a>
    </div>
  );
}
