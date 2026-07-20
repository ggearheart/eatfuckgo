/* eslint-disable @typescript-eslint/no-explicit-any */
// The board as Humboldt's Naturgemälde transect: our 10 biomes grouped under
// his climate/altitude zones, placed sea-level → summit on a stylized cross-section.

import { HEXES, START_HEXES, biomeOwner, hexesOfBiome, neighbors } from './board';
import { SPECIES, speciesCat, strategyCard } from './species';

export type PlayerId = 'p1' | 'p2' | 'p3' | 'p4';
export type Faction = 'eat' | 'fk';
// legion emblem: the Japanese-fireworks shell that blooms over a player's ground
export type BurstKind = 'chrysanthemum' | 'peony' | 'kamuro' | 'willow';
export const ALL_PLAYERS: PlayerId[] = ['p1', 'p2', 'p3', 'p4'];
export const PLAYERS: Record<PlayerId, { name: string; color: string; dot: string; fac: Faction; emblem: BurstKind }> = {
  p1: { name: 'Player 1', color: '#c4561e', dot: '🟧', fac: 'eat', emblem: 'chrysanthemum' },
  p2: { name: 'Player 2', color: '#7b4fa0', dot: '🟪', fac: 'fk', emblem: 'peony' },
  p3: { name: 'Player 3', color: '#2e8b57', dot: '🟩', fac: 'eat', emblem: 'kamuro' },
  p4: { name: 'Player 4', color: '#2a74b0', dot: '🟦', fac: 'fk', emblem: 'willow' },
};
export const FACTION = { eat: { icon: '🦷', name: 'EAT' }, fk: { icon: '🧬', name: 'F*CK' } } as const;
// next player in a match's turn order (2–4 players)
export const nextPlayer = (players: PlayerId[], cur: PlayerId): PlayerId => players[(players.indexOf(cur) + 1) % players.length];

// Display names/factions come from the lobby; mutate the shared PLAYERS object so
// every screen that reads PLAYERS[p] picks them up without prop-threading.
export function setPlayerNames(names: string[]) { ALL_PLAYERS.forEach((p, i) => { PLAYERS[p].name = (names[i] || '').trim() || `Player ${i + 1}`; }); }
export function setPlayerFactions(facs: Faction[]) { ALL_PLAYERS.forEach((p, i) => { if (facs[i]) PLAYERS[p].fac = facs[i]; }); }
export function setPlayerEmblems(embs: BurstKind[]) { ALL_PLAYERS.forEach((p, i) => { if (embs[i]) PLAYERS[p].emblem = embs[i]; }); }

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

// ── Legions: Titan-style mobile stacks ──
// A legion is a stack of species that occupies a hex, moves each turn, recruits
// locally, splits, and fights. Its firework emblem identifies it within a player
// (the player's colour is shared across their legions).
export const STACK_CAP = 7;            // a legion is full at 7 species (incl. weirdos)
export const MAX_LEGIONS = 4;          // each player has at most 4 legion markers
export const LEGION_EMBLEMS: BurstKind[] = ['chrysanthemum', 'peony', 'kamuro', 'willow'];
export interface Legion {
  id: string;          // `${player}-${n}`
  player: PlayerId;
  n: number;           // 1..4
  emblem: BurstKind;   // firework shell identifying this legion within the player
  hex: string;         // current position (one legion per hex globally)
  team: Faction;       // eat|fk — switchable only in a GM lab
  species: string[];   // stack (species ids), max STACK_CAP
  moved: boolean;      // has moved this turn
}

// owners/states are keyed by HEX id (see board.ts), not biome code.
export interface MatchState {
  owners: Record<string, PlayerId | null>;
  states: Record<string, string>; // hex id -> current biome code (mutated by the warming clock)
  warming: number;                // degrees °C, 0.0 .. MAX_C
  turns: number;                  // turns resolved so far
  claims: number;                 // hexes claimed so far (drives warming)
  turn: PlayerId;
  players: PlayerId[];            // participating players, in turn order (2–4)
  legions: Record<string, Legion>; // all living legions by id
  adapt: Record<PlayerId, Record<string, number>>; // strategy id -> Red Queen adaptation level per player
}
export const ADAPT_CAP = 3; // max adaptation; champion bonus = 2 - level (down to -1)

