/* eslint-disable @typescript-eslint/no-explicit-any */
// Pure battle engine ported from the prototype. Functions mutate the passed
// State (the React reducer clones first), so the UI stays a function of State.
import {
  CFG, EAT, FK, WEIRDO_STACKS, SCENARIOS, BOARDS,
  BIOME_AFFINITY, setCtx, Side,
} from './data';
import { matchedElements, ELEMENTS } from './elements';

export interface Inst { card: any; adapt: number; exhausted: boolean; isWeirdo: boolean }
export type Step = 'scenario' | 'p1' | 'p2' | 'ready' | 'over';
export type PartSrc = 'base' | 'terrain' | 'scenario' | 'energy' | 'lineage';
export interface Part { t: string; src: PartSrc }
export interface Profile { dice: number; hitOn: number; power: number; parts: Part[]; native: boolean; reroll: boolean; first: boolean }
export interface Pool { rolls: { r: number; h: boolean; r2?: number }[]; hits: number }
export interface LastRoll { aP: Profile; dP: Profile; a: Pool; d: Pool; aHits: number; dHits: number; aCard: any; dCard: any; dominant: Side | null }
export interface State {
  battleType: 'eat' | 'fk'; // = fac.atk, kept for overall theming
  fac: { atk: 'eat' | 'fk'; def: 'eat' | 'fk' }; // each side fights as its own faction
  terrain: string; round: number; step: Step;
  life: Record<Side, number>; energy: Record<Side, number>;
  alloc: Record<Side, { meta: number; repro: number }>;
  stack: Record<Side, Inst[]>; played: Record<Side, number | null>; pending: Record<Side, number | null>;
  scenario: any | null; story: string;
  lead: { atk: string | null; def: string | null }; // dominant species' strategy id per side
  species: { atk: string | null; def: string | null }; // dominant species id per side (display)
  adapt: { atk: number; def: number }; // Red Queen adaptation level of each champion at battle start
  weirdoUsed: boolean; musterUsed: boolean; winner: string | null; outcome: string; log: string[];
  lastRoll: LastRoll | null;
}

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

export interface BattleSetup {
  fac: { atk: 'eat' | 'fk'; def: 'eat' | 'fk' };
  terrain: string; atkIds: string[]; defIds: string[];
  lead?: { atk: string | null; def: string | null };     // dominant species' strategy id
  species?: { atk: string | null; def: string | null };  // dominant species id
  adapt?: { atk: number; def: number };                  // champion adaptation levels
}
export function newBattle(setup: BattleSetup): State {
  const { fac, terrain, atkIds, defIds } = setup;
  const deckOf = (f: 'eat' | 'fk') => (f === 'eat' ? EAT : FK);
  const pick = (f: 'eat' | 'fk', ids: string[]) => deckOf(f).filter((c) => ids.includes(c.id)).map((c) => mkInst(c));
  const s: State = {
    battleType: fac.atk, fac, terrain, round: 1, step: 'scenario',
    life: { atk: START_LIFE, def: START_LIFE }, energy: { atk: E, def: E },
    alloc: { atk: { meta: E, repro: 0 }, def: { meta: E, repro: 0 } },
    stack: { atk: pick(fac.atk, atkIds), def: pick(fac.def, defIds) }, played: { atk: null, def: null }, pending: { atk: null, def: null },
    scenario: null, story: '',
    lead: setup.lead ?? { atk: null, def: null },
    species: setup.species ?? { atk: null, def: null },
    adapt: setup.adapt ?? { atk: 0, def: 0 },
    weirdoUsed: false, musterUsed: false, winner: null, outcome: '',
    log: [`⚔️ Biome Clash in ${BOARDS[terrain].name}! Life ${START_LIFE} each.`], lastRoll: null,
  };
  beginRound(s);
  return s;
}

