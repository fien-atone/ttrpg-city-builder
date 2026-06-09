import type { Contribute, SupportCfg } from '../types';
import { sampleSupport } from '../trajectory';

export const supportDefaults: SupportCfg = {
  keyframes: [
    { year: 0, amount: 3, kind: 'investment' },
    { year: 15, amount: 1.5, kind: 'subsidy' },
    { year: 40, amount: 0, kind: 'subsidy' },
  ],
};

export const supportPresets: Record<string, Partial<SupportCfg>> = {
  heavy_then_taper: {
    keyframes: [
      { year: 0, amount: 4, kind: 'investment' },
      { year: 20, amount: 2, kind: 'subsidy' },
      { year: 50, amount: 0, kind: 'subsidy' },
    ],
  },
  none: { keyframes: [{ year: 0, amount: 0, kind: 'investment' }] },
  steady_crown: {
    keyframes: [
      { year: 0, amount: 2, kind: 'subsidy' },
      { year: 200, amount: 2, kind: 'subsidy' },
    ],
  },
  relief_after_crisis: {
    keyframes: [
      { year: 0, amount: 1, kind: 'investment' },
      { year: 30, amount: 0, kind: 'subsidy' },
      { year: 40, amount: 3, kind: 'aid' },
      { year: 60, amount: 0.5, kind: 'aid' },
    ],
  },
};

export const supportContribute: Contribute = (lev, world, snap) => {
  const amount = sampleSupport(world.support.keyframes, snap.year);
  lev.funding += amount;
  if (amount > 0) {
    lev.migrationPull += amount * 0.4; // funded settlements actively recruit
  }
};
