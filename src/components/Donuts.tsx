import type { YearState, Sector } from '../domain/types';
import { SECTOR_COLORS, COMPOSITION_COLORS } from '../lib/ui';
import { SECTORS } from '../domain/levers';
import { useI18n } from '../i18n/I18nContext';
import { DonutChart, type Segment } from './DonutChart';

export function EconomyDonut({ point }: { point: YearState }) {
  const { t } = useI18n();
  // hide sub-0.5% slivers so the chart shows what actually exists here
  const segments: Segment[] = SECTORS.filter((s) => point.sectors[s] >= 0.005).map((s: Sector) => ({
    key: s,
    label: t(`sectors.${s}`),
    value: point.sectors[s],
    color: SECTOR_COLORS[s],
  }));
  return <DonutChart title={t('charts.economyTitle')} segments={segments} />;
}

export function CompositionDonut({ point }: { point: YearState }) {
  const { t, fmt } = useI18n();
  const c = point.composition;
  const residents = c.locals + c.migrants;
  const workers = Math.max(0, residents - c.dependents);
  const segments: Segment[] = [
    { key: 'locals', label: t('composition.locals'), value: c.locals, color: COMPOSITION_COLORS.locals },
    { key: 'migrants', label: t('composition.migrants'), value: c.migrants, color: COMPOSITION_COLORS.migrants },
    { key: 'transients', label: t('composition.transients'), value: c.transients, color: COMPOSITION_COLORS.transients },
  ];
  return (
    <DonutChart
      title={t('charts.compositionTitle')}
      segments={segments}
      centerLabel={`${fmt(workers)} ⚒`}
    />
  );
}
