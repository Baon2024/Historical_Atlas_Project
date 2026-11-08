'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { useControl, type MapRef } from 'react-map-gl/maplibre';
import * as maplibre from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import { MapLibreOverlay, type MapLibreOverlayProps } from '@deck.gl/maplibre';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Globe2, Minus, Plus, RotateCcw } from 'lucide-react';
import { colorToRgba, featureBounds } from '@/lib/atlas';
import type { Polity, PolityProperties } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';

maplibre.setWorkerUrl('/maplibre-gl-worker.mjs');

const cartoApiKey = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim() ?? '';

const initialCamera = {
  longitude: 0,
  latitude: 20,
  zoom: 2.5,
  bearing: 0,
  pitch: 0,
};

const mapStyle: StyleSpecification = {
  version: 8,
  projection: { type: 'globe' },
  sky: {
    'sky-color': '#eeeee5',
    'horizon-color': '#e6ebe3',
    'fog-color': '#eeeee5',
    'sky-horizon-blend': 0.9,
    'horizon-fog-blend': 0.4,
    'fog-ground-blend': 0.8,
  },
  sources: {
    land: {
      type: 'raster',
      tiles: ['/data/geography/land.png'],
      tileSize: 2048,
      minzoom: 0,
      maxzoom: 0,
      attribution:
        'Land: <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener">Natural Earth</a>',
    },
    carto: {
      type: 'raster',
      tiles: [
        `https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png?key=${encodeURIComponent(cartoApiKey)}`,
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors · © <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#dce3de' },
    },
    {
      id: 'land-outline',
      type: 'raster',
      source: 'land',
      paint: { 'raster-fade-duration': 0 },
    },
  ],
};

function DeckOverlay(props: MapLibreOverlayProps) {
  const overlay = useControl<MapLibreOverlay>(
    () => new MapLibreOverlay({ ...props, interleaved: false }),
  );

  useEffect(() => {
    overlay.setProps(props);
  }, [overlay, props]);

  return null;
}

export default function GlobeMap() {
  const {
    data,
    selectedFeature: selected,
    hoveredFeatureId: hoveredId,
    selectFeature: onSelect,
    setHoveredFeatureId: onHover,
  } = useAppContext();

  const map = useRef<MapRef>(null);

  const [ready, setReady] = useState(false);

  const [failed, setFailed] = useState<string | null>(null);

  const [revision, setRevision] = useState(0);

  const [tooltip, setTooltip] = useState<{
    name: string;
    x: number;
    y: number;
  } | null>(null);

  const [supported] = useState(() => {
    try {
      const canvas = document.createElement('canvas');

      const context = canvas.getContext('webgl2');

      context?.getExtension('WEBGL_lose_context')?.loseContext();

      return Boolean(context);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setTooltip(null);
  }, [data]);

  useEffect(() => {
    if (!selected || !ready || !map.current) return;

    const width = window.innerWidth;

    const height = window.innerHeight;

    const small = width < 760;

    const left = width >= 1200 ? 350 : width >= 760 ? 300 : 35;

    map.current.fitBounds(featureBounds(selected), {
      padding: {
        top: small ? 20 : 70,
        bottom: small ? Math.min(height * 0.43 + 155, height - 150) : 180,
        left,
        right: small ? 35 : width >= 1200 ? 415 : 340,
      },
      maxZoom: 4.5,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : 850,
    });
  }, [selected, ready]);

  const layers = useMemo(
    () => [
      new GeoJsonLayer<PolityProperties>({
        id: 'historical-polities',
        data,
        pickable: true,
        filled: true,
        stroked: true,
        lineWidthUnits: 'pixels',
        lineWidthMinPixels: 1,
        getFillColor: (feature) =>
          colorToRgba(
            feature.properties.fillColor,
            feature.properties.fillOpacity,
          ),
        getLineColor: (feature) =>
          feature.id === hoveredId
            ? [40, 61, 49, 255]
            : feature.id === selected?.id
              ? [50, 70, 55, 255]
              : colorToRgba(feature.properties.strokeColor),
        getLineWidth: (feature) =>
          feature.id === hoveredId || feature.id === selected?.id
            ? 3
            : feature.properties.strokeWidth,
        updateTriggers: {
          getLineColor: [hoveredId, selected?.id],
          getLineWidth: [hoveredId, selected?.id],
        },
        onHover: (info) => {
          const feature = info.object as Polity | undefined;

          onHover(feature?.id ?? null);

          setTooltip(
            feature
              ? { name: feature.properties.name, x: info.x, y: info.y }
              : null,
          );
        },
      }),
    ],
    [data, hoveredId, selected?.id, onHover],
  );

  if (!supported)
    return (
      <div className="map-unavailable" role="alert">
        <Globe2 size={34} strokeWidth={1} />
        <h2>Your globe needs WebGL 2</h2>
        <p>
          Enable hardware acceleration or try a browser that supports WebGL 2.
          You can still explore territories using the chapter list.
        </p>
      </div>
    );

  return (
    <div className="globe-container" data-map-ready={ready}>
      <Map
        key={revision}
        ref={map}
        mapLib={maplibre}
        initialViewState={initialCamera}
        mapStyle={mapStyle}
        projection="globe"
        minZoom={0.7}
        maxZoom={7}
        maxPitch={0}
        dragRotate={false}
        touchPitch={false}
        attributionControl={{ compact: true }}
        canvasContextAttributes={{ antialias: true }}
        onLoad={(event) => {
          setReady(true);

          performance.mark('epoch-map-ready');

          if (!cartoApiKey) {
            setFailed(
              'Set NEXT_PUBLIC_CARTO_API_KEY in .env and restart the app to load CARTO tiles.',
            );

            return;
          }

          // Start remote tiles after the local globe is interactive.

          if (!event.target.getLayer('geography'))
            event.target.addLayer({
              id: 'geography',
              type: 'raster',
              source: 'carto',
              paint: { 'raster-saturation': -0.65, 'raster-opacity': 0.82 },
            });
        }}
        onError={(event) =>
          setFailed(
            event.error.message.includes('WebGL')
              ? 'The globe could not start. Please try again.'
              : 'Detailed tiles are unavailable. Showing the simplified globe.',
          )
        }
        onMouseLeave={() => {
          onHover(null);

          setTooltip(null);
        }}
      >
        <DeckOverlay
          layers={layers}
          getCursor={({ isHovering, isDragging }) =>
            isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
          }
          onClick={(info) =>
            onSelect((info.object as Polity | undefined) ?? null)
          }
        />
      </Map>
      <div className="map-controls" aria-label="Globe controls">
        <div className="zoom-buttons surface">
          <button
            className="icon-button"
            aria-label="Zoom in"
            disabled={!ready}
            onClick={() => map.current?.zoomIn({ duration: 200 })}
          >
            <Plus size={19} />
          </button>
          <button
            className="icon-button"
            aria-label="Zoom out"
            disabled={!ready}
            onClick={() => map.current?.zoomOut({ duration: 200 })}
          >
            <Minus size={19} />
          </button>
        </div>
        <button
          className="icon-button reset-button surface"
          aria-label="Reset globe view"
          disabled={!ready}
          onClick={() => {
            onSelect(null);

            map.current?.flyTo({
              ...initialCamera,
              padding: { top: 0, bottom: 0, left: 0, right: 0 },
              duration: window.matchMedia('(prefers-reduced-motion: reduce)')
                .matches
                ? 0
                : 850,
            });
          }}
        >
          <Globe2 size={19} strokeWidth={1.5} />
        </button>
      </div>
      {tooltip && (
        <div
          className="map-tooltip"
          role="tooltip"
          style={{
            left: Math.min(
              tooltip.x + 14,
              (map.current?.getContainer().clientWidth ?? window.innerWidth) -
                220,
            ),
            top: Math.max(10, tooltip.y - 40),
          }}
        >
          {tooltip.name}
        </div>
      )}
      {failed && (
        <div className="map-warning surface" role="alert">
          <span>{failed}</span>
          <button
            onClick={() => {
              setReady(false);

              setFailed(null);

              setRevision((value) => value + 1);
            }}
          >
            <RotateCcw size={13} />
            Retry map
          </button>
        </div>
      )}
    </div>
  );
}
