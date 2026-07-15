import { motion, AnimatePresence } from 'framer-motion';

export function LifeTrack({ life, start, battleType }: { life: number; start: number; battleType: 'eat' | 'fk' }) {
  const full = battleType === 'eat' ? '🍩' : '🥚';
  const n = Math.max(0, life);
  const items = Array.from({ length: Math.max(n, start) }, (_, i) => ({ i, alive: i < n }));
  return (
    <div className="flex items-center justify-center gap-[2px] text-lg min-h-[26px]">
      <AnimatePresence mode="popLayout">
        {items.map(({ i, alive }) => (
          <motion.span
            key={i}
            layout
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: alive ? 1 : 0.85, opacity: alive ? 1 : 0.35, filter: alive ? 'none' : 'grayscale(1)' }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {alive ? full : '◯'}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
