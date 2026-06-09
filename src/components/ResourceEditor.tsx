import type { Dispatch } from 'react';
import type { Resource, ResourceType, WorldConfig } from '../domain/types';
import type { ConfigAction } from '../state/config';
import { useI18n } from '../i18n/I18nContext';

const TYPES: ResourceType[] = ['iron', 'copper', 'gold', 'silver', 'gems', 'coal', 'stone', 'salt', 'timber'];

const d5 = () => 1 + Math.floor(Math.random() * 5);

function randomResources(): Resource[] {
  const n = 1 + Math.floor(Math.random() * 3);
  const pool = [...TYPES].sort(() => Math.random() - 0.5).slice(0, n);
  return pool.map((type) => ({ type, volume: d5(), accessibility: d5(), depth: d5() }));
}

interface Props {
  config: WorldConfig;
  dispatch: Dispatch<ConfigAction>;
}

/** Edit the geology resource list: type + volume / accessibility / depth (1..5). */
export function ResourceEditor({ config, dispatch }: Props) {
  const { t } = useI18n();
  const rs = config.geology.resources;
  const set = (idx: number, key: string, value: unknown) =>
    dispatch({ type: 'setField', path: `geology.resources.${idx}.${key}`, value });
  const setList = (next: Resource[]) =>
    dispatch({ type: 'setField', path: 'geology.resources', value: next });

  return (
    <div className="editor">
      <div className="editor-label">
        {t('fields.resources')}
        <span className="hint"> · {t('hints.resources')}</span>
      </div>
      <div className="editor-head res">
        <span />
        <span>{t('resfields.volume')}</span>
        <span>{t('resfields.access')}</span>
        <span>{t('resfields.depth')}</span>
        <span />
      </div>
      {rs.map((r, i) => (
        <div className="editor-row res" key={i}>
          <select value={r.type} onChange={(e) => set(i, 'type', e.target.value)}>
            {TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {t(`resourceType.${tp}`)}
              </option>
            ))}
          </select>
          <input type="number" min={1} max={5} value={r.volume} onChange={(e) => set(i, 'volume', Number(e.target.value))} />
          <input type="number" min={1} max={5} value={r.accessibility} onChange={(e) => set(i, 'accessibility', Number(e.target.value))} />
          <input type="number" min={1} max={5} value={r.depth} onChange={(e) => set(i, 'depth', Number(e.target.value))} />
          <button className="mini" onClick={() => setList(rs.filter((_, j) => j !== i))}>
            {t('actions.remove')}
          </button>
        </div>
      ))}
      <div className="btnrow">
        <button
          className="mini add"
          onClick={() => setList([...rs, { type: 'iron', volume: 3, accessibility: 3, depth: 2 }])}
        >
          + {t('actions.add')}
        </button>
        <button className="mini add" onClick={() => setList(randomResources())}>
          {t('actions.randomize')}
        </button>
      </div>
    </div>
  );
}
