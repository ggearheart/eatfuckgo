/* eslint-disable @typescript-eslint/no-explicit-any */
// Left column: the codex. Humboldt's climate zones, and under each the biomes
// that live there with their supplied elements, terrain feature, and the
// strategy cards suited to them. Zones are collapsible to tame the density.
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ZONES, FACTION } from '../game/humboldt';
import { BOARDS, EAT, FK, BIOME_AFFINITY } from '../engine/data';
import { TERRAIN_ELEMENTS, ELEMENTS } from '../engine/elements';

const cardsFor = (code: string) =>
  [...EAT.map((c: any) => ({ ...c, side: 'eat' })), ...FK.map((c: any) => ({ ...c, side: 'fk' }))]
    .filter((c: any) => c.ter?.includes(code));

export function ZonePanel() {
  const [open, setOpen] = useState<Record<string, boolean>>({ [ZONES[0].id]: true });
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  return (
    <div className="rounded-2xl border-2 border-ink bg-white/70 p-2.5 text-left overflow-y-auto" style={{ maxHeight: '74vh' }}>
      <div className="flex items-center gap-2 px-0.5 mb-2">
        <div className="font-black text-sm">🗺️ Zones &amp; niches</div>
        <button onClick={() => setOpen(Object.fromEntries(ZONES.map((z) => [z.id, true])))} className="text-[9px] text-neutral-500 underline">expand</button>
        <button onClick={() => setOpen({})} className="text-[9px] text-neutral-500 underline">collapse</button>
      </div>

      {/* antique herbarium accent — plates from Humboldt & Bonpland's Plantes équinoxiales (1808) */}
      <div className="mb-2 rounded-lg border overflow-hidden" style={{ borderColor: '#c9b597', background: '#efe6d2' }}>
        <div className="flex gap-px">
          {['06', '07', '08'].map((n) => (
            <img key={n} src={`${import.meta.env.BASE_URL}img/plates/plante${n}.jpg`} alt="Humboldt & Bonpland botanical plate"
              loading="lazy" className="w-1/3 h-24 object-cover" style={{ objectPosition: 'center 42%', filter: 'sepia(0.15)' }} />
          ))}
        </div>
        <div className="text-[8px] italic text-neutral-500 text-center py-0.5 px-1">Plantes équinoxiales — Humboldt &amp; Bonpland, 1808 · public domain</div>
      </div>

      {ZONES.map((z) => {
        const isOpen = !!open[z.id];
        return (
          <div key={z.id} className="mb-1.5">
            <button onClick={() => toggle(z.id)}
              className="w-full flex items-center gap-1.5 text-left border-b-2 border-neutral-300 pb-1 hover:bg-black/[0.03] rounded-t px-0.5">
              <span className="text-[10px] text-neutral-500 w-2">{isOpen ? '▾' : '▸'}</span>
              <span className="text-[11px] font-black uppercase tracking-wide text-neutral-600 flex-1">{z.name}</span>
              <span className="text-xs">{z.biomes.map((c) => BOARDS[c].icon).join('')}</span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="pt-1.5">
                    {z.biomes.map((code) => {
                      const b = BOARDS[code];
                      const els = TERRAIN_ELEMENTS[code] || [];
                      const cards = cardsFor(code);
                      return (
                        <div key={code} className="mb-2 pl-0.5">
                          <div className="text-xs font-bold flex items-center gap-1">
                            <span>{b.icon}</span><span>{b.name}</span>
                            <span className="text-[8px] px-1 py-0.5 rounded font-black text-white" title={`Favors ${FACTION[BIOME_AFFINITY[code]].name} (+1 die)`}
                              style={{ background: BIOME_AFFINITY[code] === 'eat' ? '#c4561e' : '#7b4fa0' }}>{FACTION[BIOME_AFFINITY[code]].icon}</span>
                            <span className="text-[11px] ml-auto">{els.map((e) => ELEMENTS[e].icon).join('')}</span>
                          </div>
                          <div className="text-[10px] text-neutral-500 leading-snug mt-0.5">{b.desc}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {cards.map((c: any) => (
                              <span key={c.id + c.side} title={`${c.n} — ${c.side === 'eat' ? 'EAT' : 'F*CK'}`}
                                className="text-[9px] px-1 py-0.5 rounded border font-semibold leading-none"
                                style={{ borderColor: c.side === 'eat' ? '#c4561e' : '#7b4fa0', color: c.side === 'eat' ? '#c4561e' : '#7b4fa0' }}>
                                {c.art} {c.n}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
