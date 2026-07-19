/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import { CardArt } from './CardArt';
import { ModChips } from './ModChips';
import { BOARDS, facOfCard } from '../engine/data';
import { diceProfile, expHits, verdict, deployTurn } from '../engine/engine';
import type { State } from '../engine/engine';
import type { Side } from '../engine/data';

export function CardModal({ state, side, idx, onClose, onDeploy }: {
  state: State; side: Side; idx: number; onClose: () => void; onDeploy: () => void;
}) {
  const inst = state.stack[side][idx];
  const c = inst.card;
  const oppSide: Side = side === 'atk' ? 'def' : 'atk';
  const oppIdx = state.played[oppSide];
  const oppCard = oppIdx != null ? state.stack[oppSide][oppIdx].card : null;
  const p = diceProfile(state, inst, side, oppCard);
  const [vLabel, vColor] = verdict(p);
  const terNames = (c.ter || []).map((t: string) => (BOARDS[t] || { name: t }).name).join(', ') || '—';
  const powStat = facOfCard(c) === 'eat' ? `OFF ${c.off}` : `REP ${c.rep}`;
  const canDeploy = deployTurn(state, side) && !inst.exhausted;
  const sc = state.scenario ? `${state.scenario.icon} ${state.scenario.name}` : 'no scenario yet';

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="bg-white rounded-2xl border-2 border-ink shadow-comic max-w-md w-full p-4"
        onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}>
        <div className="flex items-center gap-3 mb-1">
          <CardArt card={c} size={72} battleType={state.battleType} />
          <div>
            <div className="text-[17px] font-black">{c.n}{inst.isWeirdo ? ' 🧬' : ''}</div>
            <div className="text-[10px] text-neutral-500">{powStat} (Power) · ADA {c.ada} · DEF {c.def} · MOV {c.mov}{inst.adapt ? ` · adapted +${inst.adapt}` : ''}</div>
          </div>
        </div>
        <div className="text-[11px] leading-relaxed text-[#4a3820] bg-[#fffaee] border-2 border-[#e8ddd0] rounded-lg p-2">
          <b>How it works</b><br />Native to: <b>{terNames}</b>.<br />
          It lives or dies on raw stats, the right biome, and this round's scenario.
        </div>
        <div className="text-[12px] leading-relaxed mt-2 rounded-lg p-2 bg-white border-2" style={{ borderColor: vColor }}>
          <b style={{ color: vColor }}>This round vs {BOARDS[state.terrain].name} · {sc}: {vLabel}</b><br />
          Rolls <b>{p.dice} dice</b>, hits on <b>{p.hitOn}+</b> → expected <b>{expHits(p).toFixed(1)} hits</b>.
          <div className="mt-1.5"><ModChips parts={p.parts} hideBase={false} /></div>
        </div>
        <div className="mt-3 flex gap-2 justify-end">
          {canDeploy && (
            <button className="px-3 py-1.5 rounded-lg border-2 border-ink bg-eat text-white text-xs font-extrabold" onClick={onDeploy}>▲ Preview in arena</button>
          )}
          <button className="px-3 py-1.5 rounded-lg border-2 border-ink bg-white text-xs font-extrabold" onClick={onClose}>Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
