'use client';

import { ChevronDown } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function ScenarioSelector() {
  const { manifest, activeScenario, changeScenario } = useAppContext();

  return (
    <div className="scenario-field">
      <label className="eyebrow" htmlFor="scenario">
        Choose a chapter
      </label>
      <div className="select-wrap">
        <select
          id="scenario"
          value={activeScenario.id}
          onChange={(event) => changeScenario(event.target.value)}
        >
          {manifest.scenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.title}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </div>
    </div>
  );
}
