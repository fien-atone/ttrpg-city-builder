import type { Sector } from './types';
import type { ProfessionId } from './census';

/** Which sector each derived profession belongs to (for the sector drill-down). */
export const PROFESSION_SECTOR: Record<ProfessionId, Sector> = {
  farmers: 'farming',
  herders: 'farming',
  hunters: 'farming',
  fishers: 'farming',
  miners: 'mining',
  smiths: 'crafts',
  craftsmen: 'crafts',
  merchants: 'trade',
  innkeepers: 'services',
  guards: 'military',
  priests: 'clergy',
  scholars: 'knowledge',
  mages: 'knowledge',
};

/** Which sector a building serves (buildings without a clear home are omitted). */
export const BUILDING_SECTOR: Partial<Record<string, Sector>> = {
  granary: 'farming',
  mill: 'farming',
  smithy: 'crafts',
  manufactory: 'crafts',
  aqueduct: 'crafts',
  market: 'trade',
  guild_hall: 'trade',
  inn: 'services',
  bathhouse: 'services',
  well: 'services',
  houses: 'services',
  bridge: 'services',
  town_hall: 'services',
  palisade: 'military',
  wood_walls: 'military',
  stone_walls: 'military',
  manor: 'military',
  shrine: 'clergy',
  stone_church: 'clergy',
  cathedral: 'clergy',
  water_altar: 'clergy',
  mage_house: 'knowledge',
  hospital: 'knowledge',
  university: 'knowledge',
};
