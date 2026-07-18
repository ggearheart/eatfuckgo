/* eslint-disable @typescript-eslint/no-explicit-any */
// Pure battle engine ported from the prototype. Functions mutate the passed
// State (the React reducer clones first), so the UI stays a function of State.
import {
  CFG, EAT, FK, WEIRDO_STACKS, TERRAIN_FX, CATASTROPHES, SCENARIOS, BOARDS,
  hasKW, isAquatic, setCtx, Side,
} from './data';
import { matchedElements, ELEMENTS } from './elements';

export interface Inst { card: any; adapt: number; exhausted: boolean; isWeirdo: boolean; toughUsed?: boolean }
export type Step = 'catacheck' | 'scenario' | 'p1' | 'p2' | 'ready' | 'over';
export type PartSrc = 'base' | 'terrain' | 'scenario' | 'cata' | 'energy' | 'lineage' | 'keyword';
export interface Part { t: string; src: PartSrc }
export interface Profile { dice: number; hitOn: number; power: number; parts: Part[]; native: boolean; reroll: boolean; first: boolean }
export interface Pool { rolls: { r: number; h: boolean; r2?: number }[]; hits: number }
export interface LastRoll { aP: Profile; dP: Profile; a: Pool; d: Pool; aHits: number; dHits: number; aCard: any; dCard: any; dominant: Side | null }
export interface State {
  battleType: 'eat' | 'fk'; terrain: string; round: number; step: Step;
  life: Record<Side, number>; energy: Record<Side, number>;
  alloc: Record<Side, { meta: number; repro: number }>;
  stack: Record<Side, Inst[]>; played: Record<Side, number | null>; pending: Record<Side, number | null>;
  scenario: any | null; story: string; cata: any | null; cataChecked: boolean; cataDice: { a: number; d: number } | null;
  weirdoUsed: boolean; musterUsed: boolean; winner: string | null; outcome: string; log: string[];
  lastRoll: LastRoll | null;
}

const CATA_ROUND = 3;
const E = CFG.energyPerRound;
const START_LIFE = CFG.startLife;
const rollDie = () => 1 + Math.floor(Math.random() * 6);

export const roller = (s: State): Side => (s.round % 2 === 1 ? 'atk' : 'def');
export const firstPicker = (s: State): Side => (s.round % 2 === 1 ? 'atk' : 'def');
export const secondPicker = (s: State): Side => (firstPicker(s) === 'atk' ? 'def' : 'atk');
export const other = (side: Side): Side => (side === 'atk' ? 'def' : 'atk');
export const sideName = (x: Side) => (x === 'atk' ? 'Attacker' : 'Defender');
export const deployTurn = (s: State, side: Side) =>
  (s.step === 'p1' && side === firstPicker(s)) || (s.step === 'p2' && side === secondPicker(s));

const mkInst = (card: any, isWeirdo = false): Inst => ({ card, adapt: 0, exhausted: false, isWeirdo });
const log = (s: State, m: string) => { s.log.push(m); };

export function newBattle(battleType: 'eat' | 'fk', terrain: string, atkIds: string[], defIds: string[]): State {
  const deck = battleType === 'eat' ? EAT : FK;
  const pick = (ids: string[]) => deck.filter((c) => ids.includes(c.id)).map((c) => mkInst(c));
  const s: State = {
    battleType, terrain, round: 1, step: 'scenario',
    life: { atk: START_LIFE, def: START_LIFE }, energy: { atk: E, def: E },
    alloc: { atk: { meta: E, repro: 0 }, def: { meta: E, repro: 0 } },
    stack: { atk: pick(atkIds), def: pick(defIds) }, played: { atk: null, def: null }, pending: { atk: null, def: null },
    scenario: null, story: '', cata: null, cataChecked: false, cataDice: null,
    weirdoUsed: false, musterUsed: false, winner: null, outcome: '',
    log: [`⚔️ Terrain Clash in ${BOARDS[terrain].name}! Life ${START_LIFE} each.`], lastRoll: null,
  };
  beginRound(s);
  return s;
}

function beginRound(s: State) {
  s.energy = { atk: E, def: E };
  s.alloc = { atk: { meta: E, repro: 0 }, def: { meta: E, repro: 0 } };
  s.scenario = null; s.story = ''; s.pending = { atk: null, def: null };
  s.step = (s.round === CATA_ROUND && !s.cataChecked) ? 'catacheck' : 'scenario';
}

