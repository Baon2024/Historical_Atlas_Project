import type { Manifest, Polity, PolityCollection } from './types';

export function formatYear(year: number): string {
  return `${String(Math.abs(year))} ${year < 0 ? 'BCE' : 'CE'}`;
}

export function colorToRgba(
  hex: string,
  opacity = 1,
): [number, number, number, number] {
  const value = /^#[\da-f]{6}$/i.test(hex) ? hex.slice(1) : '777777';

  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
    Math.round(Math.max(0, Math.min(1, opacity)) * 255),
  ];
}

export function featureBounds(
  feature: Polity,
): [[number, number], [number, number]] {
  const polygons =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;

  const positions = polygons.flat(2);

  const latitudes = positions.map((p) => p[1]);
  // Use the shorter longitude interval for polygons crossing the antimeridian.

  const longitudes = positions
    .map((p) => ((p[0] % 360) + 360) % 360)
    .sort((a, b) => a - b);

  let largestGap = -1;

  let start = 0;

  for (let i = 0; i < longitudes.length; i++) {
    const gap =
      (i === longitudes.length - 1 ? longitudes[0] + 360 : longitudes[i + 1]) -
      longitudes[i];

    if (gap > largestGap) {
      largestGap = gap;

      start = (i + 1) % longitudes.length;
    }
  }

  let west = longitudes[start];

  if (west > 180) west -= 360;

  return [
    [west, Math.min(...latitudes)],
    [west + 360 - largestGap, Math.max(...latitudes)],
  ];
}

export function parseManifest(input: unknown): Manifest {
  const manifest = input as Manifest;

  if (
    !manifest ||
    !Array.isArray(manifest.scenarios) ||
    !manifest.scenarios.length
  )
    throw new Error('No scenarios are available.');

  const ids = new Set<string>();

  for (const scenario of manifest.scenarios) {
    if (
      !scenario.id ||
      ids.has(scenario.id) ||
      !scenario.title ||
      !Array.isArray(scenario.snapshots) ||
      !scenario.snapshots.length
    )
      throw new Error('The scenario index is invalid.');

    ids.add(scenario.id);

    const snapshotIds = new Set<string>();

    for (const snapshot of scenario.snapshots) {
      if (
        !snapshot.id ||
        snapshotIds.has(snapshot.id) ||
        !Number.isInteger(snapshot.year) ||
        snapshot.year === 0 ||
        !snapshot.label ||
        !snapshot.dataFile?.startsWith('/data/')
      )
        throw new Error('A historical snapshot is invalid.');

      snapshotIds.add(snapshot.id);
    }

    scenario.snapshots.sort((a, b) => a.year - b.year);
  }

  return manifest;
}

export function parseCollection(input: unknown): PolityCollection {
  const collection = input as PolityCollection;

  if (
    !collection ||
    collection.type !== 'FeatureCollection' ||
    !Array.isArray(collection.features)
  )
    throw new Error('This snapshot is not a GeoJSON collection.');

  const ids = new Set<string>();

  for (const feature of collection.features) {
    if (
      !feature ||
      feature.type !== 'Feature' ||
      typeof feature.id !== 'string' ||
      ids.has(feature.id) ||
      !feature.properties?.name ||
      !feature.properties?.faction ||
      typeof feature.properties.summary !== 'string' ||
      !feature.geometry ||
      !['Polygon', 'MultiPolygon'].includes(feature.geometry.type)
    )
      throw new Error('This snapshot contains an invalid territory.');

    ids.add(feature.id);

    const polygons =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;

    if (
      !polygons.length ||
      !polygons.every(
        (polygon) =>
          polygon.length &&
          polygon.every(
            (ring) =>
              ring.length >= 4 &&
              ring.every(
                (p) =>
                  p.length >= 2 &&
                  Number.isFinite(p[0]) &&
                  Number.isFinite(p[1]) &&
                  p[1] >= -90 &&
                  p[1] <= 90,
              ) &&
              ring[0][0] === ring.at(-1)![0] &&
              ring[0][1] === ring.at(-1)![1],
          ),
      )
    )
      throw new Error('This snapshot contains an invalid boundary.');
  }

  return collection;
}
