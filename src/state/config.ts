import type {
  WorldConfig,
  Neighbor,
  ScheduledChange,
  SupportKeyframe,
  DomainKey,
} from '../domain/types';
import { defaultWorldConfig, DOMAIN_PRESETS } from '../domain/config';
import { setByPath } from '../lib/path';

export { defaultWorldConfig };

export type ConfigAction =
  | { type: 'setField'; path: string; value: unknown }
  | { type: 'applyPreset'; domain: DomainKey; presetId: string }
  | { type: 'addNeighbor'; neighbor: Neighbor }
  | { type: 'removeNeighbor'; id: string }
  | { type: 'addScheduled'; change: ScheduledChange }
  | { type: 'removeScheduled'; id: string }
  | { type: 'setKeyframe'; index: number; frame: SupportKeyframe }
  | { type: 'addKeyframe'; frame: SupportKeyframe }
  | { type: 'removeKeyframe'; index: number }
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

    case 'addScheduled':
      return { ...state, scheduledChanges: [...state.scheduledChanges, action.change] };
    case 'removeScheduled':
      return {
        ...state,
        scheduledChanges: state.scheduledChanges.filter((c) => c.id !== action.id),
      };

    case 'addKeyframe':
      return {
        ...state,
        support: { keyframes: [...state.support.keyframes, action.frame] },
      };
    case 'setKeyframe': {
      const frames = state.support.keyframes.map((f, i) => (i === action.index ? action.frame : f));
      return { ...state, support: { keyframes: frames } };
    }
    case 'removeKeyframe':
      return {
        ...state,
        support: { keyframes: state.support.keyframes.filter((_, i) => i !== action.index) },
      };

    case 'load':
      return action.config;
    case 'reset':
      return defaultWorldConfig;
    default:
      return state;
  }
}
