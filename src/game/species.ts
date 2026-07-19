/* eslint-disable @typescript-eslint/no-explicit-any */
// The species roster — the bridge between abstract STRATEGIES (the cards) and
// the living world. Each species is a real organism that embodies one strategy
// in one biome. In a clash, a player's in-hand strategies map (via this table)
// to the species that could carry them in the contested biome, and the player
// names a DOMINANT species to lead the fight.
//
// Category (EAT vs F*CK) is derived from the strategy's deck — no duplication.
// This is a CURATED PROTOTYPE roster: a handful of species per biome across both
// categories, enough to exercise the mechanic. Expand once the flow feels right.
import { EAT, FK } from '../engine/data';

export interface Species { id: string; name: string; emoji: string; strategy: string; biome: string; }

const STRAT: Record<string, any> = Object.fromEntries([...EAT, ...FK].map((c: any) => [c.id, c]));
export const stratName = (id: string) => STRAT[id]?.n ?? id;
export const stratCat = (id: string): 'eat' | 'fk' => (EAT.some((c: any) => c.id === id) ? 'eat' : 'fk');

export const SPECIES: Species[] = [
  // ── V · Volcanic Vent (EAT-favored) ──
  { id: 'tubeworm', name: 'Giant Tube Worm', emoji: '🪱', strategy: 'chemosynthesis', biome: 'V' },
  { id: 'sulfurbact', name: 'Sulfur Bacteria', emoji: '🦠', strategy: 'anoxygenic', biome: 'V' },
  { id: 'methanogen', name: 'Methanogen Archaeon', emoji: '🌫️', strategy: 'binary_fission', biome: 'V' },
  { id: 'thermophile', name: 'Thermophile Microbe', emoji: '🧫', strategy: 'hgt', biome: 'V' },

  // ── I · Ice Age Tundra (EAT-favored) ──
  { id: 'polarbear', name: 'Polar Bear', emoji: '🐻‍❄️', strategy: 'apex_crush', biome: 'I' },
  { id: 'graywolf', name: 'Gray Wolf', emoji: '🐺', strategy: 'pack_hunt', biome: 'I' },
  { id: 'caribou', name: 'Caribou', emoji: '🦌', strategy: 'viviparity', biome: 'I' },
  { id: 'tardigrade', name: 'Tardigrade', emoji: '🐛', strategy: 'spore', biome: 'I' },
  { id: 'penguin', name: 'Emperor Penguin', emoji: '🐧', strategy: 'ext_care', biome: 'I' },

  // ── F · Canopy Forest (F*CK-favored) ──
  { id: 'chimp', name: 'Chimpanzee', emoji: '🐒', strategy: 'tool_use', biome: 'F' },
  { id: 'orbweaver', name: 'Orb-weaver Spider', emoji: '🕷️', strategy: 'trap_build', biome: 'F' },
  { id: 'leafcutter', name: 'Leafcutter Ant', emoji: '🐜', strategy: 'fungal_farm', biome: 'F' },
  { id: 'birdofpara', name: 'Bird of Paradise', emoji: '🦚', strategy: 'lek', biome: 'F' },
  { id: 'cordyceps', name: 'Cordyceps Fungus', emoji: '🍄', strategy: 'repro_manip', biome: 'F' },
  { id: 'stranglerfig', name: 'Strangler Fig', emoji: '🌳', strategy: 'veg_prop', biome: 'F' },

  // ── D · Desert (EAT-favored) ──
  { id: 'sidewinder', name: 'Sidewinder', emoji: '🐍', strategy: 'venom', biome: 'D' },
  { id: 'kangaroorat', name: 'Kangaroo Rat', emoji: '🐀', strategy: 'seed_pred', biome: 'D' },
  { id: 'whiptail', name: 'Whiptail Lizard', emoji: '🦎', strategy: 'parthenogenesis', biome: 'D' },
  { id: 'spadefoot', name: 'Spadefoot Toad', emoji: '🐸', strategy: 'delayed_dev', biome: 'D' },
  { id: 'resurrection', name: 'Resurrection Plant', emoji: '🌿', strategy: 'spore', biome: 'D' },

  // ── A · Savannah (EAT-favored) ──
  { id: 'cheetah', name: 'Cheetah', emoji: '🐆', strategy: 'solo_sprint', biome: 'A' },
  { id: 'lion', name: 'Lion', emoji: '🦁', strategy: 'pack_hunt', biome: 'A' },
  { id: 'wildebeest', name: 'Wildebeest', emoji: '🐃', strategy: 'bulk_graze', biome: 'A' },
  { id: 'locust', name: 'Desert Locust', emoji: '🦗', strategy: 'swarm_breed', biome: 'A' },
  { id: 'meerkat', name: 'Meerkat', emoji: '🦫', strategy: 'allo_parent', biome: 'A' },

  // ── P · Primordial Swamp (F*CK-favored) ──
  { id: 'alligator', name: 'American Alligator', emoji: '🐊', strategy: 'sit_wait', biome: 'P' },
  { id: 'watermold', name: 'Water Mold', emoji: '🍄', strategy: 'osmotrophy', biome: 'P' },
  { id: 'mosquito', name: 'Mosquito', emoji: '🦟', strategy: 'swarm_breed', biome: 'P' },
  { id: 'cyano', name: 'Cyanobacteria', emoji: '🦠', strategy: 'binary_fission', biome: 'P' },
  { id: 'cattail', name: 'Cattail', emoji: '🌾', strategy: 'veg_prop', biome: 'P' },

  // ── S · Shallow Sea (F*CK-favored) ──
  { id: 'giantclam', name: 'Giant Clam', emoji: '🦪', strategy: 'filter_feed', biome: 'S' },
  { id: 'reefshark', name: 'Reef Shark', emoji: '🦈', strategy: 'electro', biome: 'S' },
  { id: 'staghorn', name: 'Staghorn Coral', emoji: '🪸', strategy: 'broadcast', biome: 'S' },
  { id: 'clownfish', name: 'Clownfish', emoji: '🐠', strategy: 'seq_herm', biome: 'S' },
  { id: 'seastar', name: 'Sea Star', emoji: '⭐', strategy: 'fragmentation', biome: 'S' },

  // ── O · Open Ocean (EAT-favored) ──
  { id: 'bluewhale', name: 'Blue Whale', emoji: '🐋', strategy: 'filter_feed', biome: 'O' },
  { id: 'greatwhite', name: 'Great White Shark', emoji: '🦈', strategy: 'apex_crush', biome: 'O' },
  { id: 'orca', name: 'Orca', emoji: '🐳', strategy: 'pack_hunt', biome: 'O' },
  { id: 'salmon', name: 'Sockeye Salmon', emoji: '🐟', strategy: 'semelparous', biome: 'O' },
  { id: 'anglerfish', name: 'Anglerfish', emoji: '🎣', strategy: 'sex_parasit', biome: 'O' },

  // ── C · Deep Cave (F*CK-favored) ──
  { id: 'bat', name: 'Bat', emoji: '🦇', strategy: 'echolocation', biome: 'C' },
  { id: 'cavemicrobe', name: 'Cave Sulfur Microbe', emoji: '🦠', strategy: 'chemosynthesis', biome: 'C' },
  { id: 'crayfish', name: 'Marbled Crayfish', emoji: '🦞', strategy: 'parthenogenesis', biome: 'C' },
  { id: 'molerat', name: 'Naked Mole-Rat', emoji: '🐀', strategy: 'eusocial', biome: 'C' },

  // ── G · GM Lab (F*CK-favored) — engineered life ──
  { id: 'gmalgae', name: 'GM Biofuel Algae', emoji: '🦠', strategy: 'filter_feed', biome: 'G' },
  { id: 'phage', name: 'Engineered Phage', emoji: '🧬', strategy: 'parasitism', biome: 'G' },
  { id: 'ecoli', name: 'Engineered E. coli', emoji: '🧫', strategy: 'hgt', biome: 'G' },
  { id: 'genedrive', name: 'Gene-Drive Mosquito', emoji: '🦟', strategy: 'repro_manip', biome: 'G' },
  { id: 'labmouse', name: 'Knockout Lab Mouse', emoji: '🐁', strategy: 'viviparity', biome: 'G' },

  // ── coverage fills: a species for every remaining strategy ──
  { id: 'kelp', name: 'Giant Kelp', emoji: '🌿', strategy: 'oxygenic', biome: 'S' },            // EAT · Oxygenic Photosynthesis
  { id: 'fiddler', name: 'Fiddler Crab', emoji: '🦀', strategy: 'detritivory', biome: 'P' },     // EAT · Detritivory / Scavenging
  { id: 'okapi', name: 'Okapi', emoji: '🦌', strategy: 'browse', biome: 'F' },                   // EAT · Browse / Selective Feeding
  { id: 'wilddog', name: 'African Wild Dog', emoji: '🐕', strategy: 'persistence', biome: 'A' }, // EAT · Persistence Hunt
  { id: 'frigatebird', name: 'Frigatebird', emoji: '🕊️', strategy: 'klepto', biome: 'O' },       // EAT · Kleptoparasitism
  { id: 'hydra', name: 'Freshwater Hydra', emoji: '🪸', strategy: 'budding', biome: 'P' },        // F*CK · Budding / Colonial
  { id: 'cuttlefish', name: 'Cuttlefish', emoji: '🦑', strategy: 'display', biome: 'S' },         // F*CK · Honest Signal / Display
  { id: 'rightwhale', name: 'Right Whale', emoji: '🐋', strategy: 'sperm_comp', biome: 'O' },     // F*CK · Sperm Competition
  { id: 'brownbear', name: 'Brown Bear', emoji: '🐻', strategy: 'infanticide', biome: 'I' },      // F*CK · Infanticide / Takeover
];

export const SPECIES_BY_ID: Record<string, Species> = Object.fromEntries(SPECIES.map((s) => [s.id, s]));
export const speciesInBiome = (biome: string) => SPECIES.filter((s) => s.biome === biome);
export const speciesFor = (biome: string, strategy: string) => SPECIES.filter((s) => s.biome === biome && s.strategy === strategy);
export const speciesCat = (s: Species) => stratCat(s.strategy);