function beginRound(s: State) {
  s.energy = { atk: E, def: E };
  s.alloc = { atk: { meta: E, repro: 0 }, def: { meta: E, repro: 0 } };
  s.scenario = null; s.story = ''; s.pending = { atk: null, def: null };
  s.step = 'scenario';
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

const basePower = (i: Inst, bt: 'eat' | 'fk') => (bt === 'eat' ? i.card.off : i.card.rep) + (i.adapt || 0);

export function diceProfile(s: State, inst: Inst, side: Side | null, oppCard: any | null): Profile {
  const bt = side ? s.fac[side] : s.battleType;
  setCtx(bt, s.terrain);
  const c = inst.card, pw = basePower(inst, bt);
  let dice = Math.max(1, Math.ceil(pw / 2) + 2);
  let hitOn = Math.max(2, Math.min(6, 6 - Math.floor((c.ada || 0) / 3)));
  const parts: Part[] = [];
  const add = (t: string, src: Part['src']) => parts.push({ t, src });
  add(`${dice} dice (power ${pw})`, 'base');
  add(`hits ${hitOn}+ (ADA ${c.ada})`, 'base');
  if (BIOME_AFFINITY[s.terrain] === bt) { dice += 1; add(`+1 die · biome favors ${bt === 'eat' ? 'EAT' : 'F*CK'}`, 'terrain'); }
  const reroll = false, first = false;
  const native = (c.ter || []).includes(s.terrain);
  // Element-matching dominance: suits the biome's elements → +1 die each; unsuited → −1
  const matched = matchedElements(c, s.terrain);
  if (matched.length) { dice += matched.length; add(`+${matched.length} dice · suits ${matched.map((e) => ELEMENTS[e].icon).join('')}`, 'terrain'); }
  else { dice -= 1; add('−1 die · unsuited to biome', 'terrain'); }
  // dominant species: champion bonus, eroded by Red Queen adaptation (2 − level)
  if (side && s.lead[side] === c.id) {
    const lvl = s.adapt[side] || 0;
    const bonus = 2 - lvl;
    dice += bonus;
    add(`${bonus >= 0 ? '+' : ''}${bonus} dice · 👑 dominant${lvl ? ` (adapted ×${lvl})` : ' species'}`, 'lineage');
  }
  if (side) {
    let lin = 0;
    s.stack[side].forEach((o) => { if (o !== inst && o.card.t < c.t && (o.card.ter || []).some((t: string) => (c.ter || []).includes(t))) lin++; });
    lin = Math.min(CFG.lineageMax, lin);
    if (lin) { const d = Math.min(2, Math.ceil(lin / 2)); dice += d; add(`+${d} die lineage`, 'lineage'); }
  }
  if (s.scenario) { const sc = s.scenario.fx(c); if (sc.dice) { dice += sc.dice; add(`${sc.dice > 0 ? '+' : ''}${sc.dice} dice · ${s.scenario.name}`, 'scenario'); } if (sc.thr) { hitOn += sc.thr; add(`${sc.thr > 0 ? '+' : ''}${sc.thr} to hit · ${s.scenario.name}`, 'scenario'); } }
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
  if (!inst || inst.exhausted) return;
  s.pending[side] = idx;
}
export function commitActive(s: State) {
  const side: Side | null = s.step === 'p1' ? firstPicker(s) : s.step === 'p2' ? secondPicker(s) : null;
  if (!side || s.pending[side] == null) return;
  s.played[side] = s.pending[side]; s.pending[side] = null;
  s.step = s.step === 'p1' ? 'p2' : 'ready';
}

function applyRepro(s: State, side: Side) {
  const r = s.alloc[side].repro || 0;
  const who = sideName(side);
  if (r >= 2) { s.life[side]++; log(s, `🧬 ${who} reproduces — +1 life.`); }
  if (r >= 3) {
    const deck = s.fac[side] === 'eat' ? EAT : FK;
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
  if (aHits > dHits) { win = 'atk'; ld = 1; aInst.adapt++; msg = `⚔️ ${aC.n} lands ${aHits} hits to ${dHits}.`; }
  else if (dHits > aHits) { win = 'def'; la = 1; dInst.adapt++; msg = `🛡️ ${dC.n} lands ${dHits} hits to ${aHits}.`; }
  else if (dom) { // hit tie → best-suited to the biome dominates
    if (dom === 'atk') { win = 'atk'; ld = 1; aInst.adapt++; msg = `⚔️ ${aHits}–${dHits} tie — 👑 ${aC.n} dominates the biome (better suited).`; }
    else { win = 'def'; la = 1; dInst.adapt++; msg = `🛡️ ${dHits}–${aHits} tie — 👑 ${dC.n} dominates the biome (better suited).`; }
  }
  else if (aP.power !== dP.power) {
    if (aP.power > dP.power) { win = 'atk'; ld = 1; aInst.adapt++; msg = `⚔️ ${aHits}–${dHits} tie — ${aC.n} is the stronger strategy.`; }
    else { win = 'def'; la = 1; dInst.adapt++; msg = `🛡️ ${dHits}–${aHits} tie — ${dC.n} is the stronger strategy.`; }
  } else { la = 1; ld = 1; msg = `💥 Dead heat ${aHits}–${dHits}. Both bleed.`; }
  s.life.atk -= la; s.life.def -= ld;
  log(s, msg);
  s.outcome = msg + ' — ' + flavor(win);
  s.stack.atk.forEach((i) => (i.exhausted = false)); s.stack.def.forEach((i) => (i.exhausted = false));
  aInst.exhausted = true;
  dInst.exhausted = true;

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
  const deck = s.fac.def === 'eat' ? EAT : FK;
  const c = deck.find((x) => x.id === id);
  if (!c) return;
  s.musterUsed = true;
  s.stack.def.push(mkInst(c));
  log(s, `🌿 Defender musters ${c.art} ${c.n} into their stack!`);
}
export function concede(s: State, loser: Side) { s.winner = other(loser); s.step = 'over'; }
