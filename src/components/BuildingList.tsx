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
          const cls = b.replaced
            ? 'b-replaced'
            : b.unlocked
              ? b.tag === 'magic'
                ? 'b-mag'
                : b.tag === 'tech'
                  ? 'b-tech'
                  : 'b-on'
              : 'b-off';
          const right = b.replaced
            ? t('slice.replaced')
            : b.unlocked
              ? b.count > 1
                ? `${t('slice.has')} ×${b.count}`
                : t('slice.has')
              : t('slice.from', { n: fmt(b.threshold) });
          return (
            <li className={cls} key={b.id}>
              <span>
                {b.unlocked && !b.replaced ? '●' : '○'} {t(`buildings.${b.id}`)}
                {TAG_GLYPH[b.tag]}
              </span>
              <span className="at">{right}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
