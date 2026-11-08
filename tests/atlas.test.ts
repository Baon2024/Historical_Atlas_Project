import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  colorToRgba,
  featureBounds,
  formatYear,
  parseCollection,
  parseManifest,
} from '../lib/atlas.ts';
import type { Polity } from '../lib/types';
import { demoManifest, getDemoSnapshot } from '../lib/demoData.ts';

const load = (path: string) =>
  JSON.parse(
    readFileSync(new URL(`../public${path}`, import.meta.url), 'utf8'),
  );

test('all supplied snapshots are valid and have at least three styled territories', () => {
  const manifest = parseManifest(load('/data/manifest.json'));

  assert.equal(manifest.scenarios.length, 2);

  for (const scenario of manifest.scenarios) {
    assert.equal(scenario.snapshots.length, 3);

    assert.deepEqual(
      scenario.snapshots.map((s) => s.year),
      scenario.snapshots.map((s) => s.year).sort((a, b) => a - b),
    );

    for (const snapshot of scenario.snapshots) {
      const data = parseCollection(load(snapshot.dataFile));

      assert.ok(data.features.length >= 3);

      assert.equal(
        new Set(data.features.map((f) => f.id)).size,
        data.features.length,
      );

      for (const feature of data.features) {
        assert.match(feature.properties.fillColor, /^#[\da-f]{6}$/i);

        assert.ok(feature.properties.summary);

        assert.ok(featureBounds(feature).flat().every(Number.isFinite));
      }
    }
  }
});

test('dates have BCE and CE labels without negative signs', () => {
  assert.equal(formatYear(-218), '218 BCE');

  assert.equal(formatYear(1206), '1206 CE');
});

test('every startup snapshot is imported and matches its hardcoded fixture', () => {
  for (const scenario of demoManifest.scenarios) {
    for (const snapshot of scenario.snapshots) {
      assert.deepEqual(
        getDemoSnapshot(snapshot.dataFile),
        load(snapshot.dataFile),
      );
    }
  }

  assert.throws(
    () => getDemoSnapshot('/data/scenarios/missing.json'),
    /No imported demo dataset/,
  );
});

test('styling parses colour and clamps alpha', () => {
  assert.deepEqual(colorToRgba('#C0392B', 0.6), [192, 57, 43, 153]);

  assert.deepEqual(colorToRgba('#000000', 2), [0, 0, 0, 255]);

  assert.deepEqual(colorToRgba('invalid', -1), [119, 119, 119, 0]);
});

test('bounds include all multipolygon parts and wrap across the dateline', () => {
  const feature = load('/data/scenarios/mediterranean-218.json')
    .features[0] as Polity;

  const bounds = featureBounds(feature);

  assert.ok(bounds[0][0] < 9.12 && bounds[1][0] > 19.9);

  assert.ok(bounds[0][1] < 36.8 && bounds[1][1] > 45.4);

  const dateline = {
    ...feature,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [179, 10],
          [-179, 10],
          [-179, 12],
          [179, 12],
          [179, 10],
        ],
      ],
    },
  } as Polity;

  assert.equal(
    featureBounds(dateline)[1][0] - featureBounds(dateline)[0][0],
    2,
  );
});

test('bad manifests, duplicate IDs, and unclosed boundaries fail clearly', () => {
  assert.throws(() => parseManifest({ scenarios: [] }), /No scenarios/);

  const manifest = load('/data/manifest.json');

  manifest.scenarios[0].snapshots[0].year = 0;

  assert.throws(() => parseManifest(manifest), /invalid/);

  const collection = load('/data/scenarios/mediterranean-218.json');

  collection.features[1].id = collection.features[0].id;

  assert.throws(() => parseCollection(collection), /invalid/);

  const unclosed = load('/data/scenarios/mediterranean-218.json');

  unclosed.features[2].geometry.coordinates[0].pop();

  assert.throws(() => parseCollection(unclosed), /invalid boundary/);
});
