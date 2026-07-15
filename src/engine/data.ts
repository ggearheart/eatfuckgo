/* eslint-disable @typescript-eslint/no-explicit-any */
// Game data + rule tables, ported verbatim from the EAT IT | F*CK IT prototype.
// Scenario/catastrophe fx closures read CTX (set via setCtx before evaluation).
export type Side = 'atk' | 'def';
export const CTX = { battleType: 'eat' as 'eat' | 'fk', terrain: 'V' as string };
export function setCtx(bt: 'eat'|'fk', terrain: string){ CTX.battleType = bt; CTX.terrain = terrain; }


export const CFG = {
  startLife: 5,
  energyPerRound: 3,     // split each round between Metabolize / Reproduce
  nativeBonus: 2,        // base native-terrain power (terrain table overrides)
  packMax: 3, lineageMax: 3,
  critRoll: 6, critBonus: 2,   // Selection Die
  fumbleRoll: 1, fumblePenalty: 2,
};

export const KW: Record<string,string[]> = {
  sit_wait:['ambush'], trap_build:['ambush'],
  venom:['venom','range'], electro:['venom'],
  echolocation:['range'], hgt:['range'], spore:['range','tough'], repro_manip:['range'],
  pack_hunt:['pack'], persistence:['pack'], allo_parent:['pack'], eusocial:['pack'],
  broadcast:['swarm'], swarm_breed:['swarm'], binary_fission:['swarm'], budding:['swarm'],
  fragmentation:['tough'],
};


export const kwOf = (c: any): string[] => (c.kw || (KW as any)[c.id] || []);
export const hasKW = (c: any, k: string) => kwOf(c).includes(k);
export const isAquatic = (c: any) => (c.ter || []).some((t: string) => t === 'O' || t === 'S');
export const isCold = (c: any) => (c.ter || []).includes('I');
export const isPhoto = (c: any) => c.id === 'anoxygenic' || c.id === 'oxygenic';
export const stat = (c: any) => (CTX.battleType === 'eat' ? c.off : c.rep);

export const EAT: any[] = [
  {id:'chemosynthesis',n:'Chemosynthesis',art:'⚗️',t:0,off:0,def:4,rep:0,ada:5,mov:1,ter:['V','C'],rs:0,fs:0},
  {id:'anoxygenic',n:'Anoxygenic Photosynthesis',art:'☀️',t:0,off:0,def:2,rep:0,ada:2,mov:1,ter:['V','S'],rs:0,fs:0},
  {id:'oxygenic',n:'Oxygenic Photosynthesis',art:'🌿',t:0,off:0,def:3,rep:3,ada:4,mov:1,ter:['S','P','F'],rs:0,fs:0},
  {id:'osmotrophy',n:'Osmotrophy / Absorption',art:'🍄',t:0,off:0,def:0,rep:2,ada:3,mov:1,ter:['P','F'],rs:0,fs:0},
  {id:'filter_feed',n:'Filter Feeding',art:'🐋',t:1,off:0,def:2,rep:3,ada:2,mov:1,ter:['O','S','P'],rs:0,fs:0},
  {id:'detritivory',n:'Detritivory / Scavenging',art:'🦅',t:1,off:0,def:3,rep:0,ada:3,mov:1,ter:['P','A','F'],rs:0,fs:0},
  {id:'parasitism',n:'Parasitism (Feeding)',art:'🪱',t:1,off:2,def:3,rep:0,ada:4,mov:1,ter:['P','F','A','S','D','C'],rs:0,fs:0},
  {id:'bulk_graze',n:'Bulk Grazing',art:'🦕',t:2,off:0,def:4,rep:2,ada:0,mov:2,ter:['A','F'],rs:0,fs:0},
  {id:'browse',n:'Browse / Selective Feeding',art:'🦒',t:2,off:0,def:0,rep:0,ada:3,mov:3,ter:['F','A'],rs:0,fs:0},
  {id:'sit_wait',n:'Sit-and-Wait Ambush',art:'🐊',t:2,off:5,def:3,rep:0,ada:0,mov:1,ter:['P','F','D'],rs:0,fs:1},
  {id:'seed_pred',n:'Seed Predation',art:'🐦',t:2,off:0,def:0,rep:3,ada:3,mov:1,ter:['F','A','D'],rs:0,fs:0},
  {id:'venom',n:'Venom Injection',art:'🐍',t:3,off:6,def:4,rep:0,ada:3,mov:1,ter:['D','F','S'],rs:1,fs:0},
  {id:'trap_build',n:'Trap Building',art:'🕷️',t:3,off:4,def:2,rep:0,ada:4,mov:1,ter:['F','C','P'],rs:0,fs:1},
  {id:'solo_sprint',n:'Solo Sprint Pursuit',art:'🐆',t:3,off:5,def:2,rep:0,ada:0,mov:6,ter:['A','O'],rs:0,fs:0},
  {id:'electro',n:'Electrosensory Hunt',art:'🦈',t:3,off:5,def:0,rep:0,ada:4,mov:1,ter:['O','S','C'],rs:1,fs:0},
  {id:'persistence',n:'Persistence Hunt',art:'🐺',t:4,off:4,def:0,rep:0,ada:4,mov:5,ter:['A','I'],rs:0,fs:0},
  {id:'pack_hunt',n:'Pack / Cooperative Hunting',art:'🦁',t:4,off:7,def:0,rep:0,ada:5,mov:4,ter:['A','O','I'],rs:0,fs:0},
  {id:'echolocation',n:'Echolocation Hunt',art:'🦇',t:4,off:5,def:0,rep:0,ada:4,mov:5,ter:['C','O'],rs:1,fs:0},
  {id:'klepto',n:'Kleptoparasitism',art:'🦴',t:4,off:5,def:2,rep:0,ada:0,mov:5,ter:['A','O'],rs:0,fs:0},
  {id:'tool_use',n:'Tool Use / Extraction',art:'🐒',t:4,off:4,def:0,rep:0,ada:7,mov:3,ter:['F','A'],rs:0,fs:0},
  {id:'apex_crush',n:'Apex Crushing Predator',art:'🦖',t:5,off:8,def:5,rep:0,ada:0,mov:2,ter:['A','O','I'],rs:0,fs:0},
  {id:'fungal_farm',n:'Fungal Farming',art:'🌾',t:5,off:0,def:3,rep:3,ada:6,mov:1,ter:['C','F'],rs:0,fs:0},
];

