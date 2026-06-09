import type { Dispatch } from 'react';
import type { WorldConfig } from '../domain/types';
import type { ConfigAction } from '../state/config';
import { useI18n } from '../i18n/I18nContext';
import { RangeField, NumberField } from '../lib/inputs';

interface Props {
  config: WorldConfig;
  dispatch: Dispatch<ConfigAction>;
}

/** Funding progression: one-off tapering investment + systemic subsidy until a year. */
export function SupportEditor({ config, dispatch }: Props) {
  const { t } = useI18n();
  const s = config.support;
  const set = (key: string, value: number) =>
    dispatch({ type: 'setField', path: `support.${key}`, value });

  return (
    <div>
      <div className="subblock">
        <div className="subblock-title">
          {t('support.investment')} <span className="hint">· {t('support.oneOffNote')}</span>
        </div>
        <RangeField label={t('fields.amount')} value={s.investment} min={0} max={5} step={0.5} onChange={(v) => set('investment', v)} />
        <NumberField label={`${t('support.investmentYears')} (${t('support.years')})`} value={s.investmentYears} min={0} max={400} onChange={(v) => set('investmentYears', v)} />
      </div>
      <div className="subblock">
        <div className="subblock-title">
          {t('support.subsidy')} <span className="hint">· {t('support.systemicNote')}</span>
        </div>
        <RangeField label={t('fields.amount')} value={s.subsidy} min={0} max={5} step={0.5} onChange={(v) => set('subsidy', v)} />
        <NumberField label={t('support.subsidyUntil')} value={s.subsidyUntil} min={0} max={400} onChange={(v) => set('subsidyUntil', v)} />
      </div>
    </div>
  );
}
