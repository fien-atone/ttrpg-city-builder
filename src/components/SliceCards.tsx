import type { YearState } from '../domain/types';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  point: YearState;
}

/** Six cards, each with a plain-language tooltip explaining what it means. */
export function SliceCards({ point }: Props) {
  const { t, fmt } = useI18n();
  const filled = point.capacity > 0 ? Math.round((point.population / point.capacity) * 100) : 0;

  const cards: Array<{ k: string; v: string; hint: string }> = [
    { k: t('cards.population'), v: fmt(point.population), hint: t('cardHints.population') },
    {
      k: t('cards.growth'),
      v: `${point.growth >= 0 ? '+' : ''}${(point.growth * 100).toFixed(2)}%`,
      hint: t('cardHints.growth'),
    },
    {
      k: t('cards.capacity'),
      v: `${fmt(point.capacity)} · ${filled}%`,
      hint: t('cardHints.capacity'),
    },
    {
      k: t('cards.development'),
      v: `${Math.round(point.development * 100)}%`,
      hint: t('cardHints.development'),
    },
    { k: t('cards.prosperity'), v: point.prosperity.toFixed(2), hint: t('cardHints.prosperity') },
    { k: t('cards.funding'), v: point.funding.toFixed(1), hint: t('cardHints.funding') },
  ];

  return (
    <div className="cards">
      {cards.map((c) => (
        <div className="card has-hint" key={c.k} title={c.hint}>
          <div className="k">{c.k}</div>
          <div className="v">{c.v}</div>
        </div>
      ))}
    </div>
  );
}
