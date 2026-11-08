# How the atlas code works

This guide describes the current code: plain React state shared through context, with hardcoded historical datasets imported at startup.

## 1. Start with these files

| File | What it does |
| --- | --- |
| `app/page.tsx` | Displays the atlas at `/`. |
| `app/layout.tsx` | Adds metadata, global styles, and the application provider. |
| `context/AppContext.tsx` | Holds shared state and exposes `useAppContext()`. |
| `lib/demoData.ts` | Statically imports the manifest and all six historical snapshots. |
| `components/Atlas.tsx` | Arranges the page and manages its local information/expansion controls. |
| `components/Map.tsx` | Creates the globe, polygon layer, camera controls, and hover tooltip. |
| `components/ScenarioSelector.tsx` | Chooses a chapter using context. |
| `components/Timeline.tsx` | Chooses a snapshot using context. |
| `components/InspectorSidebar.tsx` | Displays the selected territory. |
| `lib/types.ts` | Describes the data structures with TypeScript. |
| `lib/atlas.ts` | Formats dates/colours, calculates bounds, and checks data. |
| `public/data/` | Holds the hardcoded JSON and background geographic assets. |

## 2. What happens at startup

1. Next.js serves the `/` page.
2. `app/layout.tsx` wraps that page in `AppProvider`.
3. The provider imports `lib/demoData.ts`, which imports the existing manifest and all six snapshot JSON files.
4. The provider starts with the Mediterranean chapter and its 218 BCE snapshot.
5. Components read the state and selected dataset through `useAppContext()`.
6. MapLibre draws the globe, and deck.gl draws the historical territories.

Choosing a different year selects a different object already in memory. No historical-data request is made, and no files or folders are generated.

## 3. Hardcoded data and static imports

`lib/demoData.ts` contains imports such as:

```ts
import mediterranean218 from '../public/data/scenarios/demo.json' with {
  type: 'json',
};
```

This is a **static import**. The bundler includes the JSON in the application’s JavaScript. The `with { type: 'json' }` part identifies the imported module as JSON; it also allows the same import to work in the Node.js tests.

The files stay under `public/data/` to preserve the specification’s directory layout. Although Next.js can serve files from that directory at URLs, this app imports the historical JSON directly instead of requesting those URLs.

The module registers each imported snapshot in an object:

```ts
const demoSnapshots: Record<string, PolityCollection> = {
  '/data/scenarios/demo.json': parseCollection(mediterranean218),

  // The other five imports are registered here too.
};
```

The path is a lookup key. `getDemoSnapshot(activeSnapshot.dataFile)` looks up the already loaded object; it does not fetch or read a file.

`parseManifest` and `parseCollection` check the hardcoded values once when the module initializes. They catch issues such as missing snapshot metadata, duplicate IDs, and unclosed polygon rings. A missing registry entry throws an error identifying the unregistered path.

There is no historical-data generator, fetching hook, cache, loading state, or retry state. Edit the existing JSON directly. To add another snapshot, also add its static import and registry entry.

## 4. State, context, and the custom hook

These are separate mechanisms:

- **`useState` stores changing values.**
- **Context shares values and update functions with child components.**
- **`useAppContext()` is our own hook for reading that context.**

`useAppContext` is not a built-in React hook. Its implementation calls React’s `useContext(AppContext)` and checks that the provider exists.

### Creating state with `useState`

The provider contains declarations like:

```tsx
const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);
```

This means:

- The initial value is `null`: no territory is hovered.
- `hoveredFeatureId` is the current value.
- `setHoveredFeatureId(...)` changes the value.
- `<string | null>` tells TypeScript the allowed value types.

The square brackets unpack the two values returned by `useState`. This is called **array destructuring**.

The provider stores scenario ID, snapshot ID, selected territory ID, and hovered territory ID. There is no reducer and no `dispatch` function.

### Sharing the values

The provider supplies a `value` object to its children. This shortened example shows two of its actual fields:

```tsx
<AppContext.Provider
  value={{
    selectedFeatureId,
    setSelectedFeatureId,
  }}
>
  {children}
</AppContext.Provider>
```

