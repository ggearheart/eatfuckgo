/* eslint-disable @typescript-eslint/no-explicit-any */
// The computer opponent for the legion game. Each turn it moves its unmoved
// legions one at a time: prefer settling neutral/own ground and growing, and
// clash an adjacent enemy legion when it looks favourable. Heuristic, not search.
import { MatchState, PlayerId, Faction, PLAYERS, legionsOf, legionAt, occupiedHexes, Legion } from './humboldt';
import { legionMoves, curBiome } from './board';
import { BIOME_AFFINITY } from '../engine/data';
import { speciesInBiome, speciesCat, SPECIES_BY_ID } from './species';

export type MapMove = { type: 'muster' | 'clash' | 'pass'; hexId?: string; legionId?: string };

// choose a legion + destination this turn (or pass when nothing moves)
export function aiMapMove(m: MatchState, me: PlayerId, reach: number): MapMove {
  const occ = occupiedHexes(m);
  const mine = legionsOf(m, me).filter((l) => !l.moved);
  for (const l of mine) {
    const occExcept = new Set(occ); occExcept.delete(l.hex);
    const ends = [...legionMoves(l.hex, reach, occExcept)];
    if (!ends.length) continue;
    const enemyLegionHexes = ends.filter((h) => { const t = legionAt(m, h); return t && t.player !== me; });
    const enemyClaimed = ends.filter((h) => !legionAt(m, h) && m.owners[h] && m.owners[h] !== me);
    const freeGround = ends.filter((h) => !legionAt(m, h) && m.owners[h] !== me);
    // attack an enemy legion only when we clearly outnumber it
    const goodClash = enemyLegionHexes.find((h) => { const t = legionAt(m, h)!; return l.species.length >= t.species.length + 1; });
    if (goodClash) return { type: 'clash', hexId: goodClash, legionId: l.id };
    if (freeGround.length) {
      freeGround.sort((a, b) => score(m, me, b) - score(m, me, a));
      return { type: 'muster', hexId: freeGround[0], legionId: l.id };
    }
    if (enemyClaimed.length) return { type: 'muster', hexId: enemyClaimed[0], legionId: l.id };
    if (enemyLegionHexes.length) return { type: 'clash', hexId: enemyLegionHexes[0], legionId: l.id };
  }
  return { type: 'pass' };
}
function score(m: MatchState, me: PlayerId, hex: string): number {
  const biome = curBiome(m.states, hex);
  const aff = BIOME_AFFINITY[biome] === PLAYERS[me].fac ? 2 : 0;
  const neutral = m.owners[hex] == null ? 1 : 0;
  return aff + neutral;
}

// pick a champion (mode + dominant species) from a specific legion's stack
export function legionChampion(m: MatchState, l: Legion): { mode: Faction; species: string } | null {
  const avail = (mode: Faction) => l.species.map((id) => SPECIES_BY_ID[id]).filter((s) => s && speciesCat(s) === mode);
  const order: Faction[] = l.team === 'eat' ? ['eat', 'fk'] : ['fk', 'eat'];
  const mode = order.find((f) => avail(f).length); if (!mode) return null;
  const list = avail(mode).sort((a, b) => (m.adapt[l.player][a!.strategy] || 0) - (m.adapt[l.player][b!.strategy] || 0));
  return { mode, species: list[0]!.id };
}

// legacy per-biome contest chooser (kept for any collection-style callers)
export function aiChooseContest(m: MatchState, who: PlayerId, biome: string): { mode: Faction; species: string } | null {
  const owned = new Set(legionsOf(m, who).flatMap((l) => l.species));
  const avail = (mode: Faction) => speciesInBiome(biome).filter((s) => speciesCat(s) === mode && owned.has(s.id));
  const team = PLAYERS[who].fac, other: Faction = team === 'eat' ? 'fk' : 'eat';
  const order: Faction[] = Array.from(new Set([BIOME_AFFINITY[biome], team, other]));
  const mode = order.find((f) => avail(f).length);
  if (!mode) return null;
  const list = avail(mode).sort((a, b) => (m.adapt[who][a.strategy] || 0) - (m.adapt[who][b.strategy] || 0));
  return { mode, species: list[0].id };
}
