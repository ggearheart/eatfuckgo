/* eslint-disable @typescript-eslint/no-explicit-any */
// Pre-clash setup: attacker picks EAT/F*CK mode → the game maps their strategies
// to the species that carry them in this biome → attacker names a DOMINANT
// species. Then the defender sees it and either concedes or names their own
// dominant species. The result launches the clash (each dominant species bonused).
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BOARDS, BIOME_AFFINITY } from '../engine/data';
import { curBiome } from '../game/board';
import { PLAYERS, FACTION, Faction, PlayerId, MatchState } from '../game/humboldt';
import { speciesInBiome, speciesCat, stratName, SPECIES_BY_ID, Species } from '../game/species';
import { aiChooseContest } from '../game/ai';

export interface ContestResult {
  atkMode: Faction; atkIds: string[]; atkLead: string; atkSpecies: string;
  defMode: Faction; defIds: string[]; defLead: string; defSpecies: string;
}

type Step = 'atkMode' | 'atkPick' | 'handoff' | 'defView' | 'defPick';

const rosterFor = (biome: string, mode: Faction) => speciesInBiome(biome).filter((s) => speciesCat(s) === mode);
const stratsOf = (list: Species[]) => Array.from(new Set(list.map((s) => s.strategy)));

function SpeciesGrid({ list, chosen, onPick, color, fatigue }: { list: Species[]; chosen: string | null; onPick: (id: string) => void; color: string; fatigue: (sp: Species) => number }) {
  return (
    <div className="grid grid-cols-2 gap-2 my-3">
      {list.map((sp) => {
        const on = chosen === sp.id;
        const fat = fatigue(sp); // Red Queen adaptation on this strategy
        const bonus = 2 - fat;
        return (
          <button key={sp.id} onClick={() => onPick(sp.id)}
            className="flex items-center gap-2 p-2 rounded-xl border-2 text-left transition-transform hover:-translate-y-0.5"
            style={on ? { borderColor: color, background: '#fffdf5', boxShadow: `0 0 0 2px ${color}` } : { borderColor: '#e2d8c6', background: '#fff' }}>
            <span className="text-2xl">{sp.emoji}</span>
            <span className="leading-tight min-w-0">
              <span className="block text-xs font-black truncate">{sp.name}{on ? ' 👑' : ''}</span>
              <span className="block text-[10px] text-neutral-500 truncate">{stratName(sp.strategy)}</span>
              <span className="block text-[9px] font-bold" style={{ color: bonus > 0 ? '#2a7a3a' : bonus === 0 ? '#a06a10' : '#c02018' }}>
                {fat ? `adapted ×${fat} · champ ${bonus >= 0 ? '+' : ''}${bonus}` : 'fresh · champ +2'}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ContestSetup({ match, hex, vsAI, aiAttack, onAttack, onLaunch, onConcede, onCancel }: {
  match: MatchState; hex: string; vsAI?: boolean; aiAttack?: { mode: Faction; species: string };
  onAttack?: (mode: Faction, species: string) => void; onLaunch: (r: ContestResult) => void; onConcede: () => void; onCancel: () => void;
}) {
  const biome = curBiome(match.states, hex);
  const b = BOARDS[biome];
  const atk = match.turn, def = (match.owners[hex] ?? match.players.find((p) => p !== atk)!) as PlayerId; // defender = the hex's owner
  const aff = BIOME_AFFINITY[biome];

  // a player can only field species whose strategy is in their collection
  const atkOwned = new Set(match.collection[atk]);
  const defOwned = new Set(match.collection[def]);
  const modeAvail = (o: Set<string>, mode: Faction) => rosterFor(biome, mode).some((s) => o.has(s.id));
  const firstMode = (o: Set<string>, team: Faction): Faction => {
    const other = team === 'eat' ? 'fk' : 'eat';
    return modeAvail(o, team) ? team : modeAvail(o, other) ? other : team;
  };

  // defend-vs-AI: the computer has already committed its attack; jump straight to the defender's view
  const [step, setStep] = useState<Step>(aiAttack ? 'defView' : 'atkMode');
  const [atkMode, setAtkMode] = useState<Faction>(() => (aiAttack ? aiAttack.mode : firstMode(atkOwned, PLAYERS[atk].fac)));
  const [atkSpecies, setAtkSpecies] = useState<string | null>(aiAttack ? aiAttack.species : null);
  const [defMode, setDefMode] = useState<Faction>(() => firstMode(defOwned, PLAYERS[def].fac));
  const [defSpecies, setDefSpecies] = useState<string | null>(null);
  const pickAtkMode = (f: Faction) => { setAtkMode(f); setAtkSpecies(null); };
  const pickDefMode = (f: Faction) => { setDefMode(f); setDefSpecies(null); };

  const atkRoster = rosterFor(biome, atkMode).filter((s) => atkOwned.has(s.id));
  const defRoster = rosterFor(biome, defMode).filter((s) => defOwned.has(s.id));
  const spById = (id: string | null) => (id ? speciesInBiome(biome).find((s) => s.id === id) : null);

  const affTag = (
    <span className="text-[11px] text-neutral-500">this biome favors {FACTION[aff].icon} <b>{FACTION[aff].name}</b> (+1 die)</span>
  );
  const modeButtons = (val: Faction, set: (f: Faction) => void, team: Faction, o: Set<string>) => (
    <div className="flex gap-2 justify-center my-2">
      {(['eat', 'fk'] as Faction[]).map((f) => {
        const avail = modeAvail(o, f);
        return (
          <button key={f} disabled={!avail} onClick={() => set(f)}
            title={avail ? '' : 'no species of this mode in your collection here'}
            className="px-4 py-2 rounded-xl border-2 font-extrabold text-sm disabled:cursor-not-allowed"
            style={val === f
              ? { borderColor: '#1a0e04', background: f === 'eat' ? '#c4561e' : '#7b4fa0', color: '#fff' }
              : { borderColor: '#d4d4d4', color: '#888', background: '#fff', opacity: avail ? 1 : 0.35 }}>
            {FACTION[f].icon} {FACTION[f].name}{f === team ? ' ★' : ''}
          </button>
        );
      })}
    </div>
  );

  function launch() {
    const aSp = spById(atkSpecies)!, dSp = spById(defSpecies)!;
    onLaunch({
      atkMode, atkIds: stratsOf(atkRoster), atkLead: aSp.strategy, atkSpecies: aSp.id,
      defMode, defIds: stratsOf(defRoster), defLead: dSp.strategy, defSpecies: dSp.id,
    });
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
      <motion.div className="bg-white rounded-2xl border-2 border-ink p-5 max-w-md w-full shadow-comic max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }}>
        <div className="text-center font-black text-sm">{b.icon} {b.name} — {affTag}</div>

        <AnimatePresence mode="wait">
          {/* ── attacker: pick mode ── */}
          {step === 'atkMode' && (
            <motion.div key="am" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center text-sm font-bold mt-2" style={{ color: PLAYERS[atk].color }}>{PLAYERS[atk].dot} {PLAYERS[atk].name} — how will you fight this biome?</div>
              {modeButtons(atkMode, pickAtkMode, PLAYERS[atk].fac, atkOwned)}
              <div className="text-[11px] text-neutral-500 text-center">★ = your team · greyed = no species in your collection here.</div>
              <button disabled={atkRoster.length === 0} onClick={() => setStep('atkPick')} className="mt-3 w-full py-2.5 rounded-xl border-2 border-ink bg-ink text-white font-extrabold disabled:opacity-40">
                {atkRoster.length ? `Field your ${FACTION[atkMode].name} species →` : 'No species in your collection for this biome'}
              </button>
              <button onClick={onCancel} className="mt-2 text-xs text-neutral-500 underline block mx-auto">cancel</button>
            </motion.div>
          )}

          {/* ── attacker: pick dominant species ── */}
          {step === 'atkPick' && (
            <motion.div key="ap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center text-xs font-bold mt-2">{FACTION[atkMode].icon} Your {FACTION[atkMode].name} species in {b.name} — name your <b>dominant species</b> to lead the clash:</div>
              <SpeciesGrid list={atkRoster} chosen={atkSpecies} onPick={setAtkSpecies} color={PLAYERS[atk].color} fatigue={(sp) => match.adapt[atk][sp.strategy] ?? 0} />
              <div className="flex gap-2">
                <button onClick={() => setStep('atkMode')} className="px-3 py-2 rounded-lg border-2 border-ink bg-white text-xs font-bold">← mode</button>
                <button disabled={!atkSpecies} onClick={() => {
                  if (!vsAI) { setStep('handoff'); return; }
                  // human attacks the computer → AI picks its defence, then we play the clash live
                  const defC = aiChooseContest(match, def, biome);
                  if (!defC) { onAttack!(atkMode, atkSpecies!); return; } // AI can't field a defence → straight claim
                  const dRoster = rosterFor(biome, defC.mode).filter((s) => defOwned.has(s.id));
                  onLaunch({
                    atkMode, atkIds: stratsOf(atkRoster), atkLead: spById(atkSpecies)!.strategy, atkSpecies: atkSpecies!,
                    defMode: defC.mode, defIds: stratsOf(dRoster), defLead: SPECIES_BY_ID[defC.species].strategy, defSpecies: defC.species,
                  });
                }}
                  className="flex-1 py-2.5 rounded-xl border-2 border-ink text-white font-extrabold disabled:opacity-40"
                  style={{ background: PLAYERS[atk].color }}>{vsAI ? '⚔️ Attack' : 'Lock in'} {spById(atkSpecies)?.emoji ?? ''}{vsAI ? '' : ' →'}</button>
              </div>
            </motion.div>
          )}

          {/* ── handoff (hotseat privacy) ── */}
          {step === 'handoff' && (
            <motion.div key="ho" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6">
              <div className="text-4xl mb-2">🤝</div>
              <div className="font-black">Pass the device to {PLAYERS[def].dot} {PLAYERS[def].name}</div>
              <div className="text-[11px] text-neutral-500 mt-1">They'll see the attacker's dominant species and decide.</div>
              <button onClick={() => setStep('defView')} className="mt-4 px-5 py-2.5 rounded-xl border-2 border-ink font-extrabold text-white" style={{ background: PLAYERS[def].color }}>I'm {PLAYERS[def].name} — reveal →</button>
            </motion.div>
          )}

          {/* ── defender: sees attacker's pick + roster ── */}
          {step === 'defView' && (
            <motion.div key="dv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mt-2 rounded-xl border-2 px-3 py-2 text-center" style={{ borderColor: PLAYERS[atk].color, background: atkMode === 'eat' ? '#fdf0ea' : '#f3ecfa' }}>
                <div className="text-[11px] font-bold" style={{ color: PLAYERS[atk].color }}>{PLAYERS[atk].name} attacks as {FACTION[atkMode].icon} {FACTION[atkMode].name}, led by</div>
                <div className="text-lg font-black">{spById(atkSpecies)?.emoji} {spById(atkSpecies)?.name}</div>
                <div className="text-[10px] text-neutral-500">fielding: {atkRoster.map((s) => s.emoji).join(' ')}</div>
              </div>
              <div className="text-center text-sm font-bold mt-3" style={{ color: PLAYERS[def].color }}>{PLAYERS[def].dot} {PLAYERS[def].name} — answer or concede?</div>
              {modeButtons(defMode, pickDefMode, PLAYERS[def].fac, defOwned)}
              <div className="flex gap-2 mt-1">
                <button onClick={onConcede} className="px-3 py-2.5 rounded-xl border-2 border-ink bg-white text-xs font-extrabold text-neutral-600">🏳️ Concede hex</button>
                <button onClick={() => setStep('defPick')} className="flex-1 py-2.5 rounded-xl border-2 border-ink text-white font-extrabold" style={{ background: PLAYERS[def].color }}>Field {FACTION[defMode].name} species →</button>
              </div>
            </motion.div>
          )}

          {/* ── defender: pick dominant species ── */}
          {step === 'defPick' && (
            <motion.div key="dp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center text-xs font-bold mt-2">{FACTION[defMode].icon} Your {FACTION[defMode].name} species — name your <b>dominant species</b> to face {spById(atkSpecies)?.emoji}:</div>
              <SpeciesGrid list={defRoster} chosen={defSpecies} onPick={setDefSpecies} color={PLAYERS[def].color} fatigue={(sp) => match.adapt[def][sp.strategy] ?? 0} />
              <div className="flex gap-2">
                <button onClick={() => setStep('defView')} className="px-3 py-2 rounded-lg border-2 border-ink bg-white text-xs font-bold">←</button>
                <button onClick={onConcede} className="px-3 py-2 rounded-lg border-2 border-ink bg-white text-xs font-bold text-neutral-600">🏳️ Concede</button>
                <button disabled={!defSpecies} onClick={launch}
                  className="flex-1 py-2.5 rounded-xl border-2 border-ink text-white font-extrabold disabled:opacity-40"
                  style={{ background: PLAYERS[def].color }}>⚔️ Clash!</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
