import { useEffect, useReducer, useRef, useState } from 'react';
import { configReducer, defaultWorldConfig } from './state/config';
import { useSimulation } from './state/useSimulation';
import {
  saveToStorage,
  loadFromStorage,
  exportJson,
  parseImported,
} from './state/persistence';
import { ConfigPanel } from './components/ConfigPanel';
import { TopBar } from './components/TopBar';
import { Timeline } from './components/Timeline';
import { SliceCards } from './components/SliceCards';
import { ChartView } from './components/ChartView';
import { EconomyDonut, CompositionDonut } from './components/Donuts';
import { BuildingList } from './components/BuildingList';
import { OutcomePanel } from './components/OutcomePanel';
import { EventLog } from './components/EventLog';

export function App() {
  const [config, dispatch] = useReducer(
    configReducer,
    undefined,
    () => loadFromStorage() ?? defaultWorldConfig,
  );
  const sim = useSimulation(config);
  const [selectedYear, setSelectedYear] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedYear((y) => Math.min(y, sim.years));
  }, [sim.years]);

  const point = sim.points[Math.min(selectedYear, sim.points.length - 1)];

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
        />
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />

        <Timeline years={sim.years} value={selectedYear} onChange={setSelectedYear} />
        <SliceCards point={point} peak={sim.peak} />
        <ChartView sim={sim} selectedYear={selectedYear} />

        <div className="donut-row">
          <EconomyDonut point={point} />
          <CompositionDonut point={point} />
        </div>

        <div className="grid2">
          <BuildingList point={point} />
          <div>
            <OutcomePanel outcome={sim.outcome} />
            <EventLog events={sim.events} selectedYear={selectedYear} />
          </div>
        </div>
      </main>
    </div>
  );
}
