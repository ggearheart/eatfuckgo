/* eslint-disable @typescript-eslint/no-explicit-any */
import { BOARDS } from '../engine/data';
import { TERRAIN_ELEMENTS, ELEMENTS } from '../engine/elements';
import { BIOME_DATA } from '../game/biomeData';
import { zoneOf } from '../game/humboldt';

// A Humboldt "data column" for one biome: climate envelope + representative
// organisms with Wikipedia links. Reused in the contest overlay and (later) map.
export function BiomeDossier({ code }: { code: string }) {
  const b = BOARDS[code];
  const d = BIOME_DATA[code];
  const els = TERRAIN_ELEMENTS[code] || [];
  const zone = zoneOf(code);
  if (!d) return null;
  return (
    <div className="text-left">
      <div className="flex items-center gap-2">
        <span className="text-3xl">{b.icon}</span>
        <div>
          <div className="font-black leading-tight">{b.name}</div>
          <div className="text-[11px] text-neutral-500">{zone?.name}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-lg">{els.map((e) => ELEMENTS[e].icon).join('')}</div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wide">supplies</div>
        </div>
      </div>

      <p className="mt-2 text-[12px] italic text-neutral-600 border-l-2 border-neutral-300 pl-2">{d.tagline}</p>

      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[11px]">
        <dt className="font-bold text-neutral-500">🌡️ Temp</dt><dd>{d.temp}</dd>
        <dt className="font-bold text-neutral-500">💧 Water</dt><dd>{d.moisture}</dd>
        <dt className="font-bold text-neutral-500">⚗️ Energy</dt><dd>{d.chem}</dd>
      </dl>

      <div className="mt-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 mb-1">Representative life</div>
        <ul className="space-y-1">
          {d.organisms.map((o) => (
            <li key={o.sci} className="text-[11px] leading-snug">
              <a href={`https://en.wikipedia.org/wiki/${o.wiki}`} target="_blank" rel="noopener"
                className="font-bold underline decoration-dotted hover:text-eat">{o.n}</a>
              <span className="text-neutral-400 italic"> · {o.sci}</span>
              <span className="text-neutral-600"> — {o.note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2.5 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5">
        <div className="text-[10px] font-black uppercase tracking-wide text-amber-700">🔥 As the planet warms</div>
        <div className="text-[11px] text-amber-900 leading-snug">{d.warming}</div>
      </div>
    </div>
  );
}