// the 6 lowest-tier species of a team, to seed the two starting legions (3 each)
export function starterSpecies(team: Faction): string[] {
  return SPECIES.filter((s) => speciesCat(s) === team)
    .map((s) => ({ id: s.id, t: strategyCard(s.strategy)?.t ?? 0 }))
    .sort((a, b) => a.t - b.t)
    .slice(0, 6)
    .map((x) => x.id);
}
// a free adjacent hex to seed a player's second legion next to their home
function secondStart(home: string, taken: Set<string>): string {
  return neighbors(home).find((n) => !taken.has(n)) ?? home;
}
export function freshMatch(players: PlayerId[] = ['p1', 'p2']): MatchState {
  const owners: Record<string, PlayerId | null> = {};
  const states: Record<string, string> = {};
  HEXES.forEach((h) => { owners[h.id] = null; states[h.id] = h.biome; });
  const legions: Record<string, Legion> = {};
  const adapt = {} as Record<PlayerId, Record<string, number>>;
  const taken = new Set<string>();
  players.forEach((p, i) => {
    const team = PLAYERS[p].fac;
    const home = START_HEXES[i]; taken.add(home);
    const adj = secondStart(home, taken); taken.add(adj);
    owners[home] = p; owners[adj] = p;
    const six = starterSpecies(team);
    legions[`${p}-1`] = { id: `${p}-1`, player: p, n: 1, emblem: LEGION_EMBLEMS[0], hex: home, team, species: six.slice(0, 3), moved: false };
    legions[`${p}-2`] = { id: `${p}-2`, player: p, n: 2, emblem: LEGION_EMBLEMS[1], hex: adj, team, species: six.slice(3, 6), moved: false };
    adapt[p] = {};
  });
  return { owners, states, warming: 0, turns: 0, claims: 0, turn: players[0], players, legions, adapt };
}

// ── legion helpers ──
export const legionsOf = (m: MatchState, p: PlayerId): Legion[] =>
  Object.values(m.legions).filter((l) => l.player === p).sort((a, b) => a.n - b.n);
export const legionAt = (m: MatchState, hexId: string): Legion | undefined =>
  Object.values(m.legions).find((l) => l.hex === hexId);
export const occupiedHexes = (m: MatchState): Set<string> => new Set(Object.values(m.legions).map((l) => l.hex));
// the next unused legion number/emblem for a player (for splitting)
export function nextLegionSlot(m: MatchState, p: PlayerId): { n: number; emblem: BurstKind } | null {
  const used = new Set(legionsOf(m, p).map((l) => l.n));
  for (let n = 1; n <= MAX_LEGIONS; n++) if (!used.has(n)) return { n, emblem: LEGION_EMBLEMS[n - 1] };
  return null;
}
// players still in the game (≥1 legion)
export const livingPlayers = (m: MatchState): PlayerId[] => m.players.filter((p) => legionsOf(m, p).length > 0);

// hexes held by a player
export const heldBy = (m: MatchState, p: PlayerId) => HEXES.filter((h) => m.owners[h.id] === p).length;
// whole biomes (all current patches) controlled by a player — kept for the scoreboard
export const biomesControlledBy = (m: MatchState, p: PlayerId) =>
  ALL_BIOMES.filter((code) => biomeOwner(m.owners, code, m.states) === p).length;
export const livingBiomes = (m: MatchState) =>
  ALL_BIOMES.filter((code) => hexesOfBiome(code, m.states).length > 0);

// ── victory: elimination — a player with no legions is out ──
// Winner once only one player remains; +4 °C fallback = most legions (tiebreak hexes).
export function matchWinner(m: MatchState): PlayerId | null {
  const alive = livingPlayers(m);
  if (alive.length === 1 && m.players.length > 1) return alive[0];
  return null;
}
export function pluralityWinner(m: MatchState): PlayerId {
  return [...m.players].sort((a, b) => legionsOf(m, b).length - legionsOf(m, a).length || heldBy(m, b) - heldBy(m, a))[0];
}
// a player one kill away from winning (only rival left has a single legion) — "close" cue
export function matchThreat(m: MatchState): PlayerId | null {
  const alive = livingPlayers(m);
  if (alive.length !== 2) return null;
  const weak = alive.find((p) => legionsOf(m, p).length === 1);
  const strong = alive.find((p) => p !== weak);
  return weak && strong ? strong : null;
}
