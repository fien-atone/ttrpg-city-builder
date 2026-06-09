import type { Contribute, Geology, Resource } from '../types';

export const geologyDefaults: Geology = {
  fertility: 3,
  resources: [{ type: 'stone', volume: 3, accessibility: 4, depth: 1 }],
  stability: 4,
};

const R = (type: Resource['type'], volume: number, accessibility: number, depth: number): Resource => ({
  type,
  volume,
  accessibility,
  depth,
});

export const geologyPresets: Record<string, Partial<Geology>> = {
  fertile_plain: { fertility: 5, resources: [R('stone', 2, 4, 1)], stability: 5 },
  iron_hills: { fertility: 3, resources: [R('iron', 4, 3, 2), R('coal', 3, 3, 2)], stability: 4 },
  gold_strike: { fertility: 2, resources: [R('gold', 4, 2, 4), R('silver', 3, 2, 3)], stability: 3 },
  salt_flats: { fertility: 1, resources: [R('salt', 5, 4, 1)], stability: 4 },
  barren_rock: { fertility: 1, resources: [R('stone', 4, 4, 1)], stability: 2 },
  rich_seam: { fertility: 3, resources: [R('gems', 3, 1, 5), R('iron', 3, 3, 2)], stability: 3 },
};

/** Effective extraction quality of a resource: volume gated by how reachable it is. */
function extractability(r: Resource): number {
  const reach = (r.accessibility - r.depth * 0.5) / 5; // 0..1-ish
  return Math.max(0, r.volume * Math.max(0.1, reach));
}

export const geologyContribute: Contribute = (lev, world, snap) => {
  const geo = world.geology;
  lev.foodCapacity *= 0.4 + geo.fertility * 0.22; // fertility 1→0.62, 5→1.5
  lev.sectorWeights.farming += 3 + geo.fertility * 2;

  let mining = 0;
  for (const r of geo.resources) mining += extractability(r);
  // mining only matters while the reserve holds out
  const reserveLeft = Number.isFinite(snap.reserves) ? snap.reserves > 0 : true;
  if (mining > 0 && reserveLeft) {
    lev.sectorWeights.mining += mining * 1.4;
    lev.sectorWeights.crafts += mining * 0.4;
    lev.migrationPull += mining * 0.25; // boom-town draw
    if (mining >= 6) lev.flags.add('rich_deposit');
  }
  if (geo.stability <= 2) lev.flags.add('unstable_ground');
};

/** Total reserve a resource-bearing settlement starts with (Infinity if nothing to deplete). */
export function initialReserve(geo: Geology, baseK: number): number {
  let mining = 0;
  for (const r of geo.resources) {
    if (r.type === 'stone' || r.type === 'timber' || r.type === 'salt') continue; // renewable-ish
    mining += r.volume;
  }
  if (mining <= 0) return Infinity;
  return baseK * mining * 1.4;
}
