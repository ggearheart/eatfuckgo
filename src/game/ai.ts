/* eslint-disable @typescript-eslint/no-explicit-any */
// The computer opponent. It plays the MAP (roll → muster / clash / pass) and
// picks a mode + dominant species for any clash it's in. Clashes resolve
// headlessly (see engine.autoResolve). Heuristic, not search — good enough to
// give a human a real game.
import { MatchState, PlayerId, Faction, PLAYERS } from './humboldt';
import { reachableFor, curBiome, hexesOfBiome } from './board';
import { BIOME_AFFINITY } from '../engine/data';
import { speciesInBiome, speciesCat } from './species';

export type MapMove = { type: 'muster' | 'clash' | 'pass'; hexId?: string };

// choose a hex to act on this turn
export function aiMapMove(m: MatchState, me: PlayerId, reach: number): MapMove {
  const targets = [...reachableFor(m.owners, me, reach)];
  if (!targets.length) return { type: 'pass' };
  const neutral = targets.filter((id) => m.owners[id] == null);
  const enemy = targets.filter((id) => m.owners[id] != null);
  const heldOfBiome = (id: string) => {
    const hs = hexesOfBiome(curBiome(m.states, id), m.states);
    return hs.filter((h) => m.owners[h] === me).length;
  };
  // prefer peaceful mustering: settle biomes you already partly hold, and your affinity
  if (neutral.length) {
    neutral.sort((a, b) => (heldOfBiome(b) * 2 + (BIOME_AFFINITY[curBiome(m.states, b)] === PLAYERS[me].fac ? 1 : 0))
      - (heldOfBiome(a) * 2 + (BIOME_AFFINITY[curBiome(m.states, a)] === PLAYERS[me].fac ? 1 : 0)));
    return { type: 'muster', hexId: neutral[0] };
  }
  // no neutral ground left: attack a rival hex in a biome you already partly hold (to flip it)
  if (enemy.length) {
    enemy.sort((a, b) => heldOfBiome(b) - heldOfBiome(a));
    return { type: 'clash', hexId: enemy[0] };
  }
  return { type: 'pass' };
}

// choose a mode + dominant species for a clash in this biome (attacker or defender).
// returns null if the player owns no species that can fight here (→ concede/auto-loss).
export function aiChooseContest(m: MatchState, who: PlayerId, biome: string): { mode: Faction; species: string } | null {
  const owned = new Set(m.collection[who]);
  const avail = (mode: Faction) => speciesInBiome(biome).filter((s) => speciesCat(s) === mode && owned.has(s.id));
  const team = PLAYERS[who].fac, other: Faction = team === 'eat' ? 'fk' : 'eat';
  // prefer the mode the biome favors if you can field it, else your team, else the other
  const aff = BIOME_AFFINITY[biome];
  const order: Faction[] = Array.from(new Set([aff, team, other]));
  const mode = order.find((f) => avail(f).length);
  if (!mode) return null;
  // pick the freshest champion (lowest Red Queen adaptation)
  const list = avail(mode).sort((a, b) => (m.adapt[who][a.strategy] || 0) - (m.adapt[who][b.strategy] || 0));
  return { mode, species: list[0].id };
}
