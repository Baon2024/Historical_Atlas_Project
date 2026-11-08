# Epoch — A historical atlas

A browser-based historical atlas following `product_spec.md`, with a 3D globe, scenario selector, discrete timeline, and territory inspector. The interface uses a light atlas design and adapts to desktop and mobile.

All historical boundaries and descriptions are illustrative dummy data. They are not historical references or statements about current sovereignty.

The polity outlines now include detailed coastlines, islands, and revised territorial extents. See [boundary sources and limitations](docs/polity-boundaries.md) for the refinement method and date-specific coverage. Inland historical frontiers remain approximate.

## Run locally

Use Node.js 22.18 or later and npm. This project was checked with Node 24.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Historical data and the simplified local globe work without an API key. The detailed CARTO basemap requires a CARTO key.

Put your key in the project-root `.env` file:

```dotenv
NEXT_PUBLIC_CARTO_API_KEY=your_carto_basemap_key
```

An empty entry is supplied in `.env.example`. `.env` is ignored by Git. Request a key from [CARTO](https://www.carto.com/basemaps/apikey/index.html). Restart `npm run dev` after changing the key; for production, rebuild and restart. Next.js embeds `NEXT_PUBLIC_` values into browser code, which is how the map can send the key with tile requests.

For a production preview:

```sh
npm run build
npm start
```

## Application structure

`AppProvider` holds application state with `useState`. The map, timeline, scenario selector, and inspector access that state through `useAppContext()`.

All demo JSON is hardcoded and statically imported in `lib/demoData.ts` when the application starts. Selecting a scenario or year reads an already imported snapshot from memory. There is no historical-data fetch, cache, retry layer, or data generator.

The JSON files remain in `public/data/` to preserve the specification’s layout. Their `dataFile` paths act as keys into the imported snapshot registry; the application does not fetch those paths.

Read [CODE_GUIDE.md](CODE_GUIDE.md) for an explanation of the React hooks, context, imports, data flow, map rendering, and less familiar syntax.

## Included behaviour

- Two chapters with three snapshots each: Mediterranean powers (264, 218, 201 BCE) and Eurasian empires (1206, 1227, 1260 CE).
- Initial snapshot: Mediterranean powers, 218 BCE. Initial camera: longitude 0, latitude 20, zoom 2.5.
- Per-territory colours, borders, hover labels, map selection, and a keyboard-accessible territory list.
- Manual timeline slider, dated buttons, and previous/next controls.
- A 380px desktop inspector and a scrolling mobile panel, with Markdown summaries and metadata.
- Close-button, Escape, and background-click dismissal. Snapshot changes retain the camera and clear selection and hover.
- Zoom/reset controls, reduced-motion support, focus handling, and a WebGL-unavailable message that retains territory-list exploration.

The globe loads bundled Natural Earth geography first, then requests the original CARTO light basemap without labels. Each CARTO tile URL receives the `key` query parameter from `NEXT_PUBLIC_CARTO_API_KEY`. If the key is missing, the app shows a setup message and uses the local globe without making CARTO requests. If tile requests fail, the local geography remains visible and the map offers a retry. Historical data remains statically imported and independent of the tile service.

CARTO and OpenStreetMap attribution remain visible. Automated browser tests block external CARTO tiles so they do not use your tile allowance.

The map uses `react-map-gl/maplibre` and `@deck.gl/maplibre` with separate overlaid WebGL canvases. This avoids depth conflicts between the globe and historical polygons. deck.gl’s globe view remains experimental; dependency upgrades need a globe/picking regression check.

There is no backend, authentication, autoplay, persistent user state, or deployment.

## Editing the hardcoded data

1. Edit the JSON files in `public/data/scenarios/` directly.
2. Update `public/data/manifest.json` when adding or changing chapter dates.
3. Register any new snapshot with a static import and matching key in `lib/demoData.ts`.

A snapshot is a GeoJSON FeatureCollection. Each feature needs a unique string ID, a Polygon or MultiPolygon with closed coordinate rings, and the styling/metadata properties described in the spec. Coordinates use longitude, latitude order.

Use six-digit hex colours, opacity from 0 to 1, border widths in pixels, and `hatchPattern: "none"`. Pattern fills are not implemented. Summaries support Markdown with raw HTML disabled. Extra metadata such as capital, ruler, and status is shown in the inspector.

Manifest years are negative for BCE and positive for CE; year zero is not allowed. Snapshots sort chronologically. A chapter’s `dataFile` identifies its default snapshot and must match a registered imported dataset.

The imported data is checked by `parseManifest` and `parseCollection` during module initialization. There is no generator to overwrite hand-edited historical fixtures.

## Supporting assets

`predev` and `prebuild` run `scripts/prepare-map.mjs`. It copies the installed MapLibre worker into `public/maplibre-gl-worker.mjs`, giving the browser a local worker matching the library version. The copied worker is gitignored.

The Natural Earth coastline and its prebuilt local world tile are included in `public/data/geography/`. Their license is alongside them. `scripts/prepare-geography.mjs` can regenerate those geographic assets manually; ordinary startup does not run it or generate historical datasets.

## Checks and formatting

```sh
npm run format
npm run format:check
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Source uses two-space indentation, multiline declarations, and blank lines between separate operations and functions. Prettier configuration is in `.prettierrc.json`. The supplied product spec and generated/public assets are excluded from formatting.

The unit tests validate fixtures, startup registration, date formatting, styling, and bounds. Five browser scenarios cover direct globe interaction, navigation, mobile/reduced-motion behaviour, all six snapshots with dataset URLs blocked, WebGL fallback, and unavailable basemap tiles.

Browser tests use installed Google Chrome and a production build. Screenshots and ordinary startup measurements are saved under `.cache/qa/`. Historical software-rendering stress observations and outstanding performance limits are recorded in `docs/validation.md`.
# Historical_Atlas_Project
