import type { Dispatch } from 'react';
import type { Neighbor, NeighborType, Relation, WorldConfig } from '../domain/types';
import type { ConfigAction } from '../state/config';
import { useI18n } from '../i18n/I18nContext';
import { setByPath } from '../lib/path';

const TYPES: NeighborType[] = ['hamlet', 'town', 'city', 'capital', 'fort', 'port'];
const RELATIONS: Relation[] = ['allied', 'friendly', 'neutral', 'rival', 'hostile'];

interface Props {
  config: WorldConfig;
  dispatch: Dispatch<ConfigAction>;
}

export function NeighborsEditor({ config, dispatch }: Props) {
  const { t } = useI18n();
  const set = (idx: number, key: keyof Neighbor, value: unknown) =>
    dispatch({ type: 'setField', path: `neighbors.${idx}.${key}`, value });
  void setByPath;

  return (
    <div className="editor">
      {config.neighbors.map((n, i) => (
        <div className="editor-row" key={n.id}>
          <select value={n.type} onChange={(e) => set(i, 'type', e.target.value)}>
            {TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {t(`neighborType.${tp}`)}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={n.distance}
            title={t('fields.distance')}
            onChange={(e) => set(i, 'distance', Number(e.target.value))}
          />
          <input
            type="number"
            min={1}
            max={5}
            value={n.linkSpeed}
            title={t('fields.linkSpeed')}
            onChange={(e) => set(i, 'linkSpeed', Number(e.target.value))}
          />
          <select value={n.relation} onChange={(e) => set(i, 'relation', e.target.value)}>
            {RELATIONS.map((r) => (
              <option key={r} value={r}>
                {t(`relation.${r}`)}
              </option>
            ))}
          </select>
          <button className="mini" onClick={() => dispatch({ type: 'removeNeighbor', id: n.id })}>
            {t('actions.remove')}
          </button>
        </div>
      ))}
      <button
        className="mini add"
        onClick={() =>
          dispatch({
            type: 'addNeighbor',
            neighbor: { id: `n${Date.now()}`, type: 'town', distance: 5, linkSpeed: 3, relation: 'neutral' },
          })
        }
      >
        + {t('actions.add')}
      </button>
    </div>
  );
}
