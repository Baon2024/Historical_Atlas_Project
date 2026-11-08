'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Compass,
  Globe2,
  Info,
  LoaderCircle,
} from 'lucide-react';
import { formatYear } from '@/lib/atlas';
import { useAppContext } from '@/context/AppContext';
import ScenarioSelector from './ScenarioSelector';
import Timeline from './Timeline';
import InspectorSidebar from './InspectorSidebar';

const GlobeMap = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <LoaderCircle className="spin" size={22} />
      <span>Preparing your globe…</span>
    </div>
  ),
});

export default function Atlas() {
  const {
    manifest,
    data,
    activeScenario: scenario,
    activeSnapshot: snapshot,
    selectedFeature: selected,
    selectFeature: select,
    clearSelection: close,
  } = useAppContext();

  const [expanded, setExpanded] = useState(false);

  const [about, setAbout] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();

        setAbout(false);
      }
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <main className={`atlas ${selected ? 'has-inspector' : ''}`}>
      <header className="masthead">
        <a className="brand" href="/" aria-label="Epoch atlas home">
          <Globe2 strokeWidth={1.2} size={31} />
          <span>
            epoch<span className="brand-dot">.</span>
          </span>
        </a>
        <span className="brand-subtitle">A historical atlas</span>
        <div className="header-right">
          <span className="header-tagline">
            A world that never stood still.
          </span>
          <button
            className="about-button"
            onClick={() => setAbout((value) => !value)}
            aria-expanded={about}
            aria-controls="about-atlas"
          >
            <Info size={14} />
            <span>Illustrative data</span>
          </button>
        </div>
      </header>
      <div className="map-stage">
        <GlobeMap />
      </div>
      {about && (
        <section id="about-atlas" className="about-panel surface">
          <h2>A window into a changing world</h2>
          <p>
            This MVP uses dummy historical descriptions and schematic
            boundaries. It is an exploration demo, not a historical source.
          </p>
          <p>
            The basemap provides present-day geographic context. Polity colours
            show only the selected snapshot.
          </p>
          <button onClick={() => setAbout(false)}>
            Back to exploring <ArrowUpRight size={14} />
          </button>
        </section>
      )}
      <section
        className={`explorer surface ${expanded ? 'expanded' : ''}`}
        aria-label="Atlas chapters"
      >
        <div className="chapter-top">
          <span className="eyebrow">
            <BookOpen size={13} /> Chapter{' '}
            {String(
              (manifest.scenarios.findIndex((s) => s.id === scenario?.id) ??
                0) + 1,
            ).padStart(2, '0')}
          </span>
          <button
            className="mobile-expand icon-button"
            aria-label={
              expanded ? 'Collapse chapter details' : 'Expand chapter details'
            }
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            <ChevronDown size={18} />
          </button>
          <Compass
            className="chapter-compass"
            strokeWidth={1.1}
            size={24}
            aria-hidden="true"
          />
        </div>
        <h1>{scenario?.title ?? 'Explore the past'}</h1>
        <p className="chapter-subtitle">
          {scenario?.subtitle ?? 'Every boundary has a story.'}
        </p>
        <ScenarioSelector />
        <div className="chapter-details">
          {snapshot && (
            <>
              <div className="snapshot-heading">
                <span className="eyebrow">The world in</span>
                <strong>{formatYear(snapshot.year)}</strong>
                <h2>{snapshot.label}</h2>
              </div>
              <p className="snapshot-description">{snapshot.description}</p>
            </>
          )}
          <div className="legend-header">
            <span className="eyebrow">Polities in this snapshot</span>
            <span>{data.features.length.toString().padStart(2, '0')}</span>
          </div>
          <ul className="polity-list">
            {data.features.map((feature) => (
              <li key={feature.id}>
                <button
                  onClick={() => {
                    select(feature);

                    setExpanded(false);
                  }}
                  aria-pressed={selected?.id === feature.id}
                >
                  <span
                    className="polity-dot"
                    style={{ background: feature.properties.fillColor }}
                  />
                  <span>{feature.properties.name}</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <p className="explorer-hint">
            Select a territory.
            <br />
            Discover a different world.
          </p>
        </div>
        <div className="chapter-footer">
          <span className="status-dot" />
          Interactive globe<span>Drag to explore</span>
        </div>
      </section>
      <div className="map-caption" aria-hidden="true">
        <span>THE WORLD, REIMAGINED THROUGH TIME</span>
        <span>Scroll to zoom · Drag to rotate</span>
      </div>
      {scenario && snapshot && <Timeline />}
      {selected && snapshot && <InspectorSidebar />}
      <footer className="atlas-footer">
        <span>Schematic boundaries · Not a historical source</span>
        <span className="footer-edition">EPOCH / EXPLORER EDITION</span>
      </footer>
      <p className="sr-only" role="status" aria-live="polite">
        {snapshot && `${scenario?.title}, ${formatYear(snapshot.year)}. `}
        {`${data.features.length} territories available.`}
      </p>
    </main>
  );
}
