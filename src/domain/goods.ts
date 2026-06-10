import type { ResourceType, WorldConfig, YearState } from './types';
import type { Census, FoodChannelId } from './census';
import { applySchedule } from './trajectory';

/**
 * The concrete-goods layer: turns shares into things a GM can name. What do
 * they grow, whom do they raise, what do the workshops make and FROM what,
 * what leaves town on carts and what comes in. Margins are value tiers
 * (1..3 coins): spice money vs grain money.
 */

export type GoodId =
  | 'wheat'
  | 'barley'
  | 'rye'
  | 'oats'
  | 'dates'
  | 'rice'
  | 'cattle'
  | 'horses'
  | 'sheep'
  | 'goats'
  | 'pigs'
  | 'reindeer'
  | 'camels'
  | 'furs'
  | 'game_meat'
  | 'fish'
  | 'timber_goods'
  | 'tools'
  | 'weapons'
  | 'cloth'
  | 'pottery'
  | 'grain'
  | 'wine'
  | 'spices'
  | 'ore'
  | 'wool'
  | 'clay';

export interface TradeGood {
  id: GoodId | ResourceType;
  isResource: boolean;
  margin: number; // 1..3 — coins shown in the UI
}

export interface ProducedGood {
  id: GoodId;
  from: (GoodId | ResourceType)[];
  imported: boolean; // inputs are not local
}

export interface Goods {
  grow: GoodId[];
  raise: GoodId[];
  wildcatch: GoodId[]; // hunting & fishing
  produce: ProducedGood[];
  exports: TradeGood[];
  imports: GoodId[];
}

function channelShare(census: Census, id: FoodChannelId): number {
  return census.food.channels.find((c) => c.id === id)?.share ?? 0;
}

export function deriveGoods(point: YearState, census: Census, world: WorldConfig): Goods {
  const w = applySchedule(world, point.year);
  const g = w.geography;
  const s = point.sectors;

  // ---- grown crops: biome × climate ----
  let grow: GoodId[] = [];
  if (s.farming >= 0.06 && w.geology.fertility >= 2 && channelShare(census, 'crops') >= 0.05) {
    if (g.biome === 'desert') grow = g.water !== 'none' ? ['dates'] : [];
    else if (g.biome === 'wetland' && w.climate.temperature >= 4) grow = ['rice'];
    else if (w.climate.temperature <= 2 || g.biome === 'tundra') grow = ['rye', 'oats'];
    else grow = ['wheat', 'barley'];
  }

  // ---- livestock: biome ----
  const RAISE: Record<typeof g.biome, GoodId[]> = {
    plains: ['cattle', 'horses'],
    hills: ['sheep', 'goats'],
    forest: ['pigs'],
    mountains: ['goats'],
    tundra: ['reindeer'],
    desert: ['camels', 'goats'],
    wetland: ['cattle'],
  };
  const raise = channelShare(census, 'livestock') >= 0.04 ? RAISE[g.biome] : [];

  // ---- hunting & fishing ----
  const wildcatch: GoodId[] = [];
  if (channelShare(census, 'hunting') >= 0.04) {
    if (g.biome === 'forest' || g.biome === 'tundra') wildcatch.push('furs');
    wildcatch.push('game_meat');
  }
  if (channelShare(census, 'fishing') >= 0.04) wildcatch.push('fish');

  // ---- workshops: outputs need inputs ----
  const produce: ProducedGood[] = [];
  const workedTypes = new Set(
    point.resources.filter((r) => r.phase === 'worked').map((r) => r.type),
  );
  if (s.crafts >= 0.08) {
    if (g.biome === 'forest' || workedTypes.has('timber')) {
      produce.push({ id: 'timber_goods', from: ['timber' as ResourceType], imported: false });
    }
    if (workedTypes.has('iron') || workedTypes.has('copper')) {
      const metal: ResourceType = workedTypes.has('iron') ? 'iron' : 'copper';
      produce.push({ id: 'tools', from: [metal], imported: false });
      if (s.military >= 0.12) produce.push({ id: 'weapons', from: [metal], imported: false });
    } else if (s.crafts >= 0.15 && point.capabilities.crafts > 0.5) {
      // serious craftsmen with no local metal work imported stock
      produce.push({ id: 'tools', from: ['ore'], imported: true });
    }
    if (raise.includes('sheep')) produce.push({ id: 'cloth', from: ['wool'], imported: false });
    if (produce.length === 0) produce.push({ id: 'pottery', from: ['clay'], imported: false });
  }

  // ---- exports: the most valuable local surplus ----
  const exports: TradeGood[] = [];
  if (s.trade >= 0.06) {
    for (const r of point.resources) {
      if (r.phase !== 'worked') continue;
      const def = w.geology.resources.find((d) => d.type === r.type);
      const value = def?.value ?? 1;
      if (value >= 3) exports.push({ id: r.type, isResource: true, margin: value >= 5 ? 3 : 2 });
    }
    if (produce.some((p) => p.id === 'cloth')) exports.push({ id: 'cloth', isResource: false, margin: 2 });
    if (produce.some((p) => p.id === 'tools')) exports.push({ id: 'tools', isResource: false, margin: 2 });
    if (wildcatch.includes('furs')) exports.push({ id: 'furs', isResource: false, margin: 2 });
    if (channelShare(census, 'crops') >= 0.3 && w.geology.fertility >= 4) {
      exports.push({ id: 'grain', isResource: false, margin: 1 });
    }
    if (produce.some((p) => p.id === 'timber_goods')) {
      exports.push({ id: 'timber_goods', isResource: false, margin: 1 });
    }
    exports.sort((a, b) => b.margin - a.margin);
    exports.splice(4);
  }

  // ---- imports: what the town visibly lacks ----
  const imports: GoodId[] = [];
  if (channelShare(census, 'imports') >= 0.15) imports.push('grain');
  if (produce.some((p) => p.imported)) imports.push('ore');
  if (point.prosperity >= 1.2 && s.trade >= 0.1) imports.push('wine', 'spices');

  return { grow, raise, wildcatch, produce, exports, imports };
}