The outer braces in `value={{ ... }}` insert JavaScript into JSX; the inner braces create the object.

`children` means the elements placed inside `AppProvider`. Because the layout wraps the page in it, all atlas components can access this shared state.

### Reading and updating it

```tsx
import { useAppContext } from '@/context/AppContext';

export function ClearSelectionButton() {
  const {
    selectedFeatureId,
    setSelectedFeatureId,
  } = useAppContext();

  return (
    <button
      disabled={selectedFeatureId === null}
      onClick={() => setSelectedFeatureId(null)}
    >
      Clear selection
    </button>
  );
}
```

The curly-brace destructuring picks fields from the context object. The arrow function in `onClick` runs the setter when the click happens. Calling the setter directly during rendering would update state at the wrong time.

Updating state causes React to render again. Components consuming the context receive the updated values.

Hooks must be called at the top level of a component or another hook, rather than inside a condition, loop, or click handler. Calling `useAppContext()` outside `AppProvider` throws a clear error.

## 5. Stored IDs and calculated objects

The provider stores IDs and calculates the corresponding full objects.

```tsx
const selectedFeature =
  data.features.find((feature) => feature.id === selectedFeatureId) ?? null;
```

`.find(...)` searches the current snapshot. A matching territory becomes `selectedFeature`; otherwise, `?? null` supplies `null`.

This avoids keeping another copy of a territory object in state. The inspector gets its content from the currently active dataset.

`activeScenario`, `activeSnapshot`, and `snapshotIndex` are also calculated from state and the imported manifest. `snapshotIndex` is the active snapshot’s position in its chapter’s array; the timeline slider uses that index.

The initial IDs come from the first chapter and its default snapshot. The default is identified by the chapter’s `dataFile` matching a snapshot’s `dataFile`.

## 6. Following a user interaction

### Clicking a territory

1. deck.gl identifies the polygon under the pointer.
2. The map calls `selectFeature(feature)` from context.
3. That function stores the feature’s ID with `setSelectedFeatureId(...)`.
4. The provider calculates the selected territory from the current data.
5. `Atlas` displays the inspector.
6. A map effect moves the camera to the territory’s bounds.

A background click supplies `null`, which clears selection. Escape and the close button also clear selection.

### Choosing another year

The timeline calls `changeSnapshot(index)`. After finding the requested snapshot, the provider updates the IDs and clears the old selection:

```tsx
setScenarioId(activeScenario.id);

setSnapshotId(nextSnapshot.id);

setSelectedFeatureId(null);

setHoveredFeatureId(null);
```

React batches these updates from the event. The next render uses the resulting state together. `getDemoSnapshot(...)` immediately returns the new imported dataset, and deck.gl receives it.

No request needs to finish, so there is no old-request/new-request race to handle. The camera remains where it was until a territory is selected or the view is reset.

### Choosing another chapter

The selector calls `changeScenario(id)`. That picks the chapter’s default snapshot and clears selection and hover.

Use `changeScenario` and `changeSnapshot` for navigation because they include the resets. Individual territory setters are exposed for selection and hover.

## 7. React hooks used in the code

| Hook | Its job here |
| --- | --- |
| `useState` | Stores shared navigation/selection and local controls such as open panels, map readiness, and tooltips. |
| `useContext` | Reads the nearest provider’s shared values, through `useAppContext()`. |
| `useEffect` | Registers keyboard listeners, focuses the inspector, clears a tooltip, or moves the map camera after state changes. |
| `useRef` | Keeps a reference to the map instance or a DOM element between renders. |
| `useCallback` | Keeps a function reference stable between renders while its dependencies remain unchanged. |
| `useMemo` | Reuses the calculated polygon-layer configuration until its dependencies change. |

An effect’s dependency array lists the values that determine when it runs again. The camera effect depends on the selected territory and map readiness.

An effect can return a cleanup function. For example, the Escape effect registers a browser listener and removes it during cleanup:

```tsx
window.addEventListener('keydown', onKey);

return () => window.removeEventListener('keydown', onKey);
```

