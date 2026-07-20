/* eslint-disable @typescript-eslint/no-explicit-any */
// The Muster Guide: a full reference of every biome's recruit ladders — which
// EAT and F*CK strategies (and the species that carry them) you can build where,
// in tier order. Openable as a side/overlay panel or pinned to its own tab
// (via the #guide hash), so a player can keep it beside the board.
import { BOARDS, BIOME_AFFINITY } from '../engine/data';
import { ZONES, FACTION, Faction } from '../game/humboldt';
import { speciesInBiome, speciesCat, strategyCard, Species } from '../game/species';

function ladder(biome: string, cat: Faction) {
  return speciesInBiome(biome)
    .filter((s) => speciesCat(s) === cat)
    .map((s) => ({ s, c: strategyCard(s.strategy) || {} }))
    .sort((a, b) => (a.c.t ?? 0) - (b.c.t ?? 0));
}

function Rung({ s, c, base, cat }: { s: Species; c: any; base: boolean; cat: Faction }) {
  const accent = cat === 'eat' ? '#c4561e' : '#7b4fa0';
  return (
    <div className="flex items-center gap-1.5 py-1 border-b last:border-0" style={{ borderColor: '#efe7d7' }}>
      <span className="text-[9px] font-black w-6 shrink-0" style={{ color: accent }}>T{c.t ?? 0}</span>
      <span className="text-lg leading-none shrink-0">{c.art}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold leading-tight truncate">{c.n}</div>
        <div className="text-[9px] text-neutral-500 truncate">{s.emoji} {s.name}</div>
      </div>
      <div className="flex gap-0.5 shrink-0">
        <span className="px-1 rounded text-[8px] font-bold bg-[#ffe1b0] text-[#7a4800]">O{c.off}</span>
        <span className="px-1 rounded text-[8px] font-bold bg-[#e7d9f2] text-[#5a3a80]">R{c.rep}</span>
        <span className="px-1 rounded text-[8px] font-bold bg-[#f2ead9] text-[#5a4830]">A{c.ada}</span>
      </div>
      <span className="text-[8px] w-9 shrink-0 text-right">{base ? <span className="text-[#2a9d4a] font-bold">start</span> : <span className="text-neutral-400">🔒 climb</span>}</span>
    </div>
  );
}

function LadderCol({ biome, cat }: { biome: string; cat: Faction }) {
  const rows = ladder(biome, cat);
  const fav = BIOME_AFFINITY[biome] === cat;
  const accent = cat === 'eat' ? '#c4561e' : '#7b4fa0';
  const minT = rows.length ? Math.min(...rows.map((r) => r.c.t ?? 0)) : 0;
  return (
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-black uppercase tracking-wide mb-0.5" style={{ color: accent }}>
        {FACTION[cat].icon} {FACTION[cat].name}{fav && <span title="this biome favours this mode"> ★</span>}
      </div>
      {rows.length ? rows.map((r) => <Rung key={r.s.id} s={r.s} c={r.c} base={(r.c.t ?? 0) === minT} cat={cat} />)
        : <div className="text-[10px] text-neutral-400 italic py-1">none here</div>}
    </div>
  );
}

function BiomeCard({ code }: { code: string }) {
  const b = BOARDS[code];
  const aff = BIOME_AFFINITY[code] as Faction;
  return (
    <div className="rounded-xl border-2 p-2" style={{ borderColor: '#e2d8c6', background: '#fffdf7' }}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xl">{b.icon}</span>
        <span className="text-xs font-black flex-1">{b.name}</span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: aff === 'eat' ? '#f6e1d3' : '#eadcf4', color: aff === 'eat' ? '#8a4a20' : '#5a3a80' }}>
          favours {FACTION[aff].icon} {FACTION[aff].name}
        </span>
      </div>
      <div className="flex gap-3">
        <LadderCol biome={code} cat="eat" />
        <div className="w-px shrink-0" style={{ background: '#efe7d7' }} />
        <LadderCol biome={code} cat="fk" />
      </div>
    </div>
  );
}

// The guide body — shared by the in-app overlay and the standalone tab.
export function MusterGuideBody() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ZONES.map((z) => (
        <div key={z.id} className="contents">
          {z.biomes.map((code) => <BiomeCard key={code} code={code} />)}
        </div>
      ))}
    </div>
  );
}

const Intro = () => (
  <p className="text-[11px] text-neutral-600 leading-snug">
    Roll to move, then settle a neutral hex to <b>muster</b> — recruit one strategy from that biome's ladder into your
    arsenal. Each biome offers an <b style={{ color: '#c4561e' }}>EAT</b> ladder and a <b style={{ color: '#7b4fa0' }}>F*CK</b> ladder;
    the ★ mode is favoured there. You may only take a rung once you hold a lower one of that mode — so build each ladder from the
    bottom up. Stats: <b>O</b>ffence · <b>R</b>eproduction · <b>A</b>daptation (Red Queen).
  </p>
);

// In-app overlay (dismissable, with a "pin to new tab" button)
export function MusterGuide({ onClose }: { onClose: () => void }) {
  const openTab = () => window.open(`${location.pathname}#guide`, '_blank', 'noopener');
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-3 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl border-2 border-ink p-4 w-full max-w-4xl shadow-comic my-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-1">
          <div className="font-black text-base">📖 Muster guide — recruit ladders by biome</div>
          <button onClick={openTab} className="ml-auto text-[11px] font-bold px-2 py-1 rounded-lg border-2 border-ink bg-white">⧉ Pin to new tab</button>
          <button onClick={onClose} className="text-[11px] font-bold px-2 py-1 rounded-lg border-2 border-ink bg-white">✕ Close</button>
        </div>
        <div className="mb-2"><Intro /></div>
        <MusterGuideBody />
      </div>
    </div>
  );
}

// Standalone full-page version (rendered when the URL hash is #guide)
export function MusterGuidePage() {
  return (
    <div className="min-h-screen bg-[#f7f1e3] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="font-black text-xl mb-1">📖 EAT FUCK GO — Muster guide</div>
        <div className="mb-3"><Intro /></div>
        <MusterGuideBody />
      </div>
    </div>
  );
}