export const FK: any[] = [
  {id:'binary_fission',n:'Binary Fission',art:'🔬',t:0,off:0,def:0,rep:8,ada:-2,mov:1,ter:['V','P'],rs:0,fs:0},
  {id:'hgt',n:'Horizontal Gene Transfer',art:'🔄',t:0,off:0,def:0,rep:3,ada:9,mov:1,ter:['V','P'],rs:1,fs:0},
  {id:'budding',n:'Budding / Colonial',art:'🪸',t:0,off:0,def:2,rep:6,ada:0,mov:1,ter:['P','S'],rs:0,fs:0},
  {id:'fragmentation',n:'Fragmentation / Regen',art:'⭐',t:0,off:0,def:6,rep:4,ada:0,mov:1,ter:['S','P'],rs:0,fs:0},
  {id:'broadcast',n:'Broadcast Spawning',art:'🐟',t:1,off:0,def:-2,rep:9,ada:2,mov:1,ter:['O','S','P'],rs:0,fs:0},
  {id:'parthenogenesis',n:'Parthenogenesis',art:'🦎',t:1,off:0,def:0,rep:7,ada:1,mov:1,ter:['D','C','I'],rs:0,fs:0},
  {id:'veg_prop',n:'Vegetative / Clonal Spread',art:'🌱',t:1,off:0,def:3,rep:5,ada:0,mov:3,ter:['F','P','A'],rs:0,fs:0},
  {id:'spore',n:'Spore / Cryptobiosis',art:'💠',t:1,off:0,def:8,rep:4,ada:5,mov:1,ter:['D','I','V'],rs:1,fs:0},
  {id:'semelparous',n:'Semelparous Reproduction',art:'🐠',t:2,off:3,def:0,rep:8,ada:-1,mov:1,ter:['O','A','I'],rs:0,fs:0},
  {id:'swarm_breed',n:'Swarm Breeding',art:'🦗',t:2,off:0,def:3,rep:7,ada:0,mov:1,ter:['P','A','S'],rs:0,fs:0},
  {id:'display',n:'Honest Signal / Display',art:'🦚',t:2,off:0,def:-2,rep:6,ada:4,mov:1,ter:['A','F','S'],rs:0,fs:0},
  {id:'sperm_comp',n:'Sperm Competition',art:'🔭',t:2,off:0,def:0,rep:6,ada:5,mov:1,ter:['O','S','P','A'],rs:0,fs:0},
  {id:'delayed_dev',n:'Delayed Development',art:'🐻',t:2,off:0,def:5,rep:0,ada:5,mov:1,ter:['I','D'],rs:0,fs:0},
  {id:'viviparity',n:'Viviparity (Live Birth)',art:'🐬',t:3,off:0,def:5,rep:3,ada:4,mov:1,ter:['I','D','F'],rs:0,fs:0},
  {id:'lek',n:'Lek Mating System',art:'🦃',t:3,off:3,def:0,rep:7,ada:0,mov:1,ter:['A','F'],rs:0,fs:0},
  {id:'infanticide',n:'Infanticide / Takeover',art:'😤',t:3,off:5,def:-1,rep:5,ada:0,mov:1,ter:['A','I'],rs:0,fs:0},
  {id:'allo_parent',n:'Alloparental Care',art:'🦮',t:3,off:0,def:6,rep:3,ada:5,mov:1,ter:['A','F','C'],rs:0,fs:0},
  {id:'ext_care',n:'Extended Parental Care',art:'🐘',t:4,off:0,def:4,rep:2,ada:6,mov:1,ter:['F','I'],rs:0,fs:0},
  {id:'eusocial',n:'Eusociality',art:'🐝',t:4,off:5,def:7,rep:5,ada:0,mov:1,ter:['F','C'],rs:0,fs:0},
  {id:'seq_herm',n:'Sequential Hermaphroditism',art:'🐡',t:4,off:0,def:0,rep:6,ada:6,mov:1,ter:['S','O'],rs:0,fs:0},
  {id:'repro_manip',n:'Reproductive Manipulation',art:'🍄',t:4,off:6,def:0,rep:6,ada:5,mov:1,ter:['F','P'],rs:1,fs:0},
];

export const WEIRDO_STACKS: Record<string,any> = {
  1:{n:'Lamprey',art:'🪡',cards:[
    {id:'w_sucker',n:'Sucker Lock',art:'🪠',off:4,def:1,rep:6,ada:4,mov:4,ter:['O','S'],kw:['venom']},
    {id:'w_rasp',n:'Rasping Tongue',art:'👅',off:5,def:1,rep:2,ada:3,mov:3,ter:['O','S'],kw:[]},
    {id:'w_anticoag',n:'Anticoagulant',art:'🩸',off:3,def:2,rep:4,ada:5,mov:2,ter:['O','S'],kw:['venom']}]},
  2:{n:'Platypus',art:'🦆',cards:[
    {id:'w_electro',n:'Electroreception',art:'⚡',off:5,def:3,rep:3,ada:6,mov:3,ter:['P','S'],kw:['range']},
    {id:'w_venomspur',n:'Venom Spur',art:'🦵',off:6,def:2,rep:1,ada:3,mov:2,ter:['P'],kw:['venom']},
    {id:'w_egglay',n:'Monotreme Eggs',art:'🥚',off:0,def:4,rep:6,ada:4,mov:1,ter:['P','F'],kw:[]}]},
  3:{n:'Horseshoe Crab',art:'🦀',cards:[
    {id:'w_fossil',n:'Living Fossil',art:'🪨',off:1,def:8,rep:5,ada:8,mov:1,ter:['S','O'],kw:['tough']},
    {id:'w_molt',n:'Armored Molt',art:'🛡️',off:2,def:7,rep:3,ada:4,mov:1,ter:['S'],kw:['tough']},
    {id:'w_massspawn',n:'Mass Spawn',art:'🥚',off:0,def:3,rep:8,ada:2,mov:1,ter:['S','O'],kw:['swarm']}]},
  4:{n:'Fungi Network',art:'🍄',cards:[
    {id:'w_mycelium',n:'Mycelium Web',art:'🕸️',off:2,def:4,rep:5,ada:7,mov:0,ter:['F','C'],kw:['tough']},
    {id:'w_spores',n:'Spore Burst',art:'💠',off:0,def:5,rep:8,ada:5,mov:1,ter:['F','C','D'],kw:['swarm','range']},
    {id:'w_decay',n:'Decomposition',art:'🍂',off:3,def:3,rep:4,ada:6,mov:0,ter:['F','P'],kw:[]}]},
  5:{n:'Tardigrade',art:'🐛',cards:[
    {id:'w_crypto',n:'Cryptobiosis',art:'🛏️',off:0,def:10,rep:2,ada:10,mov:1,ter:['I','D','V'],kw:['tough']},
    {id:'w_anhydro',n:'Anhydrobiosis',art:'🏜️',off:0,def:9,rep:3,ada:8,mov:1,ter:['D','I'],kw:['tough']},
    {id:'w_dnarepair',n:'DNA Repair',art:'🧬',off:1,def:7,rep:4,ada:9,mov:1,ter:['V','C'],kw:['tough']}]},
  6:{n:'Mantis Shrimp',art:'🦐',cards:[
    {id:'w_dactyl',n:'Dactyl Club',art:'🥊',off:8,def:2,rep:4,ada:3,mov:4,ter:['S','O'],kw:['ambush']},
    {id:'w_polarvis',n:'Polarized Vision',art:'🌈',off:5,def:2,rep:3,ada:8,mov:4,ter:['S','O'],kw:['range']},
    {id:'w_strike',n:'Cavitation Strike',art:'💥',off:7,def:1,rep:2,ada:5,mov:3,ter:['S','O'],kw:['range']}]},
};

