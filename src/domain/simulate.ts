import type {
  SimParams,
  SimResult,
  YearPoint,
  SimEvent,
  BuildingState,
  EventKind,
} from './types';
import { ARCHETYPES } from './archetypes';
import { BUILDINGS } from './buildings';
import { phaseOf } from './phases';
import { mulberry32 } from './rng';

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/**
 * Pure, deterministic simulation. Same params → same result.
 *
 * Model: logistic growth  r·P·(1 − P/K)  + migration as a share of the gap to K.
 * Sanitation adds hidden "urban mortality"; magic lowers it and raises K; sponsor
 * capital compresses the early years; shocks are seeded so a run is reproducible.
 */
export function simulate(p: SimParams): SimResult {
  const a = ARCHETYPES[p.archetype];
  const attr = p.attractiveness + a.attr;
  const cap = p.capital + a.cap;
  const bal = p.balance / 100; // 0 = tech, 1 = magic
  const rand = mulberry32(p.seed || 1);

  // ---- carrying capacity K -------------------------------------------------
  const food = p.fertility * p.water; // 1..25
  const tradeMult = 1 + (p.trade - 1) * 0.9; // links lift the ceiling hard
  const magBoostK = 1 + p.magic * 0.1;
  let K =
    40 *
    food *
    tradeMult *
    (0.6 + p.safety * 0.12) *
    (0.55 + p.sanitation * 0.12) *
    magBoostK;
  K = clamp(K, 60, 60000);

  // ---- rates ---------------------------------------------------------------
  const baseR = 0.012 * a.baseR; // natural-growth "golden window" cap
  const migK = 0.02 + attr * 0.012 + cap * 0.006;
  const sanPenalty = (3 - p.sanitation) * 0.004;
  const magHeal = p.magic * 0.0035;
  const capYears = cap > 0 ? Math.round(cap * 6) : 0;

  let pop = p.pop0;
  let reserve = p.resourceCap ? K * 8 : Infinity;
  let exhaustedAt: number | null = null;

  const points: YearPoint[] = [];
  const events: SimEvent[] = [];

  for (let y = 0; y <= p.years; y++) {
    // effective ceiling this year (resource exhaustion pulls it down)
    let Ky = K;
    if (p.resourceCap) {
      const ratio = clamp(reserve / (K * 8), 0, 1);
      Ky = clamp(60 + (K - 60) * ratio, 60, K);
      reserve -= pop * 0.9;
      if (reserve <= 0 && exhaustedAt === null) {
        exhaustedAt = y;
        events.push({ year: y, kind: 'exhausted', severity: 0 });
      }
    }

    const buildings: BuildingState[] = BUILDINGS.map((b) => {
      let unlocked = pop >= b.threshold;
      if (unlocked && b.needMagic && p.magic < b.needMagic) unlocked = false;
      if (unlocked && b.needTech && bal > 0.6) unlocked = false; // magic glut stifles tech
      if (unlocked && b.tag === 'tech' && bal > 0.75) unlocked = false;
      return { id: b.id, tag: b.tag, threshold: b.threshold, unlocked };
    });

    points.push({
      year: y,
      population: pop,
      capacity: Ky,
      phase: phaseOf(pop),
      growth: 0, // filled in below
      buildings,
    });

    if (y === p.years) break;

    // ---- yearly delta ------------------------------------------------------
    const capBoost = y < capYears ? 0.015 * cap : 0;
    const natural = (baseR + magHeal - sanPenalty) * pop * (1 - pop / Ky);
    const migration =
      pop < Ky ? migK * (Ky - pop) * 0.06 + capBoost * pop : -0.01 * (pop - Ky);
    let dpop = natural + migration;

    // ---- shocks ------------------------------------------------------------
    if (p.shocksEnabled) {
      const roll = rand();
      const pEvent =
        0.04 + (pop > 800 ? 0.03 : 0) + (3 - p.sanitation) * 0.012;
      if (roll < pEvent) {
        const kind = rand();
        let sev: number;
        let ek: EventKind;
        if (kind < 0.4) {
          sev = (0.08 + rand() * 0.22) * (1 - p.magic * 0.08);
          ek = 'plague';
        } else if (kind < 0.7) {
          sev = (0.05 + rand() * 0.18) * (1.3 - p.fertility * 0.08);
          ek = 'famine';
        } else if (kind < 0.9) {
          sev = (0.1 + rand() * 0.2) * (1.4 - p.safety * 0.12);
          ek = 'raid';
        } else {
          sev = 0.04 + rand() * 0.08;
          ek = 'fire';
        }
        sev = clamp(sev, 0, 0.55);
        dpop -= pop * sev;
        events.push({ year: y + 1, kind: ek, severity: sev });
      }
    }

    pop = Math.max(2, pop + dpop);
  }

  // year-over-year growth for the slice readout
  for (let i = 0; i < points.length; i++) {
    const prev = i > 0 ? points[i - 1].population : points[i].population;
    points[i].growth = (points[i].population - prev) / Math.max(prev, 1);
  }

  const peak = points.reduce((m, pt) => Math.max(m, pt.population), 0);
  return { points, events, years: p.years, peak };
}
