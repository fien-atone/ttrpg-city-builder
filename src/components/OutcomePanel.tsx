import type { Outcome } from '../domain/types';
import { STATUS_COLORS } from '../lib/ui';
import { useI18n } from '../i18n/I18nContext';

export function OutcomePanel({ outcome }: { outcome: Outcome }) {
  const { t } = useI18n();
  const col = STATUS_COLORS[outcome.finalStatus];
  const m = outcome.mission;
  const missionWord = m.met ? t('outcome.met') : m.partial ? t('outcome.partial') : t('outcome.failed');
  const missionCol = m.met ? '#5ec27a' : m.partial ? '#e0a458' : '#e0625a';

  return (
    <div className="outcome">
      <h2>{t('outcome.title')}</h2>
      <div className="outcome-row">
        <span className="phase-pill" style={{ color: col, borderColor: col }}>
          {t(`status.${outcome.finalStatus}`)}
        </span>
        {outcome.collapsed ? (
          <span className="o-text bad">
            {t('outcome.collapsedAt', { n: outcome.collapsed.year })} —{' '}
            {t(`outcome.reason_${outcome.collapsed.reason}`)}
          </span>
        ) : (
          <span className="o-text good">{t('outcome.survived')}</span>
        )}
      </div>
      <div className="outcome-row">
        <span className="o-label">{t('outcome.missionLabel')}:</span>
        <span style={{ color: missionCol, fontWeight: 600 }}>{missionWord}</span>
        <span className="o-text">
          {m.achievedYear !== null
            ? t('outcome.reachedIn', { n: m.achievedYear })
            : t('outcome.peakVsTarget', { pct: Math.round(m.peakVsTarget * 100) })}
        </span>
      </div>
    </div>
  );
}