`useRef` does not trigger a render when its `.current` value changes. The map ref provides imperative methods such as `fitBounds`, `zoomIn`, and `flyTo`.

`useCallback` keeps the function itself; it does not execute it. The stable `clearSelection` function helps the keyboard-listener effect avoid unnecessary registration changes.

`useMemo` caches a calculated value, not application state. The layer depends on data and selection styling; it is recalculated when those inputs change.

All consumers of this single context can render when its value changes. This MVP does not have per-field context subscriptions.

## 8. Globe and polygon rendering

Two libraries do different jobs:

- **MapLibre** draws the globe/background and handles camera navigation.
- **deck.gl** draws historical GeoJSON territories and performs polygon picking for hover and clicks.

`MapLibreOverlay` keeps their cameras synchronized. The app uses separate, overlapping WebGL canvases to avoid depth conflicts between the globe surface and historical fills.

`GeoJsonLayer` receives the active collection and accessor functions that read each feature’s properties:

```tsx
getFillColor: (feature) =>
  colorToRgba(
    feature.properties.fillColor,
    feature.properties.fillOpacity,
  ),
```

An **accessor** is a function the library calls for a feature. `colorToRgba` converts a hex colour and opacity into the `[red, green, blue, alpha]` numbers deck.gl expects. Each channel uses a 0–255 scale.

Hovering changes the outline and stores tooltip coordinates in pixels. Those screen coordinates are separate from geographic longitude and latitude. `updateTriggers` tells deck.gl when an accessor’s selection-dependent output needs refreshing.

`featureBounds` finds a rectangle around all parts of a territory. It also accounts for the longitude seam at ±180°. `fitBounds` changes the camera so that rectangle fits, with padding for the side panels or mobile inspector.

The reset button clears selection and returns to the initial camera. The map’s retry button increments a `revision` used as React’s `key`; a changed key causes React to replace the map instance and initialize it again.

## 9. Background assets versus historical data

Historical data is statically imported into JavaScript.

The geographic background uses image tiles. MapLibre loads the included Natural Earth world tile first, then requests the original CARTO light basemap without labels. CARTO requires an API key, read from `process.env.NEXT_PUBLIC_CARTO_API_KEY` and appended to each tile URL as `?key=...`.

Set that variable in the project-root `.env` file. Next.js loads it when the app starts/builds; the `NEXT_PUBLIC_` prefix makes the value available in browser code. Restart the development server after changing it, or rebuild and restart a production server. `encodeURIComponent` escapes the key for use in the URL. `.env` is ignored by Git; `.env.example` shows the variable name without a key.

If no key is set, the app shows a setup message and keeps the local globe without requesting CARTO tiles. Failed tile requests also leave the local background visible and show a retry action.

If WebGL 2 is unavailable, the map shows an explanation. The territory list and inspector still work through React and the imported data.

The low-resolution local coastline is deliberately coarse; it is geographic context, not another historical dataset.

## 10. Next.js and the dynamic globe import

`app/page.tsx` defines `/`. `app/layout.tsx` supplies the surrounding page structure and provider.

`'use client'` marks a client-component boundary for interactive React code. Next.js can still pre-render its initial markup. Hooks and browser interactions run in the client.

`Atlas` imports the globe with `dynamic(() => import('./Map'), { ... })` and `ssr: false`. This loads the map component separately and renders it in the browser, where canvas, `document`, and WebGL exist. A loading component appears while that JavaScript loads.

This is dynamic **code loading**. It does not generate data files or directories. The historical datasets use ordinary static imports.

## 11. Files created by development tools

The historical data generator has been removed. Startup and navigation do not create historical JSON files or folders.

Two supporting scripts remain:

| Script | When it runs | What it does |
| --- | --- | --- |
| `scripts/prepare-map.mjs` | Automatically before `dev` and `build`. | Copies MapLibre’s installed browser worker into `public/`. |
| `scripts/prepare-geography.mjs` | Manually, if you choose to regenerate the included geography. | Recreates the local coastline/world tile from Natural Earth data. |

The worker is a separate browser thread used for map processing. Copying it locally gives MapLibre a worker matching the installed package version. That copied file is gitignored.

