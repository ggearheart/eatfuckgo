/* eslint-disable @typescript-eslint/no-explicit-any */
// Element-matching dominance (borrowed from Dominant Species).
// Each terrain SUPPLIES a small set of elements; each strategy MATCHES some.
// The card that matches more of the biome's elements is better suited — it gains
// dice AND "dominates" the biome (winning clash ties). Suitability, not stat-pile.

export type Element = 'sun' | 'meat' | 'water' | 'mineral' | 'plant' | 'host';

export const ELEMENTS: Record<Element, { icon: string; name: string }> = {
  sun: { icon: '☀️', name: 'Sunlight' },
  meat: { icon: '🥩', name: 'Meat' },
  water: { icon: '💧', name: 'Water' },
  mineral: { icon: '⛰️', name: 'Minerals' },
  plant: { icon: '🌱', name: 'Plants' },
  host: { icon: '🧬', name: 'Host / organic' },
};

// What each terrain supplies (biome-specific — the heart of dominance).
export const TERRAIN_ELEMENTS: Record<string, Element[]> = {
  V: ['mineral', 'host'],          // Volcanic Vent — chemosynthetic, sulfur life
  P: ['water', 'plant'],           // Primordial Swamp
  S: ['sun', 'water'],             // Shallow Sea — sunlit reef
  O: ['water', 'meat'],            // Open Ocean — pursuit
  I: ['meat', 'mineral'],          // Ice Age — lean, carnivore-favored
  A: ['sun', 'plant', 'meat'],     // Savannah — rich, contested
  F: ['sun', 'plant'],             // Canopy Forest
  D: ['mineral', 'meat'],          // Desert
  C: ['mineral', 'host'],          // Deep Cave
  G: ['sun', 'mineral', 'host'],   // GM Lab — chaotic wildcard
};

// What each strategy matches (its ecological "diet"/adaptation).
export const CARD_ELEMENTS: Record<string, Element[]> = {
  // EAT
  chemosynthesis: ['mineral'], anoxygenic: ['sun', 'mineral'], oxygenic: ['sun'], osmotrophy: ['host', 'mineral'],
  filter_feed: ['water'], detritivory: ['host'], parasitism: ['host'], bulk_graze: ['plant'], browse: ['plant'],
  sit_wait: ['meat'], seed_pred: ['plant'], venom: ['meat'], trap_build: ['meat'], solo_sprint: ['meat'],
  electro: ['meat', 'water'], persistence: ['meat'], pack_hunt: ['meat'], echolocation: ['meat', 'water'],
  klepto: ['meat'], tool_use: ['meat', 'plant'], apex_crush: ['meat'], fungal_farm: ['host', 'plant'],
  // FK
  binary_fission: ['mineral'], hgt: ['host'], budding: ['water'], fragmentation: ['water'], broadcast: ['water'],
  parthenogenesis: ['mineral'], veg_prop: ['plant'], spore: ['mineral'], semelparous: ['water'], swarm_breed: ['plant'],
  display: ['plant'], sperm_comp: ['water'], delayed_dev: ['mineral'], viviparity: ['meat'], lek: ['plant'],
  infanticide: ['meat'], allo_parent: ['plant'], ext_care: ['plant'], eusocial: ['plant'], seq_herm: ['water'],
  repro_manip: ['host'], sex_parasit: ['host', 'water'],
};

export const terrainElems = (t: string): Element[] => TERRAIN_ELEMENTS[t] || [];

// Weirdo / unlisted cards derive elements from the biomes they're native to.
function derive(card: any): Element[] {
  const s = new Set<Element>();
  (card.ter || []).forEach((t: string) => terrainElems(t).forEach((e) => s.add(e)));
  return Array.from(s).slice(0, 2);
}
export const cardElements = (card: any): Element[] => CARD_ELEMENTS[card.id] || derive(card);

export const matchedElements = (card: any, terrain: string): Element[] => {
  const te = terrainElems(terrain);
  return cardElements(card).filter((e) => te.includes(e));
};
export const matchCount = (card: any, terrain: string): number => matchedElements(card, terrain).length;