export function rollScenario(s: State) {
  if (s.step !== 'scenario' || s.winner) return;
  const die = rollDie();
  s.scenario = SCENARIOS[(die - 1) % SCENARIOS.length];
  setCtx(s.battleType, s.terrain);
  s.story = s.scenario.story(BOARDS[s.terrain].name);
  log(s, `🎲 ${sideName(roller(s))} rolls ${die} → ${s.scenario.icon} ${s.scenario.name}: ${s.scenario.tag}.`);
  s.step = 'p1';
}

export function rollCataCheck(s: State) {
  if (s.step !== 'catacheck' || s.cataChecked) return;
  const a = rollDie(), d = rollDie();
  s.cataDice = { a, d }; s.cataChecked = true;
  if (a === d) {
    s.cata = CATASTROPHES[Math.floor(Math.random() * CATASTROPHES.length)];
    log(s, `☄️ Catastrophe check: both rolled ${a} — MATCH! ${s.cata.icon} ${s.cata.name} strikes for the rest of the battle.`);
  } else {
    log(s, `☄️ Catastrophe check: ${a} vs ${d} — no match. Terrain & scenario rule the day.`);
  }
}
export function proceedCata(s: State) { if (s.step === 'catacheck') s.step = 'scenario'; }

const basePower = (i: Inst, bt: 'eat' | 'fk') => (bt === 'eat' ? i.card.off : i.card.rep) + (i.adapt || 0);

export function diceProfile(s: State, inst: Inst, side: Side | null, oppCard: any | null): Profile {
  setCtx(s.battleType, s.terrain);
  const c = inst.card, pw = basePower(inst, s.battleType);
  let dice = Math.max(1, Math.ceil(pw / 2) + 2);
  let hitOn = Math.max(2, Math.min(6, 6 - Math.floor((c.ada || 0) / 3)));
  const parts: Part[] = [];
  const add = (t: string, src: Part['src']) => parts.push({ t, src });
  add(`${dice} dice (power ${pw})`, 'base');
  add(`hits ${hitOn}+ (ADA ${c.ada})`, 'base');
  let reroll = false, first = false;
  const tf = TERRAIN_FX[s.terrain] || {};
  const native = (c.ter || []).includes(s.terrain);
  // Element-matching dominance: suits the biome's elements → +1 die each; unsuited → −1
  const matched = matchedElements(c, s.terrain);
  if (matched.length) { dice += matched.length; add(`+${matched.length} dice · suits ${matched.map((e) => ELEMENTS[e].icon).join('')}`, 'terrain'); }
  else { dice -= 1; add('−1 die · unsuited to biome', 'terrain'); }
  if (side) {
    let lin = 0;
    s.stack[side].forEach((o) => { if (o !== inst && o.card.t < c.t && (o.card.ter || []).some((t: string) => (c.ter || []).includes(t))) lin++; });
    lin = Math.min(CFG.lineageMax, lin);
    if (lin) { const d = Math.min(2, Math.ceil(lin / 2)); dice += d; add(`+${d} die lineage`, 'lineage'); }
  }
  if (hasKW(c, 'pack') && side) {
    let pk = Math.min(CFG.packMax, s.stack[side].filter((o) => o !== inst).length) + (tf.packBonus ? 1 : 0);
    if (pk) { dice += Math.min(4, pk); add(`+${Math.min(4, pk)} dice pack`, tf.packBonus ? 'terrain' : 'keyword'); }
    reroll = true; add('rerolls misses (pack)', 'keyword');
  }
  if (hasKW(c, 'ambush')) {
    if (tf.ambushOff) add('ambush negated (open terrain)', 'terrain');
    else if (oppCard && (oppCard.mov || 1) >= 4) add('ambush negated (fast prey)', 'keyword');
    else { const ab = 2 + (tf.ambushBonus ? 1 : 0); dice += ab; add(`+${ab} dice ambush`, tf.ambushBonus ? 'terrain' : 'keyword'); }
  }
  if (hasKW(c, 'range')) {
    if (tf.blockRange) add('range blocked (cover)', 'terrain');
    else { dice += 1; first = true; add('+1 die range · strikes first', 'keyword'); }
  }
  if (hasKW(c, 'venom') && tf.venomBonus) { dice += 1; add('+1 die venom (terrain)', 'terrain'); }
  if (tf.aquaticBonus && isAquatic(c)) { dice += 1; add('+1 die aquatic', 'terrain'); }
  if (tf.fastBonus && (c.mov || 1) >= 4) { dice += 1; add('+1 die fast', 'terrain'); }
  if (tf.swarmPenalty && hasKW(c, 'swarm')) { dice -= 1; add('−1 die swarm', 'terrain'); }
  if (tf.toughBonus && hasKW(c, 'tough')) { dice += 1; add('+1 die tough', 'terrain'); }
  if (s.scenario) { const sc = s.scenario.fx(c); if (sc.dice) { dice += sc.dice; add(`${sc.dice > 0 ? '+' : ''}${sc.dice} dice · ${s.scenario.name}`, 'scenario'); } if (sc.thr) { hitOn += sc.thr; add(`${sc.thr > 0 ? '+' : ''}${sc.thr} to hit · ${s.scenario.name}`, 'scenario'); } }
  if (s.cata) { const cm = s.cata.fx(c); if (cm) { const dd = cm > 0 ? Math.ceil(cm / 2) : -Math.ceil(-cm / 2); if (dd) { dice += dd; add(`${dd > 0 ? '+' : ''}${dd} dice · ${s.cata.name}`, 'cata'); } } }
  dice = Math.max(1, dice); hitOn = Math.max(2, Math.min(6, hitOn));
  return { dice, hitOn, power: pw, parts, native, reroll, first };
}
// Who is better suited to (dominates) the current biome — the DS tiebreaker.
export function dominantSide(s: State, aCard: any, dCard: any): Side | null {
  const a = matchedElements(aCard, s.terrain).length, d = matchedElements(dCard, s.terrain).length;
  return a > d ? 'atk' : d > a ? 'def' : null;
}
export const expHits = (p: Profile) => (p.dice * (7 - p.hitOn)) / 6;
export const verdict = (p: Profile): [string, string] => {
  const e = expHits(p);
  return e >= 3 ? ['🔥 Dominant', '#1a8030'] : e >= 2 ? ['💪 Strong', '#3a8030'] : e >= 1.2 ? ['⚖️ Even', '#7a6010'] : ['⚠️ Weak', '#c02018'];
};

