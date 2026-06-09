import type {
  SimResult,
  YearState,
  SimEvent,
  BuildingState,
  EventKind,
  WorldConfig,
  Designation,
  DesignationChange,
  Outcome,
  Sector,
} from './types';
import { buildLevers, capacityFrom, normalizeSectors } from './levers';
import { BUILDINGS } from './buildings';
import { phaseOf } from './phases';
import { mulberry32 } from './rng';
import { applySchedule } from './trajectory';
import { initialReserve } from './config/geology';
import { viabilityFloor } from './config/founders';
import { derivedHarshness } from './config/climate';
import { fundingAt } from './config/support';
import { deriveDesignation } from './designation';
import { statusFor, evaluateMission } from './outcome';

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Output-per-capita weights: a trade/craft economy is richer than subsistence farming. */
const SECTOR_VALUE: Record<Sector, number> = {
  farming: 0.6,
  mining: 1.3,
  crafts: 1.2,
  trade: 1.5,
  services: 1.0,
  military: 0.4,
  clergy: 0.8,
  knowledge: 1.4,
};

/**
 * Pure, deterministic per-year evolution. Same config → same result.
 *
 * Design principles of this model:
 * - Two slow STOCKS give the settlement memory: `development` (infrastructure,
 *   built by funding/skill/prosperity, damaged by raids & fires) and
 *   `prosperity` (output per capita from the sector mix). Levers are inputs;
 *   stocks are what the settlement has actually become.
 * - Migration is proportional to the existing population (people move to
 *   living communities, not to empty carrying capacity), plus a small
 *   sponsored trickle. A hamlet of 40 next to a huge K no longer balloons.
 * - Status uses 5-year smoothed growth and absolute size; designation has
 *   population gates with demotion — no thriving market towns of 40 souls.
 */
