import type { Dispatch } from 'react';
import type { SupportKind, WorldConfig } from '../domain/types';
import type { ConfigAction } from '../state/config';
import { useI18n } from '../i18n/I18nContext';

const KINDS: SupportKind[] = ['investment', 'subsidy', 'aid'];

interface Props {
  config: WorldConfig;
  dispatch: Dispatch<ConfigAction>;
}

/** Funding trajectory: keyframes of {year, amount, kind} interpolated over time. */
export function SupportEditor({ config, dispatch }: Props) {
  const { t } = useI18n();
  const frames = config.support.keyframes;

  return (
    <div className="editor">
      <div className="editor-head">
        <span>{t('fields.year')}</span>
        <span>{t('fields.amount')}</span>
        <span>{t('fields.kind')}</span>
        <span />
      </div>
      {frames.map((f, i) => (
        <div className="editor-row kf" key={i}>
          <input
            type="number"
            min={0}
            value={f.year}
            onChange={(e) => dispatch({ type: 'setKeyframe', index: i, frame: { ...f, year: Number(e.target.value) } })}
          />
          <input
            type="number"
            min={0}
            max={5}
            step={0.5}
            value={f.amount}
            onChange={(e) => dispatch({ type: 'setKeyframe', index: i, frame: { ...f, amount: Number(e.target.value) } })}
          />
          <select
            value={f.kind}
            onChange={(e) => dispatch({ type: 'setKeyframe', index: i, frame: { ...f, kind: e.target.value as SupportKind } })}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`supportKind.${k}`)}
              </option>
            ))}
          </select>
          <button className="mini" onClick={() => dispatch({ type: 'removeKeyframe', index: i })}>
            {t('actions.remove')}
          </button>
        </div>
      ))}
      <button
        className="mini add"
        onClick={() => {
          const lastYear = frames.length ? frames[frames.length - 1].year + 10 : 0;
          dispatch({ type: 'addKeyframe', frame: { year: lastYear, amount: 0, kind: 'subsidy' } });
        }}
      >
        + {t('actions.add')}
      </button>
    </div>
  );
}
