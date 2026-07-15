/* eslint-disable @typescript-eslint/no-explicit-any */
import { useBattle } from './store';
import { BattleScreen } from './screens/BattleScreen';
import { EAT, FK, BOARDS } from './engine/data';
import { motion } from 'framer-motion';

const TERRAINS = Object.keys(BOARDS);
const rand = (n: number) => Math.floor(Math.random() * n);
function randStack(deck: any[], n: number): string[] {
  const pool = [...deck]; const out: string[] = [];
  for (let k = 0; k < n && pool.length; k++) out.push(pool.splice(rand(pool.length), 1)[0].id);
  return out;
}

export default function App() {
  const [state, dispatch] = useBattle();

  function start(bt?: 'eat' | 'fk') {
    const battleType = bt ?? (Math.random() < 0.5 ? 'eat' : 'fk');
    const terrain = TERRAINS[rand(TERRAINS.length)];
    const deck = battleType === 'eat' ? EAT : FK;
    dispatch({ t: 'new', battleType, terrain, atkIds: randStack(deck, 2 + rand(4)), defIds: randStack(deck, 2 + rand(4)) });
  }

  if (state) return <BattleScreen state={state} dispatch={dispatch} onNewRandom={() => start(undefined)} onExit={() => location.reload()} />;

  return (
    <div className="min-h-full flex flex-col items-center justify-center text-center p-6">
      <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="font-display text-5xl sm:text-6xl tracking-tight">
        <span className="text-eat">EAT</span> <span className="text-fk">FUCK</span> <span className="text-ink">GO</span>
      </motion.h1>
      <p className="mt-3 max-w-md text-neutral-600 text-sm">
        A duel of evolutionary strategies. The terrain sets the stage, a scenario is rolled each round,
        and the strategy best suited to the moment wins the dice.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <button onClick={() => start('eat')} className="px-6 py-3 rounded-xl border-2 border-ink bg-eat text-white font-extrabold shadow-comic">🦷 EAT IT skirmish</button>
        <button onClick={() => start('fk')} className="px-6 py-3 rounded-xl border-2 border-ink bg-fk text-white font-extrabold shadow-comic">🧬 F*CK IT skirmish</button>
        <button onClick={() => start(undefined)} className="px-6 py-3 rounded-xl border-2 border-ink bg-white font-extrabold shadow-comic">🎲 Random</button>
      </div>
      <a href="/eatfuckgo/infographic/" className="mt-7 inline-block px-5 py-2.5 rounded-xl border-2 border-ink bg-white font-extrabold text-sm shadow-comic">📖 How to play — the illustrated guide</a>
      <a className="mt-6 text-xs text-neutral-500 underline" href="/eatfuckgo/legacy/index.html">view the original prototype →</a>
    </div>
  );
}
