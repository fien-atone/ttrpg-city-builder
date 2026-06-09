import type { SimParams } from '../domain/types';
import { ARCHETYPES } from '../domain/archetypes';

export const defaultParams: SimParams = {
  archetype: 'village',
  pop0: 80,
  years: 120,
  fertility: 3,
  water: 3,
  trade: 2,
  safety: 3,
  sanitation: 2,
  attractiveness: 3,
  capital: 3,
  magic: 2,
  balance: 50,
  shocksEnabled: true,
  resourceCap: false,
  seed: 42,
};

export type ParamAction =
  | { type: 'set'; key: keyof SimParams; value: SimParams[keyof SimParams] }
  | { type: 'reset' };

export function paramsReducer(state: SimParams, action: ParamAction): SimParams {
  switch (action.type) {
    case 'set': {
      const next = { ...state, [action.key]: action.value } as SimParams;
      // changing the archetype resets the starting population to its default
      if (action.key === 'archetype') {
        next.pop0 = ARCHETYPES[action.value as SimParams['archetype']].pop;
      }
      return next;
    }
    case 'reset':
      return defaultParams;
    default:
      return state;
  }
}
