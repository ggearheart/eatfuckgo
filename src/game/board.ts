/* eslint-disable @typescript-eslint/no-explicit-any */
// The board as a hex field laid over Humboldt's Naturgemälde cross-section.
// 10 biomes, each split into 1–3 hex "spots" whose count roughly tracks how
// much of the real world that habitat covers. You control a biome only when
// you hold ALL of its hexes. Movement is adjacency-based (see contestableFor).
import type { PlayerId, MatchState } from './humboldt';

// Rows top→base of the mountain — a regular 1…8 triangle of 36 hex spots.
// Every row is a palindrome, so the board is LEFT-RIGHT MIRROR-SYMMETRIC: neither
// bottom-corner home has an advantage. The two GM Labs sit side-by-side dead-center
// at level 3, equidistant from both players. Counts: F6 D6 I4 A4 S4 O4 V2 C2 P2 G2.
const LAYOUT: string[][] = [
  ['V'],                                        // summit vent (centerline)
  ['I', 'I'],                                   // ice cap
  ['I', 'V', 'I'],                              // snow field around a central vent
  ['F', 'G', 'G', 'F'],                         // level 3: twin GM Labs dead-center, forest flanks
  ['F', 'D', 'C', 'D', 'F'],                    // forest flanks, desert belt, cave in the massif
  ['F', 'A', 'D', 'D', 'A', 'F'],               // lower slope
  ['S', 'A', 'D', 'C', 'D', 'A', 'S'],          // lowland belt + a deep-cave core
  ['O', 'O', 'S', 'P', 'P', 'S', 'O', 'O'],     // marine base, swamp at the center
];

const R = 35;
export const HEX_R = R;
const DX = Math.sqrt(3) * R;   // horizontal step between hex centers
const DY = 1.5 * R;            // vertical step between rows
const CX = 500;
const Y0 = 104;

export interface Hex { id: string; biome: string; row: number; x: number; y: number; }

export const HEXES: Hex[] = [];
{
  const seen: Record<string, number> = {};
  LAYOUT.forEach((rowArr, r) => {
    const n = rowArr.length;
    const startx = CX - ((n - 1) * DX) / 2;
    rowArr.forEach((biome, i) => {
      const k = (seen[biome] = (seen[biome] ?? 0));
      seen[biome] = k + 1;
      HEXES.push({ id: `${biome}${k}`, biome, row: r, x: startx + i * DX, y: Y0 + r * DY });
    });
  });
}

export const HEX_BY_ID: Record<string, Hex> = Object.fromEntries(HEXES.map((h) => [h.id, h]));
export const hexBiome = (id: string) => HEX_BY_ID[id]?.biome;
// current biome of a hex, honoring warming transformations (falls back to base)
export const curBiome = (states: Record<string, string> | undefined, id: string) => states?.[id] ?? hexBiome(id);
export const hexesOfBiome = (code: string, states?: Record<string, string>) =>
  HEXES.filter((h) => (states ? states[h.id] : h.biome) === code).map((h) => h.id);

// Adjacency by proximity — immediate hex neighbors share an edge (~DX apart).
const TH = DX * 1.15;
export const ADJ: Record<string, string[]> = {};
HEXES.forEach((a) => {
  ADJ[a.id] = HEXES.filter((b) => b.id !== a.id && Math.hypot(a.x - b.x, a.y - b.y) <= TH).map((b) => b.id);
});
export const neighbors = (id: string) => ADJ[id] ?? [];

// Pointy-top hex outline (point up) as an SVG points string.
export function hexPoints(cx: number, cy: number, r = R): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

// Home bases: opposite marine corners. Both players start in the ocean and
// climb the mountain, meeting in the tropical lowlands.
// Start hexes, assigned in order to the 2–4 players: bottom-left & bottom-right
// ocean corners, then the summit vent, then the central cave — spread apart.
export const START_HEXES = ['O0', 'O3', 'V0', 'C0'];

// Muted, Naturgemälde-engraving palette — distinct but board-like, not neon.
export const BIOME_COLORS: Record<string, string> = {
  V: '#c05a3a', // volcanic
  I: '#d3e4ee', // ice
  F: '#5c9a4f', // forest
  D: '#e0c987', // desert
  A: '#cbae5c', // savanna
  P: '#8a9a56', // swamp
  S: '#7fbccb', // shallow sea
  O: '#4a86a3', // open ocean
  C: '#9a8ea8', // cave
  G: '#c39ad0', // lab
};

