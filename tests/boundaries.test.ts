import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { parseCollection } from '../lib/atlas.ts';
import type { PolityCollection } from '../lib/types';

function load(name: string): PolityCollection {
  const path = new URL(
    `../public/data/scenarios/${name}.json`,
    import.meta.url,
  );

  return parseCollection(JSON.parse(readFileSync(path, 'utf8')));
}

function pointInRing(point: number[], ring: number[][]): boolean {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x, y] = point;

    const [xi, yi] = ring[i];

    const [xj, yj] = ring[j];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

function contains(
  dataset: string,
  territoryId: string,
  point: number[],
): boolean {
  const territory = load(dataset).features.find(
    (feature) => feature.id === territoryId,
  );

  assert.ok(territory, `${dataset} is missing ${territoryId}.`);

  const polygons =
    territory.geometry.type === 'Polygon'
      ? [territory.geometry.coordinates]
      : territory.geometry.coordinates;

  return polygons.some(
    (polygon) =>
      pointInRing(point, polygon[0]) &&
      !polygon.slice(1).some((hole) => pointInRing(point, hole)),
  );
}

test('all six snapshots contain valid closed geographic boundaries', () => {
  const names = [
    'mediterranean-264',
    'mediterranean-218',
    'mediterranean-201',
    'eurasia-1206',
    'eurasia-1227',
    'eurasia-1260',
  ];

  for (const name of names) {
    for (const territory of load(name).features) {
      const polygons =
        territory.geometry.type === 'Polygon'
          ? [territory.geometry.coordinates]
          : territory.geometry.coordinates;

      for (const polygon of polygons) {
        for (const ring of polygon) {
          assert.deepEqual(ring[0], ring.at(-1));

          for (const [longitude, latitude] of ring) {
            assert.ok(longitude >= -180 && longitude <= 180);

            assert.ok(latitude >= -90 && latitude <= 90);
          }
        }
      }
    }
  }
});

test('Punic snapshots distinguish the Italian mainland, Sicily, and Iberian possessions', () => {
  assert.equal(contains('mediterranean-264', 'rome', [12.4964, 41.9028]), true);

  assert.equal(contains('mediterranean-264', 'rome', [9.19, 45.46]), false);

  assert.equal(contains('mediterranean-264', 'carthage', [13.36, 38.11]), true);

  assert.equal(contains('mediterranean-264', 'rome', [13.36, 38.11]), false);

  assert.equal(contains('mediterranean-218', 'rome', [13.36, 38.11]), true);

  assert.equal(contains('mediterranean-218', 'carthage', [-0.98, 37.61]), true);

  assert.equal(contains('mediterranean-201', 'rome', [-0.98, 37.61]), true);

  assert.equal(contains('mediterranean-201', 'rome', [-9.14, 38.72]), false);
});

test('Song retains its southern coastline and Hainan without claiming Taiwan or Delhi claiming the Deccan', () => {
  for (const year of [1206, 1227, 1260]) {
    assert.equal(contains(`eurasia-${year}`, 'song', [120.155, 30.274]), true);

    assert.equal(contains(`eurasia-${year}`, 'song', [110.3, 20.04]), true);

    assert.equal(contains(`eurasia-${year}`, 'song', [121.565, 25.033]), false);

    assert.equal(contains(`eurasia-${year}`, 'delhi', [77.209, 28.614]), true);

    assert.equal(
      contains(`eurasia-${year}`, 'delhi', [72.8777, 19.076]),
      false,
    );

    assert.equal(contains(`eurasia-${year}`, 'delhi', [72.57, 23.02]), false);
  }
});

test('later Mongol expansion includes Baghdad and Moscow while Hangzhou remains Song', () => {
  assert.equal(contains('eurasia-1227', 'mongol', [66.96, 39.65]), true);

  assert.equal(contains('eurasia-1227', 'mongol', [44.366, 33.315]), false);

  assert.equal(contains('eurasia-1260', 'mongol', [44.366, 33.315]), true);

  assert.equal(contains('eurasia-1260', 'mongol', [37.617, 55.755]), true);

  assert.equal(contains('eurasia-1260', 'mongol', [21.01, 52.23]), false);

  assert.equal(contains('eurasia-1260', 'mongol', [120.155, 30.274]), false);

  assert.equal(contains('eurasia-1260', 'song', [104.066, 30.67]), false);

  assert.equal(contains('eurasia-1260', 'song', [106.55, 29.56]), true);
});
