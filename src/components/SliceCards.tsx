import type { YearState } from '../domain/types';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  point: YearState;
  peak: number;
}

export function SliceCards({ point, peak }: Props) {
  const { t, fmt } = useI18n();
  const filled = point.capacity > 0 ? point.population / point.capacity : 0;
  const unlocked = point.buildings.filter((b) => b.unlocked).length;

  const cards: Array<[string, string]> = [
    [t('cards.population'), fmt(point.population)],
    [t('cards.growth'), `${(point.growth * 100).toFixed(2)}%`],
    [t('cards.capacity'), fmt(point.capacity)],
    [t('cards.filled'), `${Math.round(filled * 100)}%`],
    [t('cards.funding'), point.funding.toFixed(1)],
    [t('cards.buildings'), `${unlocked}/${point.buildings.length}`],
    [t('cards.peak'), fmt(peak)],
  ];

  return (
    <div className="cards">
      {cards.map(([k, v]) => (
        <div className="card" key={k}>
          <div className="k">{k}</div>
          <div className="v">{v}</div>
        </div>
      ))}
    </div>
  );
}
