import type { WorldConfig, Neighbor, ScheduledChange, DomainKey } from '../domain/types';
import { defaultWorldConfig, DOMAIN_PRESETS } from '../domain/config';
import { setByPath } from '../lib/path';

export { defaultWorldConfig };

export type ConfigAction =
  | { type: 'setField'; path: string; value: unknown }
  | { type: 'applyPreset'; domain: DomainKey; presetId: string }
  | { type: 'addNeighbor'; neighbor: Neighbor }
  | { type: 'removeNeighbor'; id: string }
  | { type: 'setNeighbors'; neighbors: Neighbor[] }
  | { type: 'addScheduled'; change: ScheduledChange }
  | { type: 'removeScheduled'; id: string }
  | { type: 'load'; config: WorldConfig }
  | { type: 'reset' };

export function configReducer(state: WorldConfig, action: ConfigAction): WorldConfig {
  switch (action.type) {
    case 'setField':
      return setByPath(state, action.path, action.value);

    case 'applyPreset': {
      const bank = DOMAIN_PRESETS[action.domain] as Record<string, Partial<unknown>>;
      const patch = bank?.[action.presetId];
      if (!patch) return state;
      return { ...state, [action.domain]: { ...(state[action.domain] as object), ...patch } };
    }

    case 'addNeighbor':
      return { ...state, neighbors: [...state.neighbors, action.neighbor] };
    case 'removeNeighbor':
      return { ...state, neighbors: state.neighbors.filter((n) => n.id !== action.id) };
    case 'setNeighbors':
      return { ...state, neighbors: action.neighbors };

    case 'addScheduled':
      return { ...state, scheduledChanges: [...state.scheduledChanges, action.change] };
    case 'removeScheduled':
      return {
        ...state,
        scheduledChanges: state.scheduledChanges.filter((c) => c.id !== action.id),
      };

    case 'load':
      return action.config;
    case 'reset':
      return defaultWorldConfig;
    default:
      return state;
  }
}
