import type { SimParams, YearPoint } from '../domain/types';
import { clamp, COLORS } from '../lib/ui';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  params: SimParams;
  point: YearPoint;
}

export function Limiters({ params, point }: Props) {
  const { t } = useI18n();
  const filled = point.capacity > 0 ? point.population / point.capacity : 0;

  const rows: Array<{ label: string; value: number; proximity?: boolean }> = [
    { label: t('limiters.food'), value: (params.fertility * params.water) / 25 },
    { label: t('limiters.trade'), value: params.trade / 5 },
    { label: t('limiters.safety'), value: params.safety / 5 },
    { label: t('limiters.sanitation'), value: params.sanitation / 5 },
    { label: t('limiters.magic'), value: params.magic / 5 },
    { label: t('slice.proximity'), value: clamp(filled, 0, 1), proximity: true },
  ];

  return (
    <div>
      <h2>{t('slice.limitersTitle')}</h2>
      <div className="bars">
        {rows.map((r) => {
          const pct = Math.round(r.value * 100);
          const color = r.proximity
            ? r.value > 0.9
              ? COLORS.bad
              : r.value > 0.6
                ? COLORS.accent
                : COLORS.good
            : r.value < 0.34
              ? COLORS.bad
              : r.value < 0.67
                ? COLORS.accent
                : COLORS.good;
          return (
            <div className="bar" key={r.label}>
              <div className="bl">
                <span>{r.label}</span>
                <span>{pct}%</span>
              </div>
              <div className="track">
                <div className="fill" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
