import { useEffect, useReducer, useState } from 'react';
import { defaultParams, paramsReducer } from './state/params';
import { useSimulation } from './state/useSimulation';
import { Controls } from './components/Controls';
import { TopBar } from './components/TopBar';
import { Timeline } from './components/Timeline';
import { SliceCards } from './components/SliceCards';
import { ChartView } from './components/ChartView';
import { BuildingList } from './components/BuildingList';
import { Limiters } from './components/Limiters';
import { EventLog } from './components/EventLog';

export function App() {
  const [params, dispatch] = useReducer(paramsReducer, defaultParams);
  const sim = useSimulation(params);
  const [selectedYear, setSelectedYear] = useState(0);

  // keep the scrubber within range when the horizon shrinks
  useEffect(() => {
    setSelectedYear((y) => Math.min(y, sim.years));
  }, [sim.years]);

  const point = sim.points[Math.min(selectedYear, sim.points.length - 1)];

  return (
    <div className="wrap">
      <Controls params={params} dispatch={dispatch} />
      <main className="view">
        <TopBar point={point} />
        <Timeline years={sim.years} value={selectedYear} onChange={setSelectedYear} />
        <SliceCards point={point} peak={sim.peak} />
        <ChartView sim={sim} selectedYear={selectedYear} />
        <div className="grid2">
          <BuildingList point={point} />
          <div>
            <Limiters params={params} point={point} />
            <EventLog events={sim.events} selectedYear={selectedYear} />
          </div>
        </div>
      </main>
    </div>
  );
}
