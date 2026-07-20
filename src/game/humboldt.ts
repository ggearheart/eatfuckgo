/* eslint-disable @typescript-eslint/no-explicit-any */
// The board as Humboldt's Naturgemälde transect: our 10 biomes grouped under
// his climate/altitude zones, placed sea-level → summit on a stylized cross-section.

import { HEXES, HOME, biomeOwner, hexesOfBiome } from './board';
import { SPECIES, speciesCat } from './species';

export type PlayerId = 'p1' | 'p2';
export type Faction = 'eat' | 'fk';
export const PLAYERS: Record<PlayerId, { name: string; color: string; dot: string; fac: Faction }> = {
  p1: { name: 'Player 1', color: '#c4561e', dot: '🟧', fac: 'eat' },
  p2: { name: 'Player 2', color: '#7b4fa0', dot: '🟪', fac: 'fk' },
};
export function setPlayerFactions(f1: Faction, f2: Faction) { PLAYERS.p1.fac = f1; PLAYERS.p2.fac = f2; }
export const FACTION = { eat: { icon: '🦷', name: 'EAT' }, fk: { icon: '🧬', name: 'F*CK' } } as const;
export const otherPlayer = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

// Display names come from the lobby; mutate the shared PLAYERS object so every
// screen that reads PLAYERS[p].name picks them up without prop-threading.
export function setPlayerNames(p1: string, p2: string) {
  PLAYERS.p1.name = p1.trim() || 'Player 1';
  PLAYERS.p2.name = p2.trim() || 'Player 2';
}

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
  warming: number;                // degrees °C, 0.0 .. MAX_C
  turns: number;                  // turns (contests) resolved so far
  claims: number;                 // hexes claimed so far (drives warming)
  turn: PlayerId;
  collection: Record<PlayerId, string[]>; // SPECIES ids each player has collected
  adapt: Record<PlayerId, Record<string, number>>; // strategy id -> Red Queen adaptation level per player
}
export const ADAPT_CAP = 3; // max adaptation; champion bonus = 2 - level (down to -1)
// A team-biased starter roster: most of your team's species + a few of the other.
export function starterCollection(fac: Faction): string[] {
  const own = SPECIES.filter((s) => speciesCat(s) === fac).map((s) => s.id);
  const other = SPECIES.filter((s) => speciesCat(s) !== fac).map((s) => s.id);
  const shuffled = (a: string[]) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  return Array.from(new Set([...shuffled(own).slice(0, 22), ...shuffled(other).slice(0, 5)]));
}
export function freshMatch(): MatchState {
  const owners: Record<string, PlayerId | null> = {};
  const states: Record<string, string> = {};
  HEXES.forEach((h) => { owners[h.id] = null; states[h.id] = h.biome; });
  (Object.keys(HOME) as PlayerId[]).forEach((p) => HOME[p].forEach((id) => (owners[id] = p)));
  return {
    owners, states, warming: 0, turns: 0, claims: 0, turn: 'p1',
    collection: { p1: starterCollection(PLAYERS.p1.fac), p2: starterCollection(PLAYERS.p2.fac) },
    adapt: { p1: {}, p2: {} },
  };
}
// hexes held by a player
export const heldBy = (m: MatchState, p: PlayerId) => HEXES.filter((h) => m.owners[h.id] === p).length;
// whole biomes (all current patches) controlled by a player
export const biomesControlledBy = (m: MatchState, p: PlayerId) =>
  ALL_BIOMES.filter((code) => biomeOwner(m.owners, code, m.states) === p).length;

// ── victory: control a majority of the biomes that still exist ──
// Warming drives some biomes extinct (0 hexes), so we count only living ones.
export const livingBiomes = (m: MatchState) =>
  ALL_BIOMES.filter((code) => hexesOfBiome(code, m.states).length > 0);
// strict majority of living biomes
export const biomeWinThreshold = (m: MatchState) => Math.floor(livingBiomes(m).length / 2) + 1;
export function matchWinner(m: MatchState): PlayerId | null {
  const need = biomeWinThreshold(m);
  if (biomesControlledBy(m, 'p1') >= need) return 'p1';
  if (biomesControlledBy(m, 'p2') >= need) return 'p2';
  return null;
}
// a player one biome short of the majority (no winner yet) — for the "close" cue
export function matchThreat(m: MatchState): PlayerId | null {
  if (matchWinner(m)) return null;
  const need = biomeWinThreshold(m);
  if (biomesControlledBy(m, 'p1') === need - 1) return 'p1';
  if (biomesControlledBy(m, 'p2') === need - 1) return 'p2';
  return null;
}