function rollPool(p: Profile): Pool {
  const rolls: Pool['rolls'] = []; let hits = 0;
  for (let i = 0; i < p.dice; i++) { const r = rollDie(); const h = r >= p.hitOn; if (h) hits++; rolls.push({ r, h }); }
  if (p.reroll) rolls.forEach((dd) => { if (!dd.h) { const r = rollDie(); dd.r2 = r; if (r >= p.hitOn) { dd.h = true; hits++; } } });
  return { rolls, hits };
}

const FLAVORS: Record<string, string[]> = {
  atk: ['Natural selection in action.', 'The fit feed.', 'It out-competed and out-lived.'],
  def: ['The defender holds the niche.', 'Home-field biology wins.', 'Resilience pays off.'],
  tie: ['Mutually assured digestion.', "Nobody wins the Red Queen's race.", 'Co-extinction — how romantic.'],
};
const flavor = (k: string) => { const a = FLAVORS[k] || []; return a[Math.floor(Math.random() * a.length)] || ''; };

export function setAlloc(s: State, side: Side, meta: number) {
  if (s.winner || !deployTurn(s, side)) return;
  meta = Math.max(0, Math.min(s.energy[side], meta));
  s.alloc[side] = { meta, repro: s.energy[side] - meta };
}
export function selectCard(s: State, side: Side, idx: number) {
  if (s.winner || !deployTurn(s, side)) return;
  const inst = s.stack[side][idx];
  if (!inst || (inst.exhausted && !hasKW(inst.card, 'swarm'))) return;
  s.pending[side] = idx;
}
export function commitActive(s: State) {
  const side: Side | null = s.step === 'p1' ? firstPicker(s) : s.step === 'p2' ? secondPicker(s) : null;
  if (!side || s.pending[side] == null) return;
  s.played[side] = s.pending[side]; s.pending[side] = null;
  s.step = s.step === 'p1' ? 'p2' : 'ready';
}

function applyRepro(s: State, side: Side) {
  let r = s.alloc[side].repro || 0;
  if (s.cata && s.cata.reproDouble) r *= 2;
  const who = sideName(side);
  if (r >= 2) { s.life[side]++; log(s, `🧬 ${who} reproduces — +1 life.`); }
  if (r >= 3) {
    const deck = s.battleType === 'eat' ? EAT : FK;
    const opts = deck.filter((c) => (c.ter || []).includes(s.terrain));
    if (opts.length) { const c = opts[Math.floor(Math.random() * opts.length)]; s.stack[side].push(mkInst(c)); log(s, `🥚 ${who} spawns ${c.art} ${c.n}!`); }
  }
}

