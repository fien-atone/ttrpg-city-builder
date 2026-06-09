import { useState } from 'react';
import type { Sector, YearState } from '../domain/types';
import type { Census } from '../domain/census';
import { SECTORS } from '../domain/levers';
import { PROFESSION_SECTOR, BUILDING_SECTOR } from '../domain/sectorInfo';
import { SECTOR_COLORS } from '../lib/ui';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  point: YearState;
  census: Census;
}

/** Click a sector → see who and what makes it up at the selected year. */
export function SectorExplorer({ point, census }: Props) {
  const { t, fmt, scale } = useI18n();
  const [selected, setSelected] = useState<Sector>('farming');

  const share = point.sectors[selected];
  const workers = census.workforce * share;
  const cap = point.capabilities[selected];
  const capLabels = scale('scales.capability');
  const capWord = capLabels[Math.min(capLabels.length - 1, Math.floor(cap * capLabels.length))];

  const professions = census.professions.filter((p) => PROFESSION_SECTOR[p.id] === selected);
  const buildings = point.buildings.filter(
    (b) => b.unlocked && !b.replaced && BUILDING_SECTOR[b.id] === selected,
  );
  const resources = selected === 'mining' ? point.resources : [];

  return (
    <div className="sector-explorer">
      <h2>{t('sectorExplorer.title')}</h2>
      <div className="chips">
        {SECTORS.map((s) => (
          <button
            key={s}
            className={`chip ${s === selected ? 'on' : ''}`}
            style={s === selected ? { borderColor: SECTOR_COLORS[s] } : undefined}
            onClick={() => setSelected(s)}
          >
            <i className="swatch" style={{ background: SECTOR_COLORS[s] }} />
            {t(`sectors.${s}`)}
            <span className="chip-pct">{Math.round(point.sectors[s] * 100)}%</span>
          </button>
        ))}
      </div>

      <div className="sector-detail">
        <div className="sd-stats">
          <span>
            {t('sectorExplorer.share')}: <b>{Math.round(share * 100)}%</b>
          </span>
          <span>
            {t('sectorExplorer.workers')}: <b>{fmt(workers)}</b>
          </span>
          <span>
            {t('sectorExplorer.knowhow')}: <b>{capWord}</b> ({Math.round(cap * 100)}%)
          </span>
        </div>

        <div className="sd-cols">
          <div>
            <div className="sd-title">{t('census.professionsTitle')}</div>
            {professions.length === 0 ? (
              <div className="hint">{t('sectorExplorer.empty')}</div>
            ) : (
              <ul className="plain-list">
                {professions.map((p) => (
                  <li key={p.id}>
                    {t(`profession.${p.id}`)}: <b>{fmt(p.count)}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <div className="sd-title">{t('dossier.buildingsTitle')}</div>
            {buildings.length === 0 ? (
              <div className="hint">{t('sectorExplorer.empty')}</div>
            ) : (
              <ul className="plain-list">
                {buildings.map((b) => (
                  <li key={b.id}>
                    {t(`buildings.${b.id}`)}
                    {b.count > 1 ? ` ×${b.count}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {resources.length > 0 && (
            <div>
              <div className="sd-title">{t('census.depositsTitle')}</div>
              <ul className="plain-list">
                {resources.map((r, i) => (
                  <li key={i}>
                    {t(`resourceType.${r.type}`)}: {t(`resourceState.${r.phase}`)}
                    {r.phase === 'worked' && ` · ${Math.round(r.reserveFrac * 100)}%`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
