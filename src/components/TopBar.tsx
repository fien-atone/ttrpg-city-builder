import type { YearPoint } from '../domain/types';
import { PHASE_COLORS, COLORS } from '../lib/ui';
import { useI18n } from '../i18n/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function TopBar({ point }: { point: YearPoint }) {
  const { t } = useI18n();
  const color = PHASE_COLORS[point.phase];
  return (
    <div className="toprow">
      <div className="yearbox">
        <span className="y">{point.year}</span>
        <span className="yl">{t('cards.year')}</span>
        <span className="phase-pill" style={{ color, borderColor: color }}>
          {t(`phases.${point.phase}`)}
        </span>
      </div>
      <div className="topright">
        <div className="legend">
          <span><i className="swatch" style={{ background: COLORS.accent }} />{t('legend.population')}</span>
          <span><i className="swatch" style={{ background: COLORS.line }} />{t('legend.capacity')}</span>
          <span><i className="swatch" style={{ background: COLORS.bad }} />{t('legend.shock')}</span>
          <span><i className="swatch" style={{ background: COLORS.accent2 }} />{t('legend.selected')}</span>
        </div>
        <LanguageSwitcher />
      </div>
    </div>
  );
}
