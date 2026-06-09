import type { Contribute, Geography, Neighbor, NeighborType, Relation } from '../types';

export const neighborsDefaults: Neighbor[] = [
  { id: 'n1', type: 'town', distance: 4, linkSpeed: 3, relation: 'friendly' },
];

const SIZE: Record<NeighborType, number> = {
  hamlet: 1,
  town: 3,
  city: 7,
  capital: 12,
  fort: 2,
  port: 5,
};
const RELATION_TRADE: Record<Relation, number> = {
  allied: 1.2,
  friendly: 1.0,
  neutral: 0.7,
  rival: 0.3,
  hostile: 0,
};

/** Gravity pull of one neighbor: bigger & closer & better-linked = more interaction. */
function gravity(n: Neighbor): number {
  const reach = n.linkSpeed / Math.max(1, n.distance);
  return SIZE[n.type] * reach;
}

export const neighborsContribute: Contribute = (lev, world) => {
  for (const n of world.neighbors) {
    const g = gravity(n);
    const trade = g * RELATION_TRADE[n.relation];
    lev.importCapacity *= 1 + trade * 0.03;
    lev.sectorWeights.trade += trade * 2.5;
    lev.sectorWeights.services += trade * 0.8;
    lev.migrationPull += trade * 0.18;
    lev.transientFlow += Math.min(0.1, trade * 0.01);

    if (n.relation === 'hostile') {
      lev.raidPressure += g * 0.6;
    } else if (n.relation === 'allied' && (n.type === 'fort' || n.type === 'capital' || n.type === 'city')) {
      lev.defense += g * 0.15;
    }
  }
  if (world.neighbors.length === 0) lev.flags.add('isolated_region');
};

/** Suggest plausible neighbors from our own geography (used when seeding the list). */
export function suggestNeighbors(geo: Geography): Neighbor[] {
  const out: Neighbor[] = [];
  const onRoute = geo.road === 'highway' || geo.road === 'crossroads' || geo.road === 'minor_road';
  if (onRoute) {
    out.push({ id: 'up', type: 'town', distance: 3, linkSpeed: 4, relation: 'friendly' });
    out.push({ id: 'down', type: 'city', distance: 7, linkSpeed: 4, relation: 'neutral' });
  }
  if (geo.water === 'coast' || geo.water === 'rivermouth') {
    out.push({ id: 'port', type: 'port', distance: 5, linkSpeed: 5, relation: 'friendly' });
  }
  if (geo.road === 'isolated' && out.length === 0) {
    out.push({ id: 'far', type: 'hamlet', distance: 9, linkSpeed: 1, relation: 'neutral' });
  }
  return out;
}
