import manifestJson from '../public/data/manifest.json' with { type: 'json' };
import mediterranean264 from '../public/data/scenarios/mediterranean-264.json' with { type: 'json' };
import mediterranean218 from '../public/data/scenarios/mediterranean-218.json' with { type: 'json' };
import mediterranean201 from '../public/data/scenarios/mediterranean-201.json' with { type: 'json' };
import eurasia1206 from '../public/data/scenarios/eurasia-1206.json' with { type: 'json' };
import eurasia1227 from '../public/data/scenarios/eurasia-1227.json' with { type: 'json' };
import eurasia1260 from '../public/data/scenarios/eurasia-1260.json' with { type: 'json' };

import { parseCollection, parseManifest } from './atlas.ts';
import type { PolityCollection } from './types';

export const demoManifest = parseManifest(manifestJson);

const demoSnapshots: Record<string, PolityCollection> = {
  '/data/scenarios/mediterranean-264.json': parseCollection(mediterranean264),
  '/data/scenarios/mediterranean-218.json': parseCollection(mediterranean218),
  '/data/scenarios/mediterranean-201.json': parseCollection(mediterranean201),

  '/data/scenarios/eurasia-1206.json': parseCollection(eurasia1206),
  '/data/scenarios/eurasia-1227.json': parseCollection(eurasia1227),
  '/data/scenarios/eurasia-1260.json': parseCollection(eurasia1260),
};

export function getDemoSnapshot(dataFile: string): PolityCollection {
  const snapshot = demoSnapshots[dataFile];

  if (!snapshot) {
    throw new Error(`No imported demo dataset is registered for ${dataFile}.`);
  }

  return snapshot;
}
