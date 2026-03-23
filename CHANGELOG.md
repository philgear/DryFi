# DryFi — CHANGELOG

All notable changes to the DryFi IoT Environmental Monitoring Dashboard are documented here.  
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Conserver] — Active HEAD
> Branch point: `Observer`  
> Primary author: Jennifer Batara  
> Last commit: `d768294` — *feat: Implemented heatmaps and UI assets*

### ✨ Added

#### Celestial Engine
- `SolarService` NOAA SPA implementation: sun elevation, azimuth, zenith, GHI, UV Index, dawn/dusk
- `computeSunPosition()` and `computeSolarDay()` pure math helpers with full Julian Day calculations
- Moon phase synodic engine: `computeMoonPhase()` returning phase fraction, name, illumination
- Golden Hour and Blue Hour arc zones rendered on the SVG astrolabe
- Planetary ephemeris: Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
  - Orbital radius and azimuth computed via `EphemerisService`
  - 4K radial gradient SVG `<defs>` texture maps per planet
  - Saturn dual-ellipse ring system with 3D tilt emulation
- Local Sidereal Time rotation for the constellation layer (longitude-driven)
- `updateLocationAtTime(lat, lon, name, date)` on `SolarService` for timezone-aware celestial simulation

#### World Clock System
- 27 `insightHotspots` across 3 thematic groups:
  - **ALPINE** (9 locations): Chamonix, Zermatt, Cortina, Innsbruck, Whistler, Banff, Aspen, Niseko, Queenstown
  - **SUPPLY_CHAIN** (9 locations): Rotterdam, Singapore, Panama Canal, Suez Canal, Port of LA, Shanghai, Hamburg, Nhava Sheva, Jebel Ali
  - **MANGROVE** (9 locations): Guayaquil, Sundarbans, Everglades, Mekong Delta, Jakarta, Dakar, Miyako-jima, Maldives, Kiribati
- IANA timezone (`tz`) field on all 27 hotspots
- Polar fan layout: 4 quadrant groups (`trClocks`, `tlClocks`, `brClocks`, `blClocks`) with sine-arc radial positioning
- `getLocalDateForTimezone(tz)` — reconstructs local wall-clock Date for celestial simulation
- Globe spin to center selected longitude on `teleportToHotspot()`
- Cinematic focal zoom (`galaxyZoom`) on location teleport

#### Globe & GPS
- 3D globe via `realistic_earth.png` with `background-position` driven by `--gx` CSS variable
- Globe drag-to-rotate: `startGlobeDrag`, `onGlobeDrag`, `endGlobeDrag` with velocity tracking
- `onGlobeClick()` — OpenWeather geocoding reverse lookup at clicked lat/lon
- Orthographic `sitePinX/Y` computed properties using `Math.sin()` spherical projection
- `sitePinVisible` backface culling (> 90° longitude delta = behind the planet)
- Volumetric cloud overlay with `mix-blend-mode: screen` and mask gradient

#### Eisenhower Matrix
- 27 location-specific strategic directives (DO / DECIDE / DELEGATE / DELETE) keyed by 3-letter hotspot ID
- Matrix activates on globe click, clock click, or geolocation search result
- Fallback generic directives for ad-hoc map picks (`id: 'MAP'`)

#### UI & Design System
- Paul Klee "Masonic Waterfall" color palette: ochre gold, burnt sienna, deep teal, storm abyss, deep violet
- Glassmorphism tiles: `backdrop-blur(16px)`, `rgba(15,23,42,0.55)`, 28px border-radius
- SkyhookMono Bold masthead with low-poly SVG background mesh (`mastheadMesh` trigonometric grid)
- Origami Unfold entrance animation: 3D perspective rotation stagger per tile (0.3s → 2.5s)
- Particle systems: `origami-fall` (rain), `heat-rise` (temperature), `wind-rush` (wind), `vapor-drift` (cloud)
- Diamond star rendering: 1px `rotate(45deg)` box-shadow arrays, `border-radius:0`
- Stationary constellations: opacity-only `starmap-twinkle` keyframes, no transform animations
- 3 independent dense star background layers (`starmap-bg-1/2/3`) at 1.5s / 2.2s / 2.8s intervals
- Wind tile: windsock SVG animation driven by `current_wind` signal

#### Services & Data
- `WeatherService`: OpenWeather forecast API — temp, humidity, precipitation, wind, pressure, cloud, feels-like, visibility, weather description
- `SatelliteService`: deterministic geo-mocked NDVI, albedo index, and carbon flux based on lat/lon seed
- `EphemerisService`: planetary orbital data provider
- `generate-env.js` prebuild script: `environment.ts` auto-generated from `.env`

#### Interaction Architecture
- Click overlay div (`z-index:40; pointer-events:none`) isolated from globe's `(window:mouseup)` drag trap
- `.clk-btn` CSS class: `z-index:9999 !important; pointer-events:auto !important; padding:1.5rem` hit-target expansion
- Geolocation search engine with live `isSearching()` indicator and OpenWeather geocode API
- `teleportToClock()` → `teleportToHotspot()` with timezone-aware solar recalculation

### 🔧 Changed
- `getFanStyle()` simplified to return only `{ left, right, top, bottom }` — structural CSS moved to `.clk-btn`
- `#tick()` refactored to delegate to `#tickAt(date)` for arbitrary date injection
- Globe center offset corrected: `globeRotX = lon + 90` aligns map to visual front-center

### 🐛 Fixed
- Clock buttons moved outside `overflow:hidden` globe drag container — eliminates `(window:mouseup)` event absorption
- `type="button"` added to clock `<button>` elements to prevent implicit form submission page reload
- Globe `background-position` formula corrected: `(leftLon + 180) / 360 * 100` → proper hemisphere alignment
- Orthographic GPS pin formula corrected from linear to `Math.sin()` arc projection

---

## [Observer] — Baseline Scaffold
> Branch point: `master` (legacy React)  
> Commit: `68f792c` — *feat: Initialize new Angular frontend file structure*

### ✨ Added
- Angular 21 workspace scaffold (`front-end/`)
- Tailwind CSS v4 with `@theme` token configuration in `styles.css`
- Standalone component architecture (`app.ts`, `app.html`, `app.css`)
- Initial service shells: `WeatherService`, `SolarService`, `SatelliteService`
- `environment.ts` with `OPEN_WEATHER_KEY`, `SITE_LAT`, `SITE_LON`, `IOT_ENDPOINT_URL`, `IOT_KEY`
- `generate-env.js` prebuild environment injection script
- Basic Adafruit IO sensor feed endpoints (`/temperature`, `/humidity`)
- `AGENTS.md` — Tech stack and design directives for AI agents
- `GEMINI.md` — Gemini-specific workflow rules for the DryFi project
- IBM Plex Mono, SkyhookMono Bold webfonts
- Vite build configuration with Angular adapter

### 🗑️ Removed (vs. master)
- Legacy React prototype (`master` branch) — replaced by Angular 21

---

## [master] — Legacy Prototype
> Commit: `8d01b77` — *basic setup with react*  
> Status: **Archived — do not develop against**

- Initial React + basic sensor read project
- Config model stub (`config_model`)
- Pre-dates the DryFi IoT dashboard rewrite
