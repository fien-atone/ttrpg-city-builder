import type { MissionResult, Status, WorldConfig, YearState } from './types';

/** Per-year status from size, fill and momentum. */
export function statusFor(
  year: number,
  population: number,
  floor: number,
  capacity: number,
  growth: number,
): Status {
  if (year < 6 && population < floor * 3) return 'founding';
  if (population <= floor) return 'struggling';
  const fill = capacity > 0 ? population / capacity : 0;
  if (growth < -0.012) return 'declining';
  if (growth > 0.02 && fill < 0.92) return 'thriving';
  if (population < floor * 2) return 'struggling';
  return 'stable';
}

/** Did the settlement meet its founding goal within the horizon? */
export function evaluateMission(points: YearState[], world: WorldConfig): MissionResult {
  const target = world.mission.targetPopulation;
  const horizon = world.mission.horizonYears;
  let achievedYear: number | null = null;
  let peak = 0;
  for (const p of points) {
    if (p.population > peak) peak = p.population;
    if (achievedYear === null && p.year <= horizon && p.population >= target) {
      achievedYear = p.year;
    }
  }
  const abandoned = points.length > 0 && points[points.length - 1].status === 'abandoned';
  const met = achievedYear !== null && !abandoned;
  const partial = !met && peak >= target * 0.5 && !abandoned;
  return { met, partial, achievedYear, peakVsTarget: target > 0 ? peak / target : 0 };
}
