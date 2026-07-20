/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattle } from './store';
import { autoResolve } from './engine/engine';
import { aiMapMove, aiChooseContest } from './game/ai';
import { BattleScreen } from './screens/BattleScreen';
import { MapScreen } from './screens/MapScreen';
import { EAT, FK, BOARDS } from './engine/data';
import { freshMatch, nextPlayer, heldBy, biomesControlledBy, matchWinner, pluralityWinner, biomeWinThreshold, livingBiomes, setPlayerNames, setPlayerFactions, setPlayerEmblems, FACTION, PLAYERS, ALL_PLAYERS, ALL_BIOMES, ADAPT_CAP, MatchState, Faction, BurstKind, PlayerId } from './game/humboldt';
import { BurstBadge, BURST_META } from './components/LegionBurst';
import { curBiome, hexesOfBiome, tickWarming, degLabel, MAX_C } from './game/board';
import { speciesInBiome, speciesCat, recruitOptions, SPECIES_BY_ID } from './game/species';
import { ContestSetup, ContestResult } from './components/ContestSetup';
import { MusterScreen } from './components/MusterScreen';
import { MusterGuide, MusterGuidePage } from './components/MusterGuide';
import { HandPanel } from './components/HandPanel';

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
  const [pending, setPending] = useState<string | null>(null); // hex id awaiting clash setup
  const [mustering, setMustering] = useState<string | null>(null); // hex id awaiting recruit choice
  const [activeHex, setActiveHex] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [warmingNote, setWarmingNote] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState<string[]>(['', '', '', '']);
  const [facs, setFacs] = useState<Faction[]>(['eat', 'fk', 'eat', 'fk']);
  const [emblems, setEmblems] = useState<BurstKind[]>(['chrysanthemum', 'peony', 'kamuro', 'willow']);
  const [ai, setAi] = useState<boolean[]>([false, false, false, false]); // which lobby seats are computer
  const [aiPlayers, setAiPlayers] = useState<Set<PlayerId>>(new Set());
  const [log, setLog] = useState<string[]>([]);
  const [reach, setReach] = useState<number | null>(null); // this turn's 1d6 movement roll
  const [showGuide, setShowGuide] = useState(false);
  const [showHands, setShowHands] = useState(false);
  const hasAI = aiPlayers.size > 0;

  const deckOf = (f: Faction) => (f === 'eat' ? EAT : FK);

  // ── free-play skirmish (no map): a true EAT vs F*CK duel ──
  function skirmish(bt?: 'eat' | 'fk') {
    const atk = bt ?? (Math.random() < 0.5 ? 'eat' : 'fk');
    const def: Faction = atk === 'eat' ? 'fk' : 'eat';
    const terrain = TERRAINS[rand(TERRAINS.length)];
    setActiveHex(null);
    dispatch({ t: 'new', setup: { fac: { atk, def }, terrain, atkIds: randStack(deckOf(atk), 2 + rand(4)), defIds: randStack(deckOf(def), 2 + rand(4)) } });
    setPhase('battle');
  }

  // ── Humboldt match ──
  function startMatch() {
    const players = ALL_PLAYERS.slice(0, playerCount);
    setPlayerNames(names); setPlayerFactions(facs); setPlayerEmblems(emblems);
    setAiPlayers(new Set(players.filter((_, i) => ai[i])));
    setMatch(freshMatch(players)); setResult(null); setWarmingNote(null); setReach(null); setMustering(null); setPending(null);
    setLog([`🌱 ${players.map((p, i) => `${PLAYERS[p].dot} ${PLAYERS[p].name}${ai[i] ? ' 🤖' : ''}`).join(' · ')} — the mountain awaits.`]);
    setPhase('map');
  }
  // Titan-style: a neutral hex is mustered (free claim, no clash); a rival's hex is a clash.
  function pickBiome(id: string) {
    setWarmingNote(null);
    if (match.owners[id] == null) muster(id);
    else setPending(id);
  }
  function muster(id: string) {
    // human gets the interactive recruit screen; the AI auto-recruits
    if (aiPlayers.has(match.turn)) doMuster(id, aiRecruit(match.turn, curBiome(match.states, id)));
    else setMustering(id);
  }
  function aiRecruit(player: PlayerId, biome: string): string | null {
    const opts = recruitOptions(match.collection[player], biome, PLAYERS[player].fac).filter((o) => o.unlocked && !o.owned);
    return opts.length ? opts.sort((a, b) => b.tier - a.tier)[0].species.id : null; // grab the best unlocked recruit
  }
  function doMuster(id: string, recruitId: string | null) {
    const owners = { ...match.owners }; owners[id] = match.turn;
    const biome = curBiome(match.states, id);
    const sp = recruitId ? SPECIES_BY_ID[recruitId] : null;
    const entries = [`🌱 ${PLAYERS[match.turn].name} settled ${BOARDS[biome].name}${sp ? ` and recruited ${sp.emoji} ${sp.name}` : ''}.`];
    finishTurn(owners, entries, false, recruitId ? { player: match.turn, species: [recruitId] } : undefined);
  }
  function rollMove() { setReach(1 + Math.floor(Math.random() * 6)); }
  function passTurn() { finishTurn({ ...match.owners }, [`⤳ ${PLAYERS[match.turn].name} has no move — passes.`], false); }
  // finish a turn: warming (per claim), migration, grow/prune collections, adaptation, victory, log
  function finishTurn(owners: Record<string, any>, entries: string[], claimed: boolean, grant?: { player: PlayerId; species: string[] }, combat?: { atkStrat: string | null; defStrat: string | null; defender: PlayerId }) {
    const tick = tickWarming(match, claimed);
    const displaced = tick.changed.filter((c) => owners[c.id]).length;
    tick.changed.forEach((c) => { if (owners[c.id]) owners[c.id] = null; }); // migration teeth
    if (tick.changed.length) entries.push(`🔥 ${degLabel(tick.warming)}: ${tick.changed.length} hex${tick.changed.length > 1 ? 'es' : ''} transformed${displaced ? `, displacing ${displaced} population${displaced > 1 ? 's' : ''}` : ''}.`);
    // collections: settling adds a biome's species; a clash win absorbs the defeated one
    const collection = {} as Record<PlayerId, string[]>;
    match.players.forEach((p) => { collection[p] = [...match.collection[p]]; });
    if (grant) grant.species.forEach((id) => { if (id && !collection[grant.player].includes(id)) collection[grant.player].push(id); });
    const extinct = ALL_BIOMES.filter((c) => hexesOfBiome(c, match.states).length > 0 && hexesOfBiome(c, tick.states).length === 0);
    if (extinct.length) {
      const dead = new Set(extinct.flatMap((c) => speciesInBiome(c).map((s) => s.id)));
      match.players.forEach((p) => { collection[p] = collection[p].filter((id) => !dead.has(id)); });
      entries.push(`🦴 ${extinct.map((c) => BOARDS[c].name).join(', ')} vanished — ${dead.size} species went extinct.`);
    }
    // Red Queen adaptation
    const adapt = {} as Record<PlayerId, Record<string, number>>;
    match.players.forEach((p) => { adapt[p] = { ...match.adapt[p] }; });
    const atkP = match.turn;
    Object.keys(adapt[atkP]).forEach((sid) => { if (sid !== combat?.atkStrat) adapt[atkP][sid] = Math.max(0, adapt[atkP][sid] - 1); });
    if (combat?.atkStrat) adapt[atkP][combat.atkStrat] = Math.min(ADAPT_CAP, (adapt[atkP][combat.atkStrat] || 0) + 1);
    if (combat?.defStrat && combat.defender) adapt[combat.defender][combat.defStrat] = Math.min(ADAPT_CAP, (adapt[combat.defender][combat.defStrat] || 0) + 1);
    const next = { ...match, owners, states: tick.states, warming: tick.warming, turns: match.turns + 1, claims: tick.claims, turn: nextPlayer(match.players, match.turn), collection, adapt };
    setMatch(next);
    setReach(null);
    setWarmingNote(tick.changed.length
      ? `🔥 The planet warmed to ${degLabel(tick.warming)} — ${tick.changed.length} hex${tick.changed.length > 1 ? 'es' : ''} transformed${displaced ? `, displacing ${displaced} population${displaced > 1 ? 's' : ''} (now neutral)` : ''}.`
      : null);
    // victory: early majority instant win, else plurality once the planet maxes out
    const won = matchWinner(next);
    if (won) {
      const n = biomesControlledBy(next, won);
      entries.push(`🏆 ${PLAYERS[won].name} controls a majority (${n} biomes) — victory!`);
      setResult(`🏆 ${PLAYERS[won].name} wins — a majority of the ${livingBiomes(next).length} living biomes (${n}).`);
    } else if (next.warming >= MAX_C) {
      const w = pluralityWinner(next), n = biomesControlledBy(next, w);
      entries.push(`🏆 Planet maxed at ${degLabel(next.warming)} — ${PLAYERS[w].name} leads with ${n} biome${n === 1 ? '' : 's'}!`);
      setResult(`🏆 The planet reached ${degLabel(next.warming)}. ${PLAYERS[w].name} wins with the most biomes (${n}).`);
    }
    if (entries.length) setLog((l) => [...l, ...entries]);
  }

  function launchContest(r: ContestResult) {
    const hex = pending!; setPending(null); setActiveHex(hex);
    const atk = match.turn, def = match.owners[hex] as PlayerId;
    dispatch({ t: 'new', setup: {
      fac: { atk: r.atkMode, def: r.defMode }, terrain: curBiome(match.states, hex),
      atkIds: r.atkIds, defIds: r.defIds,
      lead: { atk: r.atkLead, def: r.defLead }, species: { atk: r.atkSpecies, def: r.defSpecies },
      adapt: { atk: match.adapt[atk][r.atkLead] ?? 0, def: match.adapt[def][r.defLead] ?? 0 },
    } });
    setPhase('battle');
  }
  function concedeContest() {
    const hex = pending!; setPending(null);
    const owner = match.owners[hex] as PlayerId;
    const owners = { ...match.owners }; owners[hex] = match.turn;
    const biome = curBiome(match.states, hex);
    const settled = speciesInBiome(biome).filter((s) => speciesCat(s) === PLAYERS[match.turn].fac).map((s) => s.id);
    finishTurn(owners, [`🏳️ ${PLAYERS[owner].name} conceded ${BOARDS[biome].name} to ${PLAYERS[match.turn].name}.`], true, { player: match.turn, species: settled });
    setPhase('map');
  }
  function claimAndReturn() {
    const owners = { ...match.owners };
    const atk = match.turn;
    const def = (activeHex ? match.owners[activeHex] : match.players.find((p) => p !== atk)) as PlayerId;
    const atkName = PLAYERS[atk].name, defName = PLAYERS[def].name;
    const biomeNm = activeHex ? BOARDS[curBiome(match.states, activeHex)].name : 'the field';
    const entries: string[] = [];
    let grant: { player: PlayerId; species: string[] } | undefined;
    const absorb = (p: PlayerId, sp: string | null) => { if (sp) { grant = { player: p, species: [sp] }; entries.push(`🧬 ${PLAYERS[p].name} absorbed ${SPECIES_BY_ID[sp]?.emoji} ${SPECIES_BY_ID[sp]?.name}.`); } };
    if (state?.winner && activeHex) {
      if (state.winner === 'atk') { owners[activeHex] = atk; entries.push(`⚔️ ${atkName} won ${biomeNm}.`); absorb(atk, state.species.def); }
      else if (state.winner === 'def') { owners[activeHex] = def; entries.push(`🛡️ ${defName} held ${biomeNm}.`); absorb(def, state.species.atk); }
      else entries.push(`🤝 Stalemate at ${biomeNm}.`);
    }
    finishTurn(owners, entries, state?.winner === 'atk', grant, { atkStrat: state?.lead.atk ?? null, defStrat: state?.lead.def ?? null, defender: def });
    setActiveHex(null); setPhase('map');
  }
  function endMatch() {
    const w = pluralityWinner(match), n = biomesControlledBy(match, w);
    setResult(`🌡️ Called at ${degLabel(match.warming)}. ${PLAYERS[w].name} leads with ${n} biome${n === 1 ? '' : 's'} (${heldBy(match, w)} hexes).`);
  }

  // ── computer opponent & headless clash resolution (AI games) ──
  const rosterIds = (player: PlayerId, biome: string, mode: Faction) => Array.from(new Set(
    speciesInBiome(biome).filter((s) => speciesCat(s) === mode && match.collection[player].includes(s.id)).map((s) => s.strategy)));
  function resolveContest(hex: string, atkP: PlayerId, atkC: { mode: Faction; species: string } | null, defP: PlayerId, defC: { mode: Faction; species: string } | null) {
    const biome = curBiome(match.states, hex);
    const owners = { ...match.owners };
    const stratOf = (id: string) => SPECIES_BY_ID[id].strategy;
    let winner: 'atk' | 'def' | 'draw';
    if (!atkC) winner = 'def';
    else if (!defC) winner = 'atk';
    else winner = autoResolve({
      fac: { atk: atkC.mode, def: defC.mode }, terrain: biome,
      atkIds: rosterIds(atkP, biome, atkC.mode), defIds: rosterIds(defP, biome, defC.mode),
      lead: { atk: stratOf(atkC.species), def: stratOf(defC.species) },
      species: { atk: atkC.species, def: defC.species },
      adapt: { atk: match.adapt[atkP][stratOf(atkC.species)] ?? 0, def: match.adapt[defP][stratOf(defC.species)] ?? 0 },
    });
    const A = PLAYERS[atkP].name, D = PLAYERS[defP].name, B = BOARDS[biome].name;
    const entries: string[] = []; let grant: { player: PlayerId; species: string[] } | undefined;
    if (winner === 'atk') { owners[hex] = atkP; entries.push(`⚔️ ${A} took ${B} from ${D}.`); if (defC) grant = { player: atkP, species: [defC.species] }; }
    else if (winner === 'def') { entries.push(`🛡️ ${D} held ${B} vs ${A}.`); if (atkC) grant = { player: defP, species: [atkC.species] }; }
    else entries.push(`🤝 Stalemate at ${B}.`);
    finishTurn(owners, entries, winner === 'atk', grant, { atkStrat: atkC ? stratOf(atkC.species) : null, defStrat: defC ? stratOf(defC.species) : null, defender: defP });
  }
  function humanAttack(mode: Faction, species: string) {
    const hex = pending!; setPending(null);
    const defP = match.owners[hex] as PlayerId;
    resolveContest(hex, match.turn, { mode, species }, defP, aiChooseContest(match, defP, curBiome(match.states, hex)));
  }
  function aiClash(hex: string) {
    const defP = match.owners[hex] as PlayerId, biome = curBiome(match.states, hex);
    resolveContest(hex, match.turn, aiChooseContest(match, match.turn, biome), defP, aiChooseContest(match, defP, biome));
  }
  // the computer takes its map turn
  useEffect(() => {
    if (phase !== 'map' || result || pending || mustering || !aiPlayers.has(match.turn)) return;
    const id = setTimeout(() => {
      if (reach == null) { rollMove(); return; }
      const mv = aiMapMove(match, match.turn, reach);
      if (mv.type === 'muster' && mv.hexId) muster(mv.hexId);
      else if (mv.type === 'clash' && mv.hexId) aiClash(mv.hexId);
      else passTurn();
    }, 650);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, match, reach, pending, mustering, result, aiPlayers]);

  // standalone reference tab (pinned via the #guide hash)
  if (typeof location !== 'undefined' && location.hash === '#guide') return <MusterGuidePage />;

  if (phase === 'battle' && state) {
    return (
      <BattleScreen state={state} dispatch={dispatch}
        mapMode={activeHex != null}
        biomeName={activeHex ? BOARDS[curBiome(match.states, activeHex)].name : undefined}
        attackerName={activeHex ? PLAYERS[match.turn].name : undefined}
        defenderName={activeHex && match.owners[activeHex] ? PLAYERS[match.owners[activeHex]!].name : undefined}
        onClaim={activeHex ? claimAndReturn : undefined}
        onExit={() => (activeHex ? setPhase('map') : location.reload())}
        onNewRandom={() => skirmish(undefined)} />
    );
  }

  if (phase === 'map') {
    return (
      <>
        <MapScreen match={match} onPick={pickBiome} onEnd={endMatch} onHome={() => setPhase('home')} note={warmingNote} log={log} reach={reach} onRoll={rollMove} onPass={passTurn} />
        {/* floating utilities: your hand + the recruit-ladder reference */}
        <div className="fixed bottom-3 right-3 z-40 flex flex-col items-end gap-2">
          <button onClick={() => setShowHands(true)} title="Your species, strategies & weirdos"
            className="px-3 py-2 rounded-full border-2 border-ink font-extrabold text-xs shadow-comic text-white"
            style={{ background: PLAYERS[match.turn].color }}>🎴 {PLAYERS[match.turn].name}'s hand</button>
          <button onClick={() => setShowGuide(true)} title="Recruit ladders by biome"
            className="px-3 py-2 rounded-full border-2 border-ink bg-white font-extrabold text-xs shadow-comic">📖 Muster guide</button>
        </div>
        <AnimatePresence>
          {showHands && <HandPanel match={match} viewer={match.turn} onClose={() => setShowHands(false)} />}
          {showGuide && <MusterGuide onClose={() => setShowGuide(false)} />}
          {mustering && (
            <MusterScreen match={match} hex={mustering} player={match.turn}
              onRecruit={(sp) => { const h = mustering; setMustering(null); doMuster(h, sp); }}
              onCancel={() => setMustering(null)} />
          )}
          {pending && (
            <ContestSetup match={match} hex={pending} vsAI={hasAI} onAttack={humanAttack}
              onLaunch={launchContest} onConcede={concedeContest} onCancel={() => setPending(null)} />
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

      {/* founders — portraits of Humboldt & Bonpland (public domain) */}
      <div className="mt-6 flex flex-col items-center">
        <div className="flex items-end justify-center gap-5">
          {[
            { img: 'humboldt', name: 'Alexander von Humboldt', pos: 'center 14%' },
            { img: 'bonpland', name: 'Aimé Bonpland', pos: 'center 22%' },
          ].map((p) => (
            <figure key={p.img} className="text-center">
              <img src={`${import.meta.env.BASE_URL}img/portraits/${p.img}.jpg`} alt={p.name} loading="lazy"
                className="w-24 h-28 object-cover rounded-lg border-2 border-ink shadow-comic" style={{ objectPosition: p.pos, filter: 'sepia(0.22)' }} />
              <figcaption className="text-[10px] font-bold mt-1 leading-tight max-w-[6rem]">{p.name}</figcaption>
            </figure>
          ))}
        </div>
        <div className="text-[10px] text-neutral-500 italic mt-1.5">in the spirit of the 1799–1804 American expedition · portraits public domain</div>
      </div>

      {/* player setup */}
      <div className="mt-6 w-full max-w-md bg-white/70 rounded-2xl border-2 border-ink p-4 shadow-comic">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-[11px] font-black uppercase tracking-wide text-neutral-500">How many players?</span>
          {[2, 3, 4].map((n) => (
            <button key={n} onClick={() => setPlayerCount(n)} className="w-8 h-8 rounded-lg border-2 font-black text-sm"
              style={playerCount === n ? { borderColor: '#1a0e04', background: '#1a0e04', color: '#fff' } : { borderColor: '#d4d4d4', color: '#999', background: '#fff' }}>{n}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ALL_PLAYERS.slice(0, playerCount).map((pid, i) => (
            <div key={pid} className="rounded-lg border-2 p-2" style={{ borderColor: PLAYERS[pid].color }}>
              <span className="text-[11px] font-bold" style={{ color: PLAYERS[pid].color }}>{PLAYERS[pid].dot} Player {i + 1}</span>
              <input value={names[i]} onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Player ${i + 1}`} maxLength={14}
                className="mt-1 w-full px-2 py-1.5 rounded-lg border-2 border-ink text-sm font-bold outline-none" />
              <div className="mt-1 flex gap-1">
                {(['eat', 'fk'] as Faction[]).map((f) => (
                  <button key={f} onClick={() => setFacs(facs.map((x, j) => (j === i ? f : x)))}
                    className="flex-1 text-[10px] font-extrabold py-1 rounded border-2 transition-colors"
                    style={facs[i] === f
                      ? { borderColor: '#1a0e04', background: f === 'eat' ? '#c4561e' : '#7b4fa0', color: '#fff' }
                      : { borderColor: '#d4d4d4', color: '#9ca3af', background: '#fff' }}>
                    {FACTION[f].icon} {FACTION[f].name}
                  </button>
                ))}
              </div>
              {/* legion emblem — the firework shell that blooms over this player's ground */}
              <div className="mt-1 flex items-center gap-1">
                <span className="text-[9px] font-bold text-neutral-400">Legion</span>
                <div className="flex gap-1 flex-1 justify-end">
                  {BURST_META.map((bm) => (
                    <button key={bm.kind} title={`${bm.label} — ${bm.hint}`}
                      onClick={() => setEmblems(emblems.map((x, j) => (j === i ? bm.kind : x)))}
                      className="rounded border-2 p-0.5 leading-none transition-colors"
                      style={emblems[i] === bm.kind ? { borderColor: PLAYERS[pid].color, background: '#fffdf5' } : { borderColor: '#e2e2e2', background: '#fff' }}>
                      <BurstBadge color={emblems[i] === bm.kind ? PLAYERS[pid].color : '#b8b0a2'} kind={bm.kind} size={16} />
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setAi(ai.map((x, j) => (j === i ? !x : x)))}
                className="mt-1 w-full text-[10px] font-extrabold py-1 rounded border-2 transition-colors"
                style={ai[i] ? { borderColor: '#1a0e04', background: '#1a0e04', color: '#fff' } : { borderColor: '#d4d4d4', color: '#9ca3af', background: '#fff' }}>
                {ai[i] ? '🤖 Computer' : '🧑 Human'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* game modes */}
      <div className="mt-4 w-full max-w-md grid gap-3">
        <button onClick={startMatch} className="text-left rounded-2xl border-2 border-ink bg-ink text-white p-4 shadow-comic hover:translate-y-[-1px] transition-transform">
          <div className="font-extrabold text-lg">🎭 Pass &amp; Play</div>
          <div className="text-xs opacity-80">2–4 players, one device — muster across the mountain and clash where frontiers meet.</div>
        </button>

        <button disabled className="text-left rounded-2xl border-2 border-dashed border-neutral-300 bg-white/60 text-neutral-500 p-4 cursor-not-allowed relative">
          <span className="absolute top-3 right-3 text-[9px] font-black uppercase bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">Coming soon</span>
          <div className="font-extrabold text-lg">🔗 Invite a friend</div>
          <div className="text-xs">Share a code or link to play someone remotely. Networking to come.</div>
        </button>

        <button onClick={startMatch} className="text-left rounded-2xl border-2 border-ink bg-white p-4 shadow-comic hover:translate-y-[-1px] transition-transform">
          <div className="font-extrabold text-lg">🤖 Vs Computer</div>
          <div className="text-xs text-neutral-600">Toggle any player to <b>🤖 Computer</b> above, then start. The AI musters, clashes at borders, and picks fresh champions.</div>
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

      <div className="mt-7 flex flex-wrap gap-2 justify-center">
        <a href="/eatfuckgo/infographic/" target="_blank" rel="noopener" className="inline-block px-5 py-2.5 rounded-xl border-2 border-ink bg-white font-extrabold text-sm shadow-comic">📖 How to play — the illustrated guide ↗</a>
        <button onClick={() => setShowGuide(true)} className="inline-block px-5 py-2.5 rounded-xl border-2 border-ink bg-white font-extrabold text-sm shadow-comic">🧬 Muster guide — recruit ladders</button>
      </div>
      <a className="mt-5 text-xs text-neutral-500 underline" href="/eatfuckgo/legacy/index.html" target="_blank" rel="noopener">view the original prototype →</a>
      <AnimatePresence>{showGuide && <MusterGuide onClose={() => setShowGuide(false)} />}</AnimatePresence>
    </div>
  );
}
