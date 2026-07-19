/* eslint-disable @typescript-eslint/no-explicit-any */
// The board as a hex field laid over Humboldt's Naturgemälde cross-section.
// 10 biomes, each split into 1–3 hex "spots" whose count roughly tracks how
// much of the real world that habitat covers. You control a biome only when
// you hold ALL of its hexes. Movement is adjacency-based (see contestableFor).
import type { PlayerId } from './humboldt';

// Rows top→base of the mountain — a regular 1…8 triangle of 36 hex spots.
// Counts (≈ real habitat extent): F6 D6 I4 A4 S4 O4 V2 C2 P2 G2. Forest on the
// wet slope, desert in the rain-shadow, ice+vent up top, marine at the base.
const LAYOUT: string[][] = [
  ['V'],                                   // summit crater (Chimborazo is a volcano)
  ['V', 'I'],                              // upper cone + snow line
  ['I', 'I', 'I'],                         // snow field
  ['F', 'F', 'C', 'D'],                    // treeline: forest slope, cave in the massif, dry flank
  ['F', 'F', 'C', 'D', 'D'],               // mid slope
  ['F', 'F', 'A', 'A', 'D', 'D'],          // lower slope → savanna
  ['S', 'A', 'A', 'P', 'P', 'D', 'G'],     // lowland belt: coast, savanna, swamp, desert edge, lab
  ['O', 'O', 'S', 'S', 'S', 'O', 'O', 'G'],// marine base + anthropocene corner
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
export const hexesOfBiome = (code: string) => HEXES.filter((h) => h.biome === code).map((h) => h.id);

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
export const HOME: Record<PlayerId, string[]> = { p1: ['O0'], p2: ['O3'] };

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

// A player can contest any hex they don't already hold that borders a hex they do.
export function contestableFor(owners: Record<string, PlayerId | null>, player: PlayerId): Set<string> {
  const held = new Set(HEXES.filter((h) => owners[h.id] === player).map((h) => h.id));
  const out = new Set<string>();
  HEXES.forEach((h) => {
    if (owners[h.id] === player) return;
    if (neighbors(h.id).some((n) => held.has(n))) out.add(h.id);
  });
  return out;
}

// A biome is controlled only when one player holds every hex of it.
export function biomeOwner(owners: Record<string, PlayerId | null>, code: string): PlayerId | null {
  const hs = hexesOfBiome(code);
  const first = owners[hs[0]];
  if (!first) return null;
  return hs.every((id) => owners[id] === first) ? first : null;
}
