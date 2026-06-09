import type { Contribute, Polity } from '../types';

export const polityDefaults: Polity = {
  sovereignty: 'vassal',
  borderProximity: 2,
  stability: 3,
  taxBurden: 2,
};

export const polityPresets: Record<string, Partial<Polity>> = {
  loyal_heartland: { sovereignty: 'vassal', borderProximity: 1, stability: 5, taxBurden: 2 },
  free_charter: { sovereignty: 'independent', borderProximity: 2, stability: 3, taxBurden: 1 },
  distant_colony: { sovereignty: 'colony', borderProximity: 3, stability: 2, taxBurden: 3 },
  contested_march: { sovereignty: 'protectorate', borderProximity: 5, stability: 2, taxBurden: 4 },
  crown_protectorate: { sovereignty: 'protectorate', borderProximity: 2, stability: 4, taxBurden: 3 },
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
  // taxes push people out and drain self-funding
  lev.migrationPush += p.taxBurden * 0.5;
  lev.funding -= p.taxBurden * 0.04;
  if (p.sovereignty === 'independent') lev.flags.add('independent');
  if (p.stability <= 2) lev.flags.add('weak_authority');
};
