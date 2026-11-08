'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import { demoManifest, getDemoSnapshot } from '@/lib/demoData';
import type {
  Manifest,
  Polity,
  PolityCollection,
  Scenario,
  Snapshot,
} from '@/lib/types';

interface AppContextValue {
  manifest: Manifest;
  data: PolityCollection;

  activeScenario: Scenario;
  activeSnapshot: Snapshot;
  snapshotIndex: number;

  selectedFeatureId: string | null;
  hoveredFeatureId: string | null;
  selectedFeature: Polity | null;

  setSelectedFeatureId: Dispatch<SetStateAction<string | null>>;
  setHoveredFeatureId: Dispatch<SetStateAction<string | null>>;
  selectFeature: (feature: Polity | null) => void;
  clearSelection: () => void;
  changeScenario: (scenarioId: string) => void;
  changeSnapshot: (index: number) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const initialScenario = demoManifest.scenarios[0];

const initialSnapshot =
  initialScenario.snapshots.find(
    (snapshot) => snapshot.id === initialScenario.defaultSnapshotId,
  ) ?? initialScenario.snapshots[0];

export function AppProvider({ children }: { children: ReactNode }) {
  const [scenarioId, setScenarioId] = useState(initialScenario.id);

  const [snapshotId, setSnapshotId] = useState(initialSnapshot.id);

  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
    null,
  );

  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);

  const manifest = demoManifest;

  const activeScenario =
    manifest.scenarios.find((scenario) => scenario.id === scenarioId) ??
    initialScenario;

  const activeSnapshot =
    activeScenario.snapshots.find((snapshot) => snapshot.id === snapshotId) ??
    activeScenario.snapshots.find(
      (snapshot) => snapshot.id === activeScenario.id,
    ) ??
    activeScenario.snapshots[0];

  const snapshotIndex = Math.max(
    0,
    activeScenario.snapshots.findIndex(
      (snapshot) => snapshot.id === activeSnapshot.id,
    ),
  );

  const data = getDemoSnapshot(activeSnapshot.dataFile);

  const selectedFeature =
    data.features.find((feature) => feature.id === selectedFeatureId) ?? null;

  const selectFeature = useCallback((feature: Polity | null) => {
    setSelectedFeatureId(feature?.id ?? null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFeatureId(null);
  }, []);

  function changeScenario(nextScenarioId: string) {
    const nextScenario = manifest.scenarios.find(
      (scenario) => scenario.id === nextScenarioId,
    );

    if (!nextScenario) {
      return;
    }

    const defaultSnapshot =
      nextScenario.snapshots.find(
        (snapshot) => snapshot.id === nextScenario.defaultSnapshotId,
      ) ?? nextScenario.snapshots[0];

    setScenarioId(nextScenario.id);
    setSnapshotId(defaultSnapshot.id);
    setSelectedFeatureId(null);
    setHoveredFeatureId(null);
  }

  function changeSnapshot(index: number) {
    const nextSnapshot = activeScenario.snapshots[index];

    if (!nextSnapshot) {
      return;
    }

    setScenarioId(activeScenario.id);
    setSnapshotId(nextSnapshot.id);
    setSelectedFeatureId(null);
    setHoveredFeatureId(null);
  }

  return (
    <AppContext.Provider
      value={{
        manifest,
        data,
        activeScenario,
        activeSnapshot,
        snapshotIndex,
        selectedFeatureId,
        hoveredFeatureId,
        selectedFeature,
        setSelectedFeatureId,
        setHoveredFeatureId,
        selectFeature,
        clearSelection,
        changeScenario,
        changeSnapshot,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider.');
  }

  return context;
}
