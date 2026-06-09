import type { Dispatch } from 'react';
import type { Neighbor, NeighborType, Relation, WorldConfig } from '../domain/types';
import type { ConfigAction } from '../state/config';
import { suggestNeighbors } from '../domain/config/neighbors';
import { useI18n } from '../i18n/I18nContext';

const TYPES: NeighborType[] = ['hamlet', 'town', 'city', 'capital', 'fort', 'port'];
const RELATIONS: Relation[] = ['allied', 'friendly', 'neutral', 'rival', 'hostile'];

const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** Plausible neighbors derived from our geography, plus a random wildcard or two. */
function generateNeighbors(config: WorldConfig): Neighbor[] {
  const base = suggestNeighbors(config.geography).map((n, i) => ({ ...n, id: `g${Date.now()}-${i}` }));
  const extras = Math.floor(Math.random() * 2) + (base.length === 0 ? 1 : 0);
  for (let i = 0; i < extras; i++) {
    base.push({
      id: `r${Date.now()}-${i}`,
      type: pick(TYPES),
      distance: 2 + Math.floor(Math.random() * 9),
      linkSpeed: 1 + Math.floor(Math.random() * 5),
      relation: pick(RELATIONS),
    });
  }
  return base;
}

interface Props {
  config: WorldConfig;
  dispatch: Dispatch<ConfigAction>;
}

export function NeighborsEditor({ config, dispatch }: Props) {
  const { t } = useI18n();
  const set = (idx: number, key: keyof Neighbor, value: unknown) =>
    dispatch({ type: 'setField', path: `neighbors.${idx}.${key}`, value });

  return (
    <div className="editor">
      <div className="editor-head">
        <span>{t('fields.neighborType')}</span>
        <span>{t('fields.distance')}</span>
        <span>{t('fields.linkSpeed')}</span>
        <span>{t('fields.relation')}</span>
      </div>
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
      <div className="btnrow">
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
        <button
          className="mini add"
          onClick={() => dispatch({ type: 'setNeighbors', neighbors: generateNeighbors(config) })}
        >
          {t('actions.generate')}
        </button>
      </div>
    </div>
  );
}
