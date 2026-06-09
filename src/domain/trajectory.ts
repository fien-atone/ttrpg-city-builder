import type { WorldConfig, ScheduledChange } from './types';

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
    climate: { ...world.climate, hazards: { ...world.climate.hazards } },
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
      // a lasting shift: drier, shorter seasons, drought-prone at high magnitude
      w.climate.rainfall = clamp5(w.climate.rainfall - (c.magnitude - 3) * 0.5);
      w.climate.growingSeason = clamp5(w.climate.growingSeason - (c.magnitude - 3) * 0.4);
      if (c.magnitude >= 4) w.climate.hazards.droughts = true;
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
