# DryFi — Branch Reference

> IoT Environmental Monitoring Dashboard  
> Angular 21 · Tailwind CSS v4 · Adafruit IO  

---

## Branches

### 🌱 `Observer`
**Role:** Baseline initialization — stripped Angular 21 scaffold  
**Author:** Jennifer Batara  
**Status:** Stable · Read-only reference  

The Observer branch is the initial Angular 21 application scaffold from which all active development branches diverged. It establishes the foundational project architecture:

- Angular 21 workspace with standalone components
- Tailwind CSS v4 integration and `@theme` token layer
- Basic `WeatherService`, `SolarService`, and `SatelliteService` shells
- `environment.ts` pipeline (`generate-env.js` + `.env`)
- Adafruit IO feed endpoint scaffolding
- Core routing and app shell layout

> **Use this branch as a clean starting point** if you need to test a feature in isolation without accumulated Conserver changes.

---

### 🔭 `Conserver`
**Role:** Active development — premium dashboard UI and live telemetry  
**Author:** Jennifer Batara  
**Status:** Active HEAD ✅  
**Base:** Observer  

The Conserver branch is the primary working branch containing all dashboard feature development. It extends Observer with the complete visual, interactive, and data-driven feature set:

#### Frontend Features
- **Paul Klee Glassmorphism Design System** — `slate-950` backgrounds, curated tile palette, `backdrop-blur-2xl` mosaic tiles
- **SkyhookMono Bold** masthead typography with low-poly geometric background mesh
- **Origami Unfold UI Animation** — 3D `perspective(1500px)` entrance sequence staggered per tile
- **Responsive tile grid** — Indoor Telemetry, External Weather, Wind, Solar, Globe, Astrolabe, Eisenhower Matrix

#### Celestial & Astrolabe
- **NOAA Solar Position Algorithm (SPA)** — real-time sun elevation, azimuth, GHI, UV Index
- **Moon Phase Engine** — synodic period calculation, illumination percentage
- **4K Planetary Ephemeris** — 8-planet SVG radial gradient textures (Mercury → Pluto + Saturn rings)
- **Local Sidereal Time** constellation rotation driven by longitude
- **6 Satellite Constellation overlays** — Sentinel-1A, Landsat 9, ICESat-2, WorldView-3, Copernicus DEM, Landsat 8
- **Golden Hour & Blue Hour arc zones** on the astrolabe SVG

#### World Clocks & Geolocation
- **27 World Clock hotspots** across 3 groups: Alpine Glaciers, Supply Chain Ports, Mangrove/Coastal Cities
- **Polar fan layout** — 4 quadrant orbital fans (TL/TR/BL/BR) with sine-arc radial positioning
- **Globe interaction** — drag-to-rotate, click-to-teleport with OpenWeather geocoding
- **Orthographic GPS pin** — spherical `Math.sin()` projection for accurate dot placement
- **Isolated click overlay** — clock buttons extracted from globe drag event container to prevent event absorption

#### Data & Telemetry
- **OpenWeatherMap API** — forecast, temperature, humidity, pressure, wind, precipitation, visibility, cloud cover
- **Adafruit IO** — interior room temperature and humidity feeds
- **SatelliteService** — deterministic geo-mocked NDVI, albedo, and carbon flux metrics
- **`updateLocationAtTime()`** — celestial recalculation using city's local wall-clock time when selecting a world clock

#### Eisenhower Matrix
- **27 Location-specific strategic directives** — unique DO / DECIDE / DELEGATE / DELETE for each hotspot ID
- **Dynamic update** on clock or map selection via `activeHotspot` signal

#### CSS & Animation
- **`.clk-btn` hit-target architecture** — `z-index:9999`, `pointer-events:auto`, `1.5rem` transparent padding
- **Diamond star rendering** — `rotate(45deg)` box-shadow arrays, `border-radius:0` for sharp stellar vertices
- **Stationary constellations** — opacity-only twinkle keyframes, no transform animations
- **Origami particle systems** — heat-rise, wind-rush, vapor-drift, rain-fall per weather metric

---

## Branch Topology

```
master (initial react scaffold, 2019)
  └── Observer  (Angular 21 rewrite scaffold)
        └── Conserver  (active premium dashboard — HEAD)
```

---

## Working Agreement

| Rule | Detail |
|---|---|
| Feature branches | Fork from `Conserver` |
| Hotfixes | PR into `Conserver` with passing build |
| Observer | Never force-push; reference only |
| Build command | `npm run build` from `front-end/` |
| Preview | `npm run preview` from `front-end/` |
| CLI invocations | Always via `npm run ng -- ...` |
