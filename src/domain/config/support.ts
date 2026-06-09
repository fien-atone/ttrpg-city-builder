import type { Contribute, SupportCfg } from '../types';

export const supportDefaults: SupportCfg = {
  investment: 3,
  investmentYears: 20,
  subsidy: 1,
  subsidyUntil: 40,
};

export const supportPresets: Record<string, Partial<SupportCfg>> = {
  heavy_then_taper: { investment: 4, investmentYears: 25, subsidy: 1.5, subsidyUntil: 60 },
  none: { investment: 0, investmentYears: 0, subsidy: 0, subsidyUntil: 0 },
  steady_crown: { investment: 1, investmentYears: 10, subsidy: 2, subsidyUntil: 400 },
  relief_after_crisis: { investment: 1, investmentYears: 8, subsidy: 0.5, subsidyUntil: 80 },
};

/** Funding at a given year: tapering one-off investment + systemic subsidy. */
export function fundingAt(s: SupportCfg, year: number): number {
  let amount = 0;
  if (s.investmentYears > 0 && year < s.investmentYears) {
    amount += s.investment * (1 - year / s.investmentYears);
  }
  if (year <= s.subsidyUntil) amount += s.subsidy;
  return amount;
}

export const supportContribute: Contribute = (lev, world, snap) => {
  const amount = fundingAt(world.support, snap.year);
  lev.funding += amount;
  if (amount > 0) {
    lev.migrationPull += amount * 0.4; // funded settlements actively recruit
  }
};
