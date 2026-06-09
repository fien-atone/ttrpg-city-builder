import type { YearState } from '../domain/types';
import { PHASE_COLORS, STATUS_COLORS } from '../lib/ui';
import { useI18n } from '../i18n/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface Props {
  point: YearState;
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onImport: () => void;
  onDossier: () => void;
}

export function TopBar({ point, onSave, onLoad, onExport, onImport, onDossier }: Props) {
  const { t } = useI18n();
  const phaseCol = PHASE_COLORS[point.phase];
  const statusCol = STATUS_COLORS[point.status];

  return (
    <div className="toprow">
      <div className="yearbox">
        <span className="y">{point.year}</span>
        <span className="yl">{t('cards.year')}</span>
        <span className="phase-pill" style={{ color: statusCol, borderColor: statusCol }}>
          {t(`status.${point.status}`)}
        </span>
        <span className="phase-pill" style={{ color: phaseCol, borderColor: phaseCol }}>
          {t(`designation.${point.designation}`)}
        </span>
      </div>
      <div className="topright">
        <div className="iobar">
          <button onClick={onSave}>{t('actions.save')}</button>
          <button onClick={onLoad}>{t('actions.load')}</button>
          <button onClick={onExport}>{t('actions.export')}</button>
          <button onClick={onImport}>{t('actions.import')}</button>
          <button onClick={onDossier}>{t('actions.dossier')}</button>
        </div>
        <LanguageSwitcher />
      </div>
    </div>
  );
}
