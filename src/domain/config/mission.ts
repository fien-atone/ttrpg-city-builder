import type { Contribute, Designation, Mission, MissionId } from '../types';

export const missionDefaults: Mission = {
  goal: 'frontier_town',
  targetPopulation: 600,
  horizonYears: 100,
};

export const missionPresets: Record<string, Partial<Mission>> = {
  new_nation: { goal: 'new_nation', targetPopulation: 5000, horizonYears: 200 },
  frontier_town: { goal: 'frontier_town', targetPopulation: 600, horizonYears: 100 },
  resource_extraction: { goal: 'resource_extraction', targetPopulation: 800, horizonYears: 60 },
  military_outpost: { goal: 'military_outpost', targetPopulation: 300, horizonYears: 80 },
  stop_nomads: { goal: 'stop_nomads', targetPopulation: 400, horizonYears: 80 },
  religious_haven: { goal: 'religious_haven', targetPopulation: 500, horizonYears: 120 },
  trade_hub: { goal: 'trade_hub', targetPopulation: 2000, horizonYears: 120 },
};

/** The designation a mission is trying to steer toward (used by outcome + hysteresis). */
export const MISSION_TARGET_DESIGNATION: Record<MissionId, Designation> = {
  new_nation: 'city',
  frontier_town: 'agrarian',
  resource_extraction: 'mining_camp',
  military_outpost: 'border_fort',
  stop_nomads: 'border_fort',
  religious_haven: 'religious_center',
  trade_hub: 'market_town',
};

export const missionContribute: Contribute = (lev, world, snap) => {
  switch (world.mission.goal) {
    case 'new_nation':
      lev.migrationPull += 4;
      lev.funding += 0.5;
      lev.sectorWeights.services += 4;
      break;
    case 'resource_extraction':
      // the charter only matters while there is something left to extract
      if (snap.reserves > 0) {
        lev.sectorWeights.mining += 6;
        lev.migrationPull += 2;
      }
      break;
    case 'military_outpost':
    case 'stop_nomads':
      lev.sectorWeights.military += 8;
      lev.defense += 0.8;
      lev.naturalGrowth *= 0.7; // garrison reproduces poorly
      break;
    case 'religious_haven':
      lev.sectorWeights.clergy += 8;
      lev.migrationPull += 1.5; // pilgrims & converts
      break;
    case 'trade_hub':
      lev.sectorWeights.trade += 6;
      lev.importCapacity *= 1.15;
      break;
    case 'frontier_town':
    default:
      lev.sectorWeights.farming += 2;
      break;
  }
};
