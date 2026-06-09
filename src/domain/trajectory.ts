import type { SupportKeyframe, WorldConfig, ScheduledChange } from './types';

/** Piecewise-linear sample of a funding trajectory at a given year. */
export function sampleSupport(keyframes: SupportKeyframe[], year: number): number {
  if (keyframes.length === 0) return 0;
  const sorted = [...keyframes].sort((a, b) => a.year - b.year);
  if (year <= sorted[0].year) return sorted[0].amount;
  const last = sorted[sorted.length - 1];
  if (year >= last.year) return last.amount;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (year >= a.year && year <= b.year) {
      const t = (year - a.year) / Math.max(1, b.year - a.year);
      return a.amount + (b.amount - a.amount) * t;
    }
  }
  return last.amount;
}

/**
 * Apply scheduled exogenous changes that have fired by `year`, returning a
 * shallow-adjusted copy of the world config. Endogenous change (depletion,
 * aging) is handled in the simulation loop, not here.
 */
export function applySchedule(world: WorldConfig, year: number): WorldConfig {
  const fired = world.scheduledChanges.filter((c) => c.year <= year);
  if (fired.length === 0) return world;

  const next: WorldConfig = {
    ...world,
    geography: { ...world.geography },
    climate: { ...world.climate },
    polity: { ...world.polity },
  };

  for (const c of fired) applyOne(next, c);
  return next;
}

function clamp5(x: number) {
  return Math.min(5, Math.max(1, x));
}

function applyOne(w: WorldConfig, c: ScheduledChange) {
  switch (c.kind) {
    case 'road_built':
      // upgrade the road by `magnitude` steps
      w.geography.road = bumpRoad(w.geography.road, c.magnitude);
      break;
    case 'war_begins':
      w.polity.borderProximity = clamp5(w.polity.borderProximity + c.magnitude * 0.6);
      w.polity.stability = clamp5(w.polity.stability - c.magnitude * 0.4);
      break;
    case 'war_ends':
      w.polity.borderProximity = clamp5(w.polity.borderProximity - c.magnitude * 0.6);
      w.polity.stability = clamp5(w.polity.stability + c.magnitude * 0.3);
      break;
    case 'sovereignty_change':
      w.polity.taxBurden = clamp5(w.polity.taxBurden + (c.magnitude - 3));
      break;
    case 'climate_shift':
      w.climate.harshness = clamp5(w.climate.harshness + (c.magnitude - 2) * 0.5);
      w.climate.rainfall = clamp5(w.climate.rainfall - (c.magnitude - 3) * 0.4);
      break;
    case 'resource_strike':
      // handled in geology via reserves; here it nudges mining draw via fertility-neutral flag
      break;
  }
}

const ROAD_ORDER: WorldConfig['geography']['road'][] = [
  'isolated',
  'track',
  'minor_road',
  'highway',
  'crossroads',
];
function bumpRoad(road: WorldConfig['geography']['road'], steps: number): WorldConfig['geography']['road'] {
  const i = ROAD_ORDER.indexOf(road);
  return ROAD_ORDER[Math.min(ROAD_ORDER.length - 1, i + Math.round(steps))];
}
