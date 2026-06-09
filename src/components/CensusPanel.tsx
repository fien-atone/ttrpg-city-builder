import type { Census } from '../domain/census';
import { useI18n } from '../i18n/I18nContext';

const CHANNEL_COLORS: Record<string, string> = {
  crops: '#7cb342',
  livestock: '#a1887f',
  hunting: '#8d6e63',
  fishing: '#5aa7e0',
  imports: '#e0a458',
  magic: '#b07ae0',
};

export function CensusPanel({ census }: { census: Census }) {
  const { t, fmt } = useI18n();
  const f = census.food;

  return (
    <div>
      <h2>{t('census.foodTitle')}</h2>
      <div className="food-summary">
        {t('census.need')}: <b>{fmt(f.need)}</b> · {t('census.supplied')}: <b>{fmt(f.supplied)}</b>
        {f.deficit > 0.5 && (
          <span className="deficit">
            {' '}
            · {t('census.deficit')}: {fmt(f.deficit)}
          </span>
        )}
      </div>
      <div className="food-bar">
        {f.channels.map((ch) => (
          <div
            key={ch.id}
            className="food-seg"
            style={{ width: `${Math.max(2, ch.share * 100)}%`, background: CHANNEL_COLORS[ch.id] }}
            title={`${t(`foodChannel.${ch.id}`)}: ${fmt(ch.rations)}`}
          />
        ))}
      </div>
      <ul className="food-list">
        {f.channels.map((ch) => (
          <li key={ch.id}>
            <i className="swatch" style={{ background: CHANNEL_COLORS[ch.id] }} />
            <span className="dl-label">{t(`foodChannel.${ch.id}`)}</span>
            <span className="dl-val">
              {fmt(ch.rations)} · {Math.round(ch.share * 100)}%
            </span>
          </li>
        ))}
      </ul>

      {(census.land.cropsHa >= 1 || census.land.pastureHa >= 1) && (
        <>
          <h2>{t('census.landTitle')}</h2>
          <ul className="plain-list">
            {census.land.cropsHa >= 1 && (
              <li>
                {t('census.cropsHa')}: ~{fmt(census.land.cropsHa)} {t('census.ha')} ·{' '}
                {t('census.farmsteads')}: {fmt(census.land.farmsteads)}
              </li>
            )}
            {census.land.pastureHa >= 1 && (
              <li>
                {t('census.pastureHa')}: ~{fmt(census.land.pastureHa)} {t('census.ha')}
              </li>
            )}
          </ul>
        </>
      )}

      <h2>{t('census.professionsTitle')}</h2>
      <div className="prof-grid">
        {census.professions.map((p) => (
          <div className="prof" key={p.id}>
            <span className="dl-label">{t(`profession.${p.id}`)}</span>
            <b>{fmt(p.count)}</b>
          </div>
        ))}
      </div>
      <div className="hint" style={{ marginTop: 6 }}>
        {t('census.workforce')}: {fmt(census.workforce)}
      </div>
    </div>
  );
}
