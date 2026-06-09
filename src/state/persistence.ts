import type { WorldConfig } from '../domain/types';
import { CONFIG_VERSION, defaultWorldConfig } from '../domain/config';

const STORAGE_KEY = 'settlement-sim.world';

/** Merge a loaded config onto defaults so missing/new fields stay valid. */
function reconcile(raw: Partial<WorldConfig>): WorldConfig {
  return {
    ...defaultWorldConfig,
    ...raw,
    version: CONFIG_VERSION,
    geography: { ...defaultWorldConfig.geography, ...raw.geography },
    geology: { ...defaultWorldConfig.geology, ...raw.geology },
    climate: {
      ...defaultWorldConfig.climate,
      ...raw.climate,
      hazards: { ...defaultWorldConfig.climate.hazards, ...(raw.climate as any)?.hazards },
    },
    founders: { ...defaultWorldConfig.founders, ...raw.founders },
    wildlife: { ...defaultWorldConfig.wildlife, ...raw.wildlife },
    polity: { ...defaultWorldConfig.polity, ...raw.polity },
    mission: { ...defaultWorldConfig.mission, ...raw.mission },
    arcana: { ...defaultWorldConfig.arcana, ...raw.arcana },
    // pre-v2 saves stored keyframes — fall back to defaults for the new shape
    support:
      raw.support && typeof (raw.support as any).investment === 'number'
        ? { ...defaultWorldConfig.support, ...raw.support }
        : defaultWorldConfig.support,
    neighbors: raw.neighbors ?? defaultWorldConfig.neighbors,
    scheduledChanges: raw.scheduledChanges ?? [],
  };
}

export function saveToStorage(config: WorldConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadFromStorage(): WorldConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return reconcile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function exportJson(config: WorldConfig): void {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `world-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImported(text: string): WorldConfig {
  return reconcile(JSON.parse(text));
}
