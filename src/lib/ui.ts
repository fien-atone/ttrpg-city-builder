import type { PhaseId, BuildingTag, Sector, Status } from '../domain/types';

export const COLORS = {
  accent: '#e0a458',
  accent2: '#5aa7e0',
  good: '#5ec27a',
  bad: '#e0625a',
  magic: '#b07ae0',
  line: '#4a5462',
  muted: '#7c8694',
};

export const PHASE_COLORS: Record<PhaseId, string> = {
  camp: '#8a93a3',
  hamlet: '#c98a4a',
  village: '#d0a24a',
  town: '#6aa8e0',
  city: '#b07ae0',
};

export const TAG_GLYPH: Record<BuildingTag, string> = {
  plain: '',
  magic: ' ✦',
  tech: ' ⚙',
};

export const SECTOR_COLORS: Record<Sector, string> = {
  farming: '#7cb342',
  mining: '#8d6e63',
  crafts: '#e0a458',
  trade: '#5aa7e0',
  services: '#26a69a',
  military: '#e0625a',
  clergy: '#b07ae0',
  knowledge: '#c0ca33',
};

export const COMPOSITION_COLORS: Record<string, string> = {
  locals: '#5ec27a',
  migrants: '#5aa7e0',
  transients: '#e0a458',
  dependents: '#9aa6b6',
};

export const STATUS_COLORS: Record<Status, string> = {
  founding: '#9aa6b6',
  struggling: '#e0a458',
  stable: '#5aa7e0',
  thriving: '#5ec27a',
  declining: '#e0844a',
  abandoned: '#e0625a',
};

export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
