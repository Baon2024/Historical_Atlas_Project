'use client';

import { useEffect, useRef } from 'react';
import { ArrowUpRight, MapPin, X } from 'lucide-react';
import Markdown from 'react-markdown';
import { useAppContext } from '@/context/AppContext';
import { formatYear } from '@/lib/atlas';

const hidden = new Set([
  'name',
  'faction',
  'fillColor',
  'fillOpacity',
  'strokeColor',
  'strokeWidth',
  'hatchPattern',
  'summary',
]);

export default function InspectorSidebar() {
  const {
    selectedFeature: feature,
    activeSnapshot,
    clearSelection: onClose,
  } = useAppContext();

  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;

    close.current?.focus({ preventScroll: true });

    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  if (!feature || !activeSnapshot) {
    return null;
  }

  const date = formatYear(activeSnapshot.year);

  const properties = feature.properties;

  return (
    <aside
      className="inspector surface"
      role="region"
      aria-labelledby="inspector-title"
    >
      <div className="inspector-top">
        <span className="eyebrow">Territory notes</span>
        <button
          ref={close}
          className="icon-button"
          aria-label="Close territory inspector"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      <div
        className="inspector-stripe"
        style={{ background: properties.fillColor }}
      />
      <span className="inspector-era">{date}</span>
      <h2 id="inspector-title">{properties.name}</h2>
      <p className="faction">
        <MapPin size={14} aria-hidden="true" />
        {properties.faction}
      </p>
      <div className="summary">
        <Markdown
          skipHtml
          components={{
            a: ({ children, href }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
                <ArrowUpRight size={12} aria-hidden="true" />
              </a>
            ),
          }}
        >
          {properties.summary}
        </Markdown>
      </div>
      <dl className="metadata">
        {Object.entries(properties)
          .filter(([key, value]) => !hidden.has(key) && value !== undefined)
          .map(([key, value]) => (
            <div key={key}>
              <dt>{key.replace(/([A-Z])/g, ' $1').replaceAll('_', ' ')}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
      <p className="inspector-note">
        An illustrative portrait of the past. Boundaries and details are
        simplified for this demo.
      </p>
    </aside>
  );
}