export const TERRAIN_FX: Record<string,any> = {
  V:{native:3, nonNative:-1, note:'Volcanic: natives +3, others −1.'},
  O:{native:2, ambushOff:true, fastBonus:2, note:'Open Ocean: ambush useless; MOV ≥4 +2.'},
  F:{native:2, blockRange:true, ambushBonus:2, note:'Forest: rangestrike blocked; ambush +2.'},
  C:{native:2, blockRange:true, nonNative:-1, note:'Cave: range blocked; darkness −1 to non-natives.'},
  I:{native:2, swarmPenalty:-2, toughBonus:1, note:'Ice Age: swarmers −2; tough +1.'},
  A:{native:2, ambushOff:true, packBonus:2, note:'Savannah: ambush off; pack +2.'},
  D:{native:2, ambushBonus:2, venomBonus:1, swarmPenalty:-2, note:'Desert: ambush +2, venom +1, swarmers −2.'},
  S:{native:2, aquaticBonus:1, note:'Shallow Sea: aquatic +1.'},
  P:{native:2, aquaticBonus:1, note:'Swamp: aquatic +1.'},
  G:{native:1, wildcard:true, note:'GM Lab: a random ±1 mutation each clash.'},
};

export const CATASTROPHES: any[] = [
  {id:'extinction', icon:'☄️', name:'Mass Extinction', head:'The big and specialized die first.',
   fx:c=>(c.t>=4?-3:0) + ((hasKW(c,'swarm')||hasKW(c,'tough'))?2:0)},
  {id:'icesnap', icon:'🧊', name:'Ice Snap', head:'Cold-blooded plans freeze.',
   fx:c=>(isCold(c)?0:-2)},
  {id:'winter', icon:'🌑', name:'Asteroid Winter', head:'No sun, no sight — range & photosynthesis fail.',
   fx:c=>((hasKW(c,'range')||isPhoto(c))?-3:0)},
  {id:'anoxia', icon:'🟢', name:'Ocean Anoxia', head:'The water suffocates.',
   fx:c=>(isAquatic(c)?-3:0)},
  {id:'hyperthermal', icon:'🔥', name:'Hyperthermal Spike', head:'Everything cooks except the vent-dwellers.',
   fx:c=>((c.ter||[]).includes('V')?0:-2)},
  {id:'bloom', icon:'🌸', name:'Resource Bloom', head:'Abundance — breeders gorge.',
   fx:c=>0, reproDouble:true},
];

export const SCENARIOS: any[] = [
  {id:'abundance', icon:'☀️', name:'Abundance', tag:'breeders gorge',
   story:t=>`Plenty floods the ${t}. Breeders and swarmers gorge; lone specialists find little advantage.`,
   fx:c=> (hasKW(c,'swarm')||stat(c)>=7) ? {dice:2,thr:0} : (c.t>=5 ? {dice:-1,thr:0} : {dice:0,thr:0}) },
  {id:'scarcity', icon:'🥀', name:'Scarcity', tag:'lean times',
   story:t=>`The ${t} runs dry and lean. The dormant and the frugal endure; big metabolisms starve.`,
   fx:c=> (hasKW(c,'tough')||stat(c)<=2) ? {dice:2,thr:0} : (stat(c)>=6 ? {dice:-1,thr:0} : {dice:0,thr:0}) },
  {id:'darkness', icon:'🌙', name:'Total Darkness', tag:'the blind hunt',
   story:t=>`Light fails in the ${t}. Echolocators and electro-hunters thrive; sight-based pursuers stumble.`,
   fx:c=> hasKW(c,'range') ? {dice:2,thr:0} : ((c.mov||1)>=4 && !hasKW(c,'range') ? {dice:0,thr:1} : {dice:0,thr:0}) },
  {id:'influx', icon:'🐾', name:'Predator Influx', tag:'danger everywhere',
   story:t=>`Predators pour into the ${t}. The armored shrug it off; the fragile are picked apart.`,
   fx:c=> (c.def>=5) ? {dice:2,thr:0} : (c.def<=1 ? {dice:-1,thr:0} : {dice:0,thr:0}) },
  {id:'crowding', icon:'👥', name:'Crowding', tag:'safety in numbers',
   story:t=>`The ${t} teems and crowds. Cooperative and social strategies dominate; loners are jostled out.`,
   fx:c=> hasKW(c,'pack') ? {dice:2,thr:0} : {dice:0,thr:0} },
  {id:'upheaval', icon:'🌪️', name:'Upheaval', tag:'chaos rewards generalists',
   story:t=>`Sudden upheaval scrambles the ${t}. Flexible generalists cope; everything is a little off-balance.`,
   fx:c=> (c.ada>=6) ? {dice:1,thr:0} : {dice:0,thr:1} },
];

export const BOARDS: Record<string,any> = {
  V:{name:'Volcanic Vent',icon:'🌋',
    desc:'Sulfuric vents power chemosynthetic strategies (+1 Power). Rock formations block all rangestrikes through them.',
    f:{'0,3':'VO','1,2':'VO','1,4':'RO','2,3':'RO','3,2':'VO','3,4':'RO','4,3':'VO'}},
  P:{name:'Primordial Swamp',icon:'🌿',
    desc:'Bogs slow all non-native movement (−1 MOV). Swamp pools are impassable to non-aquatic strategies.',
    f:{'0,2':'BO','0,4':'BO','1,3':'SW','2,2':'BO','2,4':'BO','3,3':'SW','4,3':'BO'}},
  S:{name:'Shallow Sea',icon:'🐚',
    desc:'Reef hexes block rangestrikes and boost aquatic Skill (+1). Currents penalize non-aquatic movement (−1 MOV).',
    f:{'0,3':'WA','1,2':'RE','1,4':'WA','2,3':'WA','3,2':'WA','3,4':'RE','4,3':'WA'}},
  O:{name:'Open Ocean',icon:'🌊',
    desc:'Open ground extends all rangestrike range by 1 hex. Deep water zones are impassable to non-aquatic strategies.',
    f:{'0,3':'OP','1,2':'DE','1,4':'OP','2,3':'OP','3,2':'OP','3,4':'DE','4,3':'OP'}},
  I:{name:'Ice Age Tundra',icon:'❄️',
    desc:'Ice sheets everywhere. Non-cold-native strategies lose −1 Skill. Crossing ice costs +1 MOV.',
    f:{'0,3':'IC','1,2':'IC','1,4':'IC','2,2':'IC','2,4':'IC','3,3':'IC','4,3':'IC'}},
  A:{name:'Savannah',icon:'🌾',
    desc:'Open ground extends rangestrike range. Tall grass patches give desert/savannah natives First Strike.',
    f:{'0,2':'OP','0,4':'OP','1,3':'OP','2,2':'SA','2,4':'SA','3,3':'OP','4,3':'OP'}},
  F:{name:'Canopy Forest',icon:'🌲',
    desc:'Dense canopy blocks ALL rangestrikes. Non-forest-native strategies suffer −1 Skill throughout the battle.',
    f:{'0,3':'TR','1,2':'TR','1,4':'TR','2,3':'TR','3,2':'TR','3,4':'TR','4,3':'TR'}},
  D:{name:'Desert',icon:'🏜️',
    desc:'Sand dunes grant desert-native First Strike. Rock formations block rangestrikes and slow non-natives (−1 MOV).',
    f:{'0,3':'SA','1,2':'RO','1,4':'SA','2,3':'SA','3,2':'SA','3,4':'RO','4,3':'SA'}},
  C:{name:'Deep Cave',icon:'🕳️',
    desc:'Darkness penalizes all non-cave-native Skill (−1). Cave-native strategies gain +1 Power. Rock blocks rangestrikes.',
    f:{'0,2':'RO','0,4':'CA','1,3':'CA','2,2':'CA','2,4':'RO','3,3':'CA','4,3':'RO'}},
  G:{name:'GM Lab',icon:'⚗️',
    desc:'Chaotic battleground. Random features from multiple biomes create unpredictable terrain advantages.',
    f:{'1,2':'VO','1,4':'IC','2,3':'OP','3,2':'TR','3,4':'WA'}},
};

