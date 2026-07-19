/* eslint-disable @typescript-eslint/no-explicit-any */
// Left column: the codex. Humboldt's climate zones, and under each the biomes
// that live there with their supplied elements, terrain feature, and the
// strategy cards suited to them.
import { ZONES } from '../game/humboldt';
import { BOARDS, EAT, FK } from '../engine/data';
import { TERRAIN_ELEMENTS, ELEMENTS } from '../engine/elements';

const cardsFor = (code: string) =>
  [...EAT.map((c: any) => ({ ...c, side: 'eat' })), ...FK.map((c: any) => ({ ...c, side: 'fk' }))]
    .filter((c: any) => c.ter?.includes(code));

export function ZonePanel() {
  return (
    <div className="rounded-2xl border-2 border-ink bg-white/70 p-2.5 text-left overflow-y-auto" style={{ maxHeight: '74vh' }}>
      <div className="font-black text-sm px-0.5 mb-2">🗺️ Zones &amp; niches</div>
      {ZONES.map((z) => (
        <div key={z.id} className="mb-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-600 border-b-2 border-neutral-300 pb-0.5 mb-1.5">{z.name}</div>
          {z.biomes.map((code) => {
            const b = BOARDS[code];
            const els = TERRAIN_ELEMENTS[code] || [];
            const cards = cardsFor(code);
            return (
              <div key={code} className="mb-2 pl-0.5">
                <div className="text-xs font-bold flex items-center gap-1">
                  <span>{b.icon}</span><span>{b.name}</span>
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
      ))}
    </div>
  );
}
