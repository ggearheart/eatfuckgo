# 🍩 EATFUCKGO 🥚

An interactive, tech-stack card game based on the biological strategy game **EAT IT | F\*CK IT** — a duel of evolutionary strategies (resource acquisition vs. reproduction) resolved by terrain, scenario, and dice.

This repo starts as a copy of the vanilla-HTML prototype ([ggearheart/eat-it-fck-it](https://github.com/ggearheart/eat-it-fck-it)) and is being rebuilt as a modern web app — taking cues from arcade-style card games like [SEETU ATTI](https://github.com/amarnath3003/CardGame): a proper component stack, animated hands, a lobby, and turn-based multiplayer feel.

## Current prototype (carried over)
- `index.html` — card reference, rules, and the muster resolver
- `board.html` + `board-data.js` — the Titan-style masterboard
- `battle.html` — the Terrain Clash battle resolver (energy, keywords, scenarios, dice pools, catastrophes, SVG cartoon art)

## Planned tech stack
React + Vite + TypeScript + Tailwind CSS + Framer Motion (mirroring the reference game), with the game engine ported from the prototype's vanilla JS.

## Play the prototype
The static prototype is served via GitHub Pages once enabled.
