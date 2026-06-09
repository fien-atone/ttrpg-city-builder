import type { SimResult, WorldConfig, YearState } from '../domain/types';
import type { Census } from '../domain/census';

type TFn = (path: string, params?: Record<string, string | number>) => string;
type FmtFn = (n: number) => string;

/**
 * Render a GM-ready Markdown dossier: header, chronicle of what happened up
 * to the selected year, then the concrete year slice (food, land, trades,
 * buildings). Meant to be pasted straight into campaign notes.
 */
export function buildDossier(
  sim: SimResult,
  point: YearState,
  census: Census,
  world: WorldConfig,
  t: TFn,
  fmt: FmtFn,
): string {
  const L: string[] = [];
  const year = point.year;

  L.push(`# ${t('dossier.title')} — ${t(`designation.${point.designation}`)}`);
  L.push('');
  L.push(
    t('dossier.founded', {
      count: fmt(world.founders.count),
      species: t(`species.${world.founders.species}`),
      goal: t(`mission.${world.mission.goal}`),
    }),
  );
  L.push('');
  L.push(`## ${t('dossier.chronicle')}`);
  const chronicle: { year: number; text: string }[] = [];
  for (const d of sim.designationHistory) {
    if (d.year > 0 && d.year <= year) {
      chronicle.push({
        year: d.year,
        text: t('dossier.became', { designation: t(`designation.${d.designation}`) }),
      });
    }
  }
  for (const e of sim.events) {
    if (e.year > year) continue;
    const sevPart = e.kind === 'exhausted' || e.kind === 'collapse' ? '' : ` −${Math.round(e.severity * 100)}%`;
    chronicle.push({ year: e.year, text: `${t(`events.${e.kind}`)}${sevPart}` });
  }
  chronicle.sort((a, b) => a.year - b.year);
  for (const c of chronicle) L.push(`- ${t('slice.yearN', { n: c.year })} ${c.text}`);
  if (chronicle.length === 0) L.push(`- ${t('slice.noEvents')}`);

  L.push('');
  L.push(`## ${t('dossier.asOf', { n: year })}`);
  L.push(
    `- ${t('cards.population')}: **${fmt(point.population)}** (${t(`status.${point.status}`)}, ${t(`phases.${point.phase}`)})`,
  );
  const c = point.composition;
  L.push(
    `- ${t('charts.compositionTitle')}: ${t('composition.locals')} ${fmt(c.locals)}, ${t('composition.migrants')} ${fmt(c.migrants)}, ${t('composition.transients')} ${fmt(c.transients)}, ${t('composition.dependents')} ${fmt(c.dependents)}`,
  );
  L.push(
    `- ${t('cards.development')}: ${Math.round(point.development * 100)}% · ${t('cards.prosperity')}: ${point.prosperity.toFixed(2)}`,
  );
  L.push(`- ${t('census.workforce')}: ${fmt(census.workforce)}`);

  L.push('');
  L.push(`### ${t('census.foodTitle')}`);
  L.push(
    `- ${t('census.need')}: ${fmt(census.food.need)} · ${t('census.supplied')}: ${fmt(census.food.supplied)}` +
      (census.food.deficit > 0.5 ? ` · **${t('census.deficit')}: ${fmt(census.food.deficit)}**` : ''),
  );
  for (const ch of census.food.channels) {
    L.push(
      `  - ${t(`foodChannel.${ch.id}`)}: ${fmt(ch.rations)} ${t('census.rations')} (${Math.round(ch.share * 100)}%)`,
    );
  }
  if (census.land.cropsHa >= 1 || census.land.pastureHa >= 1) {
    L.push('');
    L.push(`### ${t('census.landTitle')}`);
    if (census.land.cropsHa >= 1)
      L.push(
        `- ${t('census.cropsHa')}: ~${fmt(census.land.cropsHa)} ${t('census.ha')} (${t('census.farmsteads')}: ${fmt(census.land.farmsteads)})`,
      );
    if (census.land.pastureHa >= 1)
      L.push(`- ${t('census.pastureHa')}: ~${fmt(census.land.pastureHa)} ${t('census.ha')}`);
  }

  L.push('');
  L.push(`### ${t('census.professionsTitle')}`);
  for (const p of census.professions) L.push(`- ${t(`profession.${p.id}`)}: ${fmt(p.count)}`);

  L.push('');
  L.push(`### ${t('dossier.buildingsTitle')}`);
  for (const b of point.buildings) {
    if (!b.unlocked || b.replaced) continue;
    L.push(`- ${t(`buildings.${b.id}`)}${b.count > 1 ? ` ×${b.count}` : ''}`);
  }

  return L.join('\n');
}
