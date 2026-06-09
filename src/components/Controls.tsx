import type { Dispatch } from 'react';
import type { SimParams } from '../domain/types';
import { ARCHETYPE_IDS } from '../domain/archetypes';
import type { ParamAction } from '../state/params';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  params: SimParams;
  dispatch: Dispatch<ParamAction>;
}

export function Controls({ params, dispatch }: Props) {
  const { t } = useI18n();
  const set = <K extends keyof SimParams>(key: K, value: SimParams[K]) =>
    dispatch({ type: 'set', key, value });

  const range = (
    key: keyof SimParams,
    labelKey: string,
    opts: { min: number; max: number; step?: number; suffix?: string; hintKey?: string; display?: string },
  ) => (
    <div className="field">
      <label>
        <span>{t(labelKey)}</span>
        <b>{opts.display ?? `${params[key]}${opts.suffix ?? ''}`}</b>
      </label>
      <input
        type="range"
        min={opts.min}
        max={opts.max}
        step={opts.step ?? 1}
        value={params[key] as number}
        onChange={(e) => set(key, Number(e.target.value) as never)}
      />
      {opts.hintKey && <div className="hint">{t(opts.hintKey)}</div>}
    </div>
  );

  const balanceWord =
    params.balance < 35 ? t('balanceLabel.tech') : params.balance > 65 ? t('balanceLabel.magic') : t('balanceLabel.even');

  return (
    <aside className="controls">
      <h1>{t('app.title')}</h1>
      <div className="sub">{t('app.subtitle')}</div>

      <h2>{t('sections.start')}</h2>
      {range('pop0', 'controls.startPop', { min: 5, max: 500, step: 5 })}
      {range('years', 'controls.years', { min: 20, max: 400, step: 10 })}
      <div className="field">
        <label><span>{t('controls.archetype')}</span></label>
        <select
          value={params.archetype}
          onChange={(e) => set('archetype', e.target.value as SimParams['archetype'])}
        >
          {ARCHETYPE_IDS.map((id) => (
            <option key={id} value={id}>
              {t(`archetype.${id}`)}
            </option>
          ))}
        </select>
        <div className="hint">{t(`archetypeHint.${params.archetype}`)}</div>
      </div>

      <h2>{t('sections.capacity')}</h2>
      {range('fertility', 'controls.fertility', { min: 1, max: 5, suffix: '/5' })}
      {range('water', 'controls.water', { min: 1, max: 5, suffix: '/5' })}
      {range('trade', 'controls.trade', { min: 1, max: 5, suffix: '/5', hintKey: 'hints.trade' })}
      {range('safety', 'controls.safety', { min: 1, max: 5, suffix: '/5' })}
      {range('sanitation', 'controls.sanitation', { min: 1, max: 5, suffix: '/5', hintKey: 'hints.sanitation' })}

      <h2>{t('sections.pace')}</h2>
      {range('attractiveness', 'controls.attractiveness', { min: 0, max: 5, suffix: '/5' })}
      {range('capital', 'controls.capital', { min: 0, max: 5, suffix: '/5', hintKey: 'hints.capital' })}

      <h2>{t('sections.magicTech')}</h2>
      {range('magic', 'controls.magic', { min: 0, max: 5, suffix: '/5', hintKey: 'hints.magic' })}
      {range('balance', 'controls.balance', { min: 0, max: 100, display: balanceWord, hintKey: 'hints.balance' })}

      <h2>{t('sections.events')}</h2>
      <label className="chk">
        <input
          type="checkbox"
          checked={params.shocksEnabled}
          onChange={(e) => set('shocksEnabled', e.target.checked)}
        />
        {t('controls.shocks')}
      </label>
      <label className="chk">
        <input
          type="checkbox"
          checked={params.resourceCap}
          onChange={(e) => set('resourceCap', e.target.checked)}
        />
        {t('controls.resource')}
      </label>
      <div className="seedrow">
        <span className="hint">{t('controls.seed')}:</span>
        <input
          type="number"
          value={params.seed}
          onChange={(e) => set('seed', Number(e.target.value))}
          style={{ width: 80 }}
        />
        <button onClick={() => set('seed', Math.floor(Math.random() * 9999))}>
          {t('controls.reroll')}
        </button>
      </div>
      <div className="note">{t('hints.model')}</div>
    </aside>
  );
}
