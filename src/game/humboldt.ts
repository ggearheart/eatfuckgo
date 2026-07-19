/* eslint-disable @typescript-eslint/no-explicit-any */
// The board as Humboldt's Naturgemälde transect: our 10 biomes grouped under
// his climate/altitude zones, placed sea-level → summit on a stylized cross-section.

import { HEXES, HOME, biomeOwner } from './board';

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

// owners/states are keyed by HEX id (see board.ts), not biome code.
export interface MatchState {
  owners: Record<string, PlayerId | null>;
  states: Record<string, string>; // hex id -> current biome code (mutated by the warming clock)
  warming: number;                // 0..MAX_WARMING
  turns: number;                  // turns (contests) resolved so far
  turn: PlayerId;
}
export function freshMatch(): MatchState {
  const owners: Record<string, PlayerId | null> = {};
  const states: Record<string, string> = {};
  HEXES.forEach((h) => { owners[h.id] = null; states[h.id] = h.biome; });
  (Object.keys(HOME) as PlayerId[]).forEach((p) => HOME[p].forEach((id) => (owners[id] = p)));
  return { owners, states, warming: 0, turns: 0, turn: 'p1' };
}
// hexes held by a player
export const heldBy = (m: MatchState, p: PlayerId) => HEXES.filter((h) => m.owners[h.id] === p).length;
// whole biomes (all current patches) controlled by a player
export const biomesControlledBy = (m: MatchState, p: PlayerId) =>
  ALL_BIOMES.filter((code) => biomeOwner(m.owners, code, m.states) === p).length;
