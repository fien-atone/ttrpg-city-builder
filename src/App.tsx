import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { configReducer, defaultWorldConfig } from './state/config';
import { useSimulation } from './state/useSimulation';
import {
  saveToStorage,
  loadFromStorage,
  exportJson,
  parseImported,
} from './state/persistence';
import { deriveCensus } from './domain/census';
import { buildDossier } from './lib/dossier';
import { useI18n } from './i18n/I18nContext';
import { ConfigPanel } from './components/ConfigPanel';
import { TopBar } from './components/TopBar';
import { Timeline } from './components/Timeline';
import { SliceCards } from './components/SliceCards';
import { ChartView } from './components/ChartView';
import { EconomyDonut, CompositionDonut } from './components/Donuts';
import { SectorExplorer } from './components/SectorExplorer';
import { BuildingList } from './components/BuildingList';
import { CensusPanel } from './components/CensusPanel';
import { OutcomePanel } from './components/OutcomePanel';
import { EventLog } from './components/EventLog';
import { DossierModal } from './components/DossierModal';

export function App() {
  const [config, dispatch] = useReducer(
    configReducer,
    undefined,
    () => loadFromStorage() ?? defaultWorldConfig,
  );
  const sim = useSimulation(config);
  const [selectedYear, setSelectedYear] = useState(0);
  const [dossierOpen, setDossierOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { t, fmt, scale } = useI18n();

  useEffect(() => {
    setSelectedYear((y) => Math.min(y, sim.years));
  }, [sim.years]);

  const point = sim.points[Math.min(selectedYear, sim.points.length - 1)];
  const census = useMemo(() => deriveCensus(point, config), [point, config]);

  const onImport = () => fileRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      dispatch({ type: 'load', config: parseImported(await file.text()) });
    } catch {
      /* ignore malformed file */
    }
    e.target.value = '';
  };

  const dossierMd = useMemo(
    () => (dossierOpen ? buildDossier(sim, point, census, config, { t, fmt, scale }) : ''),
    [dossierOpen, sim, point, census, config, t, fmt, scale],
  );

  return (
    <div className="wrap">
      <ConfigPanel config={config} dispatch={dispatch} />
      <main className="view">
        <TopBar
          point={point}
          onSave={() => saveToStorage(config)}
          onLoad={() => {
            const loaded = loadFromStorage();
            if (loaded) dispatch({ type: 'load', config: loaded });
          }}
          onExport={() => exportJson(config)}
          onImport={onImport}
          onDossier={() => setDossierOpen(true)}
        />
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />

        <Timeline years={sim.years} value={selectedYear} onChange={setSelectedYear} />
        <SliceCards point={point} />
        <ChartView sim={sim} selectedYear={selectedYear} />

        <div className="donut-row">
          <EconomyDonut point={point} />
          <CompositionDonut point={point} />
        </div>

        <SectorExplorer point={point} census={census} />

        <div className="grid2">
          <CensusPanel census={census} point={point} />
          <BuildingList point={point} />
        </div>
        <div className="grid2">
          <div>
            <OutcomePanel outcome={sim.outcome} />
          </div>
          <EventLog events={sim.events} selectedYear={selectedYear} />
        </div>
      </main>
      {dossierOpen && (
        <DossierModal markdown={dossierMd} year={point.year} onClose={() => setDossierOpen(false)} />
      )}
    </div>
  );
}
