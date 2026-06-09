import type { YearState } from '../domain/types';
import { TAG_GLYPH } from '../lib/ui';
import { useI18n } from '../i18n/I18nContext';

export function BuildingList({ point }: { point: YearState }) {
  const { t, fmt } = useI18n();
  return (
    <div>
      <h2>{t('slice.buildingsTitle')}</h2>
      <ul className="blist">
        {point.buildings.map((b) => {
          const cls = b.unlocked
            ? b.tag === 'magic'
              ? 'b-mag'
              : b.tag === 'tech'
                ? 'b-tech'
                : 'b-on'
            : 'b-off';
          return (
            <li className={cls} key={b.id}>
              <span>
                {b.unlocked ? '●' : '○'} {t(`buildings.${b.id}`)}
                {TAG_GLYPH[b.tag]}
              </span>
              <span className="at">
                {b.unlocked ? t('slice.has') : t('slice.from', { n: fmt(b.threshold) })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
