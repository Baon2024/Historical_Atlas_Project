import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { feature } from 'topojson-client';
import sharp from 'sharp';
import { cutPolygonByMercatorBounds } from '@math.gl/polygon';
import { fileURLToPath } from 'node:url';

const topology = JSON.parse(
  await readFile(
    new URL('../node_modules/world-atlas/land-110m.json', import.meta.url),
    'utf8',
  ),
);

const directory = new URL('../public/data/geography/', import.meta.url);

await mkdir(directory, { recursive: true });

const land = feature(topology, topology.objects.land);

await writeFile(
  new URL('land.geojson', directory),
  JSON.stringify(land) + '\n',
);
// A single Mercator world tile avoids polar seams in globe-projected GeoJSON fills.
// Rasterise only geographic context; historical overlays remain interactive vectors.

const size = 2048;

const project = ([longitude, latitude]) => {
  const radians =
    (Math.max(-85.05112878, Math.min(85.05112878, latitude)) * Math.PI) / 180;

  return [
    (((longitude + 180) / 360) * size).toFixed(2),
    (
      ((1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) /
        2) *
      size
    ).toFixed(2),
  ];
};

const polygons = land.features.flatMap((item) =>
  item.geometry.type === 'Polygon'
    ? [item.geometry.coordinates]
    : item.geometry.coordinates,
);

const clipped = polygons.flatMap((polygon) => {
  const positions = [],
    holes = [];

  for (const [index, ring] of polygon.entries()) {
    if (index) holes.push(positions.length);

    positions.push(...ring.flat());
  }

  return cutPolygonByMercatorBounds(positions, holes, {
    maxLatitude: 85.05112878,
  });
});

const paths = clipped
  .map(({ positions, holeIndices = [] }) => {
    const stops = [0, ...holeIndices, positions.length];

    const rings = stops.slice(1).map((end, index) => {
      const points = [];

      for (let i = stops[index]; i < end; i += 2)
        points.push([positions[i], positions[i + 1]]);

      return (
        points
          .map((point, i) => `${i ? 'L' : 'M'}${project(point).join(',')}`)
          .join('') + 'Z'
      );
    });

    return `<path d="${rings.join('')}" fill-rule="evenodd"/>`;
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#dce3de"/><g fill="#f3f1e7" stroke="#c4ccbe" stroke-width="0.6">${paths}</g></svg>`;

await sharp(Buffer.from(svg))
  .png()
  .toFile(fileURLToPath(new URL('land.png', directory)));

console.log(
  'Prepared public-domain Natural Earth land outline and local globe tile.',
);
