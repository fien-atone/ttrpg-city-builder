import type { PhaseId, BuildingTag } from '../domain/types';

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

export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
