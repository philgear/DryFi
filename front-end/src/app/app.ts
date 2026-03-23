import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WeatherService } from './services/weather.service';
import { SolarService, computeSunPosition } from './services/solar.service';
import { CommonModule, DatePipe } from '@angular/common';
import { environment } from '../environments/environment';

export interface ConstellationNode {
  name: string;
  path: string;
  color: string;
  delay: number;
  duration: number;
  textPos: {x: number, y: number};
  stars: {x: number, y: number, r: number, color: string}[];
}

export const CONSTELLATION_MAP: ConstellationNode[] = [
  {
    name: "Orion",
    path: "M -150,100 L -220,180 L -180,230 L -200,300 L -80,260 L -140,210 L -150,100",
    color: "rgba(45,212,191,0.5)",
    delay: 0,
    duration: 18,
    textPos: { x: -180, y: 345 },
    stars: [
      { x: -150, y: 100, r: 6, color: "rgba(251,191,36,0.8)" },
      { x: -220, y: 180, r: 4, color: "rgba(45,212,191,0.8)" },
      { x: -200, y: 300, r: 7, color: "rgba(45,212,191,0.9)" },
      { x: -80,  y: 260, r: 4, color: "rgba(45,212,191,0.8)" },
      { x: -140, y: 210, r: 3, color: "rgba(255,255,255,0.8)" },
      { x: -160, y: 220, r: 3, color: "rgba(255,255,255,0.8)" },
      { x: -180, y: 230, r: 3, color: "rgba(255,255,255,0.8)" }
    ]
  },
  {
    name: "Ursa Major",
    path: "M 200,-300 L 260,-280 L 320,-250 L 350,-200 L 340,-150 L 420,-130 L 450,-200 L 350,-200", 
    color: "rgba(251,191,36,0.5)",
    delay: 4,
    duration: 20,
    textPos: { x: 310, y: -80 },
    stars: [
      { x: 200, y: -300, r: 5, color: "rgba(255,255,255,0.8)" },
      { x: 260, y: -280, r: 5, color: "rgba(255,255,255,0.8)" },
      { x: 320, y: -250, r: 4, color: "rgba(255,255,255,0.8)" },
      { x: 350, y: -200, r: 4, color: "rgba(255,255,255,0.8)" },
      { x: 340, y: -150, r: 4, color: "rgba(255,255,255,0.8)" },
      { x: 420, y: -130, r: 6, color: "rgba(255,255,255,0.9)" },
      { x: 450, y: -200, r: 6, color: "rgba(255,255,255,0.9)" }
    ]
  },
  {
    name: "Cassiopeia",
    path: "M -400,-300 L -340,-260 L -280,-330 L -230,-270 L -160,-320",
    color: "rgba(45,212,191,0.5)",
    delay: 8,
    duration: 15,
    textPos: { x: -330, y: -375 },
    stars: [
      { x: -400, y: -300, r: 5, color: "rgba(255,255,255,0.8)" },
      { x: -340, y: -260, r: 5, color: "rgba(255,255,255,0.8)" },
      { x: -280, y: -330, r: 4, color: "rgba(255,255,255,0.8)" },
      { x: -230, y: -270, r: 4, color: "rgba(255,255,255,0.8)" },
      { x: -160, y: -320, r: 5, color: "rgba(255,255,255,0.8)" }
    ]
  },
  {
    name: "Cygnus",
    path: "M 50,-100 L 120,-50 L 150,20 M 80,-20 L 120,-50 L 180,-120", 
    color: "rgba(167,139,250,0.5)",
    delay: 12,
    duration: 18,
    textPos: { x: 100, y: 70 },
    stars: [
      { x: 50,  y: -100, r: 7, color: "rgba(255,255,255,0.9)" }, // Deneb
      { x: 120, y: -50,  r: 5, color: "rgba(255,255,255,0.8)" },
      { x: 150, y: 20,   r: 4, color: "rgba(251,191,36,0.8)" },  // Albireo
      { x: 80,  y: -20,  r: 4, color: "rgba(255,255,255,0.8)" },
      { x: 180, y: -120, r: 4, color: "rgba(255,255,255,0.8)" }
    ]
  },
  {
    name: "Scorpius",
    path: "M 100,200 L 180,250 L 220,320 L 300,350 L 380,300 M 220,320 L 250,260",
    color: "rgba(251,113,133,0.5)",
    delay: 16,
    duration: 22,
    textPos: { x: 260, y: 400 },
    stars: [
      { x: 100, y: 200, r: 7, color: "rgba(248,113,113,0.9)" }, // Antares
      { x: 180, y: 250, r: 4, color: "rgba(255,255,255,0.8)" },
      { x: 220, y: 320, r: 4, color: "rgba(255,255,255,0.8)" },
      { x: 300, y: 350, r: 4, color: "rgba(255,255,255,0.8)" },
      { x: 380, y: 300, r: 5, color: "rgba(255,255,255,0.8)" },
      { x: 250, y: 260, r: 4, color: "rgba(255,255,255,0.8)" }
    ]
  }
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  /** Expose Math so template attribute bindings can use it. */
  readonly Math = Math;
  readonly constellations = CONSTELLATION_MAP;
  isSearching = signal(false);

  // Globe interactivity state
  globeRotX = signal(0);
  globeRotY = signal(0);
  globeHovered = signal(false);
  isGlobeDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private animationFrameId: number | null = null;
  private autoSpinSpeed = 0.05; // Degrees per frame
  private dragDistance = 0;

  /** Map rotation to CSS background position percentages */
  globeBgPosX = computed(() => (this.globeRotX() / 360) * 200);
  globeBgPosY = computed(() => (this.globeRotY() / 180) * 100);

  /** Pinpoint Math: stick the GPS dot accurately to the sliding equirectangular map layer */
  sitePinX = computed(() => {
    // Math: The map is 200% the width of the container. 
    // Container sees 180° at a time. The dot maps from 0 to 200%.
    const imageDotPct = ((this.solarService.lon() + 180) / 360) * 200;
    // Panning scrubs the map left based exactly on globeBgPosX().
    let rawX = imageDotPct - this.globeBgPosX();
    // Smooth endless wrapping to match background-repeat: repeat-x
    rawX = ((rawX % 200) + 200) % 200;
    return rawX;
  });

  sitePinY = computed(() => {
    // Equirectangular Y mapping (90N to 90S over 100% height since we cropped Y)
    // Wait, if map height is 200%, the image is double height, but container is 100%.
    // Mapping 90 to -90 exactly:
    return ((90 - this.solarService.lat()) / 180) * 100;
  });

  sitePinVisible = computed(() => {
    // The Container width is exactly 100%. The image is 200% wide.
    // If the dot's X wrapped coordinate is > 100%, it is physically behind the globe!
    // We cull it to respect the 3D sphere illusion.
    const x = this.sitePinX();
    return x >= 0 && x <= 100;
  });

  /** 
   * Orbital Astrolabe Engine: 
   * Translates physical Azimuth variables into pure 360° top-down rotation mechanics.
   */
  sunOrbitRot = computed(() => {
    // 0 = North (Top), 90 = East (Right), 180 = South (Bottom), 270 = West (Left)
    // sunPosition().azimuthDeg perfectly drives the CSS rotation axis automatically!
    return this.solarService.sunPosition().azimuthDeg;
  });

  moonOrbitRot = computed(() => {
    // Synodic tracking: New Moon (Phase 0) overlaps the Sun.
    // Full Moon (Phase 0.5) is exactly 180° physically opposed.
    // The Moon lags behind the Sun 360° per month.
    const phase = this.solarService.moonPhase(); 
    const sunAz = this.solarService.sunPosition().azimuthDeg;
    // Mathematically lag the Lunar ring entirely behind the Sun's rotation.
    let lunarAz = sunAz - (phase * 360);
    // Wrap to strict 0-360 range.
    return ((lunarAz % 360) + 360) % 360;
  });

  // Chronometric Global Tracking Matrix
  currentTime = signal(new Date());

  // Local Sidereal Time Rotation (aligns sky chart geometrically to the Earth's spin)
  siderealRotation = computed(() => {
    const lon = this.solarService.lon();
    const date = this.currentTime();
    
    // Julian Days since J2000.0
    const d = date.getTime() / 86400000 - 10957.5; 
    
    // Approximate Local Sidereal Time in hours (0-24)
    let lst = (18.697374558 + 24.06570982441908 * d + lon / 15) % 24;
    if (lst < 0) lst += 24; 
    
    // Convert to degrees (15 degrees per astronomical hour)
    return lst * 15;
  });

  worldClocks = computed(() => {
    const now = this.currentTime();
    // Standard US 12-hour AM/PM Format applied universally
    const formatTime = (tz: string) => new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(now);

    return [
      // Top-Left (2x5 USA Grid)
      // Row 1
      { id: 'HNL', label: 'Honolulu', lat: 21.3069, lon: -157.8583, group: 'TL', time: formatTime('Pacific/Honolulu') },
      { id: 'ANC', label: 'Anchorage', lat: 61.2181, lon: -149.9003, group: 'TL', time: formatTime('America/Anchorage') },
      // Row 2
      { id: 'LAX', label: 'Los Angeles', lat: 34.0522, lon: -118.2437, group: 'TL', time: formatTime('America/Los_Angeles') },
      { id: 'DEN', label: 'Denver', lat: 39.7392, lon: -104.9903, group: 'TL', time: formatTime('America/Denver') },
      // Row 3
      { id: 'PHX', label: 'Phoenix', lat: 33.4484, lon: -112.0740, group: 'TL', time: formatTime('America/Phoenix') },
      { id: 'ORD', label: 'Chicago', lat: 41.8781, lon: -87.6298, group: 'TL', time: formatTime('America/Chicago') },
      // Row 4
      { id: 'IAH', label: 'Houston', lat: 29.7604, lon: -95.3698, group: 'TL', time: formatTime('America/Chicago') },
      { id: 'ATL', label: 'Atlanta', lat: 33.7490, lon: -84.3880, group: 'TL', time: formatTime('America/New_York') },
      // Row 5
      { id: 'NYC', label: 'New York', lat: 40.7128, lon: -74.0060, group: 'TL', time: formatTime('America/New_York') },
      { id: 'MIA', label: 'Miami', lat: 25.7617, lon: -80.1918, group: 'TL', time: formatTime('America/New_York') },
        
      // Top-Right (Europe)
      { id: 'LHR', label: 'London', lat: 51.5074, lon: -0.1278, group: 'TR', time: formatTime('Europe/London') },
      { id: 'CDG', label: 'Paris', lat: 48.8566, lon: 2.3522, group: 'TR', time: formatTime('Europe/Paris') },
        
      // Bottom-Left (Middle East & Asia)
      { id: 'DXB', label: 'Dubai', lat: 25.2048, lon: 55.2708, group: 'BL', time: formatTime('Asia/Dubai') },
      { id: 'BOM', label: 'Mumbai', lat: 19.0760, lon: 72.8777, group: 'BL', time: formatTime('Asia/Kolkata') },
        
      // Bottom-Right (Asia & Oceania)
      { id: 'TYO', label: 'Tokyo', lat: 35.6762, lon: 139.6503, group: 'BR', time: formatTime('Asia/Tokyo') },
      { id: 'SYD', label: 'Sydney', lat: -33.8688, lon: 151.2093, group: 'BR', time: formatTime('Australia/Sydney') }
    ];
  });

  tlClocks = computed(() => this.worldClocks().filter(c => c.group === 'TL'));
  trClocks = computed(() => this.worldClocks().filter(c => c.group === 'TR'));
  blClocks = computed(() => this.worldClocks().filter(c => c.group === 'BL'));
  brClocks = computed(() => this.worldClocks().filter(c => c.group === 'BR'));

  teleportToClock(clock: any) {
    this.solarService.updateLocation(clock.lat, clock.lon, clock.label.toUpperCase());
    this.weatherService.fetchData(clock.lat, clock.lon);
  }

  // Physical Geometric Forecast Plotters
  forecastNodes = computed(() => {
    const nodes = this.weatherService.forecastArray();
    return nodes.map(node => ({
      ...node,
      azimuth: computeSunPosition(node.dt, this.solarService.lat(), this.solarService.lon()).azimuthDeg
    }));
  });

  // Topological Twilight Ring Geometry
  private getAzimuthArc(start: Date, end: Date) {
    let startAz = computeSunPosition(start, this.solarService.lat(), this.solarService.lon()).azimuthDeg;
    let endAz = computeSunPosition(end, this.solarService.lat(), this.solarService.lon()).azimuthDeg;
    let rot = startAz - 90; // Align Native SVG 0° (East) to Cartographic 0° (North)
    let diff = endAz - startAz;
    if (diff < 0) diff += 360;

    const radius = 200; // Physical Solar Ring
    const circ = 2 * Math.PI * radius;
    const arcLen = (diff / 360) * circ;
    
    return { rot, circ, offset: circ - arcLen };
  }

  goldenHourArcs = computed(() => {
    const day = this.solarService.solarDay();
    const arr = [];
    if (day.goldenHourMorningStart && day.goldenHourMorningEnd) {
      arr.push(this.getAzimuthArc(day.goldenHourMorningStart, day.goldenHourMorningEnd));
    }
    if (day.goldenHourEveningStart && day.goldenHourEveningEnd) {
      arr.push(this.getAzimuthArc(day.goldenHourEveningStart, day.goldenHourEveningEnd));
    }
    return arr;
  });

  blueHourArcs = computed(() => {
    const day = this.solarService.solarDay();
    const arr = [];
    if (day.blueHourMorningStart && day.blueHourMorningEnd) {
      arr.push(this.getAzimuthArc(day.blueHourMorningStart, day.blueHourMorningEnd));
    }
    if (day.blueHourEveningStart && day.blueHourEveningEnd) {
      arr.push(this.getAzimuthArc(day.blueHourEveningStart, day.blueHourEveningEnd));
    }
    return arr;
  });

  // Intercept Geographic Search input mapping directly to OpenWeather
  searchLocation(event: Event) {
    event.preventDefault();
    const formUrl = event.target as HTMLFormElement;
    const input = formUrl.querySelector('input') as HTMLInputElement;
    const query = input?.value?.trim();
    if (!query) return;

    this.isSearching.set(true);
    // Explicit API routing internally maps via weather service matrix
    this.weatherService.geocode(query).subscribe({
      next: (res) => {
        this.isSearching.set(false);
        if (res && res.length > 0) {
          // Resolves City/String payloads
          const loc = res[0];
          this.solarService.updateLocation(loc.lat, loc.lon, `${loc.name}${loc.state ? ', ' + loc.state : ''}`);
          this.weatherService.fetchData(loc.lat, loc.lon);
          input.value = '';
          input.blur();
        } else if (res && res.lat) {
          // Resolves US explicit Zip Code integers
          this.solarService.updateLocation(res.lat, res.lon, res.name);
          this.weatherService.fetchData(res.lat, res.lon);
          input.value = '';
          input.blur();
        }
      },
      error: () => this.isSearching.set(false)
    });
  }

  constructor(
    public weatherService: WeatherService,
    public solarService: SolarService,
  ) {}

  ngOnInit() {
    this.weatherService.fetchData();
    this.startGlobeAnimation();
    setInterval(() => this.currentTime.set(new Date()), 60000); // Ticking 1m Chronometer
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // Globe Drag Events
  startGlobeDrag(event: MouseEvent | TouchEvent) {
    this.isGlobeDragging = true;
    this.dragDistance = 0;
    if (event instanceof MouseEvent) {
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    } else if (event.touches?.length) {
      this.lastMouseX = event.touches[0].clientX;
      this.lastMouseY = event.touches[0].clientY;
    }
  }

  onGlobeDrag(event: MouseEvent | TouchEvent) {
    if (!this.isGlobeDragging) return;
    
    let currentX = 0;
    let currentY = 0;
    
    if (event instanceof MouseEvent) {
      currentX = event.clientX;
      currentY = event.clientY;
    } else if (event.touches?.length) {
      currentX = event.touches[0].clientX;
      currentY = event.touches[0].clientY;
    }

    const deltaX = currentX - this.lastMouseX;
    const deltaY = currentY - this.lastMouseY;
    
    this.dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
    
    this.lastMouseX = currentX;
    this.lastMouseY = currentY;

    // Adjust sensitivity: 0.5 degrees per pixel
    this.globeRotX.update(v => v - deltaX * 0.5);
    
    // Clamp Y rotation to avoid spinning over the poles
    this.globeRotY.update(v => {
      let newY = v - deltaY * 0.5;
      return Math.max(-45, Math.min(45, newY));
    });
  }

  endGlobeDrag() {
    this.isGlobeDragging = false;
  }

  async onGlobeClick(event: MouseEvent) {
    if (this.dragDistance > 5) return;

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const rectX = event.clientX - rect.left;
    const rectY = event.clientY - rect.top;

    const p = this.globeRotX();
    let image_x = (rectX + 1.8 * p) % 360;
    if (image_x < 0) image_x += 360;
    
    const clickLon = image_x - 180;
    const clickLat = 90 - (rectY / 180) * 90;

    try {
      this.isSearching.set(true);
      const res = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${clickLat}&lon=${clickLon}&limit=1&appid=${environment.OPEN_WEATHER_KEY}`);
      const data = await res.json();
      
      let locName = `LAT ${clickLat.toFixed(1)}° LON ${clickLon.toFixed(1)}°`;
      if (data && data.length > 0) {
        locName = data[0].name + (data[0].state ? `, ${data[0].state}` : '') + (data[0].country ? `, ${data[0].country}` : '');
      }
      
      this.solarService.updateLocation(clickLat, clickLon, locName.toUpperCase());
      this.weatherService.fetchData(clickLat, clickLon);
      
    } catch (e) {
      console.error("Globe Telemetry Sync Error", e);
    } finally {
      this.isSearching.set(false);
    }
  }

  private startGlobeAnimation() {
    const tick = () => {
      // Auto-spin if not hovered and not spinning
      if (!this.globeHovered() && !this.isGlobeDragging) {
        this.globeRotX.update(v => v + this.autoSpinSpeed);
        // Slowly return Y back to equator (0)
        this.globeRotY.update(v => {
          if (Math.abs(v) < 0.1) return 0;
          return v * 0.98;
        });
      }
      this.animationFrameId = requestAnimationFrame(tick);
    };
    tick();
  }

  /** Format a Date as HH:MM in the browser's local timezone */
  fmtTime(d: Date): string {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Compute {cx, cy} for the sun dot on the SVG semi-arc.
   * Arc center: (100, 99), radius: 94.
   * elevation 0° → left horizon (angle 180° from east = left)
   * elevation 90° → zenith (top)
   * We map elevation 0–90 to arc angle 180°→90° (i.e. going right-to-left over the top).
   */
  sunDotCoords(): { cx: number; cy: number } {
    const el = this.solarService.sunPosition().elevationDeg;
    // Clamp to 0–90, map to radians spanning π (left horizon) → π/2 (zenith)
    const clamped = Math.max(0, Math.min(90, el));
    const angle = Math.PI - (clamped / 90) * (Math.PI / 2);
    return {
      cx: 100 + 94 * Math.cos(angle),
      cy: 99 - 94 * Math.sin(angle),
    };
  }

  /** Colour class for UV risk tier */
  uvColourClass(): string {
    switch (this.solarService.uvRisk()) {
      case 'Low':       return 'bg-emerald-400';
      case 'Moderate':  return 'bg-yellow-400';
      case 'High':      return 'bg-orange-400';
      case 'Very High': return 'bg-red-500';
      case 'Extreme':   return 'bg-violet-500';
    }
  }

  uvTextColourClass(): string {
    switch (this.solarService.uvRisk()) {
      case 'Low':       return 'text-emerald-400';
      case 'Moderate':  return 'text-yellow-400';
      case 'High':      return 'text-orange-400';
      case 'Very High': return 'text-red-500';
      case 'Extreme':   return 'text-violet-500';
    }
  }

  minutesToSunsetStr(): string {
    const mins = this.solarService.minutesToSunset();
    if (mins <= 0) return '—';
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return `${h}h ${m}m`;
  }

  fmtDaylight(minutes: number): {h: number, m: string} {
    if (!minutes) return {h: 0, m: '00'};
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60).toString().padStart(2, '0');
    return {h, m};
  }

  /**
   * Generate an SVG path string for the moon's illuminated portion.
   * phase 0 = new (dark), 0.25 = first quarter (right half lit),
   * 0.5 = full (all lit), 0.75 = last quarter (left half lit).
   * Returns an SVG path for a 60×60 viewBox centered at 30,30 r=28.
   */
  moonIlluminationPath(): string {
    const phase = this.solarService.moonPhase();
    const r = 28;
    const cx = 30, cy = 30;

    // Full or new — simple circle
    if (phase < 0.02 || phase > 0.98) {
      return `M${cx},${cy - r} A${r},${r} 0 1,1 ${cx},${cy + r} A${r},${r} 0 1,1 ${cx},${cy - r}`;
    }

    // Compute the curvature of the terminator
    // phase 0→0.5: waxing (right side lit), 0.5→1: waning (left side lit)
    let f: number;
    if (phase <= 0.5) {
      f = 1 - 4 * Math.abs(phase - 0.25); // 0 at new, 1 at first quarter, 0 at full
    } else {
      f = 1 - 4 * Math.abs(phase - 0.75);
    }

    const sweep = phase <= 0.5 ? 1 : 0; // right side first half, left side second
    const terminatorRx = r * Math.abs(1 - 2 * (phase <= 0.5 ? phase * 2 : (phase - 0.5) * 2));
    const largeArc = (phase > 0.25 && phase < 0.75) ? 1 : 0;

    if (phase <= 0.5) {
      // Waxing: lit right half
      return `M${cx},${cy - r} A${r},${r} 0 0,1 ${cx},${cy + r} A${terminatorRx},${r} 0 0,${largeArc} ${cx},${cy - r}`;
    } else {
      // Waning: lit left half
      return `M${cx},${cy - r} A${r},${r} 0 0,0 ${cx},${cy + r} A${terminatorRx},${r} 0 0,${1-largeArc} ${cx},${cy - r}`;
    }
  }
}