Geographic assets are already included, so their generation is not required during ordinary startup. The optional geography script uses math.gl to cut the longitude seam and Sharp to rasterize a geographic SVG into a PNG.

`mkdir` and `writeFile` in these Node.js tools are filesystem operations. `recursive: true` creates missing parent directories and permits an existing directory. `import.meta.url` identifies the script’s location, allowing paths to resolve relative to the script rather than the terminal’s current folder.

Next.js also creates `.next/` for compiled output and caches. Browser tests create screenshots/measurements in `.cache/qa/` and can save failure traces in `test-results/`. These are tool outputs, not application datasets, and are gitignored.

## 12. Less familiar syntax

### `@/` imports

`@/context/AppContext` resolves from the project root. The alias is configured in `tsconfig.json`.

### Renaming while destructuring

```tsx
const {
  selectedFeature: selected,
  selectFeature: onSelect,
} = useAppContext();
```

This gives existing context fields shorter local names. It does not create new state or copy an object.

### `?.` and `??`

`selected?.id` reads `id` if `selected` exists; otherwise, its result is `undefined`.

`value ?? fallback` supplies a fallback only for `null` or `undefined`. It preserves valid values such as `0`.

### `.map`, `.filter`, and `.find`

`.map` transforms items, such as territories into list elements. `.filter` keeps matching items, such as metadata fields visible in the inspector. `.find` returns the first matching item.

Rendered lists use `key={feature.id}` so React can track the same item across renders.

### Conditional JSX

```tsx
{selected && snapshot && <InspectorSidebar />}
```

The inspector is displayed only when the required values exist. A ternary expression, `condition ? first : second`, chooses between two alternatives.

### Types and assertions

Interfaces describe object fields. `Polity` represents one territory; `PolityCollection` represents its GeoJSON collection; `Scenario` and `Snapshot` describe timeline entries.

`Record<string, PolityCollection>` describes an object mapping string keys to collections.

`Omit<SomeType, 'features'>` makes a type with one property removed. The collection type replaces GeoJSON’s broad feature array with this app’s narrower territory array, which requires string IDs.

`value as SomeType` and the non-null assertion `value!` guide TypeScript; they do not perform runtime checks. The explicit data-checking functions provide runtime validation.

## 13. GeoJSON and dates

A snapshot is a `FeatureCollection`. Each feature has an ID, geometry, and properties containing styling and narrative metadata.

Coordinates are in **longitude, latitude** order. A `Polygon` contains rings: an outer boundary and optional holes. A `MultiPolygon` contains several polygons, which permits separate mainland and island regions. Rings repeat their first coordinate at the end to close the boundary.

Years are negative for BCE and positive for CE. `formatYear` adds the displayed label. Year zero is not permitted by this convention.

The inspector renders Markdown summaries with raw HTML disabled. It filters styling properties out of the metadata list and displays fields such as capital, ruler, and status.

## 14. Focus, responsive layout, and motion

The inspector uses a ref to focus its close button when it mounts. Its cleanup attempts to return focus to the previously focused element. Escape and the close button call the shared selection-clearing function.

CSS media queries adapt the layout to mobile: chapter details collapse and the inspector becomes a scrolling lower panel. The map adjusts camera padding to leave the territory visible above it.

Reduced-motion settings disable CSS animations and make the selection/reset camera movements immediate.

## 15. Commands and checks

```sh
npm run dev

npm run format
npm run format:check

npm run typecheck
npm test

npm run build
npm run test:e2e
```

`format` writes consistent formatting; `format:check` checks it without rewriting files. Source also has explicit blank lines between distinct operations, declarations, and functions.

Unit tests check the fixtures, imported snapshot registry, date labels, colours, and bounds. Browser tests cover navigation, direct polygon interaction, mobile behaviour, WebGL fallback, and unavailable basemap tiles. One test blocks all historical-data URLs and checks all six dates, proving navigation uses imported data.

The browser suite uses installed Google Chrome and a production build. It writes screenshots and ordinary loading measurements under `.cache/qa/`. Earlier software-rendering stress observations are retained in `docs/validation.md` and are not a hardware performance guarantee.
