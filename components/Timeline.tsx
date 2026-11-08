'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { formatYear } from '@/lib/atlas';
import { useAppContext } from '@/context/AppContext';

export default function Timeline() {
  const {
    activeScenario: scenario,
    snapshotIndex: index,
    changeSnapshot: onChange,
  } = useAppContext();

  if (!scenario) {
    return null;
  }

  return (
    <section className="timeline surface" aria-label="Historical timeline">
      <div className="timeline-date">
        <span className="eyebrow">A moment in time</span>
        <strong>{formatYear(scenario.snapshots[index].year)}</strong>
      </div>
      <button
        className="icon-button"
        aria-label="Previous snapshot"
        disabled={index === 0}
        onClick={() => onChange(index - 1)}
      >
        <ArrowLeft size={18} />
      </button>
      <div className="timeline-track">
        <label className="sr-only" htmlFor="timeline">
          Historical snapshot
        </label>
        <input
          id="timeline"
          type="range"
          min={0}
          max={scenario.snapshots.length - 1}
          step={1}
          value={index}
          aria-valuetext={`${formatYear(scenario.snapshots[index].year)}: ${scenario.snapshots[index].label}`}
          onChange={(event) => onChange(Number(event.target.value))}
          style={
            {
              '--progress': `${(index / Math.max(1, scenario.snapshots.length - 1)) * 100}%`,
            } as React.CSSProperties
          }
        />
        <div className="timeline-ticks">
          {scenario.snapshots.map((snapshot, i) => (
            <button
              key={snapshot.id}
              className={i === index ? 'active' : ''}
              aria-label={`Show ${formatYear(snapshot.year)}`}
              aria-pressed={i === index}
              onClick={() => onChange(i)}
            >
              <span />
              {formatYear(snapshot.year)}
            </button>
          ))}
        </div>
      </div>
      <button
        className="icon-button"
        aria-label="Next snapshot"
        disabled={index === scenario.snapshots.length - 1}
        onClick={() => onChange(index + 1)}
      >
        <ArrowRight size={18} />
      </button>
    </section>
  );
}
