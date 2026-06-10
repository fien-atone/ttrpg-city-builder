import type { GovernanceId } from './types';

export type RoleId =
  | 'elder'
  | 'councilor'
  | 'clerk'
  | 'reeve'
  | 'lord'
  | 'steward'
  | 'captain'
  | 'taxman'
  | 'guildmaster'
  | 'high_priest'
  | 'priest_admin';

const clampN = (x: number, a: number, b: number) => Math.min(b, Math.max(a, Math.floor(x)));

/** Who actually administers the settlement: positions and headcounts by rule type & size. */
export function positionsFor(gov: GovernanceId, pop: number): { role: RoleId; count: number }[] {
  switch (gov) {
    case 'none':
      return [];
    case 'elder':
      return [
        { role: 'elder', count: 1 },
        ...(pop >= 200 ? [{ role: 'reeve' as RoleId, count: 1 }] : []),
      ];
    case 'council':
      return [
        { role: 'councilor', count: clampN(3 + pop / 300, 3, 12) },
        { role: 'clerk', count: pop > 800 ? 2 : 1 },
        { role: 'reeve', count: 1 },
      ];
    case 'lord':
      return [
        { role: 'lord', count: 1 },
        { role: 'steward', count: 1 },
        ...(pop >= 250 ? [{ role: 'captain' as RoleId, count: 1 }] : []),
        { role: 'taxman', count: clampN(1 + pop / 800, 1, 5) },
      ];
    case 'guild':
      return [
        { role: 'guildmaster', count: clampN(2 + pop / 600, 2, 6) },
        { role: 'clerk', count: clampN(1 + pop / 1000, 1, 4) },
      ];
    case 'temple':
      return [
        { role: 'high_priest', count: 1 },
        { role: 'priest_admin', count: clampN(1 + pop / 400, 1, 8) },
        { role: 'steward', count: 1 },
      ];
  }
}

/**
 * Grassroots rule evolves as the settlement outgrows it: a leaderless camp
 * picks an elder, a big prosperous village forms a council. Deliberate rule
 * (lord / guild / temple / council) is sticky — someone owns it.
 */
export function evolveGovernance(
  current: GovernanceId,
  pop: number,
  development: number,
): GovernanceId | null {
  if (current === 'none' && pop >= 40) return 'elder';
  if (current === 'elder' && pop >= 600 && development > 0.45) return 'council';
  return null;
}
