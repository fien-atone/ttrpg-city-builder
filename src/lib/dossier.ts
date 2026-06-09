import type { Sector, SimResult, WorldConfig, YearState } from '../domain/types';
import type { Census } from '../domain/census';
import { applySchedule } from '../domain/trajectory';

type TFn = (path: string, params?: Record<string, string | number>) => string;
type FmtFn = (n: number) => string;
type ScaleFn = (path: string) => string[];

export interface DossierI18n {
  t: TFn;
  fmt: FmtFn;
  scale: ScaleFn;
}

const word = (labels: string[], v: number, min: number) =>
  labels[Math.min(Math.max(Math.round(v) - min, 0), labels.length - 1)] ?? '';

const capWord = (labels: string[], v: number) =>
  labels[Math.min(labels.length - 1, Math.floor(v * labels.length))] ?? '';

const KNOWHOW_SECTORS: Sector[] = ['mining', 'trade', 'crafts', 'clergy', 'knowledge', 'military'];

/**
 * GM-ready Markdown dossier. Every number is taken from the same YearState /
 * Census the UI renders, so the text always matches the charts and cards.
 */
export function buildDossier(
  sim: SimResult,
  point: YearState,
  census: Census,
  world: WorldConfig,
  i18n: DossierI18n,
): string {
  const { t, fmt, scale } = i18n;
  const worldY = applySchedule(world, point.year);
  const year = point.year;
  const L: string[] = [];

  // ---------- header ----------
  L.push(`# ${t('dossier.title')} — ${t(`designation.${point.designation}`)}`);
  L.push('');
  L.push(
    `**${fmt(point.population)}** · ${t(`phases.${point.phase}`)} · ${t(`status.${point.status}`)} · ${t('cards.year')} ${year}`,
  );
  L.push('');

  // ---------- founding ----------
  L.push(
    t('dossier.founded', {
      count: fmt(world.founders.count),
      background: t(`background.${world.founders.background}`),
      species: t(`species.${world.founders.species}`),
      goal: t(`mission.${world.mission.goal}`),
    }),
  );
  const s = world.support;
  L.push(
    s.investment > 0 || s.subsidy > 0
      ? t('dossier.supportLine', {
          inv: s.investment,
          invYears: s.investmentYears,
          sub: s.subsidy,
          subUntil: s.subsidyUntil,
        })
      : t('dossier.noSupport'),
  );

  // ---------- the place ----------
  L.push('');
  L.push(`## ${t('dossier.placeTitle')}`);
  L.push(
    `- ${t(`biome.${worldY.geography.biome}`)} · ${t(`water.${worldY.geography.water}`)} · ${t(`road.${worldY.geography.road}`)} · ${t('fields.ruggedness')}: ${word(scale('scales.ruggedness'), worldY.geography.ruggedness, 1)}`,
  );
  const hz = worldY.climate.hazards;
  const hazardList = [
    hz.winters ? t('hazards.winters') : null,
    hz.storms ? t('hazards.storms') : null,
    hz.droughts ? t('hazards.droughts') : null,
  ].filter(Boolean);
  L.push(
    `- ${t('fields.temperature')}: ${word(scale('scales.temperature'), worldY.climate.temperature, 1)} · ${t('fields.rainfall')}: ${word(scale('scales.rainfall'), worldY.climate.rainfall, 1)} · ${t('fields.growingSeason')}: ${word(scale('scales.growingSeason'), worldY.climate.growingSeason, 1)}` +
      (hazardList.length ? ` · ${hazardList.join(', ')}` : ''),
  );
  L.push(
    `- ${t('fields.fertility')}: ${word(scale('scales.fertility'), worldY.geology.fertility, 1)}`,
  );
  if (worldY.geology.resources.length > 0) {
    const exhausted = sim.events.some((e) => e.kind === 'exhausted' && e.year <= year);
    const res = worldY.geology.resources
      .map((r) => `${t(`resourceType.${r.type}`)} (${word(scale('scales.deposit'), r.volume, 1).toLowerCase()})`)
      .join(', ');
    L.push(`- ${t('fields.resources')}: ${res}${exhausted ? ` — *${t('events.exhausted').toLowerCase()}*` : ''}`);
    if (!exhausted && point.capabilities.mining < 0.25) L.push(`  - *${t('dossier.depositsUnknown')}*`);
  }
  const wl = worldY.wildlife;
  if (wl.predators >= 3 || wl.monsters >= 2) {
    const threats = [
      wl.predators >= 3 ? t('fields.predators').toLowerCase() : null,
      wl.monsters >= 2 ? t('fields.monsters').toLowerCase() : null,
    ].filter(Boolean);
    L.push(`- ${t('dossier.threatLine', { list: threats.join(', ') })}`);
  }

  // ---------- chronicle ----------
  L.push('');
  L.push(`## ${t('dossier.chronicle')}`);
  const chron: { year: number; text: string }[] = [];
  let prevPhase = sim.points[0]?.phase;
  for (const p of sim.points) {
    if (p.year > year) break;
    if (p.phase !== prevPhase) {
      chron.push({ year: p.year, text: t('dossier.grewInto', { phase: t(`phases.${p.phase}`) }) });
      prevPhase = p.phase;
    }
  }
  for (const d of sim.designationHistory) {
    if (d.year > 0 && d.year <= year) {
      chron.push({ year: d.year, text: t('dossier.became', { designation: t(`designation.${d.designation}`) }) });
    }
  }
  for (const e of sim.events) {
    if (e.year > year) continue;
    let text = t(`events.${e.kind}`);
    if (e.sector) text += ` — ${t(`sectors.${e.sector}`)}`;
    if (e.kind !== 'exhausted' && e.kind !== 'collapse' && e.kind !== 'arrival') {
      text += ` −${Math.round(e.severity * 100)}%`;
    }
    chron.push({ year: e.year, text });
  }
  chron.sort((a, b) => a.year - b.year);
  if (chron.length === 0) L.push(`- ${t('slice.noEvents')}`);
  for (const c of chron) L.push(`- **${t('slice.yearN', { n: c.year })}** ${c.text}`);

  // mission progress, judged at the selected year
  const m = sim.outcome.mission;
  L.push('');
  L.push(
    m.achievedYear !== null && m.achievedYear <= year
      ? `**${t('dossier.missionDone', { goal: t(`mission.${world.mission.goal}`), n: m.achievedYear })}**`
      : `**${t('dossier.missionProgress', {
          goal: t(`mission.${world.mission.goal}`),
          pct: Math.round((point.population / Math.max(1, world.mission.targetPopulation)) * 100),
          target: fmt(world.mission.targetPopulation),
        })}**`,
  );

  // ---------- state (mirrors the UI cards exactly) ----------
  L.push('');
  L.push(`## ${t('dossier.asOf', { n: year })}`);
  const c = point.composition;
  const filled = point.capacity > 0 ? Math.round((point.population / point.capacity) * 100) : 0;
  L.push(`- ${t('cards.population')}: **${fmt(point.population)}** (${t('cards.growth')}: ${(point.growth * 100).toFixed(2)}%)`);
  L.push(`- ${t('cards.capacity')}: ${fmt(point.capacity)} · ${t('cards.filled')}: ${filled}%`);
  L.push(`- ${t('cards.development')}: ${Math.round(point.development * 100)}% · ${t('cards.prosperity')}: ${point.prosperity.toFixed(2)} · ${t('cards.funding')}: ${point.funding.toFixed(1)}`);
  L.push(
    `- ${t('charts.compositionTitle')}: ${t('composition.locals')} ${fmt(c.locals)} · ${t('composition.migrants')} ${fmt(c.migrants)} · ${t('composition.transients')} ${fmt(c.transients)} · ${t('composition.dependents')} ${fmt(c.dependents)}`,
  );
  L.push(`- ${t('census.workforce')}: ${fmt(census.workforce)}`);

  // ---------- food & land ----------
  L.push('');
  L.push(`### ${t('census.foodTitle')}`);
  L.push(
    `- ${t('census.need')}: ${fmt(census.food.need)} · ${t('census.supplied')}: ${fmt(census.food.supplied)}` +
      (census.food.deficit > 0.5 ? ` · **${t('census.deficit')}: ${fmt(census.food.deficit)}**` : ''),
  );
  for (const ch of census.food.channels) {
    L.push(`  - ${t(`foodChannel.${ch.id}`)}: ${fmt(ch.rations)} ${t('census.rations')} (${Math.round(ch.share * 100)}%)`);
  }
  if (census.land.cropsHa >= 1 || census.land.pastureHa >= 1) {
    L.push('');
    L.push(`### ${t('census.landTitle')}`);
    if (census.land.cropsHa >= 1)
      L.push(`- ${t('census.cropsHa')}: ~${fmt(census.land.cropsHa)} ${t('census.ha')} · ${t('census.farmsteads')}: ${fmt(census.land.farmsteads)}`);
    if (census.land.pastureHa >= 1)
      L.push(`- ${t('census.pastureHa')}: ~${fmt(census.land.pastureHa)} ${t('census.ha')}`);
  }

  // ---------- trades & know-how ----------
  L.push('');
  L.push(`### ${t('census.professionsTitle')}`);
  for (const p of census.professions) L.push(`- ${t(`profession.${p.id}`)}: ${fmt(p.count)}`);
  L.push('');
  L.push(`### ${t('dossier.knowHowTitle')}`);
  for (const sec of KNOWHOW_SECTORS) {
    const v = point.capabilities[sec];
    L.push(`- ${t(`sectors.${sec}`)}: ${capWord(scale('scales.capability'), v)} (${Math.round(v * 100)}%)`);
  }

  // ---------- buildings ----------
  L.push('');
  L.push(`### ${t('dossier.buildingsTitle')}`);
  for (const b of point.buildings) {
    if (b.unlocked && !b.replaced) L.push(`- ${t(`buildings.${b.id}`)}${b.count > 1 ? ` ×${b.count}` : ''}`);
  }
  const former = point.buildings.filter((b) => b.replaced);
  if (former.length > 0) {
    L.push('');
    L.push(`### ${t('dossier.formerTitle')}`);
    for (const b of former) L.push(`- ${t(`buildings.${b.id}`)}`);
  }

  // ---------- neighbors & polity ----------
  if (worldY.neighbors.length > 0) {
    L.push('');
    L.push(`### ${t('dossier.neighborsTitle')}`);
    for (const n of worldY.neighbors) {
      L.push(`- ${t(`neighborType.${n.type}`)}, ${n.distance} ${t('dossier.days')} (${t(`relation.${n.relation}`)})`);
    }
  }
  L.push('');
  L.push(`### ${t('dossier.polityTitle')}`);
  L.push(
    `- ${t(`sovereignty.${worldY.polity.sovereignty}`)} · ${t('fields.taxBurden')}: ${word(scale('scales.tax'), worldY.polity.taxBurden, 0)} · ${t('fields.borderProximity')}: ${word(scale('scales.borderProximity'), worldY.polity.borderProximity, 1)}`,
  );

  return L.join('\n');
}
