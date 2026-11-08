# Technical Product Specification: Global Interactive Historical & Geopolitical Atlas

## 1. Overview & Objectives
Build a high-performance, web-based interactive globe and map application for visualizing historical, geopolitical, and territorial data. The platform must support seamless zooming, interactive polygon overlays, temporal state switching (e.g., historical timelines or conflict stages), and detail sidebars for inspected geographic regions.

---

## 2. Core Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                      Next.js App                        │
│ ┌──────────────────────┐      ┌───────────────────────┐ │
│ │  UI Shell & Sidebar  │      │ MapLibre Canvas       │ │
│ │  (React / Tailwind)  │      │ (react-map-gl)        │ │
│ └──────────┬───────────┘      └──────────┬────────────┘ │
└────────────┼─────────────────────────────┼──────────────┘
             │                             │
             │ Fetch GeoJSON/Metadata      │ WebGL Layers
             ▼                             ▼
┌────────────────────────┐      ┌─────────────────────────┐
│  Data Storage / CDN    │──────►  deck.gl Overlay Layer  │
│  (/public or S3 Bucket)│      │  (GeoJsonLayer)        │
└────────────────────────┘      └─────────────────────────┘
```

* **Frontend Framework:** Next.js (App Router, React 18/19, TypeScript, Tailwind CSS)
* **Map Engine:** MapLibre GL JS (`react-map-gl/maplibre`)
* **Visualization Layer:** deck.gl (`@deck.gl/react`, `@deck.gl/layers`)
* **Data Storage:** Static GeoJSON files and vector tile archives hosted via public storage (Local `/public` directory or Cloudflare R2 / AWS S3)

---

## 3. Data Schema & Architecture

### 3.1 Base Map Architecture
* Use CARTO Dark Matter or OpenStreetMap raster/vector tiles as the base map layer.
* Set default initial camera position:
  * Projection: Globe (`globe`) or Mercator (`mercator`)
  * Latitude: `20.0`, Longitude: `0.0`, Zoom Level: `2.5`

### 3.2 Dataset Structure (`/public/data/`)
Data is divided into static base geographies and dynamic state files loaded on demand.

#### A. Scenario Index Manifest (`manifest.json`)
```json
{
  "scenarios": [
    {
      "id": "roman-expansion-218bc",
      "title": "Second Punic War (218 BC)",
      "category": "Historical",
      "dataFile": "/data/scenarios/roman-expansion-218bc.json"
    },
    {
      "id": "modern-de-facto",
      "title": "Modern De Facto Control",
      "category": "Geopolitical",
      "dataFile": "/data/scenarios/modern-de-facto.json"
    }
  ]
}
```

#### B. GeoJSON Layer Format (`/data/scenarios/<scenario-id>.json`)
Standard FeatureCollection where each feature holds styling and rich metadata properties:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "f_rome_218bc",
      "geometry": {
        "type": "Polygon",
        "coordinates": [ ... ]
      },
      "properties": {
        "name": "Roman Republic",
        "faction": "Rome",
        "fillColor": "#C0392B",
        "fillOpacity": 0.6,
        "strokeColor": "#922B21",
        "strokeWidth": 2,
        "hatchPattern": "none",
        "summary": "The Roman Republic prior to the outbreak of the Second Punic War.",
        "capital": "Rome",
        "ruler": "Consuls Publius Cornelius Scipio & Tiberius Sempronius Longus"
      }
    }
  ]
}
```

---

## 4. Functional Requirements

### Feature 1: Scenario Selector
* **UI Location:** Top-left floating overlay panel.
* **Behavior:** Dropdown/Modal populated from `manifest.json`. Selecting a new scenario triggers a dynamic fetch of the target GeoJSON payload and replaces the active deck.gl layer data.

### Feature 2: High-Performance WebGL Overlay (deck.gl)
* Render boundaries, zones, and regions using `GeoJsonLayer`.
* **Styling props dynamically evaluated per feature:**
  * `getFillColor`: Array `[r, g, b, a]` parsed from feature properties.
  * `getLineColor`: Array `[r, g, b, a]` for borders.
  * `getLineWidth`: Numeric border weight.
* **Interactivity:**
  * On Hover: Highlight feature with a brighter border and show cursor tooltip displaying `properties.name`.
  * On Click: Trigger inspector panel population and fly camera to polygon center if configured.

### Feature 3: Detail Inspector Sidebar
* **UI Location:** Right-side slide-over panel (width: 380px).
* **Behavior:** Appears when a polygon/region is clicked on the map.
* **Data Displayed:**
  * Title (`properties.name`)
  * Controlling Faction (`properties.faction`)
  * Rich Summary / Markdown (`properties.summary`)
  * Key Metadata Key-Value pairs (`capital`, `ruler`, `status`, etc.)
* **Close Action:** Clicking map background or `X` button closes sidebar and clears active selection state.

---

## 5. Non-Functional Requirements & Performance Targets

* **Initial Load Time:** First Contentful Paint under 1.5s; Map interactive in under 2.5s.
* **Frame Rate:** Maintain smooth 60 FPS panning/zooming with up to 10,000 active vector coordinates on screen.
* **Responsiveness:** Support viewports from desktop (1920x1080) down to mobile touchscreens (375x667) with collapsible sidebar.

---

## 6. Implementation Checklist for Coding Agent

- [ ] **Setup:** Initialize Next.js project with TypeScript, Tailwind CSS, `lucide-react`, `react-map-gl`, `maplibre-gl`, and `@deck.gl/react`.
- [ ] **Components:**
  - [ ] `components/Map.tsx`: Main map component initializing MapLibre GL and deck.gl layer controls.
  - [ ] `components/ScenarioSelector.tsx`: Dropdown component for picking active datasets.
  - [ ] `components/InspectorSidebar.tsx`: UI drawer for region metadata display.
- [ ] **State Management:** Implement React state/Zustand store tracking `activeScenarioId`, `selectedFeature`, and `hoveredFeature`.
- [ ] **Data Mock:** Create sample dataset in `/public/data/scenarios/demo.json` containing 3 distinct polygons with full properties to test layer rendering.