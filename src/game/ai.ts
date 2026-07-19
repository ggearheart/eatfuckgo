/* eslint-disable @typescript-eslint/no-explicit-any */
// ─────────────────────────────────────────────────────────────────────────────
// SCAFFOLD ONLY — the computer opponent is not built yet.
//
// This file reserves the shape of an AI player so the lobby can offer "Vs
// Computer" and we can drop a brain in later without touching the UI. We're
// deliberately waiting until the core mechanics settle (warming, scoring,
// migration teeth) before tuning an opponent against a moving target.
//
// When we build it, an AI turn on the map has two decisions:
//   1) which contestable hex to attack (contestableFor gives the legal set)
//   2) how to fight it — 'eat' | 'fk' — and which cards to deploy in the clash
//
// A first pass could be greedy: prefer hexes whose biome its deck fits best
// (matchedElements), break ties toward completing a biome (biomeOwner) or
// denying the opponent one, and avoid hexes flagged to warm away next tick.
import type { MatchState, PlayerId } from './humboldt';

export interface AiChoice {
  hexId: string;            // which contestable hex to contest
  battleType: 'eat' | 'fk'; // how to fight for it
}

export type AiLevel = 'ecologist'; // room to grow: 'ecologist' | 'strategist' | …

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function planTurn(_match: MatchState, _me: PlayerId, _level: AiLevel = 'ecologist'): AiChoice | null {
  // TODO: implement. Returns null today so callers can treat AI as unavailable.
  return null;
}

export const AI_AVAILABLE = false;