export function resolveClash(s: State) {
  if (s.step !== 'ready' || s.played.atk == null || s.played.def == null) return;
  const aInst = s.stack.atk[s.played.atk], dInst = s.stack.def[s.played.def];
  const aC = aInst.card, dC = dInst.card;
  const aP = diceProfile(s, aInst, 'atk', dC), dP = diceProfile(s, dInst, 'def', aC);
  const a = rollPool(aP), d = rollPool(dP);
  let aHits = a.hits, dHits = d.hits;
  if (aP.first && !dP.first && aHits > 0) dHits = Math.max(0, dHits - 1);
  if (dP.first && !aP.first && dHits > 0) aHits = Math.max(0, aHits - 1);
  const dom = dominantSide(s, aC, dC);
  s.lastRoll = { aP, dP, a, d, aHits, dHits, aCard: aC, dCard: dC, dominant: dom };

  let la = 0, ld = 0, msg = '', win = 'tie';
  if (aHits > dHits) { win = 'atk'; ld = 1; aInst.adapt++; msg = `⚔️ ${aC.n} lands ${aHits} hits to ${dHits}.`; if (hasKW(aC, 'venom')) { ld++; msg += ' ☠️ Venom!'; } }
  else if (dHits > aHits) { win = 'def'; la = 1; dInst.adapt++; msg = `🛡️ ${dC.n} lands ${dHits} hits to ${aHits}.`; if (hasKW(dC, 'venom')) { la++; msg += ' ☠️ Venom!'; } }
  else if (dom) { // hit tie → best-suited to the biome dominates
    if (dom === 'atk') { win = 'atk'; ld = 1; aInst.adapt++; msg = `⚔️ ${aHits}–${dHits} tie — 👑 ${aC.n} dominates the biome (better suited).`; }
    else { win = 'def'; la = 1; dInst.adapt++; msg = `🛡️ ${dHits}–${aHits} tie — 👑 ${dC.n} dominates the biome (better suited).`; }
  }
  else if (aP.power !== dP.power) {
    if (aP.power > dP.power) { win = 'atk'; ld = 1; aInst.adapt++; msg = `⚔️ ${aHits}–${dHits} tie — ${aC.n} is the stronger strategy.`; }
    else { win = 'def'; la = 1; dInst.adapt++; msg = `🛡️ ${dHits}–${aHits} tie — ${dC.n} is the stronger strategy.`; }
  } else { la = 1; ld = 1; msg = `💥 Dead heat ${aHits}–${dHits}. Both bleed.`; }
  if (la > 0 && hasKW(aC, 'tough') && !aInst.toughUsed) { aInst.toughUsed = true; la = 0; msg += ' 🪨 Attacker shrugs it off (Tough).'; }
  if (ld > 0 && hasKW(dC, 'tough') && !dInst.toughUsed) { dInst.toughUsed = true; ld = 0; msg += ' 🪨 Defender shrugs it off (Tough).'; }
  s.life.atk -= la; s.life.def -= ld;
  log(s, msg);
  s.outcome = msg + ' — ' + flavor(win);
  s.stack.atk.forEach((i) => (i.exhausted = false)); s.stack.def.forEach((i) => (i.exhausted = false));
  if (!hasKW(aC, 'swarm')) aInst.exhausted = true;
  if (!hasKW(dC, 'swarm')) dInst.exhausted = true;

  if (s.life.atk <= 0 && s.life.def <= 0) { s.winner = 'draw'; s.step = 'over'; return; }
  if (s.life.atk <= 0) { s.winner = 'def'; s.step = 'over'; return; }
  if (s.life.def <= 0) { s.winner = 'atk'; s.step = 'over'; return; }
  s.round++; s.played = { atk: null, def: null }; beginRound(s);
}

export function summonWeirdo(s: State, roll: number) {
  if (s.weirdoUsed) return;
  s.weirdoUsed = true;
  const w = WEIRDO_STACKS[roll];
  w.cards.forEach((c: any) => s.stack.atk.push(mkInst({ ...c, t: 99, rs: 0, fs: 0 }, true)));
  log(s, `🧬 Attacker summons ${w.art} ${w.n} — its ${w.cards.length}-card stack joins the fight!`);
}
export function muster(s: State, id: string) {
  const deck = s.battleType === 'eat' ? EAT : FK;
  const c = deck.find((x) => x.id === id);
  if (!c) return;
  s.musterUsed = true;
  s.stack.def.push(mkInst(c));
  log(s, `🌿 Defender musters ${c.art} ${c.n} into their stack!`);
}
export function concede(s: State, loser: Side) { s.winner = other(loser); s.step = 'over'; }