// Foothold: how much established ground a player holds bordering a hex. Drives
// how deep a hand they field when contesting it (the territory economy).
export const FOOTHOLD_CAP = 3;
export const foothold = (owners: Record<string, PlayerId | null>, hexId: string, player: PlayerId) =>
  Math.min(FOOTHOLD_CAP, neighbors(hexId).filter((n) => owners[n] === player).length);

// Movement: each turn a player rolls 1d6, then may contest any hex within that
// many steps of their territory (BFS through the hex graph). Roll 1 = adjacent
// only; a big roll lets a lineage disperse across the map.
export function reachableFor(owners: Record<string, PlayerId | null>, player: PlayerId, reach: number): Set<string> {
  const out = new Set<string>();
  if (!reach || reach < 1) return out;
  const dist: Record<string, number> = {};
  const q: string[] = [];
  HEXES.forEach((h) => { if (owners[h.id] === player) { dist[h.id] = 0; q.push(h.id); } });
  let head = 0;
  while (head < q.length) {
    const id = q[head++];
    if (dist[id] >= reach) continue;
    neighbors(id).forEach((n) => { if (dist[n] === undefined) { dist[n] = dist[id] + 1; q.push(n); } });
  }
  HEXES.forEach((h) => { const d = dist[h.id]; if (d !== undefined && d > 0 && d <= reach && owners[h.id] !== player) out.add(h.id); });
  return out;
}

// A biome is controlled only when one player holds every (current) hex of it.
export function biomeOwner(owners: Record<string, PlayerId | null>, code: string, states?: Record<string, string>): PlayerId | null {
  const hs = hexesOfBiome(code, states);
  if (!hs.length) return null;
  const first = owners[hs[0]];
  if (!first) return null;
  return hs.every((id) => owners[id] === first) ? first : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Warming as an isotherm scale (Humboldt's specialty): 0.0 → +4.0 °C, gaining
// +0.5 °C for every CLAIMS_PER_STEP hexes contested & claimed. As it rises, the
// most heat-vulnerable hexes transform to a hotter state.
export const MAX_C = 4;                 // warming caps at +4 °C
export const DEG_STEP = 0.5;            // gained per step
const CLAIMS_PER_STEP = 3;              // claims needed per +0.5 °C
const RATE = 3;                         // hexes that can flip per +0.5 °C step
export const degreesFromClaims = (claims: number) => Math.min(MAX_C, Math.floor(claims / CLAIMS_PER_STEP) * DEG_STEP);
export const degLabel = (deg: number) => (deg <= 0 ? 'Holocene · 0.0 °C' : `+${deg.toFixed(1)} °C`);

// what each biome becomes as it heats (absent = a thermal refuge, never changes)
export const TRANSITIONS: Record<string, string> = { I: 'P', S: 'O', A: 'D', F: 'A' };
// the temperature (°C) at which each biome begins transforming
const HEAT_DEG: Record<string, number> = { I: 1, S: 2, A: 2, F: 3 };

const eligible = (states: Record<string, string>, deg: number) =>
  HEXES.filter((h) => {
    const b = states[h.id];
    return TRANSITIONS[b] && HEAT_DEG[b] <= deg;
  });

export interface HexChange { id: string; from: string; to: string; }

// Advance one turn; a claimed hex nudges the isotherm, which may flip up to RATE hexes.
export function tickWarming(m: MatchState, claimed: boolean): { claims: number; warming: number; states: Record<string, string>; changed: HexChange[] } {
  const claims = m.claims + (claimed ? 1 : 0);
  const warming = degreesFromClaims(claims);
  let states = m.states;
  const changed: HexChange[] = [];
  if (warming > m.warming) {
    const pick = eligible(states, warming)
      .sort((a, b) =>
        (warming - HEAT_DEG[states[b.id]]) - (warming - HEAT_DEG[states[a.id]]) || // most overdue first
        b.row - a.row ||                                                            // then lowest / warmest
        a.id.localeCompare(b.id))
      .slice(0, RATE);
    states = { ...states };
    pick.forEach((h) => {
      const from = states[h.id], to = TRANSITIONS[from];
      changed.push({ id: h.id, from, to });
      states[h.id] = to;
    });
  }
  return { claims, warming, states, changed };
}

// Hexes that will transform on or before the next +0.5 °C step — flagged on the map.
export function vulnerableHexes(m: MatchState): Set<string> {
  const next = Math.min(MAX_C, m.warming + DEG_STEP);
  return new Set(eligible(m.states, next).map((h) => h.id));
}
