/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattle } from './store';
import { autoResolve } from './engine/engine';
import { aiMapMove } from './game/ai';
import { BattleScreen } from './screens/BattleScreen';
import { MapScreen } from './screens/MapScreen';
import { EAT, FK, BOARDS } from './engine/data';
import type { Side } from './engine/data';
import { freshMatch, nextPlayer, heldBy, matchWinner, pluralityWinner, livingPlayers, legionsOf, legionAt, occupiedHexes, nextLegionSlot, STACK_CAP, setPlayerNames, setPlayerFactions, setPlayerEmblems, FACTION, PLAYERS, ALL_PLAYERS, ALL_BIOMES, ADAPT_CAP, MatchState, Legion, Faction, BurstKind, PlayerId } from './game/humboldt';
import { BurstBadge, BURST_META } from './components/LegionBurst';
import { curBiome, hexesOfBiome, tickWarming, degLabel, MAX_C, legionMoves } from './game/board';
import { speciesInBiome, speciesCat, recruitOptions, SPECIES_BY_ID } from './game/species';
import { ContestSetup, ContestResult } from './components/ContestSetup';
import { MusterScreen } from './components/MusterScreen';
import { LegionArrange } from './components/LegionArrange';
import { SplitLegion } from './components/SplitLegion';
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
  const [pending, setPending] = useState<{ hex: string; atkLegion: string; defLegion: string } | null>(null); // legion clash awaiting setup
  const [defense, setDefense] = useState<{ hex: string; atk: { mode: Faction; species: string }; atkLegion: string; defLegion: string } | null>(null); // reactive defense / AI attacks human
  const [aiBattleSides, setAiBattleSides] = useState<Side[]>([]); // which battle sides the computer plays
  const [clashCtx, setClashCtx] = useState<{ hex: string; atkLegion: string; defLegion: string } | null>(null); // legions in the active battle
  const [mustering, setMustering] = useState<{ legionId: string; hex: string } | null>(null); // legion recruiting after a move
  const [selLegion, setSelLegion] = useState<string | null>(null); // legion selected to move
  const [turnStart, setTurnStart] = useState<MatchState | null>(null); // snapshot for "reset moves"
  const [turnLogLen, setTurnLogLen] = useState(0); // log length at turn start (to trim on reset)
  const [confirmEnd, setConfirmEnd] = useState(false); // end-turn confirmation
  const [splitting, setSplitting] = useState<string | null>(null); // legion id being split (opens popup)
  const [arranged, setArranged] = useState<Set<PlayerId>>(new Set()); // players who've arranged their opening legions
  const [defenseReq, setDefenseReq] = useState<{ hex: string; atkLegion: string; owner: PlayerId } | null>(null); // human defender prompt
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
    setActiveHex(null); setAiBattleSides([]);
    dispatch({ t: 'new', setup: { fac: { atk, def }, terrain, atkIds: randStack(deckOf(atk), 2 + rand(4)), defIds: randStack(deckOf(def), 2 + rand(4)) } });
    setPhase('battle');
  }

  // ── Humboldt match ──
  function startMatch() {
    const players = ALL_PLAYERS.slice(0, playerCount);
    setPlayerNames(names); setPlayerFactions(facs); setPlayerEmblems(emblems);
    setAiPlayers(new Set(players.filter((_, i) => ai[i])));
    setMatch(freshMatch(players)); setResult(null); setWarmingNote(null); setReach(null); setSelLegion(null);
    setMustering(null); setPending(null); setDefense(null); setDefenseReq(null); setSplitting(null); setAiBattleSides([]); setClashCtx(null);
    setArranged(new Set(players.filter((_, i) => ai[i]))); // AI seats auto-arrange
    setLog([`🎆 ${players.map((p, i) => `${PLAYERS[p].dot} ${PLAYERS[p].name}${ai[i] ? ' 🤖' : ''}`).join(' · ')} — legions muster.`]);
    setPhase('map');
  }

  // helpers over the current match
  const stratOf = (id: string) => SPECIES_BY_ID[id]?.strategy;
  const legionStrats = (l: Legion, mode: Faction) =>
    Array.from(new Set(l.species.map((id) => SPECIES_BY_ID[id]).filter((s) => s && speciesCat(s) === mode).map((s) => s!.strategy)));
  const legionContest = (l: Legion): { mode: Faction; species: string } | null => {
    const avail = (mode: Faction) => l.species.map((id) => SPECIES_BY_ID[id]).filter((s) => s && speciesCat(s) === mode) as any[];
    const order: Faction[] = l.team === 'eat' ? ['eat', 'fk'] : ['fk', 'eat'];
    const mode = order.find((f) => avail(f).length); if (!mode) return null;
    const list = avail(mode).sort((a, b) => (match.adapt[l.player][a.strategy] || 0) - (match.adapt[l.player][b.strategy] || 0));
    return { mode, species: list[0].id };
  };
  const occExcept = (hex: string) => { const s = occupiedHexes(match); s.delete(hex); return s; };
  function aiPickRecruit(l: Legion): string | null {
    if (l.species.length >= STACK_CAP) return null;
    const biome = curBiome(match.states, l.hex);
    const opts = recruitOptions(l.species, biome, l.team).filter((o) => o.unlocked && !o.owned);
    return opts.length ? opts.sort((a, b) => b.tier - a.tier)[0].species.id : null;
  }

  function rollMove() { if (reach == null) { setTurnStart(match); setTurnLogLen(log.length); setReach(1 + Math.floor(Math.random() * 6)); } }
  // undo every move/recruit/clash made this turn, back to the roll
  function resetMoves() { if (turnStart) { setMatch(turnStart); setLog((l) => l.slice(0, turnLogLen)); setSelLegion(null); setConfirmEnd(false); } }

  // click a hex: select your legion there, or (with one selected) move/act onto it
  function pickHex(hexId: string) {
    setWarmingNote(null);
    const here = legionAt(match, hexId);
    if (here && here.player === match.turn) { if (!here.moved) setSelLegion(here.id); return; }
    if (selLegion == null || reach == null) return;
    const l = match.legions[selLegion]; if (!l || l.moved) return;
    if (!legionMoves(l.hex, reach, occExcept(l.hex)).has(hexId)) return;
    const tgt = legionAt(match, hexId);
    if (tgt) { if (tgt.player !== match.turn) beginLegionClash(l.id, tgt.id, hexId); return; } // ally-occupied = illegal
    const owner = match.owners[hexId];
    if (owner && owner !== match.turn) { requestDefense(l.id, hexId, owner); return; } // enemy-claimed empty → reactive defense
    moveAndRecruit(l.id, hexId); // free ground → claim + recruit
  }

  function applyMove(m: MatchState, legionId: string, hexId: string, recruitId: string | null): MatchState {
    const l = m.legions[legionId];
    const owners = { ...m.owners }; owners[hexId] = l.player;
    const species = recruitId && l.species.length < STACK_CAP && !l.species.includes(recruitId) ? [...l.species, recruitId] : l.species;
    return { ...m, owners, legions: { ...m.legions, [legionId]: { ...l, hex: hexId, moved: true, species } } };
  }
  function moveAndRecruit(legionId: string, hexId: string) {
    const l = match.legions[legionId];
    const isAI = aiPlayers.has(l.player);
    const recruitId = isAI ? aiPickRecruit({ ...l, hex: hexId }) : null;
    const b = curBiome(match.states, hexId), sp = recruitId ? SPECIES_BY_ID[recruitId] : null;
    setMatch(applyMove(match, legionId, hexId, recruitId));
    setSelLegion(null);
    setLog((x) => [...x, `➡️ ${PLAYERS[l.player].name}'s legion ${l.n} advanced to ${BOARDS[b].name}${sp ? ` and recruited ${sp.emoji} ${sp.name}` : ''}.`]);
    if (!isAI && l.species.length < STACK_CAP) setMustering({ legionId, hex: hexId }); // interactive recruit
  }
  // human recruit choice from the muster screen
  function doRecruit(legionId: string, recruitId: string | null) {
    setMustering(null);
    if (!recruitId) return;
    setMatch((m) => { const l = m.legions[legionId]; if (!l || l.species.length >= STACK_CAP || l.species.includes(recruitId)) return m; return { ...m, legions: { ...m.legions, [legionId]: { ...l, species: [...l.species, recruitId] } } }; });
    const sp = SPECIES_BY_ID[recruitId];
    setLog((x) => [...x, `🧬 ${PLAYERS[match.legions[legionId].player].name}'s legion recruited ${sp.emoji} ${sp.name}.`]);
  }

  // ── clash: one legion moves onto another ──
  function beginLegionClash(atkLegionId: string, defLegionId: string, hexId: string) {
    setClashCtx({ hex: hexId, atkLegion: atkLegionId, defLegion: defLegionId });
    if (aiPlayers.has(match.turn)) {
      const atkC = legionContest(match.legions[atkLegionId]);
      const defP = match.legions[defLegionId].player;
      if (aiPlayers.has(defP)) { resolveAuto(atkLegionId, defLegionId, hexId, atkC, legionContest(match.legions[defLegionId])); return; } // AI v AI headless
      setDefense({ hex: hexId, atk: atkC!, atkLegion: atkLegionId, defLegion: defLegionId }); // AI attacks human → they answer
      return;
    }
    setPending({ hex: hexId, atkLegion: atkLegionId, defLegion: defLegionId }); // human attacker picks mode+champion
  }

  // reactive defense: attacker moves onto an enemy-CLAIMED but empty hex
  function requestDefense(atkLegionId: string, hexId: string, owner: PlayerId) {
    if (aiPlayers.has(owner)) { // AI decides: bring the nearest legion within a rolled range, else cede
      const roll = 1 + Math.floor(Math.random() * 6);
      const cand = legionsOf(match, owner).find((l) => !l.moved && legionMoves(l.hex, roll, occExcept(l.hex)).has(hexId));
      if (cand) { const m2 = applyMove(match, cand.id, hexId, null); setMatch(m2); setLog((x) => [...x, `🛡️ ${PLAYERS[owner].name} rolled ${roll} — legion ${cand.n} rushes to defend ${BOARDS[curBiome(match.states, hexId)].name}.`]); beginLegionClashOn(m2, atkLegionId, cand.id, hexId); return; }
      cedeHex(atkLegionId, hexId, owner); return;
    }
    setDefenseReq({ hex: hexId, atkLegion: atkLegionId, owner }); // human defender prompt
  }
  function cedeHex(atkLegionId: string, hexId: string, owner: PlayerId) {
    setDefenseReq(null);
    setLog((x) => [...x, `🏳️ ${PLAYERS[owner].name} cedes ${BOARDS[curBiome(match.states, hexId)].name} — undefended.`]);
    moveAndRecruit(atkLegionId, hexId);
  }
  function humanDefend(defend: boolean) {
    const req = defenseReq!; setDefenseReq(null);
    if (!defend) { cedeHex(req.atkLegion, req.hex, req.owner); return; }
    const roll = 1 + Math.floor(Math.random() * 6);
    const cand = legionsOf(match, req.owner).find((l) => !l.moved && legionMoves(l.hex, roll, occExcept(l.hex)).has(req.hex));
    if (!cand) { setLog((x) => [...x, `🎲 ${PLAYERS[req.owner].name} rolled ${roll} — no legion in range. ${BOARDS[curBiome(match.states, req.hex)].name} falls.`]); moveAndRecruit(req.atkLegion, req.hex); return; }
    const m2 = applyMove(match, cand.id, req.hex, null); setMatch(m2);
    setLog((x) => [...x, `🛡️ ${PLAYERS[req.owner].name} rolled ${roll} — legion ${cand.n} moves to defend.`]);
    beginLegionClashOn(m2, req.atkLegion, cand.id, req.hex);
  }
  // clash where the defender legion was just repositioned (uses the fresh match m)
  function beginLegionClashOn(m: MatchState, atkLegionId: string, defLegionId: string, hexId: string) {
    setClashCtx({ hex: hexId, atkLegion: atkLegionId, defLegion: defLegionId });
    const atkAI = aiPlayers.has(m.legions[atkLegionId].player);
    const defAI = aiPlayers.has(m.legions[defLegionId].player);
    if (atkAI && defAI) { resolveAuto(atkLegionId, defLegionId, hexId, legionContest(m.legions[atkLegionId]), legionContest(m.legions[defLegionId]), m); return; }
    if (atkAI) { setDefense({ hex: hexId, atk: legionContest(m.legions[atkLegionId])!, atkLegion: atkLegionId, defLegion: defLegionId }); return; } // AI attacks human → human defends
    setPending({ hex: hexId, atkLegion: atkLegionId, defLegion: defLegionId }); // human attacker
  }

  // build the interactive battle from the two legions' chosen champions
  function launchBattle(atkC: { mode: Faction; species: string }, defC: { mode: Faction; species: string } | null) {
    const ctx = clashCtx!; const atkL = match.legions[ctx.atkLegion], defL = match.legions[ctx.defLegion];
    if (!defC) { resolveAuto(ctx.atkLegion, ctx.defLegion, ctx.hex, atkC, null); return; }
    dispatch({ t: 'new', setup: {
      fac: { atk: atkC.mode, def: defC.mode }, terrain: curBiome(match.states, ctx.hex),
      atkIds: legionStrats(atkL, atkC.mode), defIds: legionStrats(defL, defC.mode),
      lead: { atk: stratOf(atkC.species)!, def: stratOf(defC.species)! }, species: { atk: atkC.species, def: defC.species },
      adapt: { atk: match.adapt[atkL.player][stratOf(atkC.species)!] ?? 0, def: match.adapt[defL.player][stratOf(defC.species)!] ?? 0 },
    } });
    const sides: Side[] = []; if (aiPlayers.has(atkL.player)) sides.push('atk'); if (aiPlayers.has(defL.player)) sides.push('def');
    setAiBattleSides(sides); setActiveHex(ctx.hex); setPending(null); setDefense(null); setPhase('battle');
  }
  // attacker (human) locked in a champion via ContestSetup
  function launchContest(r: ContestResult) {
    launchBattle({ mode: r.atkMode, species: r.atkSpecies }, r.defSpecies ? { mode: r.defMode, species: r.defSpecies } : null);
  }

  // ── apply a clash outcome to the legions (shared by interactive + auto) ──
  function applyClashOutcome(m: MatchState, ctx: { hex: string; atkLegion: string; defLegion: string }, winner: 'atk' | 'def' | 'draw', absorbForAtk: string | null, absorbForDef: string | null, leadAtk: string | null, leadDef: string | null): { m: MatchState; entries: string[] } {
    const atkL = m.legions[ctx.atkLegion], defL = m.legions[ctx.defLegion];
    const legions = { ...m.legions }; const owners = { ...m.owners }; const entries: string[] = [];
    const B = BOARDS[curBiome(m.states, ctx.hex)].name;
    const grow = (l: Legion, sp: string | null) => (sp && l.species.length < STACK_CAP && !l.species.includes(sp) ? [...l.species, sp] : l.species);
    if (winner === 'atk') {
      delete legions[ctx.defLegion];
      legions[ctx.atkLegion] = { ...atkL, hex: ctx.hex, moved: true, species: grow(atkL, absorbForAtk) };
      owners[ctx.hex] = atkL.player;
      entries.push(`⚔️ ${PLAYERS[atkL.player].name}'s legion ${atkL.n} destroyed ${PLAYERS[defL.player].name}'s legion ${defL.n} at ${B}.`);
    } else if (winner === 'def') {
      delete legions[ctx.atkLegion];
      legions[ctx.defLegion] = { ...defL, species: grow(defL, absorbForDef) };
      entries.push(`🛡️ ${PLAYERS[defL.player].name}'s legion ${defL.n} held ${B}, wiping legion ${atkL.n}.`);
    } else {
      delete legions[ctx.atkLegion]; delete legions[ctx.defLegion];
      entries.push(`💥 Both legions collapsed at ${B}.`);
    }
    // Red Queen adaptation (champions used)
    const adapt = {} as Record<PlayerId, Record<string, number>>;
    m.players.forEach((p) => { adapt[p] = { ...m.adapt[p] }; });
    Object.keys(adapt[atkL.player]).forEach((sid) => { if (sid !== leadAtk) adapt[atkL.player][sid] = Math.max(0, adapt[atkL.player][sid] - 1); });
    if (leadAtk) adapt[atkL.player][leadAtk] = Math.min(ADAPT_CAP, (adapt[atkL.player][leadAtk] || 0) + 1);
    if (leadDef) adapt[defL.player][leadDef] = Math.min(ADAPT_CAP, (adapt[defL.player][leadDef] || 0) + 1);
    let next = { ...m, owners, legions, adapt };
    const w = applyWarming(next, winner === 'atk'); next = w.m; entries.push(...w.notes);
    return { m: next, entries };
  }
  // headless outcome (AI-v-AI, or a side can't field a champion). `src` is the
  // authoritative match (may be a freshly-moved copy from reactive defense).
  function resolveAuto(atkLegionId: string, defLegionId: string, hexId: string, atkC: { mode: Faction; species: string } | null, defC: { mode: Faction; species: string } | null, src: MatchState = match) {
    const ctx = { hex: hexId, atkLegion: atkLegionId, defLegion: defLegionId };
    const atkL = src.legions[atkLegionId], defL = src.legions[defLegionId];
    let winner: 'atk' | 'def' | 'draw';
    if (!atkC) winner = 'def'; else if (!defC) winner = 'atk';
    else winner = autoResolve({
      fac: { atk: atkC.mode, def: defC.mode }, terrain: curBiome(src.states, hexId),
      atkIds: legionStrats(atkL, atkC.mode), defIds: legionStrats(defL, defC.mode),
      lead: { atk: stratOf(atkC.species)!, def: stratOf(defC.species)! }, species: { atk: atkC.species, def: defC.species },
      adapt: { atk: src.adapt[atkL.player][stratOf(atkC.species)!] ?? 0, def: src.adapt[defL.player][stratOf(defC.species)!] ?? 0 },
    });
    const { m, entries } = applyClashOutcome(src, ctx, winner, defC?.species ?? null, atkC?.species ?? null, atkC ? stratOf(atkC.species)! : null, defC ? stratOf(defC.species)! : null);
    setClashCtx(null); commit(m, entries);
  }
  // interactive battle finished → apply, stay on the same turn
  function claimAndReturn() {
    const ctx = clashCtx; if (!ctx || !state) { setPhase('map'); return; }
    const { m, entries } = applyClashOutcome(match, ctx, (state.winner as 'atk' | 'def' | 'draw') || 'draw', state.species.def, state.species.atk, state.lead.atk, state.lead.def);
    setClashCtx(null); setActiveHex(null); setAiBattleSides([]); setSelLegion(null); setPhase('map');
    commit(m, entries);
  }

  // ── warming / turn plumbing ──
  function applyWarming(m: MatchState, claimed: boolean): { m: MatchState; notes: string[] } {
    const tick = tickWarming(m, claimed);
    const owners = { ...m.owners }; const notes: string[] = [];
    const displaced = tick.changed.filter((c) => owners[c.id]).length;
    tick.changed.forEach((c) => { if (owners[c.id]) owners[c.id] = null; });
    const extinct = ALL_BIOMES.filter((c) => hexesOfBiome(c, m.states).length > 0 && hexesOfBiome(c, tick.states).length === 0);
    let legions = m.legions;
    if (extinct.length) {
      const dead = new Set(extinct.flatMap((c) => speciesInBiome(c).map((s) => s.id)));
      legions = {};
      Object.values(m.legions).forEach((l) => {
        const sp = l.species.filter((id) => !dead.has(id));
        if (sp.length === 0) { notes.push(`🦴 ${PLAYERS[l.player].name}'s legion ${l.n} died out.`); return; }
        legions[l.id] = { ...l, species: sp };
      });
      notes.push(`🦴 ${extinct.map((c) => BOARDS[c].name).join(', ')} vanished.`);
    }
    if (tick.changed.length) notes.push(`🔥 ${degLabel(tick.warming)}: ${tick.changed.length} hex${tick.changed.length > 1 ? 'es' : ''} transformed${displaced ? `, ${displaced} displaced` : ''}.`);
    return { m: { ...m, owners, states: tick.states, warming: tick.warming, claims: tick.claims, legions }, notes };
  }
  // set the match + check victory (does NOT advance the turn)
  function commit(next: MatchState, entries: string[]) {
    setMatch(next); setReach(null); setSelLegion(null); setWarmingNote(null);
    const won = matchWinner(next);
    if (won) { entries.push(`🏆 ${PLAYERS[won].name} is the last legion standing — victory!`); setResult(`🏆 ${PLAYERS[won].name} wins — all rivals eliminated.`); }
    else if (next.warming >= MAX_C) { const w = pluralityWinner(next); entries.push(`🏆 Planet maxed at ${degLabel(next.warming)} — ${PLAYERS[w].name} leads with ${legionsOf(next, w).length} legions.`); setResult(`🏆 The planet reached ${degLabel(next.warming)}. ${PLAYERS[w].name} wins with the most legions.`); }
    if (entries.length) setLog((l) => [...l, ...entries]);
  }
  function endTurn() { setConfirmEnd(true); } // ask first
  function doEndTurn() {
    setConfirmEnd(false); setTurnStart(null); setSelLegion(null);
    const legions: Record<string, Legion> = {};
    Object.values(match.legions).forEach((l) => { legions[l.id] = { ...l, moved: false }; });
    // advance to the next player who still has a legion
    let nx = nextPlayer(match.players, match.turn); let guard = 0;
    while (legionsOf({ ...match, legions }, nx).length === 0 && guard++ < 8) nx = nextPlayer(match.players, nx);
    const next = { ...match, legions, turns: match.turns + 1, turn: nx };
    commit(next, [`↻ ${PLAYERS[match.turn].name} ends their turn.`]);
  }
  function endMatch() {
    const w = pluralityWinner(match);
    setResult(`🌡️ Called at ${degLabel(match.warming)}. ${PLAYERS[w].name} leads with ${legionsOf(match, w).length} legion${legionsOf(match, w).length === 1 ? '' : 's'} (${heldBy(match, w)} hexes).`);
  }

  // ── splitting: divide a legion into two, one must move this turn ──
  function confirmSplit(legionId: string, keepIds: string[], moveIds: string[]) {
    const slot = nextLegionSlot(match, match.turn); if (!slot) { setSplitting(null); return; }
    const src = match.legions[legionId];
    const nid = `${match.turn}-${slot.n}`;
    const legions = { ...match.legions,
      [legionId]: { ...src, species: keepIds },
      [nid]: { id: nid, player: match.turn, n: slot.n, emblem: slot.emblem, hex: src.hex, team: src.team, species: moveIds, moved: false } };
    setMatch({ ...match, legions });
    setSplitting(null);
    setSelLegion(nid); // the new legion shares the hex and must move off it
    setLog((x) => [...x, `✂️ ${PLAYERS[match.turn].name} split legion ${src.n} → new legion ${slot.n} (must move this turn).`]);
  }
  // ── GM lab: switch a legion's team (keeps species, recruit ladder resets) ──
  function switchTeam(legionId: string) {
    setMatch((m) => { const l = m.legions[legionId]; const team: Faction = l.team === 'eat' ? 'fk' : 'eat'; return { ...m, legions: { ...m.legions, [legionId]: { ...l, team } } }; });
    const l = match.legions[legionId];
    setLog((x) => [...x, `🧪 ${PLAYERS[l.player].name}'s legion ${l.n} re-engineered to Team ${FACTION[l.team === 'eat' ? 'fk' : 'eat'].name}.`]);
  }
  // arrange popup confirmed
  function applyArrange(legA: string[], embA: BurstKind, legB: string[], embB: BurstKind) {
    const p = match.turn;
    setMatch((m) => { const ls = legionsOf(m, p); const [a, b] = ls; if (!a || !b) return m; return { ...m, legions: { ...m.legions, [a.id]: { ...a, species: legA, emblem: embA }, [b.id]: { ...b, species: legB, emblem: embB } } }; });
    setArranged((s) => new Set([...s, p]));
  }

  // reactive-defense concede from the human prompt is handled by humanDefend(false)
  function defenderConcede() { if (defense) { resolveAuto(defense.atkLegion, defense.defLegion, defense.hex, defense.atk, null); setDefense(null); } }

  // the computer takes its map turn: move each legion once, then end the turn
  useEffect(() => {
    if (phase !== 'map' || result || pending || mustering || defense || defenseReq || splitting || confirmEnd || !aiPlayers.has(match.turn) || !arranged.has(match.turn)) return;
    const id = setTimeout(() => {
      if (reach == null) { rollMove(); return; }
      const mv = aiMapMove(match, match.turn, reach); // {type, hexId, legionId}
      if (mv.type === 'pass' || !mv.legionId || !mv.hexId) { doEndTurn(); return; }
      const tgt = legionAt(match, mv.hexId);
      if (tgt && tgt.player !== match.turn) beginLegionClash(mv.legionId, tgt.id, mv.hexId);
      else if (match.owners[mv.hexId] && match.owners[mv.hexId] !== match.turn) requestDefense(mv.legionId, mv.hexId, match.owners[mv.hexId] as PlayerId);
      else moveAndRecruit(mv.legionId, mv.hexId);
    }, 620);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, match, reach, pending, mustering, defense, defenseReq, splitting, confirmEnd, arranged, result, aiPlayers]);

  // standalone reference tab (pinned via the #guide hash)
  if (typeof location !== 'undefined' && location.hash === '#guide') return <MusterGuidePage />;

  if (phase === 'battle' && state) {
    const atkP = clashCtx ? match.legions[clashCtx.atkLegion]?.player : undefined;
    const defP = clashCtx ? match.legions[clashCtx.defLegion]?.player : undefined;
    return (
      <BattleScreen state={state} dispatch={dispatch}
        mapMode={activeHex != null}
        biomeName={activeHex ? BOARDS[curBiome(match.states, activeHex)].name : undefined}
        attackerName={atkP ? PLAYERS[atkP].name : undefined}
        defenderName={defP ? PLAYERS[defP].name : undefined}
        onClaim={activeHex ? claimAndReturn : undefined}
        aiSides={aiBattleSides}
        onExit={() => { setAiBattleSides([]); setClashCtx(null); activeHex ? setPhase('map') : location.reload(); }}
        onNewRandom={() => skirmish(undefined)} />
    );
  }

  if (phase === 'map') {
    const cur = match.turn;
    const isHuman = !aiPlayers.has(cur);
    const mustArrange = isHuman && !arranged.has(cur);
    return (
      <>
        <MapScreen match={match} reach={reach} selLegion={selLegion} activePlayer={cur} interactive={isHuman && !mustArrange}
          canReset={turnStart != null} onReset={resetMoves}
          onPick={pickHex} onRoll={rollMove} onEndTurn={endTurn} onSplit={(id) => setSplitting(id)} onSwitchTeam={switchTeam}
          onEnd={endMatch} onHome={() => setPhase('home')} note={warmingNote} log={log} />
        {/* floating utilities: your hand + the recruit-ladder reference */}
        <div className="fixed bottom-3 right-3 z-40 flex flex-col items-end gap-2">
          <button onClick={() => setShowHands(true)} title="Your legions, species, strategies & weirdos"
            className="px-3 py-2 rounded-full border-2 border-ink font-extrabold text-xs shadow-comic text-white"
            style={{ background: PLAYERS[cur].color }}>🎴 {PLAYERS[cur].name}'s legions</button>
          <button onClick={() => setShowGuide(true)} title="Recruit ladders by biome"
            className="px-3 py-2 rounded-full border-2 border-ink bg-white font-extrabold text-xs shadow-comic">📖 Muster guide</button>
        </div>
        <AnimatePresence>
          {confirmEnd && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div className="bg-white rounded-2xl border-2 border-ink p-5 text-center max-w-sm w-full shadow-comic" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <div className="font-black text-sm mb-1">↻ End {PLAYERS[cur].name}'s turn?</div>
                <div className="text-[11px] text-neutral-500 mb-3">You can still reset every move you made this turn, or end and pass to the next player.</div>
                <div className="flex gap-2 justify-center flex-wrap">
                  {turnStart && <button onClick={resetMoves} className="px-3 py-2 rounded-xl border-2 border-ink bg-white font-bold text-xs">↺ Reset moves</button>}
                  <button onClick={() => setConfirmEnd(false)} className="px-3 py-2 rounded-xl border-2 border-ink bg-white font-bold text-xs text-neutral-600">Keep playing</button>
                  <button onClick={doEndTurn} className="px-4 py-2 rounded-xl border-2 border-ink text-white font-extrabold text-xs" style={{ background: PLAYERS[cur].color }}>✓ End turn</button>
                </div>
              </motion.div>
            </motion.div>
          )}
          {mustArrange && <LegionArrange match={match} player={cur} onConfirm={applyArrange} />}
          {showHands && <HandPanel match={match} viewer={cur} onClose={() => setShowHands(false)} />}
          {showGuide && <MusterGuide onClose={() => setShowGuide(false)} />}
          {splitting && <SplitLegion legion={match.legions[splitting]} onConfirm={(keep, move) => confirmSplit(splitting, keep, move)} onCancel={() => setSplitting(null)} />}
          {mustering && match.legions[mustering.legionId] && (
            <MusterScreen match={match} legion={match.legions[mustering.legionId]} hex={mustering.hex}
              onRecruit={(sp) => doRecruit(mustering.legionId, sp)} onCancel={() => setMustering(null)} />
          )}
          {defenseReq && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div className="bg-white rounded-2xl border-2 border-ink p-5 text-center max-w-sm w-full shadow-comic" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <div className="font-black text-sm mb-1" style={{ color: PLAYERS[defenseReq.owner].color }}>{PLAYERS[defenseReq.owner].dot} {PLAYERS[defenseReq.owner].name} — defend {BOARDS[curBiome(match.states, defenseReq.hex)].name}?</div>
                <div className="text-[11px] text-neutral-500 mb-3">{PLAYERS[match.turn].name} is moving in. Defend and you roll 1d6 to rush a legion within range to meet them; decline and the hex flips.</div>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => humanDefend(true)} className="px-4 py-2 rounded-xl border-2 border-ink text-white font-extrabold" style={{ background: PLAYERS[defenseReq.owner].color }}>🛡️ Defend (roll)</button>
                  <button onClick={() => humanDefend(false)} className="px-4 py-2 rounded-xl border-2 border-ink bg-white font-bold text-neutral-600">🏳️ Let it go</button>
                </div>
              </motion.div>
            </motion.div>
          )}
          {pending && match.legions[pending.atkLegion] && match.legions[pending.defLegion] && (
            <ContestSetup match={match} hex={pending.hex}
              atkPool={match.legions[pending.atkLegion].species} defPool={match.legions[pending.defLegion].species}
              vsAI={aiPlayers.has(match.legions[pending.defLegion].player)}
              aiDefend={() => legionContest(match.legions[pending.defLegion])}
              onLaunch={launchContest} onConcede={() => resolveAuto(pending.atkLegion, pending.defLegion, pending.hex, legionContest(match.legions[pending.atkLegion]), null)}
              onCancel={() => { setPending(null); setClashCtx(null); }} />
          )}
          {defense && match.legions[defense.atkLegion] && match.legions[defense.defLegion] && (
            <ContestSetup match={match} hex={defense.hex} aiAttack={defense.atk}
              atkPool={match.legions[defense.atkLegion].species} defPool={match.legions[defense.defLegion].species}
              onLaunch={(r) => launchBattle(defense.atk, { mode: r.defMode, species: r.defSpecies })}
              onConcede={defenderConcede} onCancel={() => {}} />
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
