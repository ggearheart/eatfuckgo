import type { Part, PartSrc } from '../engine/engine';

export const PART_COLORS: Record<PartSrc, string> = {
  terrain: '#1e7a40',   // green — the biome
  scenario: '#2a6aa0',  // blue — this round's roll
  energy: '#a06a10',    // amber — allocation
  lineage: '#7a4a1e',   // brown — stack coherence
  base: '#9a8878',
};
const LABEL: Partial<Record<PartSrc, string>> = { terrain: 'Biome', scenario: 'Scenario', energy: 'Energy', lineage: 'Lineage' };

export function ModChips({ parts, hideBase = true }: { parts: Part[]; hideBase?: boolean }) {
  const shown = parts.filter((p) => !hideBase || p.src !== 'base');
  if (!shown.length) return null;
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {shown.map((p, i) => (
        <span key={i} style={{ background: PART_COLORS[p.src] }} className="text-white text-[8px] font-bold rounded px-1 py-[1px] leading-tight">
          {p.t}
        </span>
      ))}
    </div>
  );
}

export function ModLegend() {
  const items: PartSrc[] = ['terrain', 'scenario', 'lineage'];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[9px] font-semibold text-neutral-500 my-1">
      <span className="font-extrabold text-neutral-600">How this round is tilted:</span>
      {items.map((s) => (
        <span key={s} className="inline-flex items-center gap-1">
          <span style={{ background: PART_COLORS[s] }} className="inline-block w-2.5 h-2.5 rounded-sm" />
          {LABEL[s]}
        </span>
      ))}
    </div>
  );
}
