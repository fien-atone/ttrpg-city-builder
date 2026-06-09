import type { SimEvent } from '../domain/types';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  events: SimEvent[];
  selectedYear: number;
}

const NO_SEVERITY = new Set(['exhausted', 'collapse']);

export function EventLog({ events, selectedYear }: Props) {
  const { t } = useI18n();
  const shown = events.filter((e) => e.year <= selectedYear).slice(-14);

  return (
    <div>
      <h2>{t('slice.eventLogTitle')}</h2>
      <div className="shocks">
        {shown.length === 0 ? (
          <div className="ev">{t('slice.noEvents')}</div>
        ) : (
          shown.map((e, i) => (
            <div className="ev" key={`${e.year}-${i}`}>
              <b>{t('slice.yearN', { n: e.year })}</b> {t(`events.${e.kind}`)}
              {!NO_SEVERITY.has(e.kind) && ` −${Math.round(e.severity * 100)}%`}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