export function simulate(world: WorldConfig): SimResult {
  const years = world.horizonYears;
  const rand = mulberry32(world.seed || 1);
  const floor = viabilityFloor(world.founders);

  // baseline capacity (year 0) to size the resource reserve
  const baseSnap = {
    year: 0,
    population: world.founders.count,
    reserves: Infinity,
    development: 0,
    prosperity: 0,
  };
  const baseK = capacityFrom(buildLevers(world, baseSnap));
  let reserves = initialReserve(world.geology, baseK);
  let reserveExhausted = false;

  let pop = world.founders.count;
  let localsStock = pop;
  let migrantsStock = 0;
  let dependentFrac = clamp(world.founders.dependentsPct / 100, 0.05, 0.6);

  // stocks: a sponsored expedition arrives with some infrastructure
  let development = clamp(0.08 + world.support.investment * 0.05, 0, 0.45);
  let prosperity = 0.5;

  const everFunded = fundingAt(world.support, 0) > 0;

  let prevDesignation: Designation | null = null;
  let struggleStreak = 0;
  let foodDeficitStreak = 0;
  let collapsed: Outcome['collapsed'] = null;

  const popHistory: number[] = [pop];
  const points: YearState[] = [];
  const events: SimEvent[] = [];
  const designationHistory: DesignationChange[] = [];

  for (let y = 0; y <= years; y++) {
    const worldY = applySchedule(world, y);
    const lev = buildLevers(worldY, {
      year: y,
      population: pop,
      reserves,
      development,
      prosperity,
    });

    // ---- carrying capacity: levers × infrastructure × age structure ----
    const workPenalty = clamp(1 - Math.max(0, dependentFrac - 0.32) * 1.4, 0.55, 1);
    let K = capacityFrom(lev) * (0.75 + 0.45 * development) * (0.85 + 0.15 * workPenalty);

    // ---- resource depletion: a mining draw fades as the seam runs out ----
    if (Number.isFinite(reserves)) {
      reserves -= pop * 0.9;
      if (reserves <= 0 && !reserveExhausted) {
        reserveExhausted = true;
        events.push({ year: y, kind: 'exhausted', severity: 0 });
      }
      if (reserves <= 0) {
        lev.migrationPull *= 0.25;
        lev.migrationPush += 1.5;
      }
    }

    // ---- economy: sector mix → prosperity (output per capita) ----
    const w = { ...lev.sectorWeights };
    const urban = Math.log10(Math.max(10, pop));
    w.services += urban * 2;
    w.crafts += urban * 1.5;
    const sectors = normalizeSectors(w);

    let econValue = 0;
    for (const s of Object.keys(sectors) as Sector[]) econValue += sectors[s] * SECTOR_VALUE[s];
    const taxDrag = 1 - worldY.polity.taxBurden * 0.06;
    const prosperityTarget = clamp(econValue * (0.65 + development * 0.8) * taxDrag, 0, 2);
    prosperity += (prosperityTarget - prosperity) * 0.15; // economies shift slowly

    // ---- development stock: built by funding/skill/wealth, decays slowly ----
    const devTarget = clamp(
      0.12 + lev.funding * 0.08 + prosperity * 0.28 + worldY.founders.skill * 0.03 + urban / 12,
      0,
      1,
    );
    development += (devTarget - development) * 0.05;

    // ---- demography ----
    const net = lev.naturalGrowth + lev.magicHeal - lev.mortality;
    const natural = net * pop * clamp(1 - pop / K, -0.5, 1) * workPenalty;

    // migration: proportional to the living community, plus a sponsored trickle
    const room = clamp(1 - pop / K, 0, 1);
    const pull = clamp(0.4 + lev.migrationPull * 0.18 + prosperity * 0.5 + development * 0.6, 0, 3);
    const inMig = pop * 0.016 * pull * room * workPenalty + lev.migrationPull * 1.2 * room;
    const outMig = lev.migrationPush * 0.002 * pop + (pop > K ? 0.06 * (pop - K) : 0);
    const migration = inMig - outMig;

    // overshoot famine: population above what the land feeds dies back
    const overshootLoss = pop > K * 1.05 ? (pop - K) * 0.25 : 0;

    // chronic raids when pressure beats defence
    const raidGap = Math.max(0, lev.raidPressure - lev.defense * 2);
    const raidLoss = raidGap * 0.004 * pop;

    let dpop = natural + migration - overshootLoss - raidLoss;

    // ---- discrete shocks ----
    if (worldY.shocksEnabled && !collapsed) {
      const roll = rand();
      const harsh = derivedHarshness(worldY.climate);
      const pEvent =
        0.035 + (pop > 800 ? 0.025 : 0) + raidGap * 0.02 + Math.max(0, harsh - 1.5) * 0.012;
      if (roll < pEvent) {
        const kind = rand();
        let sev: number;
        let ek: EventKind;
        const magic = worldY.arcana.magic;
        if (raidGap > 0.5 && kind < 0.45) {
          sev = (0.1 + rand() * 0.2) * (1 + raidGap * 0.2);
          ek = 'raid';
        } else if (kind < 0.45) {
          sev = (0.08 + rand() * 0.22) * (1 - magic * 0.08);
          ek = 'plague';
        } else if (kind < 0.78) {
          const droughtMult = worldY.climate.hazards.droughts ? 1.3 : 1;
          sev = (0.05 + rand() * 0.18) * (1.3 - worldY.geology.fertility * 0.08) * droughtMult;
          ek = 'famine';
        } else {
          sev = 0.04 + rand() * 0.08;
          ek = 'fire';
        }
        sev = clamp(sev, 0, 0.55);
        dpop -= pop * sev;
        // raids and fires destroy infrastructure, not only people
        if (ek === 'raid') development *= 1 - sev * 0.6;
        if (ek === 'fire') development *= 1 - sev * 0.8;
        events.push({ year: Math.min(y + 1, years), kind: ek, severity: sev });
      }
    }

    if (collapsed) dpop = -0.18 * pop; // an abandoned site bleeds out

    let newPop = Math.max(0, pop + dpop);

    // ---- composition ----
    const births = Math.max(0, natural);
    const inflow = Math.max(0, migration);
    localsStock += births;
    migrantsStock += inflow;
    const matured = migrantsStock * 0.04;
    migrantsStock -= matured;
    localsStock += matured;
    const stockSum = localsStock + migrantsStock;
    if (stockSum > 0) {
      localsStock = (newPop * localsStock) / stockSum;
      migrantsStock = (newPop * migrantsStock) / stockSum;
    } else {
      localsStock = newPop;
      migrantsStock = 0;
    }
    dependentFrac += (0.32 - dependentFrac) * 0.05;
    const transients = lev.transientFlow * newPop * (0.6 + prosperity * 0.4);
    const dependents = newPop * dependentFrac;

    // ---- smoothed growth (5-year window) ----
    popHistory.push(newPop);
    const back = Math.min(5, popHistory.length - 1);
    const ref = popHistory[popHistory.length - 1 - back];
    const smoothedGrowth = ref > 0 ? Math.pow(newPop / ref, 1 / back) - 1 : 0;

    // ---- viability & collapse ----
    const foodDeficit = K < newPop * 0.8;
    foodDeficitStreak = foodDeficit ? foodDeficitStreak + 1 : 0;
    struggleStreak = newPop <= floor ? struggleStreak + 1 : 0;

    let status = collapsed
      ? ('abandoned' as const)
      : statusFor({
          year: y,
          population: newPop,
          floor,
          capacity: K,
          smoothedGrowth,
          prosperity,
          foodDeficit,
        });

    if (!collapsed) {
      const supportGone = everFunded && fundingAt(worldY.support, y) <= 0.05;
      if (newPop < 4) {
        collapsed = { year: y, reason: 'depopulation' };
      } else if (foodDeficitStreak >= 4 && newPop <= floor * 1.5) {
        collapsed = { year: y, reason: 'starvation' };
      } else if (struggleStreak >= 8) {
        collapsed = { year: y, reason: supportGone ? 'unfunded' : 'depopulation' };
      }
      if (collapsed) {
        status = 'abandoned';
        events.push({ year: y, kind: 'collapse', severity: 0 });
      }
    }

    // ---- emergent designation (size-gated, demotable) ----
    const designation = deriveDesignation(sectors, worldY, newPop, prevDesignation);
    if (designation !== prevDesignation) {
      designationHistory.push({ year: y, designation });
      prevDesignation = designation;
    }

    // ---- buildings (pop + arcana gating, upgrade chains, counts) ----
    const magicLevel = worldY.arcana.magic;
    const magicDominant = lev.flags.has('magic_dominant');
    const techSuppressed = lev.flags.has('tech_suppressed');
    const skillBoost = 1 - (worldY.founders.skill - 3) * 0.06;
    const unlockedIds = new Set<string>();
    for (const b of BUILDINGS) {
      let unlocked = newPop >= b.threshold * skillBoost;
      if (unlocked && b.needMagic && magicLevel < b.needMagic) unlocked = false;
      if (unlocked && b.needTech && magicDominant) unlocked = false;
      if (unlocked && b.tag === 'tech' && techSuppressed) unlocked = false;
      if (unlocked) unlockedIds.add(b.id);
    }
    const buildings: BuildingState[] = BUILDINGS.map((b) => {
      const unlocked = unlockedIds.has(b.id);
      const replaced = unlocked && b.replacedBy !== undefined && unlockedIds.has(b.replacedBy);
      const count =
        unlocked && !replaced && b.countPer
          ? Math.max(1, Math.floor(newPop / b.countPer) + 1)
          : unlocked && !replaced
            ? 1
            : 0;
      return { id: b.id, tag: b.tag, threshold: b.threshold, unlocked, replaced, count };
    });

    points.push({
      year: y,
      population: newPop,
      capacity: K,
      phase: phaseOf(newPop),
      growth: smoothedGrowth,
      status,
      designation,
      funding: lev.funding,
      development,
      prosperity,
      buildings,
      composition: { locals: localsStock, migrants: migrantsStock, transients, dependents },
      sectors,
    });

    pop = newPop;
  }

  const peak = points.reduce((m, p) => Math.max(m, p.population), 0);
  const outcome: Outcome = {
    finalStatus: points.length ? points[points.length - 1].status : 'founding',
    collapsed,
    mission: evaluateMission(points, world),
  };

  return { points, events, years, peak, outcome, designationHistory };
}
