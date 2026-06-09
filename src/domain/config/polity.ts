import type { Contribute, GovernanceId, Polity } from '../types';

export const polityDefaults: Polity = {
  sovereignty: 'vassal',
  governance: 'elder',
  borderProximity: 2,
  stability: 3,
  taxBurden: 2,
};

export const polityPresets: Record<string, Partial<Polity>> = {
  loyal_heartland: { sovereignty: 'vassal', governance: 'lord', borderProximity: 1, stability: 5, taxBurden: 2 },
  free_charter: { sovereignty: 'independent', governance: 'council', borderProximity: 2, stability: 3, taxBurden: 1 },
  distant_colony: { sovereignty: 'colony', governance: 'elder', borderProximity: 3, stability: 2, taxBurden: 3 },
  contested_march: { sovereignty: 'protectorate', governance: 'lord', borderProximity: 5, stability: 2, taxBurden: 4 },
  crown_protectorate: { sovereignty: 'protectorate', governance: 'lord', borderProximity: 2, stability: 4, taxBurden: 3 },
};

/**
 * Governance shapes whether the settlement can act DELIBERATELY: the yearly
 * chance to recruit a needed specialist (vs waiting for random strangers),
 * how organized the defense is, and how fast infrastructure accretes.
 */
export const GOVERNANCE: Record<
  GovernanceId,
  { recruit: number; defense: number; devBonus: number }
> = {
  none: { recruit: 0, defense: -0.15, devBonus: -0.03 },
  elder: { recruit: 0.006, defense: 0, devBonus: 0.01 },
  council: { recruit: 0.015, defense: 0.05, devBonus: 0.04 },
  lord: { recruit: 0.022, defense: 0.35, devBonus: 0.03 },
  guild: { recruit: 0.028, defense: 0.05, devBonus: 0.05 },
  temple: { recruit: 0.015, defense: 0.1, devBonus: 0.02 },
};

export const polityContribute: Contribute = (lev, world) => {
  const p = world.polity;
  // central authority lends safety; weak/distant rule less so
  lev.safety *= 0.85 + p.stability * 0.06;
  // border settlements face raids but host garrisons
  lev.raidPressure += (p.borderProximity - 2) * 0.6;
  if (p.borderProximity >= 4) {
    lev.sectorWeights.military += p.borderProximity * 1.5;
    lev.defense += 0.4;
    lev.flags.add('frontier');
  }
  // who runs the place: organized rule defends and builds better
  const gov = GOVERNANCE[p.governance];
  lev.defense += gov.defense;
  if (p.governance === 'temple') lev.sectorWeights.clergy += 2;
  if (p.governance === 'guild') lev.sectorWeights.trade += 1.5;

  // taxes push people out and drain self-funding
  lev.migrationPush += p.taxBurden * 0.5;
  lev.funding -= p.taxBurden * 0.04;
  if (p.sovereignty === 'independent') lev.flags.add('independent');
  if (p.stability <= 2) lev.flags.add('weak_authority');
};
