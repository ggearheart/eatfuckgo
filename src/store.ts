/* eslint-disable @typescript-eslint/no-explicit-any */
import { useReducer } from 'react';
import * as E from './engine/engine';
import type { State, Inst, BattleSetup } from './engine/engine';
import type { Side } from './engine/data';

export type Action =
  | { t: 'new'; setup: BattleSetup }
  | { t: 'rollScenario' }
  | { t: 'select'; side: Side; idx: number }
  | { t: 'alloc'; side: Side; meta: number }
  | { t: 'commit' }
  | { t: 'resolve' }
  | { t: 'summon'; roll: number }
  | { t: 'muster'; id: string }
  | { t: 'concede'; loser: Side };

// Clone that preserves scenario/cata references (they carry fx functions and are immutable).
function clone(s: State): State {
  return {
    ...s,
    life: { ...s.life }, energy: { ...s.energy },
    alloc: { atk: { ...s.alloc.atk }, def: { ...s.alloc.def } },
    stack: { atk: s.stack.atk.map((i: Inst) => ({ ...i })), def: s.stack.def.map((i: Inst) => ({ ...i })) },
    played: { ...s.played }, pending: { ...s.pending },
    log: [...s.log],
  };
}

function reducer(state: State | null, a: Action): State | null {
  if (a.t === 'new') return E.newBattle(a.setup);
  if (!state) return state;
  const s = clone(state);
  switch (a.t) {
    case 'rollScenario': E.rollScenario(s); break;
    case 'select': E.selectCard(s, a.side, a.idx); break;
    case 'alloc': E.setAlloc(s, a.side, a.meta); break;
    case 'commit': E.commitActive(s); break;
    case 'resolve': E.resolveClash(s); break;
    case 'summon': E.summonWeirdo(s, a.roll); break;
    case 'muster': E.muster(s, a.id); break;
    case 'concede': E.concede(s, a.loser); break;
  }
  return s;
}

export function useBattle() {
  return useReducer(reducer, null);
}
