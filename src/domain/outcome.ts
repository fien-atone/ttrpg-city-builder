import type { MissionResult, Status, WorldConfig, YearState } from './types';

export interface StatusInputs {
  year: number;
  population: number;
  floor: number; // viability floor from founders
  capacity: number;
  smoothedGrowth: number; // 5-year average annual rate
  prosperity: number; // 0..2
  foodDeficit: boolean; // capacity meaningfully below population
}

/**
 * Per-year status. Deliberately conservative: "thriving" needs real size,
 * sustained growth AND prosperity — a hamlet of 40 rebounding from a plague
 * is "struggling", not "thriving".
 */
export function statusFor(s: StatusInputs): Status {
  if (s.year < 8) return 'founding';
  if (s.population <= s.floor * 1.8 || s.foodDeficit || s.smoothedGrowth < -0.025) {
    return 'struggling';
  }
  if (s.smoothedGrowth < -0.008) return 'declining';
  if (
    s.smoothedGrowth > 0.015 &&
    s.population >= s.floor * 3 &&
    s.prosperity > 0.9 &&
    s.population < s.capacity * 0.95
  ) {
    return 'thriving';
  }
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
