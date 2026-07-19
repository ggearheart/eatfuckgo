/* eslint-disable @typescript-eslint/no-explicit-any */
// Humboldt-style "data columns" for each biome: real climate envelopes and
// representative organisms, the way the Naturgemälde flanked its mountain with
// tables of temperature, pressure, and the species that live at each band.
// Kept scientifically honest but concise — this is the nerdy content layer.

export interface Organism {
  n: string;        // common name
  sci: string;      // scientific name / group
  note: string;     // why it belongs to this niche
  wiki: string;     // Wikipedia article title for "learn more"
}
export interface BiomeDossier {
  tagline: string;          // one-line Humboldt-ish framing
  temp: string;             // representative temperature envelope
  moisture: string;         // water / precipitation regime
  chem: string;             // defining chemistry / energy source
  organisms: Organism[];    // 3 representative taxa
  warming: string;          // how a warming planet reshapes this niche (foreshadows the clock)
}

const O = (n: string, sci: string, note: string, wiki: string): Organism => ({ n, sci, note, wiki });

export const BIOME_DATA: Record<string, BiomeDossier> = {
  V: {
    tagline: 'Where the planet bleeds heat and life eats rock.',
    temp: 'Fluid 2–4 °C; vent effluent 60–400 °C',
    moisture: 'Fully marine, crushing abyssal pressure',
    chem: 'Chemosynthesis — H₂S & methane, no sunlight',
    organisms: [
      O('Giant tube worm', 'Riftia pachyptila', 'Houses sulfur-oxidizing bacteria instead of a gut', 'Riftia_pachyptila'),
      O('Yeti crab', 'Kiwa hirsuta', 'Farms bacteria on its own bristled arms', 'Kiwa_hirsuta'),
      O('Pompeii worm', 'Alvinella pompejana', 'Tolerates one of the steepest heat gradients known to animals', 'Alvinella_pompejana'),
    ],
    warming: 'Deep vents are buffered from surface warming — a refuge that grows relatively more valuable as shallow niches destabilize.',
  },
  I: {
    tagline: 'A world kept in cold storage, now thawing.',
    temp: '−40 to 0 °C; permafrost below',
    moisture: 'Locked as ice; low liquid availability',
    chem: 'Slow decomposition banks ancient carbon',
    organisms: [
      O('Woolly mammoth', 'Mammuthus primigenius', 'Megaherbivore that engineered the mammoth steppe', 'Woolly_mammoth'),
      O('Arctic fox', 'Vulpes lagopus', 'Countercurrent circulation and seasonal camouflage', 'Arctic_fox'),
      O('Tardigrade', 'Tardigrada', 'Cryptobiosis survives freezing and vacuum alike', 'Tardigrade'),
    ],
    warming: 'The first biome to fall: thaw releases methane and collapses the ice niche into tundra, then bog.',
  },
  F: {
    tagline: 'The green cathedral — most of the planet’s species live here.',
    temp: '20–28 °C, aseasonal',
    moisture: 'High: 2,000–4,000 mm rain / year',
    chem: 'Fierce light competition; thin, leached soils',
    organisms: [
      O('Strangler fig', 'Ficus spp.', 'Climbs a host, then throttles it to reach the canopy', 'Strangler_fig'),
      O('Leafcutter ant', 'Atta spp.', 'Farms fungus — agriculture evolved 50 M years before us', 'Leafcutter_ant'),
      O('Poison dart frog', 'Dendrobatidae', 'Sequesters alkaloid toxins from its diet', 'Poison_dart_frog'),
    ],
    warming: 'Rising heat pushes cloud forests upslope until they run out of mountain — the "escalator to extinction".',
  },
  D: {
    tagline: 'Scarcity as a design constraint.',
    temp: '0 °C nights to 50 °C days',
    moisture: 'Under 250 mm rain / year',
    chem: 'Water is the currency; CAM photosynthesis pays it',
    organisms: [
      O('Saguaro cactus', 'Carnegiea gigantea', 'Pleated stem stores water; CAM fixes CO₂ at night', 'Saguaro'),
      O('Fennec fox', 'Vulpes zerda', 'Giant ears dump heat, dense fur for cold nights', 'Fennec_fox'),
      O('Kangaroo rat', 'Dipodomys', 'Never drinks — metabolizes water from dry seeds', 'Kangaroo_rat'),
    ],
    warming: 'Deserts expand as subtropical dry belts spread — this niche is a net winner of a hotter planet.',
  },
  A: {
    tagline: 'Grass, grazers, and the arms race of the open plain.',
    temp: '20–30 °C, strong wet/dry seasons',
    moisture: 'Seasonal: 500–1,500 mm, fire-driven',
    chem: 'C₄ grasses; grazing and fire keep trees out',
    organisms: [
      O('Cheetah', 'Acinonyx jubatus', 'Built entirely around the sprint', 'Cheetah'),
      O('Termite', 'Macrotermes', 'Mound-builders that farm fungus and cycle nutrients', 'Termite'),
      O('Acacia', 'Vachellia', 'Trades sugar and shelter to ants for defense', 'Vachellia'),
    ],
    warming: 'Shifting rains and CO₂ favoring shrubs vs grass redraw the savanna’s edges unpredictably.',
  },
  P: {
    tagline: 'The primordial soup — where metabolism got started.',
    temp: '15–30 °C, stagnant and warm',
    moisture: 'Waterlogged, anoxic muck',
    chem: 'Low oxygen; fermentation and methanogenesis',
    organisms: [
      O('Cyanobacteria', 'Cyanobacteria', 'Invented oxygenic photosynthesis and remade the air', 'Cyanobacteria'),
      O('Lungfish', 'Dipnoi', 'Air-breathing survivor that can estivate in mud', 'Lungfish'),
      O('Mosquito', 'Culicidae', 'Larvae rule the still, warm water', 'Mosquito'),
    ],
    warming: 'Warm stagnant water plus nutrients means more anoxia and toxic algal blooms — a biome that spreads as it degrades.',
  },
  S: {
    tagline: 'The sunlit shallows — the ocean’s most crowded real estate.',
    temp: '18–29 °C, light-flooded',
    moisture: 'Marine, shallow photic zone',
    chem: 'Sunlight + carbonate chemistry build reefs',
    organisms: [
      O('Reef coral', 'Scleractinia', 'Animal + algal symbiont; the whole reef rests on it', 'Scleractinia'),
      O('Clownfish', 'Amphiprioninae', 'Lives immune within a stinging anemone', 'Amphiprioninae'),
      O('Giant clam', 'Tridacna gigas', 'Farms algae in its own mantle tissue', 'Tridacna_gigas'),
    ],
    warming: 'Heat drives coral bleaching and acidification dissolves carbonate — the shallows are on the front line.',
  },
  O: {
    tagline: 'The blue engine — vast, dilute, and relentless.',
    temp: '4–25 °C by depth and latitude',
    moisture: 'Wholly marine, open water',
    chem: 'Phytoplankton fix half the planet’s oxygen',
    organisms: [
      O('Blue whale', 'Balaenoptera musculus', 'Largest animal ever; filters krill by the ton', 'Blue_whale'),
      O('Great white shark', 'Carcharodon carcharias', 'Apex pursuit predator of the pelagic zone', 'Great_white_shark'),
      O('Krill', 'Euphausiacea', 'The swarm the whole food web pivots on', 'Krill'),
    ],
    warming: 'Warming stratifies the water column and starves plankton of nutrients; oxygen-minimum zones widen.',
  },
  C: {
    tagline: 'Life in permanent dark — energy borrowed from above.',
    temp: 'Stable 8–15 °C year-round',
    moisture: 'Dripping, humid, mineral-rich',
    chem: 'No light; chemolithotrophy and imported detritus',
    organisms: [
      O('Olm', 'Proteus anguinus', 'Blind cave salamander that can fast for years', 'Olm'),
      O('Cave fish', 'Amblyopsidae', 'Lost eyes and pigment, gained lateral-line senses', 'Amblyopsidae'),
      O('Snottite', 'Acidophilic biofilm', 'Microbial drips living on cave-wall sulfur', 'Snottite'),
    ],
    warming: 'Buffered and constant, caves are a thermal refuge — but depend on the surface world that feeds them.',
  },
  G: {
    tagline: 'The Anthropocene niche — evolution under human hands.',
    temp: 'Climate-controlled 21 °C',
    moisture: 'Engineered, on demand',
    chem: 'Directed: CRISPR, selection, synthetic pathways',
    organisms: [
      O('Lab mouse', 'Mus musculus', 'The most engineered mammal on Earth', 'Laboratory_mouse'),
      O('E. coli K-12', 'Escherichia coli', 'The workhorse chassis of biotechnology', 'Escherichia_coli'),
      O('Golden rice', 'Oryza sativa (GM)', 'Engineered to make provitamin A', 'Golden_rice'),
    ],
    warming: 'The one biome that can be steered — a wildcard that adapts as fast as its makers choose.',
  },
};
