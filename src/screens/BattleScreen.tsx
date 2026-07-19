/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dispatch } from 'react';
import type { State } from '../engine/engine';
import type { Action } from '../store';
import type { Side } from '../engine/data';
import { BOARDS, TERRAIN_FX, CFG, WEIRDO_STACKS, EAT, FK, kwOf } from '../engine/data';
import {
  roller, firstPicker, secondPicker, deployTurn, diceProfile, expHits, sideName,
} from '../engine/engine';
import { ELEMENTS, TERRAIN_ELEMENTS, matchedElements, matchCount } from '../engine/elements';
import { CardArt, KwTags } from '../components/CardArt';
import { ModChips, ModLegend } from '../components/ModChips';
import { LifeTrack } from '../components/LifeTrack';
import { DicePools } from '../components/DicePools';
import { CardModal } from '../components/CardModal';

const CATA_ROUND = 3;

export function BattleScreen({ state: s, dispatch, onNewRandom, onExit, mapMode, biomeName, attackerName, defenderName, onClaim }: {
  state: State; dispatch: Dispatch<Action>; onNewRandom: () => void; onExit: () => void;
  mapMode?: boolean; biomeName?: string; attackerName?: string; defenderName?: string; onClaim?: () => void;
}) {
  const [inspect, setInspect] = useState<{ side: Side; idx: number } | null>(null);
  const theme = s.battleType;
  const accent = theme === 'eat' ? '#c4561e' : '#7b4fa0';
  const b = BOARDS[s.terrain];
  const scenarioSet = !!s.scenario;
  const deploying = s.step === 'p1' || s.step === 'p2';
  const activeSide: Side | null = s.step === 'p1' ? firstPicker(s) : s.step === 'p2' ? secondPicker(s) : null;

  const steps = [
    { cls: 'done', n: '① Terrain', sub: 'sets the stage' },
    { cls: s.step === 'catacheck' || s.step === 'scenario' ? 'active' : 'done', n: '② Scenario', sub: 'rolled each round' },
    { cls: deploying || s.step === 'ready' ? 'active' : '', n: '③ Choose strategy', sub: 'best for terrain + scenario' },
    { cls: s.cata ? 'done' : s.step === 'catacheck' ? 'active' : s.cataChecked ? 'done' : '', n: '☄️ Catastrophe', sub: s.cata ? `${s.cata.name} struck` : s.cataChecked ? 'none — terrain rules' : `round ${CATA_ROUND}: matched dice` },
  ];

  const stepStyle = (cls: string) =>
    cls === 'active' ? { borderColor: accent, background: theme === 'eat' ? '#fdf0ea' : '#f3ecfa', color: '#1a0e04' } :
    cls === 'done' ? { borderColor: '#3a7a4a', background: '#eef7f0', color: '#3a7a4a' } :
    { borderColor: '#e8ddd0', background: '#fff', color: '#9a8878' };

  return (
    <div className="min-h-full py-4 px-2">
      <div className="mx-auto max-w-[1000px] rounded-2xl border-4 p-3 sm:p-4"
        style={{ borderColor: accent, background: theme === 'eat' ? 'linear-gradient(#fbeee5,#fffdf9)' : 'linear-gradient(#f3ecfa,#fffdf9)' }}>

        <div className="flex items-center gap-3 mb-3">
          <div className="font-display text-2xl"><span className="text-eat">EAT</span> <span className="text-fk">FUCK</span> GO</div>
          {mapMode && <div className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg" style={{ background: '#fffdf3', border: '2px solid #d4a017' }}>⚔️ {attackerName} contests {biomeName}</div>}
          <div className="ml-auto flex gap-2">
            {mapMode ? (
              <button onClick={onExit} className="text-xs font-bold px-3 py-1 rounded-lg border-2 border-ink bg-white">↩ Abandon</button>
            ) : (
              <>
                <button onClick={onNewRandom} className="text-xs font-bold px-3 py-1 rounded-lg border-2 border-ink bg-white">↺ New</button>
                <button onClick={onExit} className="text-xs font-bold px-3 py-1 rounded-lg border-2 border-ink bg-white">⌂ Home</button>
              </>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="flex gap-1.5 flex-wrap mb-2.5">
          {steps.map((st, i) => (
            <div key={i} className="flex-1 min-w-[120px] px-2.5 py-1.5 rounded-xl border-2 leading-tight" style={stepStyle(st.cls)}>
              <b className="block text-[11px]">{st.n}</b>
              <span className="text-[9px] font-semibold">{st.sub}</span>
            </div>
          ))}
        </div>

        {/* Set variables */}
        <div className="flex gap-2 flex-wrap mb-2.5 text-[11px]">
          <Chip on style={{ borderColor: '#3a7a4a', background: '#eef7f0' }}>{b.icon} Terrain: <b>{b.name}</b> <span className="text-sm">{(TERRAIN_ELEMENTS[s.terrain] || []).map((e) => ELEMENTS[e].icon).join('')}</span><br /><span className="text-[9px] text-neutral-500">supplies {(TERRAIN_ELEMENTS[s.terrain] || []).map((e) => ELEMENTS[e].name).join(', ')}</span></Chip>
          <Chip on={scenarioSet} style={scenarioSet ? { borderColor: '#2a6aa0', background: '#eef4fb' } : {}}>{scenarioSet ? <>{s.scenario.icon} Scenario: <b>{s.scenario.name}</b><br /><span className="text-[9px] text-neutral-500">{s.scenario.tag}</span></> : <>🎲 Scenario: <b>— not yet rolled</b></>}</Chip>
          <Chip on={!!s.cata} style={s.cata ? { borderColor: '#e02418', background: '#fdeeec' } : {}}>{s.cata ? <>{s.cata.icon} Catastrophe: <b>{s.cata.name}</b><br /><span className="text-[9px] text-neutral-500">{s.cata.head}</span></> : s.cataChecked ? <>🍃 Catastrophe: <b>none</b></> : <>☄️ Catastrophe: <b>checked round {CATA_ROUND}</b></>}</Chip>
          <Chip on style={{ marginLeft: 'auto', borderColor: accent }}>Round <b>{s.round}</b><br /><span className="text-[9px]">{theme === 'eat' ? '🦷 EAT · Power=OFF' : '🧬 F*CK · Power=REP'}</span></Chip>
        </div>

        {/* Action: scenario roll or catastrophe check */}
        {s.step === 'catacheck' ? (
          <CataCheck s={s} dispatch={dispatch} />
        ) : (
          <div className="rounded-xl border-2 p-3 mb-2.5 text-[#dff]" style={{ background: theme === 'eat' ? '#3a1c0e' : '#241433', borderColor: accent }}>
            <div className="flex items-center gap-2.5 flex-wrap">
              {scenarioSet ? (
                <span className="text-sm font-black">{s.scenario.icon} {s.scenario.name} <span className="text-[11px] font-semibold text-[#9cf]">— {s.scenario.tag}</span></span>
              ) : (
                <>
                  <span className="text-sm font-black">🎲 {sideName(roller(s))} rolls the round's scenario</span>
                  <button onClick={() => dispatch({ t: 'rollScenario' })} className="px-3.5 py-1.5 rounded-lg border-2 border-black bg-[#ffd21a] text-ink text-xs font-black">🎲 Roll Scenario</button>
                </>
              )}
            </div>
            <div className="text-[12px] mt-1.5 italic text-[#cfe8ff]">{scenarioSet ? s.story : 'Each round the terrain throws a fresh challenge. Roll to reveal what this one demands…'}</div>
          </div>
        )}

        {/* Persistent catastrophe banner */}
        {s.cata && s.step !== 'catacheck' && (
          <div className="flex items-center gap-2.5 rounded-xl border-2 border-[#e02418] bg-[#2a0e0e] text-[#ffd2c0] px-4 py-2.5 mb-3">
            <span className="text-2xl">{s.cata.icon}</span>
            <span><b className="text-[#ff7a6a]">{s.cata.name}</b> — {s.cata.head} <span className="text-[#d8a] text-[10px]">(rest of battle)</span></span>
          </div>
        )}

        {/* Life + energy */}
        <div className="flex gap-3 mb-2.5">
          <SidePanel side="atk" s={s} accent="#c4561e" tint="#fdf0ea" />
          <SidePanel side="def" s={s} accent="#7b4fa0" tint="#f5f0ff" />
        </div>

        {/* Arena */}
        <div className="grid grid-cols-[1fr_84px_1fr] gap-2.5 items-stretch mb-2.5">
          <ArenaSlot side="atk" s={s} onInspect={setInspect} />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="font-black text-neutral-500 text-lg">VS</div>
            {deploying ? (
              <button disabled={!(activeSide && s.pending[activeSide] != null)} onClick={() => dispatch({ t: 'commit' })}
                className="w-full py-2 rounded-lg border-2 border-black text-white text-[11px] font-extrabold disabled:opacity-40" style={{ background: '#1e7a40' }}>
                {activeSide && s.pending[activeSide] != null ? `✓ Commit ${s.stack[activeSide][s.pending[activeSide]!].card.n.split(' ')[0]}` : '✓ Commit'}
              </button>
            ) : (
              <button disabled={s.step !== 'ready'} onClick={() => dispatch({ t: 'resolve' })}
                className="w-full py-2 rounded-lg border-2 border-black text-white text-[11px] font-extrabold disabled:opacity-40" style={{ background: accent }}>🎲 Resolve</button>
            )}
          </div>
          <ArenaSlot side="def" s={s} onInspect={setInspect} />
        </div>

        <DominanceBanner s={s} />
        {(s.played.atk != null || s.played.def != null || s.pending.atk != null || s.pending.def != null) && <ModLegend />}

        {/* Dice pools */}
        <AnimatePresence>{s.lastRoll && <div className="mb-2"><DicePools roll={s.lastRoll} /></div>}</AnimatePresence>

        {/* Outcome + prompt */}
        {s.outcome && <div className="text-center text-[13px] font-extrabold mb-1">{s.outcome}</div>}
        <div className="text-center text-[12px] font-bold text-neutral-500 mb-2.5">{prompt(s)}</div>

        {/* Options */}
        <div className="flex gap-2 justify-center flex-wrap mb-3">
          {s.round > 2 && !s.weirdoUsed && !s.winner && <WeirdoBtn s={s} dispatch={dispatch} />}
          {s.round > 4 && !s.musterUsed && s.life.def > 0 && !s.winner && <MusterBtn s={s} dispatch={dispatch} />}
          <button onClick={() => dispatch({ t: 'concede', loser: 'atk' })} className="px-3.5 py-1.5 rounded-lg border-2 border-neutral-300 bg-white text-neutral-500 text-[11px] font-bold">🏳️ Concede</button>
        </div>

        {/* Hands */}
        <div className="grid grid-cols-2 gap-3">
          {(['atk', 'def'] as Side[]).map((side) => (
            <div key={side}>
              <div className={`font-extrabold text-[11px] uppercase tracking-wide mb-1.5 ${side === 'atk' ? 'text-eat' : 'text-fk'}`}>
                {side === 'atk' ? '⚔️ Attacker' : '🛡️ Defender'}'s Stack
              </div>
              <Hand side={side} s={s} onInspect={setInspect} />
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {inspect && (
          <CardModal state={s} side={inspect.side} idx={inspect.idx}
            onClose={() => setInspect(null)}
            onDeploy={() => { dispatch({ t: 'select', side: inspect.side, idx: inspect.idx }); setInspect(null); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>{s.winner && <ResultOverlay s={s} onNewRandom={onNewRandom} onExit={onExit} onClaim={onClaim} biomeName={biomeName} attackerName={attackerName} defenderName={defenderName} />}</AnimatePresence>
    </div>
  );
}

function prompt(s: State) {
  if (s.step === 'catacheck') return `☄️ Round ${CATA_ROUND} — roll for a catastrophe.`;
  if (s.step === 'scenario') return `🎲 ${sideName(roller(s))} rolls the scenario first.`;
  if (s.step === 'p1') return `${sideName(firstPicker(s))} deploys first — tap a strategy to preview, then ✓ Commit (or tap another to swap).`;
  if (s.step === 'p2') return `${sideName(secondPicker(s))} responds — preview, swap freely, then ✓ Commit.`;
  if (s.step === 'ready') return '⚡ Both committed — Resolve: each strategy rolls its dice.';
  return '';
}

function Chip({ children, on, style }: any) {
  return <div className="px-3 py-1.5 rounded-xl border-2 bg-white text-[#4a3820]" style={{ borderColor: on ? undefined : '#e8ddd0', ...style }}>{children}</div>;
}

function SidePanel({ side, s, accent, tint }: { side: Side; s: State; accent: string; tint: string }) {
  return (
    <div className="flex-1 text-center rounded-xl border-2 p-2" style={{ borderColor: accent, background: tint }}>
      <div className="font-black text-[13px]" style={{ color: accent }}>{side === 'atk' ? '⚔️ Attacker' : '🛡️ Defender'}</div>
      <LifeTrack life={s.life[side]} start={CFG.startLife} battleType={s.battleType} />
    </div>
  );
}

function ArenaSlot({ side, s, onInspect }: { side: Side; s: State; onInspect: (v: { side: Side; idx: number }) => void }) {
  const committed = s.played[side] != null;
  const previewing = !committed && deployTurn(s, side) && s.pending[side] != null;
  const idx = committed ? s.played[side]! : previewing ? s.pending[side]! : null;
  const isAtk = side === 'atk';
  const tint = isAtk ? '#fdf0ea' : '#f5f0ff';
  const accent = isAtk ? '#c4561e' : '#7b4fa0';
  if (idx == null) {
    return (
      <div className="rounded-xl border-2 border-dashed border-neutral-300 min-h-[150px] flex flex-col items-center justify-center text-center p-2.5 bg-white text-neutral-500 text-[11px]">
        {isAtk ? '⚔️ Attacker' : '🛡️ Defender'}<br />—{deployTurn(s, side) && <span className="text-[9px]"><br />tap a strategy below to preview</span>}
      </div>
    );
  }
  const inst = s.stack[side][idx];
  const oppSide: Side = isAtk ? 'def' : 'atk';
  const oppIdx = s.played[oppSide];
  const oppCard = oppIdx != null ? s.stack[oppSide][oppIdx].card : null;
  const p = diceProfile(s, inst, side, oppCard);
  const myElems = matchedElements(inst.card, s.terrain);
  const myMatch = myElems.length;
  const terrTotal = (TERRAIN_ELEMENTS[s.terrain] || []).length;
  const oppMatch = oppCard ? matchedElements(oppCard, s.terrain).length : -1;
  const dominant = !!oppCard && myMatch > oppMatch;
  const fitColor = myMatch >= terrTotal && myMatch > 0 ? '#1a8030' : myMatch > 0 ? '#a06a10' : '#c02018';
  return (
    <motion.div layout initial={{ scale: 0.8, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
      onClick={() => previewing && onInspect({ side, idx })}
      className="rounded-xl border-2 min-h-[150px] flex flex-col items-center justify-center text-center p-2.5 cursor-pointer"
      style={{ background: tint, borderColor: accent, outline: dominant ? '3px solid #d4a017' : previewing ? '3px dashed #f0c000' : 'none' }}>
      {previewing && <div className="text-[8px] font-black tracking-wide text-[#a07000] bg-[#fff3c4] border border-[#d4b020] rounded px-1.5 mb-0.5">PREVIEW · tap to inspect / swap</div>}
      {dominant && <div className="text-[9px] font-black tracking-wide text-white bg-[#d4a017] rounded px-2 py-0.5 mb-0.5">👑 DOMINATES THIS BIOME</div>}
      <CardArt card={inst.card} size={56} battleType={s.battleType} />
      <div className="text-[12px] font-black leading-tight mt-1">{inst.card.n}{inst.isWeirdo ? ' 🧬' : ''}</div>
      <div className="text-[10px] font-extrabold mt-0.5" style={{ color: fitColor }}>
        🏞️ Biome fit {myMatch}/{terrTotal} {myElems.map((e) => ELEMENTS[e].icon).join('') || '—'}
      </div>
      <div className="text-2xl font-black">🎲{p.dice}</div>
      <div className="text-[10px] font-extrabold text-neutral-500">hits on {p.hitOn}+ · ~{expHits(p).toFixed(1)} hits</div>
      <div className="mt-1 w-full"><ModChips parts={p.parts} /></div>
      <div className="mt-1"><KwTags card={inst.card} /></div>
    </motion.div>
  );
}

function arenaInst(s: State, side: Side) {
  const i = s.played[side] != null ? s.played[side] : (deployTurn(s, side) ? s.pending[side] : null);
  return i != null ? s.stack[side][i] : null;
}
function DominanceBanner({ s }: { s: State }) {
  const a = arenaInst(s, 'atk'), d = arenaInst(s, 'def');
  if (!a || !d) return null;
  const total = (TERRAIN_ELEMENTS[s.terrain] || []).length;
  const am = matchCount(a.card, s.terrain), dm = matchCount(d.card, s.terrain);
  const dom: Side | null = am > dm ? 'atk' : dm > am ? 'def' : null;
  const b = BOARDS[s.terrain];
  return (
    <div className="text-center text-[12px] font-bold rounded-lg border-2 py-1.5 my-1.5 px-2" style={{ borderColor: '#d4a017', background: '#fffdf3' }}>
      {dom ? (
        <><b style={{ color: dom === 'atk' ? '#c4561e' : '#7b4fa0' }}>👑 {dom === 'atk' ? 'Attacker' : 'Defender'}'s {(dom === 'atk' ? a : d).card.n} dominates {b.name}</b>
        {' '}— best suited ({dom === 'atk' ? am : dm}/{total} vs {dom === 'atk' ? dm : am}/{total} elements). Wins clash ties.</>
      ) : (
        <>⚖️ Suitability tie — both fit {am}/{total} of {b.name}'s elements. Neither dominates; dice &amp; Power decide.</>
      )}
    </div>
  );
}
function Hand({ side, s, onInspect }: { side: Side; s: State; onInspect: (v: { side: Side; idx: number }) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      {s.stack[side].map((inst, i) => {
        const p = diceProfile(s, inst, side, null);
        const exhausted = inst.exhausted && !kwOf(inst.card).includes('swarm');
        const previewing = deployTurn(s, side) && s.pending[side] === i;
        return (
          <motion.div key={i} layout whileHover={{ x: 3 }} onClick={() => onInspect({ side, idx: i })}
            className="flex items-center gap-2 p-1.5 rounded-lg border-2 bg-white cursor-pointer text-[11px]"
            style={{ borderColor: previewing ? '#f0c000' : '#e8ddd0', background: previewing ? '#fffaee' : '#fff', opacity: exhausted ? 0.4 : 1 }}>
            <CardArt card={inst.card} size={30} battleType={s.battleType} />
            <span className="font-extrabold flex-1 leading-tight">
              {inst.card.n}{inst.isWeirdo ? ' 🧬' : ''}{inst.adapt ? <span className="text-[#1a8030]"> +{inst.adapt}</span> : ''}
              {previewing ? <span className="text-[#a07000] text-[9px] font-black"> ◀ previewing</span> : ''}
              <br /><KwTags card={inst.card} />
            </span>
            <span className="font-black text-right">🎲{p.dice}<br /><span className="text-[8px] text-neutral-500">{p.hitOn}+</span></span>
          </motion.div>
        );
      })}
    </div>
  );
}

function CataCheck({ s, dispatch }: { s: State; dispatch: Dispatch<Action> }) {
  const FACE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  return (
    <div className="rounded-xl border-2 border-[#e02418] bg-[#2a0e0e] text-[#ffd2c0] px-4 py-3 mb-2.5 text-center">
      <div className="text-sm font-black text-[#ff9a6a]">☄️ Round {CATA_ROUND} — Catastrophe Check!</div>
      <div className="text-[11px] my-1.5">Both players roll 1d6. <b>Match the number → a catastrophe warps the rest of the battle.</b> No match → terrain &amp; scenario rule.</div>
      <div className="text-3xl my-1.5 min-h-[34px]">
        {s.cataChecked && s.cataDice ? <><span className="text-eat">⚔️ {FACE[s.cataDice.a - 1]}</span> &nbsp; <span className="text-fk">🛡️ {FACE[s.cataDice.d - 1]}</span></> : '⚔️ ❓ 🛡️ ❓'}
      </div>
      {s.cataChecked && (
        <div className="text-[12px] font-extrabold mb-1.5">
          {s.cata ? <span className="text-[#ff7a6a]">☄️ MATCH on {s.cataDice!.a}! {s.cata.icon} <b>{s.cata.name}</b> — {s.cata.head}</span>
            : <span className="text-[#bfe8c4]">🍃 {s.cataDice!.a} ≠ {s.cataDice!.d} — no catastrophe. Carry on.</span>}
        </div>
      )}
      {!s.cataChecked
        ? <button onClick={() => dispatch({ t: 'rollCata' })} className="px-4 py-1.5 rounded-lg border-2 border-black bg-[#ffd21a] text-ink text-[13px] font-black">🎲 Roll Both Dice</button>
        : <button onClick={() => dispatch({ t: 'proceedCata' })} className="px-4 py-1.5 rounded-lg border-2 border-black bg-[#ffd21a] text-ink text-[13px] font-black">Continue →</button>}
    </div>
  );
}

function WeirdoBtn({ s, dispatch }: { s: State; dispatch: Dispatch<Action> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="px-3.5 py-1.5 rounded-lg border-2 border-black bg-fk text-white text-[11px] font-extrabold">🧬 Summon Weirdo</button>
      <AnimatePresence>{open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="bg-white rounded-2xl border-2 border-ink p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <h3 className="font-black mb-2">🧬 Summon a Weirdo (brings a 3-card stack)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.keys(WEIRDO_STACKS).map((roll) => {
                const w = WEIRDO_STACKS[roll];
                return (
                  <button key={roll} onClick={() => { dispatch({ t: 'summon', roll: Number(roll) }); setOpen(false); }}
                    className="border-2 border-ink rounded-lg p-2 text-left hover:bg-neutral-50">
                    <div className="text-2xl">{w.art}</div>
                    <div className="font-extrabold text-xs">{w.n}</div>
                    <div className="text-[9px] text-neutral-500">{w.cards.map((c: any) => c.n).join(' · ')}</div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </>
  );
}

function MusterBtn({ s, dispatch }: { s: State; dispatch: Dispatch<Action> }) {
  const [open, setOpen] = useState(false);
  const deck = s.battleType === 'eat' ? EAT : FK;
  const have = new Set(s.stack.def.map((i: any) => i.card.id));
  const opts = deck.filter((c: any) => (c.ter || []).includes(s.terrain) && !have.has(c.id));
  return (
    <>
      <button onClick={() => setOpen(true)} className="px-3.5 py-1.5 rounded-lg border-2 border-black bg-[#1e7a40] text-white text-[11px] font-extrabold">🌿 Muster Strategy</button>
      <AnimatePresence>{open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="bg-white rounded-2xl border-2 border-ink p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <h3 className="font-black mb-2">🌿 Muster a terrain-native strategy</h3>
            {opts.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {opts.map((c: any) => (
                  <button key={c.id} onClick={() => { dispatch({ t: 'muster', id: c.id }); setOpen(false); }} className="border-2 border-ink rounded-lg p-2 text-left hover:bg-neutral-50">
                    <div className="text-2xl">{c.art}</div>
                    <div className="font-extrabold text-xs">{c.n}</div>
                  </button>
                ))}
              </div>
            ) : <div className="text-sm text-neutral-500">No new terrain-native strategies available.</div>}
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </>
  );
}

function ResultOverlay({ s, onNewRandom, onExit, onClaim, biomeName, attackerName, defenderName }: {
  s: State; onNewRandom: () => void; onExit: () => void; onClaim?: () => void; biomeName?: string; attackerName?: string; defenderName?: string;
}) {
  const win = s.winner;
  const banner = win === 'atk' ? '⚔️ Attacker Wins the Clash!' : win === 'def' ? '🛡️ Defender Holds!' : '💀 Mutual Collapse';
  const winnerName = win === 'draw' ? null : win === 'atk' ? attackerName : (defenderName ?? 'Defender');
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="bg-white rounded-2xl border-2 border-ink p-6 text-center max-w-md w-full" initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
        <div className="font-display text-2xl mb-1">{banner}</div>
        <div className="text-sm text-neutral-500 mb-4">Final life — Attacker {Math.max(0, s.life.atk)} · Defender {Math.max(0, s.life.def)}.</div>
        {onClaim ? (
          <>
            <div className="text-[13px] font-bold mb-4">
              {win === 'draw' ? `No one claims ${biomeName} — the niche stays contested.` : `👑 ${winnerName} claims ${biomeName}!`}
            </div>
            <button onClick={onClaim} className="px-5 py-2.5 rounded-lg border-2 border-ink text-white font-extrabold" style={{ background: '#d4a017' }}>🏳️ Return to the map</button>
          </>
        ) : (
          <div className="flex gap-2 justify-center">
            <button onClick={onNewRandom} className="px-4 py-2 rounded-lg border-2 border-ink bg-eat text-white font-extrabold">⚡ New Battle</button>
            <button onClick={onExit} className="px-4 py-2 rounded-lg border-2 border-ink bg-white font-extrabold">⌂ Home</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
