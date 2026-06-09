import type { Dispatch } from 'react';
import type { ScheduledKind, WorldConfig } from '../domain/types';
import type { ConfigAction } from '../state/config';
import { useI18n } from '../i18n/I18nContext';

const KINDS: ScheduledKind[] = [
  'road_built',
  'war_begins',
  'war_ends',
  'sovereignty_change',
  'climate_shift',
  'resource_strike',
];

interface Props {
  config: WorldConfig;
  dispatch: Dispatch<ConfigAction>;
}

/** Exogenous changes that fire in a given year (road, war, climate shift…). */
export function ScheduleEditor({ config, dispatch }: Props) {
  const { t } = useI18n();
  const changes = config.scheduledChanges;
  const set = (id: string, key: string, value: unknown) => {
    const idx = changes.findIndex((c) => c.id === id);
    if (idx >= 0) dispatch({ type: 'setField', path: `scheduledChanges.${idx}.${key}`, value });
  };

  return (
    <div className="editor">
      <div className="editor-head">
        <span>{t('fields.year')}</span>
        <span>{t('fields.eventKind')}</span>
        <span>{t('fields.magnitude')}</span>
        <span />
      </div>
      {changes.map((c) => (
        <div className="editor-row kf" key={c.id}>
          <input type="number" min={0} value={c.year} onChange={(e) => set(c.id, 'year', Number(e.target.value))} />
          <select value={c.kind} onChange={(e) => set(c.id, 'kind', e.target.value)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`scheduled.${k}`)}
              </option>
            ))}
          </select>
          <input type="number" min={1} max={5} value={c.magnitude} onChange={(e) => set(c.id, 'magnitude', Number(e.target.value))} />
          <button className="mini" onClick={() => dispatch({ type: 'removeScheduled', id: c.id })}>
            {t('actions.remove')}
          </button>
        </div>
      ))}
      <button
        className="mini add"
        onClick={() =>
          dispatch({
            type: 'addScheduled',
            change: { id: `s${Date.now()}`, year: 20, kind: 'road_built', magnitude: 1 },
          })
        }
      >
        + {t('actions.add')}
      </button>
    </div>
  );
}
