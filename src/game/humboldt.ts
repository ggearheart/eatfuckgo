/* eslint-disable @typescript-eslint/no-explicit-any */
// The board as Humboldt's Naturgemälde transect: our 10 biomes grouped under
// his climate/altitude zones, placed sea-level → summit on a stylized cross-section.

export type PlayerId = 'p1' | 'p2';
export const PLAYERS: Record<PlayerId, { name: string; color: string; dot: string }> = {
  p1: { name: 'Player 1', color: '#c4561e', dot: '🟧' },
  p2: { name: 'Player 2', color: '#7b4fa0', dot: '🟪' },
};
export const otherPlayer = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

export const ALL_BIOMES = ['V', 'I', 'F', 'D', 'A', 'P', 'S', 'O', 'C', 'G'];

// Humboldt zones (contemporary labels), high → low, each grouping our biomes.
export const ZONES: { id: string; name: string; biomes: string[] }[] = [
  { id: 'nival', name: 'Nival — Snow & Fire', biomes: ['V', 'I'] },
  { id: 'montane', name: 'Montane Cloud Forest', biomes: ['F'] },
  { id: 'arid', name: 'Arid Rain-Shadow', biomes: ['D'] },
  { id: 'lowland', name: 'Tropical Lowlands', biomes: ['A', 'P'] },
  { id: 'coastal', name: 'Coastal & Marine', biomes: ['S', 'O'] },
  { id: 'subterranean', name: 'Subterranean', biomes: ['C'] },
  { id: 'anthropocene', name: 'The Anthropocene', biomes: ['G'] },
];
export const zoneOf = (code: string) => ZONES.find((z) => z.biomes.includes(code));

// Node positions on the transect (viewBox 0 0 1000 560), placed by elevation.
export const BIOME_POS: Record<string, [number, number]> = {
  V: [566, 118],   // Volcanic Vent — summit crater
  I: [452, 176],   // Ice Age — snow line
  F: [356, 322],   // Canopy Forest — mid slope
  D: [742, 356],   // Desert — rain shadow
  A: [286, 430],   // Savannah — lowlands
  P: [432, 462],   // Swamp — lowlands
  S: [168, 470],   // Shallow Sea — coast
  O: [78, 516],    // Open Ocean — offshore
  C: [582, 452],   // Deep Cave — inside the massif
  G: [880, 438],   // GM Lab — anthropocene station
};

export interface MatchState {
  owners: Record<string, PlayerId | null>;
  turn: PlayerId;
}
export function freshMatch(): MatchState {
  const owners: Record<string, PlayerId | null> = {};
  ALL_BIOMES.forEach((b) => (owners[b] = null));
  return { owners, turn: 'p1' };
}
export const heldBy = (m: MatchState, p: PlayerId) => ALL_BIOMES.filter((b) => m.owners[b] === p).length;
