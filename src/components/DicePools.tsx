import { motion } from 'framer-motion';
import type { LastRoll } from '../engine/engine';

const FACE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function Pool({ label, color, rolls, hits }: { label: string; color: string; rolls: { r: number; h: boolean; r2?: number }[]; hits: number }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-extrabold text-[11px]" style={{ color }}>{label}</span>
      {rolls.map((d, i) => (
        <motion.span
          key={i}
          initial={{ rotate: -90, scale: 0, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 500, damping: 18 }}
          className="text-xl"
          style={{ color: d.h ? '#1a8030' : '#c9bca8' }}
        >
          {FACE[(d.r2 && d.r2 > d.r ? d.r2 : d.r) - 1]}
        </motion.span>
      ))}
      <b className="ml-auto text-sm">{hits} hits</b>
    </div>
  );
}

export function DicePools({ roll }: { roll: LastRoll }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-2 border-[#e8ddd0] rounded-xl p-2 bg-white">
      <Pool label={`⚔️ ${roll.aP.dice}🎲 hits ${roll.aP.hitOn}+`} color="#c4561e" rolls={roll.a.rolls} hits={roll.aHits} />
      <div className="mt-1">
        <Pool label={`🛡️ ${roll.dP.dice}🎲 hits ${roll.dP.hitOn}+`} color="#7b4fa0" rolls={roll.d.rolls} hits={roll.dHits} />
      </div>
    </motion.div>
  );
}
