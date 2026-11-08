import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from 'geojson';

export interface PolityProperties {
  name: string;
  faction: string;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  hatchPattern: 'none';
  summary: string;
  capital?: string;
  ruler?: string;
  status?: string;
  [key: string]: string | number | undefined;
}

export type Polity = Feature<Polygon | MultiPolygon, PolityProperties> & {
  id: string;
};

export type PolityCollection = Omit<
  FeatureCollection<Polygon | MultiPolygon, PolityProperties>,
  'features'
> & { features: Polity[] };

export interface Snapshot {
  id: string;
  label: string;
  year: number;
  dataFile: string;
  description: string;
}

export interface Scenario {
  id: string;
  title: string;
  category: string;
  defaultSnapshotId: string;
  subtitle: string;
  description: string;
  snapshots: Snapshot[];
}

export interface Manifest {
  scenarios: Scenario[];
}
