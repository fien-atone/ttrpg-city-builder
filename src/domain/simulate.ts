import type {
  SimResult,
  YearState,
  SimEvent,
  BuildingState,
  EventKind,
  WorldConfig,
  Sector,
  Designation,
  DesignationChange,
  Outcome,
} from './types';
import { buildLevers, capacityFrom, normalizeSectors } from './levers';
import { BUILDINGS } from './buildings';
import { phaseOf } from './phases';
import { mulberry32 } from './rng';
import { applySchedule } from './trajectory';
import { initialReserve } from './config/geology';
import { viabilityFloor } from './config/founders';
import { derivedHarshness } from './config/climate';
import { deriveDesignation } from './designation';
import { statusFor, evaluateMission } from './outcome';

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/**
 * Pure, deterministic per-year evolution. Same config → same result.
 * Each year: resolve schedule → build levers → capacity → growth (natural +
 * migration + funding − shocks − raids) → update composition & sectors →
 * status/collapse → emergent designation.
 */
export function simulate(world: WorldConfig): SimResult {
  const years = world.horizonYears;
  const rand = mulberry32(world.seed || 1);
  const floor = viabilityFloor(world.founders);

  // baseline capacity (year 0) to size the resource reserve
  const baseLev = buildLevers(world, { year: 0, population: world.founders.count, reserves: Infinity });
  const baseK = capacityFrom(baseLev);
  let reserves = initialReserve(world.geology, baseK);
  const reserves0 = reserves;
  let reserveExhausted = false;

  let pop = world.founders.count;
  let localsStock = pop;
  let migrantsStock = 0;
  let dependentFrac = clamp(world.founders.dependentsPct / 100, 0.05, 0.6);

  let prevDesignation: Designation | null = null;
  let struggleStreak = 0;
  let collapsed: Outcome['collapsed'] = null;

  const points: YearState[] = [];
  const events: SimEvent[] = [];
  const designationHistory: DesignationChange[] = [];

  for (let y = 0; y <= years; y++) {
    const worldY = applySchedule(world, y);
    const lev = buildLevers(worldY, { year: y, population: pop, reserves });

    let K = capacityFrom(lev);

    // resource depletion: a mining draw fades as the seam runs out
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

    // ---- growth components ----
    // dependents consume without producing: a top-heavy age structure slows
    // both the food economy and how attractive the settlement is to settlers
    const workPenalty = clamp(1 - Math.max(0, dependentFrac - 0.32) * 1.4, 0.55, 1);
    K *= 0.85 + 0.15 * workPenalty;

    const net = lev.naturalGrowth + lev.magicHeal - lev.mortality;
    const natural = net * pop * (1 - pop / K) * workPenalty;

    const migK = 0.02 + lev.migrationPull * 0.012;
    const inMig = pop < K ? migK * (K - pop) * 0.06 * workPenalty : 0;
    const outMig = lev.migrationPush * 0.0018 * pop + (pop > K ? 0.01 * (pop - K) : 0);
    const migration = inMig - outMig;

    const fundingGrowth = lev.funding > 0 ? lev.funding * 0.004 * pop * (1 - pop / K) : 0;

    // ---- raids: chronic attrition when pressure beats defence ----
    const raidGap = Math.max(0, lev.raidPressure - lev.defense * 2);
    const raidLoss = raidGap * 0.004 * pop;

    let dpop = natural + migration + fundingGrowth - raidLoss;

    // ---- discrete shocks ----
    if (worldY.shocksEnabled && !collapsed) {
      const roll = rand();
      const harsh = derivedHarshness(worldY.climate);
      const pEvent = 0.035 + (pop > 800 ? 0.025 : 0) + raidGap * 0.02 + Math.max(0, harsh - 1.5) * 0.012;
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
        events.push({ year: y + 1 <= years ? y + 1 : y, kind: ek, severity: sev });
      }
    }

    // ---- collapse handling ----
    if (collapsed) {
      dpop = -0.18 * pop; // an abandoned site bleeds out
    }

    let newPop = Math.max(0, pop + dpop);

    // ---- composition: split residents into locals vs migrants ----
    const births = Math.max(0, natural);
    const inflow = Math.max(0, migration + fundingGrowth);
    localsStock += births;
    migrantsStock += inflow;
    const matured = migrantsStock * 0.04; // migrants settle into locals over time
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

    dependentFrac += (0.32 - dependentFrac) * 0.05; // drift toward a steady age structure
    const transients = lev.transientFlow * newPop;
    const dependents = newPop * dependentFrac;

    // ---- economic sectors (some scale with urbanization) ----
    const w = { ...lev.sectorWeights };
    const urban = Math.log10(Math.max(10, newPop));
    w.services += urban * 2;
    w.crafts += urban * 1.5;
    const sectors = normalizeSectors(w);

    // ---- status / viability ----
    const prevPop = points.length > 0 ? points[points.length - 1].population : pop;
    const growthRate = (newPop - prevPop) / Math.max(1, prevPop);
    let status = collapsed ? 'abandoned' : statusFor(y, newPop, floor, K, growthRate);

    if (!collapsed) {
      if (newPop <= floor) struggleStreak += 1;
      else struggleStreak = 0;
      const starving = K < pop * 0.6;
      if (newPop < 4 || struggleStreak >= 6 || (starving && newPop <= floor)) {
        const reason = starving ? 'starvation' : lev.funding <= 0 && newPop <= floor ? 'unfunded' : 'depopulation';
        collapsed = { year: y, reason };
        status = 'abandoned';
        events.push({ year: y, kind: 'collapse', severity: 0 });
      }
    }

    // ---- emergent designation ----
    const designation = deriveDesignation(sectors, worldY, newPop, prevDesignation);
    if (designation !== prevDesignation) {
      designationHistory.push({ year: y, designation });
      prevDesignation = designation;
    }

    // ---- buildings (pop + arcana gating, upgrade chains, counts) ----
    const magicLevel = worldY.arcana.magic;
    const magicDominant = lev.flags.has('magic_dominant');
    const techSuppressed = lev.flags.has('tech_suppressed');
    const skillBoost = 1 - (worldY.founders.skill - 3) * 0.06; // skilled founders build sooner
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
      // an upgrade chain retires the old building once its successor stands
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
      growth: growthRate,
      status,
      designation,
      funding: lev.funding,
      buildings,
      composition: { locals: localsStock, migrants: migrantsStock, transients, dependents },
      sectors,
    });

    pop = newPop;
    void reserves0; // reserved for future depletion UI
  }

  const peak = points.reduce((m, p) => Math.max(m, p.population), 0);
  const outcome: Outcome = {
    finalStatus: points.length ? points[points.length - 1].status : 'founding',
    collapsed,
    mission: evaluateMission(points, world),
  };

  return { points, events, years, peak, outcome, designationHistory };
}