export const ART: Record<string,string> = {
  // EAT — Ambush: croc eyes lurking at the waterline
  sit_wait:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#bfe6cf"/><rect y="56" width="100" height="44" fill="#3aa56b"/><path d="M0,56 q12,-5 24,0 t24,0 t24,0 t24,0" fill="#5cc98a" stroke="#0b3d24" stroke-width="2"/><path d="M14,57 Q42,38 74,52 L82,57 Z" fill="#2f7d4f" stroke="#0b3d24" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="48" r="7" fill="#f4d442" stroke="#0b3d24" stroke-width="3"/><circle cx="30" cy="49" r="2.4" fill="#0b3d24"/><circle cx="50" cy="46" r="7" fill="#f4d442" stroke="#0b3d24" stroke-width="3"/><circle cx="50" cy="47" r="2.4" fill="#0b3d24"/><circle cx="80" cy="70" r="3" fill="#cdeede"/><circle cx="88" cy="82" r="2" fill="#cdeede"/></svg>`,
  // EAT — Venom: dripping fang
  venom:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#efe2c4"/><path d="M30,18 Q50,8 70,18 Q66,30 50,32 Q34,30 30,18 Z" fill="#caa24a" stroke="#0b0b0b" stroke-width="3"/><path d="M44,30 L40,66 Q50,78 60,66 L56,30 Z" fill="#fff" stroke="#0b0b0b" stroke-width="3" stroke-linejoin="round"/><path d="M50,78 q-5,9 0,16 q5,-7 0,-16Z" fill="#37b24d" stroke="#0b3d24" stroke-width="2.5"/><circle cx="50" cy="98" r="3" fill="#37b24d"/></svg>`,
  // EAT — Range: bat + sonar arcs
  echolocation:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#16203a"/><g fill="none" stroke="#7fd0ff" stroke-width="3" stroke-linecap="round"><path d="M58,50 a14,14 0 0 1 0,0"/><path d="M58,38 a18,18 0 0 1 0,24"/><path d="M58,30 a26,26 0 0 1 0,40"/><path d="M58,22 a34,34 0 0 1 0,56"/></g><path d="M22,40 Q30,28 38,40 Q34,48 30,46 Q26,48 22,40 Z" fill="#2b2b3a" stroke="#000" stroke-width="2.5"/><circle cx="30" cy="48" r="9" fill="#3a3a52" stroke="#000" stroke-width="3"/><circle cx="27" cy="47" r="1.6" fill="#ffd21a"/><circle cx="33" cy="47" r="1.6" fill="#ffd21a"/></svg>`,
  // EAT — Pack: three converging hunters
  pack_hunt:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#e8c98a"/><g fill="#7a4a1e" stroke="#0b0b0b" stroke-width="3" stroke-linejoin="round"><path d="M20,30 l16,8 -16,8 5,-8 Z"/><path d="M20,62 l16,8 -16,8 5,-8 Z"/></g><g transform="translate(0,0)"><path d="M84,42 l-18,10 18,10 -6,-10 Z" fill="#9a5a24" stroke="#0b0b0b" stroke-width="3" stroke-linejoin="round"/></g><circle cx="55" cy="52" r="7" fill="#fff" stroke="#0b0b0b" stroke-width="3"/><circle cx="55" cy="52" r="3" fill="#c02018"/></svg>`,
  // FK — Swarm: cloud of eggs dispersing
  broadcast:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#16527a"/><g fill="#bfe8ff" stroke="#0b3d5a" stroke-width="2"><circle cx="50" cy="64" r="9"/><circle cx="34" cy="46" r="5"/><circle cx="66" cy="44" r="5"/><circle cx="24" cy="62" r="4"/><circle cx="76" cy="60" r="4"/><circle cx="44" cy="30" r="3.5"/><circle cx="60" cy="28" r="3"/><circle cx="30" cy="32" r="2.5"/><circle cx="72" cy="32" r="2.5"/><circle cx="50" cy="20" r="2.5"/></g><circle cx="50" cy="64" r="3" fill="#16527a"/></svg>`,
  // FK — Tough: armored dormant spore capsule
  spore:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#2a1840"/><ellipse cx="50" cy="52" rx="26" ry="32" fill="#c9a6f0" stroke="#0b0b0b" stroke-width="4"/><g stroke="#5a2f8a" stroke-width="2.5" fill="none"><path d="M34,40 H66"/><path d="M30,52 H70"/><path d="M34,64 H66"/><path d="M50,24 V80"/></g><path d="M50,18 l6,8 -12,0 Z" fill="#ffd21a" stroke="#0b0b0b" stroke-width="2"/></svg>`,
  // EAT — Chemosynthesis: hydrothermal vent
  chemosynthesis:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#0a1226"/><g fill="#3a3550"><circle cx="40" cy="30" r="10" opacity=".7"/><circle cx="52" cy="20" r="13" opacity=".6"/><circle cx="44" cy="44" r="8" opacity=".7"/></g><path d="M30,100 L40,60 H60 L70,100 Z" fill="#4a3a2a" stroke="#000" stroke-width="3"/><rect x="42" y="52" width="16" height="12" rx="2" fill="#1a1208" stroke="#000" stroke-width="3"/><circle cx="36" cy="74" r="3" fill="#ff7a3a"/><circle cx="64" cy="80" r="3" fill="#ff7a3a"/></svg>`,
  // EAT — Photosynthesis: sun + leaf
  oxygenic:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#cdeafe"/><circle cx="32" cy="32" r="14" fill="#ffd21a" stroke="#0b0b0b" stroke-width="3"/><g stroke="#0b0b0b" stroke-width="3" stroke-linecap="round"><path d="M32,8 V2"/><path d="M32,62 V56"/><path d="M8,32 H2"/><path d="M56,32 H62"/><path d="M15,15 l-4,-4"/><path d="M49,15 l4,-4"/></g><path d="M70,86 Q42,82 50,52 Q86,52 70,86 Z" fill="#37a24a" stroke="#0b3d24" stroke-width="3"/><path d="M64,82 Q60,64 72,56" fill="none" stroke="#0b3d24" stroke-width="2.5"/></svg>`,
  // FK — Binary fission: a cell splitting
  binary_fission:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#10243a"/><circle cx="34" cy="50" r="22" fill="#7fd0a0" stroke="#0b0b0b" stroke-width="4"/><circle cx="66" cy="50" r="22" fill="#7fd0a0" stroke="#0b0b0b" stroke-width="4"/><circle cx="34" cy="50" r="6" fill="#1a6a44"/><circle cx="66" cy="50" r="6" fill="#1a6a44"/><path d="M50,28 V72" stroke="#0b0b0b" stroke-width="3" stroke-dasharray="4 4"/></svg>`,
  // EAT — Apex predator: toothy jaws
  apex_crush:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#7a1818"/><path d="M16,40 Q50,18 84,40 L84,46 Q50,40 16,46 Z" fill="#3a2a22" stroke="#000" stroke-width="3"/><path d="M16,62 Q50,84 84,62 L84,56 Q50,62 16,56 Z" fill="#3a2a22" stroke="#000" stroke-width="3"/><g fill="#fff" stroke="#000" stroke-width="1.5"><path d="M24,46 l5,10 5,-10Z"/><path d="M40,47 l5,11 5,-11Z"/><path d="M56,47 l5,11 5,-11Z"/><path d="M72,46 l5,10 5,-10Z"/><path d="M30,56 l5,-9 5,9Z"/><path d="M50,57 l5,-9 5,9Z"/><path d="M66,56 l5,-9 5,9Z"/></g></svg>`,
  // EAT — Trap building: spider web
  trap_build:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#15301f"/><g stroke="#bfead0" stroke-width="2" fill="none"><path d="M50,50 L50,8 M50,50 L86,28 M50,50 L86,72 M50,50 L50,92 M50,50 L14,72 M50,50 L14,28"/><path d="M50,20 L72,34 L72,66 L50,80 L28,66 L28,34 Z"/><path d="M50,32 L62,40 L62,60 L50,68 L38,60 L38,40 Z"/></g><circle cx="50" cy="50" r="6" fill="#3a1a1a" stroke="#000" stroke-width="2.5"/><circle cx="46" cy="48" r="1.4" fill="#ff5a3a"/><circle cx="54" cy="48" r="1.4" fill="#ff5a3a"/></svg>`,
  // FK — Parthenogenesis: lizard + egg (clonal, no mate)
  parthenogenesis:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#e8b878"/><path d="M20,60 Q40,40 60,52 Q74,58 84,48 Q80,64 60,64 Q40,72 22,68 Z" fill="#4a8a3a" stroke="#0b3d24" stroke-width="3" stroke-linejoin="round"/><path d="M20,60 q-10,4 -12,14 q8,-2 14,-6" fill="#4a8a3a" stroke="#0b3d24" stroke-width="3"/><circle cx="74" cy="50" r="2.2" fill="#0b3d24"/><ellipse cx="40" cy="82" rx="9" ry="11" fill="#fff" stroke="#0b0b0b" stroke-width="3"/></svg>`,
  // EAT — Filter feeding: baleen whale + plankton
  filter_feed:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#1b6fa8"/><g fill="#bfe8ff"><circle cx="22" cy="22" r="2.5"/><circle cx="36" cy="16" r="2"/><circle cx="48" cy="24" r="2.5"/><circle cx="30" cy="32" r="2"/></g><path d="M8,46 Q40,28 92,42 Q94,64 60,70 L20,70 Q6,60 8,46 Z" fill="#46647a" stroke="#06223a" stroke-width="3" stroke-linejoin="round"/><g stroke="#eaf6ff" stroke-width="2"><path d="M26,58 V70"/><path d="M34,58 V70"/><path d="M42,58 V70"/><path d="M50,58 V70"/><path d="M58,58 V69"/></g><circle cx="80" cy="50" r="4.5" fill="#fff" stroke="#06223a" stroke-width="2.5"/><circle cx="81" cy="50" r="2" fill="#06223a"/></svg>`,
  // EAT — Solo sprint: cheetah dash with speed lines
  solo_sprint:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#e6c878"/><g stroke="#b8923f" stroke-width="5" stroke-linecap="round"><path d="M4,34 H30"/><path d="M2,50 H26"/><path d="M6,66 H28"/></g><path d="M34,54 Q50,40 72,46 Q82,44 92,38 Q86,54 72,56 Q54,62 36,60 Z" fill="#d98a2b" stroke="#5a3210" stroke-width="3" stroke-linejoin="round"/><g stroke="#5a3210" stroke-width="4" stroke-linecap="round"><path d="M44,58 l-4,14"/><path d="M58,58 l4,14"/><path d="M68,56 l6,14"/></g><circle cx="88" cy="40" r="2" fill="#5a3210"/><g fill="#5a3210"><circle cx="50" cy="50" r="1.5"/><circle cx="60" cy="52" r="1.5"/><circle cx="68" cy="50" r="1.5"/></g></svg>`,
  // EAT — Bulk grazing: big jaw mowing grass
  bulk_graze:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#bfe08a"/><g stroke="#3a7a2a" stroke-width="4" stroke-linecap="round"><path d="M14,92 V64"/><path d="M24,92 V58"/><path d="M34,92 V66"/><path d="M44,92 V60"/></g><path d="M50,40 Q80,30 90,46 Q92,60 74,62 L54,60 Q46,52 50,40 Z" fill="#8a6a3a" stroke="#3a2410" stroke-width="3" stroke-linejoin="round"/><path d="M54,60 Q66,68 80,60" fill="none" stroke="#3a2410" stroke-width="3"/><circle cx="82" cy="46" r="2.4" fill="#3a2410"/></svg>`,
  // EAT — Browse: giraffe neck to high leaves
  browse:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#cfe8f5"/><circle cx="74" cy="24" r="16" fill="#3a8a3a" stroke="#1a5a1a" stroke-width="3"/><circle cx="58" cy="34" r="9" fill="#3a8a3a" stroke="#1a5a1a" stroke-width="3"/><path d="M18,94 L26,40 Q30,30 40,30 L44,34 Q34,38 34,46 L30,94 Z" fill="#e8b84a" stroke="#7a5210" stroke-width="3" stroke-linejoin="round"/><circle cx="40" cy="30" r="6" fill="#e8b84a" stroke="#7a5210" stroke-width="3"/><circle cx="42" cy="29" r="1.5" fill="#3a2410"/></svg>`,
  // EAT — Electrosensory: shark + lightning sense
  electro:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#0e3a52"/><path d="M14,52 Q40,40 70,48 L88,40 L80,54 L88,66 L70,58 Q40,66 14,52 Z" fill="#5a7a8a" stroke="#06202e" stroke-width="3" stroke-linejoin="round"/><path d="M44,24 l-8,16 6,0 -6,14" fill="none" stroke="#ffd21a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle cx="30" cy="50" r="2.2" fill="#06202e"/><g fill="#bfe8ff"><circle cx="24" cy="46" r="1.4"/><circle cx="28" cy="56" r="1.4"/></g></svg>`,
  // EAT — Tool use: fist gripping a probing stick
  tool_use:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#d8b88a"/><path d="M16,72 Q50,60 84,72 L84,96 L16,96 Z" fill="#7a5a32"/><ellipse cx="50" cy="72" rx="20" ry="5" fill="#3a2a16"/><rect x="47" y="22" width="6" height="50" rx="3" fill="#6a4a22" stroke="#3a2410" stroke-width="2"/><path d="M40,30 q-7,2 -7,11 q0,9 11,10 l14,0 q6,-1 6,-7 q0,-4 -5,-4 q5,-1 5,-6 q0,-5 -7,-4 l-9,0 q4,-4 0,-8 q-4,-3 -8,-2 Z" fill="#e8b878" stroke="#5a3210" stroke-width="3" stroke-linejoin="round"/></svg>`,
  // FK — Display: peacock fan of eyespots
  display:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#0e6a5a"/><g stroke="#0a4a40" stroke-width="3"><path d="M50,80 L50,28"/><path d="M50,80 L26,40"/><path d="M50,80 L74,40"/><path d="M50,80 L18,60"/><path d="M50,80 L82,60"/></g><g fill="#2aa0c8" stroke="#0a4a40" stroke-width="2"><circle cx="50" cy="28" r="7"/><circle cx="26" cy="40" r="7"/><circle cx="74" cy="40" r="7"/><circle cx="18" cy="60" r="7"/><circle cx="82" cy="60" r="7"/></g><g fill="#ffd21a"><circle cx="50" cy="28" r="2.6"/><circle cx="26" cy="40" r="2.6"/><circle cx="74" cy="40" r="2.6"/><circle cx="18" cy="60" r="2.6"/><circle cx="82" cy="60" r="2.6"/></g><circle cx="50" cy="84" r="7" fill="#1a6a8a" stroke="#06303a" stroke-width="3"/></svg>`,
  // FK — Lek: spotlight arena, strutting male
  lek:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#2a1a3a"/><path d="M50,6 L18,92 L82,92 Z" fill="#fff7c4" opacity="0.45"/><ellipse cx="50" cy="88" rx="26" ry="6" fill="#3a2a4a"/><path d="M44,86 Q38,58 52,50 Q66,54 60,80 L62,86 Z" fill="#e85a3a" stroke="#000" stroke-width="3" stroke-linejoin="round"/><circle cx="52" cy="48" r="7" fill="#e85a3a" stroke="#000" stroke-width="3"/><path d="M52,42 q5,-8 11,-6" fill="none" stroke="#ffd21a" stroke-width="3"/><path d="M44,48 l-8,-2" stroke="#ffb020" stroke-width="3"/><circle cx="54" cy="47" r="1.4" fill="#000"/></svg>`,
  // FK — Viviparity: live birth, embryo in belly
  viviparity:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#f3d0d8"/><circle cx="50" cy="54" r="30" fill="#e89aa8" stroke="#8a3a4a" stroke-width="4"/><path d="M45,44 Q58,38 63,51 Q66,63 53,67 Q42,64 42,54 Q42,48 45,44 Z" fill="#fff" stroke="#8a3a4a" stroke-width="2.5"/><circle cx="51" cy="53" r="6" fill="#f7b8c4"/><path d="M51,59 q-4,4 -2,9" fill="none" stroke="#8a3a4a" stroke-width="2.5"/><circle cx="50" cy="24" r="3" fill="#8a3a4a"/></svg>`,
  // FK — Eusociality: honeycomb + worker bee
  eusocial:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0c020"/><g fill="#ffd84a" stroke="#7a5400" stroke-width="3"><path d="M30,20 l10,6 0,12 -10,6 -10,-6 0,-12 Z"/><path d="M30,44 l10,6 0,12 -10,6 -10,-6 0,-12 Z"/><path d="M50,32 l10,6 0,12 -10,6 -10,-6 0,-12 Z"/></g><ellipse cx="68" cy="66" rx="15" ry="9" fill="#3a2a10" stroke="#000" stroke-width="3"/><g stroke="#ffd84a" stroke-width="3"><path d="M62,57 V75"/><path d="M71,55 V77"/></g><path d="M58,60 q-9,-3 -11,6 q9,3 11,-2" fill="#cfe8ff" stroke="#000" stroke-width="1.5"/><circle cx="82" cy="63" r="2" fill="#fff"/></svg>`,
  // FK — Budding: hydra with a daughter bud
  budding:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#10527a"/><ellipse cx="42" cy="56" rx="16" ry="24" fill="#7fd0a0" stroke="#0b3d24" stroke-width="4"/><g stroke="#0b3d24" stroke-width="3" stroke-linecap="round"><path d="M34,34 q-4,-12 -10,-16"/><path d="M42,30 V14"/><path d="M50,34 q4,-12 10,-16"/></g><ellipse cx="64" cy="66" rx="9" ry="13" fill="#9ce0b8" stroke="#0b3d24" stroke-width="3.5"/><g stroke="#0b3d24" stroke-width="2.5" stroke-linecap="round"><path d="M60,55 q-2,-7 -6,-9"/><path d="M64,53 V44"/><path d="M68,55 q2,-7 6,-9"/></g></svg>`,
  // FK — Swarm breeding: locust cloud over a field
  swarm_breed:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#cfe0a0"/><rect y="78" width="100" height="22" fill="#8aa84a"/><g fill="#5a4a20" stroke="#2a2008" stroke-width="1.5"><ellipse cx="24" cy="26" rx="6" ry="3"/><ellipse cx="44" cy="20" rx="6" ry="3"/><ellipse cx="64" cy="30" rx="6" ry="3"/><ellipse cx="34" cy="40" rx="6" ry="3"/><ellipse cx="56" cy="46" rx="6" ry="3"/><ellipse cx="76" cy="40" rx="6" ry="3"/><ellipse cx="20" cy="52" rx="5" ry="2.5"/><ellipse cx="70" cy="58" rx="5" ry="2.5"/></g><g stroke="#2a2008" stroke-width="1.5"><path d="M21,21 l3,-5 3,5"/><path d="M41,15 l3,-5 3,5"/></g></svg>`,
  // EAT — Anoxygenic photosynthesis: purple sulfur microbes under a dim sun
  anoxygenic:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#3a1a4a"/><circle cx="74" cy="26" r="11" fill="#c86adf" stroke="#5a2070" stroke-width="3"/><g stroke="#c86adf" stroke-width="3" stroke-linecap="round"><path d="M74,8 V3"/><path d="M90,26 H96"/><path d="M86,14 l4,-4"/></g><g fill="#7a3aa0" stroke="#3a1050" stroke-width="2"><circle cx="26" cy="74" r="10"/><circle cx="44" cy="80" r="9"/><circle cx="62" cy="76" r="8"/><circle cx="14" cy="82" r="6"/></g><g fill="#d7a0f0"><circle cx="26" cy="74" r="2.5"/><circle cx="44" cy="80" r="2.5"/><circle cx="62" cy="76" r="2.5"/></g></svg>`,
  // EAT — Osmotrophy: absorbing nutrients across a dashed membrane
  osmotrophy:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#caa0e0"/><circle cx="50" cy="54" r="28" fill="#e8d0f6" stroke="#5a2a7a" stroke-width="4" stroke-dasharray="6 4"/><circle cx="50" cy="54" r="9" fill="#7a3aa0"/><g stroke="#5a2a7a" stroke-width="3" stroke-linecap="round" fill="none"><path d="M18,30 l12,8"/><path d="M82,30 l-12,8"/><path d="M18,78 l12,-8"/><path d="M82,78 l-12,-8"/></g><g fill="#3a1a5a"><circle cx="16" cy="28" r="2.5"/><circle cx="84" cy="28" r="2.5"/><circle cx="16" cy="80" r="2.5"/><circle cx="84" cy="80" r="2.5"/></g></svg>`,
  // EAT — Detritivory: clean bones + a fly
  detritivory:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#cbb896"/><g stroke="#fff" stroke-width="8" stroke-linecap="round"><path d="M28,70 L70,34"/></g><g fill="#fff" stroke="#7a6a4a" stroke-width="2"><circle cx="26" cy="68" r="6"/><circle cx="30" cy="74" r="6"/><circle cx="68" cy="32" r="6"/><circle cx="74" cy="36" r="6"/></g><ellipse cx="60" cy="66" rx="5" ry="3.5" fill="#2a2a2a"/><g stroke="#2a2a2a" stroke-width="1.5"><path d="M56,62 l-4,-4 M64,62 l4,-4"/></g></svg>`,
  // EAT — Parasitism: an engorged tick latched on skin
  parasitism:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#e8c0a8"/><path d="M0,64 Q50,52 100,64 L100,100 L0,100 Z" fill="#d49a7a"/><path d="M0,64 Q50,52 100,64" fill="none" stroke="#a86a4a" stroke-width="3"/><ellipse cx="50" cy="50" rx="16" ry="13" fill="#5a3a2a" stroke="#1a0e08" stroke-width="3"/><circle cx="50" cy="44" r="6" fill="#3a2418" stroke="#1a0e08" stroke-width="2"/><g stroke="#1a0e08" stroke-width="2.5" stroke-linecap="round"><path d="M40,52 l-8,-4 M40,58 l-8,2 M60,52 l8,-4 M60,58 l8,2"/></g></svg>`,
  // EAT — Seed predation: a beak cracking a seed
  seed_pred:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#d8e0a0"/><path d="M12,40 L52,50 L12,60 L24,50 Z" fill="#e8a020" stroke="#7a5210" stroke-width="3" stroke-linejoin="round"/><path d="M12,58 L52,50 L12,40" fill="#f0b840" stroke="#7a5210" stroke-width="3" stroke-linejoin="round"/><g transform="translate(66,50)"><path d="M-8,-10 A10,12 0 0 1 -8,10 Z" fill="#9a6a3a" stroke="#4a2e10" stroke-width="3"/><path d="M2,-10 A10,12 0 0 0 2,10 Z" fill="#b58a52" stroke="#4a2e10" stroke-width="3"/></g><circle cx="22" cy="44" r="2" fill="#3a2410"/></svg>`,
  // EAT — Kleptoparasitism: a hand snatching another's fish
  klepto:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#bcd8e8"/><path d="M30,56 Q50,44 70,56 Q60,60 70,64 Q50,68 30,56 Z" fill="#8ab0c4" stroke="#2a4a5a" stroke-width="3" stroke-linejoin="round"/><path d="M70,56 l10,-6 0,12 Z" fill="#8ab0c4" stroke="#2a4a5a" stroke-width="3"/><circle cx="40" cy="54" r="2" fill="#2a4a5a"/><path d="M44,18 q-6,2 -7,9 q0,8 9,9 l12,0 q5,-1 5,-6 q0,-4 -6,-4 q5,-1 5,-5 q0,-5 -7,-4 l-8,0 q3,-4 0,-7 q-3,-3 -6,-1 Z" fill="#e8b878" stroke="#5a3210" stroke-width="3" stroke-linejoin="round"/><g stroke="#c02018" stroke-width="3" stroke-linecap="round"><path d="M56,42 l8,8 M64,42 l-8,8"/></g></svg>`,
  // EAT — Persistence hunt: relentless sun, sweat, footprints
  persistence:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0c878"/><circle cx="78" cy="22" r="12" fill="#ff8a2a" stroke="#a04a00" stroke-width="3"/><g stroke="#ff8a2a" stroke-width="3" stroke-linecap="round"><path d="M78,4 V0"/><path d="M96,22 H100"/></g><circle cx="40" cy="40" r="9" fill="#6a4a2a" stroke="#2a1808" stroke-width="3"/><path d="M40,49 L40,68 M40,54 L28,62 M40,54 L52,60 M40,68 L30,84 M40,68 L50,84" fill="none" stroke="#6a4a2a" stroke-width="5" stroke-linecap="round"/><g fill="#3aa0e0"><path d="M28,30 q-3,5 0,7 q3,-2 0,-7Z"/><path d="M52,34 q-3,5 0,7 q3,-2 0,-7Z"/></g></svg>`,
  // EAT — Fungal farming: an ant tending a mushroom garden
  fungal_farm:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#3a2a1a"/><path d="M22,80 q-2,-14 8,-16 q10,2 8,16 Z" fill="#e8d0b0" stroke="#7a5a3a" stroke-width="2.5"/><ellipse cx="30" cy="64" rx="12" ry="7" fill="#f0b0b0" stroke="#7a3a3a" stroke-width="2.5"/><path d="M58,82 q-1,-10 6,-12 q7,2 6,12 Z" fill="#e8d0b0" stroke="#7a5a3a" stroke-width="2.5"/><ellipse cx="64" cy="70" rx="9" ry="5" fill="#f0b0b0" stroke="#7a3a3a" stroke-width="2.5"/><g fill="#1a0e08" stroke="#000" stroke-width="1.5"><circle cx="80" cy="34" r="5"/><circle cx="88" cy="40" r="6"/><circle cx="80" cy="46" r="5"/></g><path d="M74,30 q-8,-6 -14,-2" fill="none" stroke="#1a0e08" stroke-width="2.5"/><path d="M60,28 l-10,-6 8,-2 Z" fill="#3a8a3a" stroke="#0b3d24" stroke-width="2"/></svg>`,
  // FK — Horizontal gene transfer: a plasmid bridge between microbes
  hgt:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#0e2a3a"/><ellipse cx="26" cy="50" rx="18" ry="13" fill="#7fd0a0" stroke="#0b3d24" stroke-width="3.5"/><ellipse cx="74" cy="50" rx="18" ry="13" fill="#7fd0a0" stroke="#0b3d24" stroke-width="3.5"/><rect x="40" y="46" width="20" height="8" fill="#9ce0b8" stroke="#0b3d24" stroke-width="2.5"/><circle cx="50" cy="50" r="7" fill="none" stroke="#ffd21a" stroke-width="3"/><circle cx="50" cy="43" r="2" fill="#ffd21a"/></svg>`,
  // FK — Fragmentation: a starfish regrowing a stubby arm
  fragmentation:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#16527a"/><path d="M50,46 L58,66 L80,68 L62,80 L68,98 L50,86 L32,98 L38,80 L20,68 L42,66 Z" fill="#f08a3a" stroke="#7a3a10" stroke-width="3" stroke-linejoin="round"/><path d="M50,46 L54,30" stroke="#f0b890" stroke-width="6" stroke-linecap="round"/><g stroke="#ffd21a" stroke-width="2.5"><path d="M58,24 l3,5 M64,28 l5,1 M62,34 l5,3"/></g></svg>`,
  // FK — Semelparous: a salmon leaps once to spawn, then dies
  semelparous:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#2a6a8a"/><rect y="70" width="100" height="30" fill="#1a4a6a"/><path d="M20,72 Q40,30 64,40 Q74,42 84,36 Q78,52 64,52 Q44,56 30,76" fill="#d05a4a" stroke="#5a1a10" stroke-width="3" stroke-linejoin="round"/><path d="M20,72 l-8,-6 2,12 Z" fill="#d05a4a" stroke="#5a1a10" stroke-width="3"/><circle cx="76" cy="42" r="2" fill="#fff"/><g stroke="#bfe8ff" stroke-width="2"><path d="M30,28 l4,6 M40,22 l3,6"/></g><text x="78" y="92" font-size="15">💀</text></svg>`,
  // FK — Sperm competition: many gametes race to one egg
  sperm_comp:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0d8e4"/><circle cx="78" cy="50" r="20" fill="#ffd24a" stroke="#a07000" stroke-width="4"/><circle cx="78" cy="50" r="8" fill="#ffb000"/><g fill="#9a6aaa" stroke="#5a3a6a" stroke-width="2"><circle cx="18" cy="40" r="5"/><circle cx="22" cy="56" r="5"/><circle cx="34" cy="48" r="5"/></g><g fill="none" stroke="#5a3a6a" stroke-width="2"><path d="M13,40 q-10,-3 -12,2 q10,2 12,-2"/><path d="M17,56 q-10,3 -12,-2 q10,-2 12,2"/><path d="M29,48 q-10,0 -12,4 q10,1 12,-4"/></g></svg>`,
  // FK — Delayed development: dormancy in an hourglass
  delayed_dev:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#cfe0e8"/><path d="M30,18 H70 L52,50 L70,82 H30 L48,50 Z" fill="#bfe8ff" stroke="#2a4a5a" stroke-width="3" stroke-linejoin="round"/><rect x="26" y="14" width="48" height="6" rx="2" fill="#7a5a3a"/><rect x="26" y="80" width="48" height="6" rx="2" fill="#7a5a3a"/><path d="M44,46 L56,46 L50,58 Z" fill="#ffd24a"/><path d="M50,58 q-3,8 0,18" fill="none" stroke="#ffd24a" stroke-width="3"/><circle cx="50" cy="34" r="4" fill="#ffd24a"/></svg>`,
  // FK — Alloparental care: a helper feeds chicks in the nest
  allo_parent:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#bcd8a0"/><path d="M28,64 Q50,54 72,64 Q72,80 50,82 Q28,80 28,64 Z" fill="#8a6a3a" stroke="#4a3210" stroke-width="3"/><g fill="#ffd24a" stroke="#7a5210" stroke-width="2"><circle cx="42" cy="62" r="6"/><circle cx="58" cy="62" r="6"/></g><g fill="#7a5210"><path d="M42,57 l-3,-4 6,0 Z"/><path d="M58,57 l-3,-4 6,0 Z"/></g><circle cx="34" cy="34" r="9" fill="#d05a4a" stroke="#5a1a10" stroke-width="3"/><circle cx="34" cy="34" r="1.6" fill="#fff"/><path d="M34,43 q6,8 8,14" fill="none" stroke="#d05a4a" stroke-width="5" stroke-linecap="round"/><path d="M26,32 l-7,-2" stroke="#ffb020" stroke-width="3"/></svg>`,
  // FK — Extended parental care: an elephant with its calf
  ext_care:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#cfd8e0"/><g fill="#8a8a96" stroke="#3a3a44" stroke-width="3" stroke-linejoin="round"><path d="M20,80 Q18,46 44,44 Q70,44 70,72 L70,84 L20,84 Z"/><path d="M44,46 q-8,-8 0,-16 q8,8 0,16Z"/></g><path d="M22,60 q-10,6 -8,22" fill="none" stroke="#3a3a44" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="56" r="2" fill="#1a1a22"/><g fill="#a0a0ac" stroke="#3a3a44" stroke-width="2.5" stroke-linejoin="round"><path d="M70,76 Q69,60 82,59 Q94,59 94,74 L94,86 L70,86 Z"/></g><path d="M71,68 q-6,3 -5,14" fill="none" stroke="#3a3a44" stroke-width="3" stroke-linecap="round"/></svg>`,
  // FK — Sequential hermaphroditism: a fish switching sex (♂→♀)
  seq_herm:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#1b6fa8"/><path d="M28,56 Q46,42 66,52 Q56,56 66,60 Q46,70 28,56 Z" fill="#f0a020" stroke="#7a5210" stroke-width="3" stroke-linejoin="round"/><path d="M28,56 l-9,-6 2,12 Z" fill="#f0a020" stroke="#7a5210" stroke-width="3"/><circle cx="56" cy="52" r="2" fill="#3a2410"/><g stroke="#fff" stroke-width="3" fill="none"><path d="M34,18 h12 M40,12 v12"/></g><g stroke="#fff" stroke-width="3" fill="none"><circle cx="70" cy="20" r="6"/><path d="M70,26 v9 M65,31 h10"/></g><path d="M50,20 q10,-3 15,3" fill="none" stroke="#ffd21a" stroke-width="2.5"/><path d="M63,21 l4,2 -1,-5" fill="#ffd21a"/></svg>`,
  // FK — Reproductive manipulation: cordyceps fungus erupting from a host
  repro_manip:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#1a2a18"/><g fill="#2a1a10" stroke="#000" stroke-width="2"><circle cx="44" cy="68" r="7"/><circle cx="54" cy="74" r="8"/><circle cx="44" cy="80" r="7"/></g><g stroke="#000" stroke-width="2"><path d="M40,64 q-8,-4 -12,2 M40,72 q-9,1 -12,7"/></g><g stroke="#c0e060" stroke-width="4" stroke-linecap="round"><path d="M44,62 V36"/><path d="M44,48 q-8,-6 -12,-14"/><path d="M44,44 q8,-7 13,-15"/></g><circle cx="44" cy="32" r="6" fill="#d0f070" stroke="#5a7a20" stroke-width="2.5"/><circle cx="31" cy="20" r="4" fill="#d0f070" stroke="#5a7a20" stroke-width="2"/><circle cx="58" cy="28" r="4" fill="#d0f070" stroke="#5a7a20" stroke-width="2"/></svg>`,
  // FK — Vegetative / clonal spread: a stolon making a daughter plant
  veg_prop:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#bfe0a0"/><rect y="70" width="100" height="30" fill="#7a5a3a"/><path d="M22,70 V52" stroke="#2a6a2a" stroke-width="4"/><g fill="#3a8a3a" stroke="#1a5a1a" stroke-width="2.5"><ellipse cx="16" cy="46" rx="9" ry="5"/><ellipse cx="28" cy="46" rx="9" ry="5"/></g><path d="M22,70 q20,8 40,0" fill="none" stroke="#3a8a3a" stroke-width="4"/><path d="M62,70 V54" stroke="#2a6a2a" stroke-width="4"/><g fill="#5ca84a" stroke="#1a5a1a" stroke-width="2.5"><ellipse cx="56" cy="50" rx="7" ry="4"/><ellipse cx="68" cy="50" rx="7" ry="4"/></g></svg>`,
  // FK — Infanticide / takeover: a new dominant male, rival's offspring struck out
  infanticide:`<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#7a2a1a"/><circle cx="40" cy="46" r="22" fill="#caa24a" stroke="#3a2410" stroke-width="3"/><g stroke="#8a5a1a" stroke-width="4" stroke-linecap="round"><path d="M40,20 V10 M22,30 l-7,-7 M58,30 l7,-7 M18,46 H8 M62,46 H72"/></g><path d="M30,52 q10,8 20,0" fill="none" stroke="#3a2410" stroke-width="3"/><g fill="#3a2410"><circle cx="32" cy="42" r="2.4"/><circle cx="48" cy="42" r="2.4"/></g><g fill="#fff" stroke="#3a2410" stroke-width="1"><path d="M34,52 l3,6 3,-6Z"/><path d="M44,52 l3,6 3,-6Z"/></g><circle cx="78" cy="74" r="9" fill="#d8b06a" stroke="#3a2410" stroke-width="2.5"/><g stroke="#c01818" stroke-width="3" stroke-linecap="round"><path d="M70,66 l16,16 M86,66 l-16,16"/></g></svg>`,
};
