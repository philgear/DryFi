import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WeatherService } from './services/weather.service';
// @ts-ignore
import { SatelliteService } from './services/satellite.service';
import { SolarService, computeSunPosition } from './services/solar.service';
import { EphemerisService } from './services/ephemeris.service';
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

export const SATELLITE_ORBITS: ConstellationNode[] = [
  {
    name: "Sentinel-1A (SAR)",
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
    name: "Landsat 9 (OLI)",
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
    name: "ICESat-2 (ATLAS)",
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
    name: "SMAP (Radar)",
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
    name: "Copernicus DEM",
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
  readonly constellations = SATELLITE_ORBITS;
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

  /** Pinpoint Math (Phase 12 GPS Precision): Lock GPS strictly to visible Astrolabe window */
  sitePinX = computed(() => {
    // The globe is visually a hemisphere showing exactly 180 degrees of longitude.
    // The visible center longitude is globeRotX.
    // Left edge is globeRotX - 90. Right edge is globeRotX + 90.
    const centerLon = this.globeRotX();
    let deltaLon = this.solarService.lon() - centerLon;
    
    // Normalize shortest path
    while (deltaLon > 180) deltaLon -= 360;
    while (deltaLon < -180) deltaLon += 360;
    
    // Spherical Orthographic Projection (visually arcs the motion wrapping around the sphere)
    // Using simple Sine arc mapping for hyper-realism: sin(angle)
    const normalizedX = Math.sin(deltaLon * (Math.PI / 180));
    return 50 + (normalizedX * 50);
  });

  sitePinY = computed(() => {
    const lat = Math.max(-90, Math.min(90, this.solarService.lat()));
    // Orthographic spherical mapping for the Y-axis:
    const normalizedY = Math.sin(lat * (Math.PI / 180));
    return 50 - (normalizedY * 50);
  });

  sitePinVisible = computed(() => {
    // With orthographic spherical mapping, if the longitude delta falls geometrically outside 
    // the 90 degree forward-facing hemisphere bounds, it is mathematically behind the planet.
    const centerLon = this.globeRotX();
    let deltaLon = this.solarService.lon() - centerLon;
    while (deltaLon > 180) deltaLon -= 360;
    while (deltaLon < -180) deltaLon += 360;
    
    return Math.abs(deltaLon) <= 90;
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

  insightHotspots = computed(() => {
    const now = this.currentTime();
    // Standard US 12-hour AM/PM Format applied universally
    const formatTime = (tz: string) => new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(now);

    return [
      // Alpine Glaciers (Tracking: Retreat & Snow Cover)
      { id: 'CHX', label: 'Chamonix, FR', lat: 45.9237, lon: 6.8694, group: 'ALPINE', tz: 'Europe/Paris', time: formatTime('Europe/Paris') },
      { id: 'ZRM', label: 'Zermatt, CH', lat: 46.0207, lon: 7.7491, group: 'ALPINE', tz: 'Europe/Zurich', time: formatTime('Europe/Zurich') },
      { id: 'CRT', label: 'Cortina, IT', lat: 46.5405, lon: 12.1357, group: 'ALPINE', tz: 'Europe/Rome', time: formatTime('Europe/Rome') },
      { id: 'INN', label: 'Innsbruck, AT', lat: 47.2692, lon: 11.4041, group: 'ALPINE', tz: 'Europe/Vienna', time: formatTime('Europe/Vienna') },
      { id: 'WHS', label: 'Whistler, CA', lat: 50.1163, lon: -122.9574, group: 'ALPINE', tz: 'America/Vancouver', time: formatTime('America/Vancouver') },
      { id: 'BNF', label: 'Banff, CA', lat: 51.1784, lon: -115.5708, group: 'ALPINE', tz: 'America/Edmonton', time: formatTime('America/Edmonton') },
      { id: 'ASP', label: 'Aspen, US', lat: 39.1911, lon: -106.8175, group: 'ALPINE', tz: 'America/Denver', time: formatTime('America/Denver') },
      { id: 'NIU', label: 'Niseko, JP', lat: 42.8048, lon: 140.6874, group: 'ALPINE', tz: 'Asia/Tokyo', time: formatTime('Asia/Tokyo') },
      { id: 'QST', label: 'Queenstown, NZ', lat: -45.0312, lon: 168.6626, group: 'ALPINE', tz: 'Pacific/Auckland', time: formatTime('Pacific/Auckland') },

      // Innovative Net-Zero Supply Chain (Tracking: Carbon Flux)
      { id: 'RTM', label: 'Port of Rotterdam', lat: 51.9244, lon: 4.4777, group: 'SUPPLY_CHAIN', tz: 'Europe/Amsterdam', time: formatTime('Europe/Amsterdam') },
      { id: 'SGP', label: 'Singapore Strait', lat: 1.3521, lon: 103.8198, group: 'SUPPLY_CHAIN', tz: 'Asia/Singapore', time: formatTime('Asia/Singapore') },
      { id: 'PAN', label: 'Panama Canal', lat: 9.0800, lon: -79.6800, group: 'SUPPLY_CHAIN', tz: 'America/Panama', time: formatTime('America/Panama') },
      { id: 'SUE', label: 'Suez Canal', lat: 30.5852, lon: 32.2654, group: 'SUPPLY_CHAIN', tz: 'Africa/Cairo', time: formatTime('Africa/Cairo') },
      { id: 'PLA', label: 'Port of LA', lat: 33.7288, lon: -118.2620, group: 'SUPPLY_CHAIN', tz: 'America/Los_Angeles', time: formatTime('America/Los_Angeles') },
      { id: 'SHG', label: 'Shanghai Port', lat: 31.2304, lon: 121.4737, group: 'SUPPLY_CHAIN', tz: 'Asia/Shanghai', time: formatTime('Asia/Shanghai') },
      { id: 'HAM', label: 'Port of Hamburg', lat: 53.5511, lon: 9.9937, group: 'SUPPLY_CHAIN', tz: 'Europe/Berlin', time: formatTime('Europe/Berlin') },
      { id: 'NWH', label: 'Nhava Sheva, IN', lat: 18.9493, lon: 72.9525, group: 'SUPPLY_CHAIN', tz: 'Asia/Kolkata', time: formatTime('Asia/Kolkata') },
      { id: 'JEB', label: 'Jebel Ali, AE', lat: 24.9857, lon: 55.0273, group: 'SUPPLY_CHAIN', tz: 'Asia/Dubai', time: formatTime('Asia/Dubai') },
        
      // Mangroves and Coastal Cities (Tracking: NDVI & Inundation)
      { id: 'GYQ', label: 'Greater Guayaquil', lat: -2.1894, lon: -79.8891, group: 'MANGROVE', tz: 'America/Guayaquil', time: formatTime('America/Guayaquil') },
      { id: 'SUN', label: 'Sundarbans, IN', lat: 21.9497, lon: 89.1833, group: 'MANGROVE', tz: 'Asia/Kolkata', time: formatTime('Asia/Kolkata') },
      { id: 'EVG', label: 'Everglades, FL', lat: 25.2866, lon: -80.8987, group: 'MANGROVE', tz: 'America/New_York', time: formatTime('America/New_York') },
      { id: 'MEK', label: 'Mekong Delta', lat: 10.0333, lon: 105.7833, group: 'MANGROVE', tz: 'Asia/Ho_Chi_Minh', time: formatTime('Asia/Ho_Chi_Minh') },
      { id: 'JAK', label: 'Jakarta Bay, ID', lat: -6.2088, lon: 106.8456, group: 'MANGROVE', tz: 'Asia/Jakarta', time: formatTime('Asia/Jakarta') },
      { id: 'DAK', label: 'Dakar Coast, SN', lat: 14.7167, lon: -17.4677, group: 'MANGROVE', tz: 'Africa/Dakar', time: formatTime('Africa/Dakar') },
      { id: 'MIY', label: 'Miyako-jima, JP', lat: 24.8055, lon: 125.2811, group: 'MANGROVE', tz: 'Asia/Tokyo', time: formatTime('Asia/Tokyo') },
      { id: 'MDV', label: 'Maldives Coastal', lat: 3.2028, lon: 73.2207, group: 'MANGROVE', tz: 'Indian/Maldives', time: formatTime('Indian/Maldives') },
      { id: 'KIR', label: 'Kiribati Atolls', lat: -3.3704, lon: -168.7340, group: 'MANGROVE', tz: 'Pacific/Tarawa', time: formatTime('Pacific/Tarawa') }
    ];
  });

  // Typographical Background Low-Poly Mathematical Matrix for "Skyhook"
  mastheadMesh = [
    { pY: 50, a1: 0, a2: 0, a3: 0 },
    { pY: 35, a1: 15, a2: -10, a3: 25 },
    { pY: 60, a1: -20, a2: 15, a3: -35 },
    { pY: 25, a1: 30, a2: -20, a3: 45 },
    { pY: 70, a1: -25, a2: 20, a3: -40 },
    { pY: 45, a1: 15, a2: -15, a3: 20 },
    { pY: 55, a1: -10, a2: 10, a3: -15 }
  ];

  alpineHotspots = computed(() => this.insightHotspots().filter((c: {group: string}) => c.group === 'ALPINE'));
  supplyChainHotspots = computed(() => this.insightHotspots().filter((c: {group: string}) => c.group === 'SUPPLY_CHAIN'));
  mangroveHotspots = computed(() => this.insightHotspots().filter((c: {group: string}) => c.group === 'MANGROVE'));

  // Clock Quadrant Mapping for the UI
  tlClocks = computed(() => this.alpineHotspots());
  trClocks = computed(() => this.supplyChainHotspots());
  blClocks = computed(() => this.mangroveHotspots().slice(0, Math.ceil(this.mangroveHotspots().length / 2)));
  brClocks = computed(() => this.mangroveHotspots().slice(Math.ceil(this.mangroveHotspots().length / 2)));

  // Dynamic Polar Coordinate Engine for "Fanning" the Quadrant Clocks
  getFanStyle(quadrant: 'TL'|'TR'|'BL'|'BR'|'TR_REFLECT'|'BR_REFLECT'|'TL_REFLECT'|'BL_REFLECT', index: number, total: number): any {
    // Escalate the sweeping progression across the quadrant indices
    const progress = total > 1 ? index / (total - 1) : 0; 
    
    // Sweep the fan from 15 degrees to 75 degrees (creating a beautiful corner arc)
    const sweepStart = 15;
    const sweepEnd = 75;
    const angleDeg = sweepStart + (progress * (sweepEnd - sweepStart));
    const angleRad = angleDeg * (Math.PI / 180);
    
    // Touch the absolute corner (radius 0) and dynamically sprawl out with ample spacing!
    const radius = 0 + (index * 65); 
    
    const dx = radius * Math.cos(angleRad);
    const dy = radius * Math.sin(angleRad);

    let left = 'auto', right = 'auto', top = 'auto', bottom = 'auto';

    // Apply the absolute anchor offsets intrinsically using CSS calc!
    if (quadrant === 'TL') { left = `calc(5.5rem + ${dx}px)`; top = `calc(3.5rem + ${dy}px)`; }
    if (quadrant === 'TR') { right = `calc(5.5rem + ${dx}px)`; top = `calc(3.5rem + ${dy}px)`; }
    if (quadrant === 'BL') { left = `calc(5.5rem + ${dx}px)`; bottom = `calc(3.5rem + ${dy}px)`; }
    if (quadrant === 'BR') { right = `calc(5.5rem + ${dx}px)`; bottom = `calc(3.5rem + ${dy}px)`; }
    
    if (quadrant === 'TR_REFLECT') { right = `calc(5.5rem - ${dx}px)`; top = `calc(3.5rem + ${dy}px)`; }
    if (quadrant === 'BR_REFLECT') { right = `calc(5.5rem - ${dx}px)`; bottom = `calc(3.5rem + ${dy}px)`; }
    if (quadrant === 'TL_REFLECT') { left = `calc(5.5rem - ${dx}px)`; top = `calc(3.5rem + ${dy}px)`; }
    if (quadrant === 'BL_REFLECT') { left = `calc(5.5rem - ${dx}px)`; bottom = `calc(3.5rem + ${dy}px)`; }

    return { left, right, top, bottom };
  }

  activeHotspot = signal<any>(null);

  /** Phase 10: Smooth Astrolabe Focus Logic */
  galaxyZoom = signal<number>(1.0);
  inverseZoom = computed(() => 1 / this.galaxyZoom());

  onGalaxyScroll(event: WheelEvent) {
    event.preventDefault(); // Suspend window scroll bleeding
    this.galaxyZoom.update((z: number) => {
      let increment = event.deltaY < 0 ? 1.1 : 0.9;
      return Math.max(0.5, Math.min(z * increment, 4.0)); // Strict physical depth floor and ceiling
    });
  }

  teleportToHotspot(hotspot: any) {
    this.activeHotspot.set(hotspot);
    
    // Compute what the local clock reads at this hotspot's IANA timezone
    // so sun/moon/star/planet positions reflect that city's actual sky right now
    const locationDate = hotspot.tz 
      ? this.getLocalDateForTimezone(hotspot.tz)
      : new Date();
    
    this.solarService.updateLocationAtTime(hotspot.lat, hotspot.lon, hotspot.label.toUpperCase(), locationDate);
    this.weatherService.fetchData(hotspot.lat, hotspot.lon);
    this.satService.fetchData(hotspot.lat, hotspot.lon);
    
    // Spin the 3D globe to center the selected longitude
    this.globeRotX.set(hotspot.lon + 90);
    
    // Trigger automatic cinematic focal push on telemetry acquisition
    this.galaxyZoom.set(1.6);
  }

  /** Derive a Date object representing the current moment in a given IANA timezone.
   *  We can't change UTC time, but we CAN shift the Date used for solar calculations
   *  to reflect that city's local hour/minute so the sun angle is correct for THERE. */
  getLocalDateForTimezone(tz: string): Date {
    try {
      // Use Intl to find the UTC offset for this timezone right now
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(now);
      const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? 0);
      // Reconstruct as a UTC Date using the local wall-clock values
      // This tricks SolarService into computing celestial positions for that local time
      const localAsUtc = Date.UTC(
        get('year'), get('month') - 1, get('day'),
        get('hour'), get('minute'), get('second')
      );
      return new Date(localAsUtc);
    } catch {
      return new Date();
    }
  }

  teleportToClock(clock: any) {
    this.teleportToHotspot(clock);
  }

  // Remote Trigger Action Matrix Router
  hoveredTile = signal<'ALBEDO' | 'NDVI' | 'CARBON' | null>(null);

  eisenhowerMatrix = computed(() => {
    const id = this.activeHotspot()?.id;
    if (!id) return null;

    const matrices: Record<string, any> = {
      // --- ALPINE GLACIERS ---
      'CHX': { do: "Dispatch emergency stabilization crews to the Argentière glacier seracs.", decide: "Approve budget for new Chamonix sub-surface thermodynamic sensors.", delegate: "Route daily visual albedo telemetry to the Grenoble deep-learning lab.", delete: "Discard legacy 1990s winter seasonal snowpack baseline models." },
      'ZRM': { do: "Halt all commercial heli-skiing near the retreating Matterhorn permafrost.", decide: "Trigger Matterhorn rockfall preemptive geological warning systems.", delegate: "Automate Zermatt valley drone surface temperature mappings.", delete: "Cancel funding for low-altitude snowmaking machinery." },
      'CRT': { do: "Reinforce Veneto region structural rock-netting ahead of predicted thaw.", decide: "Invest in Cortina basin atmospheric carbon scrubbing outposts.", delegate: "Assign optical spectral analysis to Italian regional universities.", delete: "Decommission static analog avalanche sensors." },
      'INN': { do: "Reroute Tyrolean freight transit to minimize Alpine valley black soot.", decide: "Determine placement of next-gen Innsbruck orbital mirror reflectors.", delegate: "Crowdsource local albedo reports via mobile Austrian skiing apps.", delete: "Scrap reliance on localized micro-climate historicals." },
      'WHS': { do: "Enforce strict logging bans around the Whistler-Blackcomb icefields.", decide: "Approve 4K satellite continuous monitoring of Coast Mountain melt runoff.", delegate: "Task local Canadian rangers with physical depth probe verification.", delete: "Ignore short-term La Niña localized temperature anomalies." },
      'BNF': { do: "Activate emergency water conservation protocols downstream from Bow Glacier.", decide: "Draft new structural budgets for Banff aquifer preservation.", delegate: "Partner with Alberta AI labs for predictive glacier retreat models.", delete: "Abandon seasonal melt-rate comparisons older than 5 years." },
      'ASP': { do: "Restrict combustion engines near Maroon Bells alpine tundra zones.", decide: "Lock in multi-state contingency plans for Colorado River source depletion.", delegate: "Automate Rocky Mountain albedo capture using geostationary data.", delete: "Deprioritize traditional high-altitude resort expansion plans." },
      'NIU': { do: "Deploy volcanic ash mitigation shields across Mount Yotei glacier flanks.", decide: "Subsidize Hokkaido geothermal transitions to offset resort emissions.", delegate: "Sync Niseko local LiDAR drone fleets with orbital telemetry.", delete: "Stop planning around consistent 'Japow' historical snow-depth." },
      'QST': { do: "Immediate halt of invasive species spread accelerating Southern Alps thaw.", decide: "Inject capital into Queenstown regional hydro-electric glacier buffers.", delegate: "Assign university teams to monitor Remarkables mountain albedo.", delete: "Remove archaic static topographical maps from the active database." },

      // --- SUPPLY CHAIN & PORTS ---
      'RTM': { do: "Mandate shoreside electrical power docking for all incoming super-freighters.", decide: "Approve massive hydrogen bunkering infrastructure at Maasvlakte.", delegate: "Automate Dutch autonomous barge logistics to slash port congestion.", delete: "Cancel permits for legacy heavy-fuel oil storage expansions." },
      'SGP': { do: "Throttle maritime traffic in the Johore Strait to reduce sulfur pooling.", decide: "Greenlight multi-billion Tuas Megaport automated carbon-tracking.", delegate: "Deploy autonomous aquatic drones to monitor maritime bunker spills.", delete: "Ignore non-compliant vessels lacking real-time emissions broadcasting." },
      'PAN': { do: "Enforce strict Neopanamax vessel draft limits against Gatun Lake levels.", decide: "Invest $5B in alternative freshwater saving basins for the locks.", delegate: "Task regional meteorologists with hyper-local watershed predictions.", delete: "Abandon previous continuous transit volume expectations." },
      'SUE': { do: "Deploy sandstorm atmospheric scrubbers along the Bitter Lakes approach.", decide: "Approve secondary green-corridor bypass channel dredging budgets.", delegate: "Integrate Egyptian port authorities with global AIS optimization AI.", delete: "Stop allowing highly polluting vessels during peak congestion hours." },
      'PLA': { do: "Eliminate all diesel drayage trucks operating in the San Pedro Bay complex.", decide: "Finalize total electrification grid for Long Beach heavy lifters.", delegate: "Partner with local AI startups to predict inbound vessel wait times.", delete: "Scrap conventional off-shore anchoring protocols causing idle smog." },
      'SHG': { do: "Rotate Yangshan deep-water mega-ships to optimize cross-wind drag.", decide: "Integrate continuous 5G emissions monitoring across all active cranes.", delegate: "Automate localized smog warnings integrating Yangtze weather data.", delete: "Bypass regional reporting delays by relying on direct orbital satellite data." },
      'HAM': { do: "Activate Elbe River tidal optimization software for deep draft entries.", decide: "Finance rapid transitions to Green Ammonia fueling at Altenwerder.", delegate: "Link German maritime traffic control directly to European space agency.", delete: "Delete analog paperwork processing for hazardous cargo tracking." },
      'NWH': { do: "Immediate halt on expansion into adjacent coastal mangrove ecosystems.", decide: "Build critical multi-modal electrified rail links to bypass local trucks.", delegate: "Automate container triage for essential zero-emission cargo first.", delete: "Reject incoming vessels failing international low-sulfur mandates." },
      'JEB': { do: "Shield active open-air terminal workers during extreme UV/Heat indices.", decide: "Approve massive solar-shade canopy construction over Jafza storage.", delegate: "Sync Dubai customs clearing with maritime predictive arrival AI.", delete: "Discard unoptimized docking queues causing excess marine idling." },

      // --- MANGROVE & COASTAL ---
      'GYQ': { do: "Deploy immediate anti-erosion bio-barriers to the Guayas River delta.", decide: "Relocate vulnerable coastal populations in high-risk inundation paths.", delegate: "Assign automated drone reforestation protocols across the Gulf.", delete: "Stop authorizing commercial shrimp farming in primary mangrove zones." },
      'SUN': { do: "Erect immediate tidal surge warnings for active cyclonic formations.", decide: "Invest heavily in bio-engineered super-mangrove root matrices.", delegate: "Crowdsource Ganges delta wildlife tracking to assess ecosystem health.", delete: "Abandon reliance on concrete seawalls sinking in the active mud flats." },
      'EVG': { do: "Halt all freshwater diversion out of the central River of Grass.", decide: "Commit $10B to elevate the Tamiami Trail and restore tidal flow.", delegate: "Deploy Florida panther and biomass thermal tracking satellites.", delete: "Cancel encroaching urban development permits on the eastern ridge." },
      'MEK': { do: "Throttle upstream dam operators to maintain critical delta sediment flow.", decide: "Subsidize Vietnamese rice farmers transitioning to brackish aquaculture.", delegate: "Automate salinity intrusion mapping across the entire river basin.", delete: "Stop relying on historical seasonal monsoon precipitation curves." },
      'JAK': { do: "Ban completely all unauthorized deep groundwater extraction across the city.", decide: "Accelerate the massive Garuda Sea Wall integration with natural mangroves.", delegate: "Use geospatial AI to predict urban subsidence vector pathways.", delete: "Stop issuing permits in the northern coastal floodplains." },
      'DAK': { do: "Reinforce the Senegalese coastal road against immediate Atlantic swells.", decide: "Fund the Great Green Wall extension down into the coastal aquifers.", delegate: "Equip local fishing fleets with oceanographic data collection sensors.", delete: "Scrap short-term sandbagging logistics in favor of natural vegetation." },
      'MIY': { do: "Harden coral reef restoration scaffolding around the Miyako strait.", decide: "Approve budgets for typhoon-resistant underwater mesh infrastructures.", delegate: "Set autonomous Japanese gliders to monitor ocean acidification.", delete: "Ignore marginal sea-level rise data; prepare for extreme storm surges." },
      'MDV': { do: "Evacuate non-essential personnel from lowest lying outer atolls.", decide: "Greenlight floating city modular construction and tethering anchors.", delegate: "Deploy Indian Ocean tsunami and swell predictive neural networks.", delete: "Abandon all traditional foundation building practices below 2 meters." },
      'KIR': { do: "Initiate immediate freshwater rationing due to saltwater lens intrusion.", decide: "Finalize international climate refugee diplomatic relocation treaties.", delegate: "Sync Pacific Ring orbital telemetry to predict king-tide impacts.", delete: "Delete outdated 20th-century mean sea level logistical models." }
    };

    return matrices[id] || {
      do: "Commence immediate orbital alignment and sensor recalibration.",
      decide: "Determine optimal geometric bounding box for future telemetry mapping.",
      delegate: "Assign continuous ping verification to secondary processing arrays.",
      delete: "Purge all unsynchronized historical caching from the active buffer."
    };
  });

  // Active Satellite Payload Mappers
  albedo_val = computed(() => this.satService.metrics().albedoIndex);
  ndviStr = computed(() => this.satService.metrics().ndviBuffer.toFixed(2));
  ndvi_val = computed(() => this.satService.metrics().ndviBuffer);
  carbon_val = computed(() => this.satService.metrics().carbonFlux);

  // Dynamic Thematic Background Interpolations
  albedoBg = computed(() => {
    const pct = Math.max(0, Math.min(100, this.albedo_val()));
    return `var(--weave), linear-gradient(145deg, color-mix(in srgb, transparent ${pct}%, #1f1209), color-mix(in srgb, transparent ${pct}%, var(--klee-sienna))), url('/optimal_glacier.png')`;
  });

  ndviBg = computed(() => {
    const pct = Math.max(0, Math.min(100, this.ndvi_val() * 100));
    return `var(--weave), linear-gradient(145deg, color-mix(in srgb, transparent ${pct}%, #04101e), color-mix(in srgb, transparent ${pct}%, var(--klee-slate))), url('/optimal_mangrove.png')`;
  });

  carbonBg = computed(() => {
    const flux = this.carbon_val() || 50;
    const cleanPct = Math.max(0, Math.min(100, 100 - ((flux - 20) / 100) * 100)); // 20g = 100% clean, 120g = 0% clean
    return `var(--weave), linear-gradient(145deg, color-mix(in srgb, transparent ${cleanPct}%, #2e1201), color-mix(in srgb, transparent ${cleanPct}%, var(--klee-amber))), url('/optimal_corridor.png')`;
  });

  // Native Spherical Astronomy translation of geocentric RA/Dec to Local Apparent Azimuth
  private computePlanetaryAzimuth(raDeg: number, decDeg: number, lstDeg: number, latDeg: number): number {
    const DEG = Math.PI / 180;
    const RAD = 180 / Math.PI;
    
    // Hour Angle (LST - Right Ascension)
    const ha = (lstDeg - raDeg) * DEG;
    const decl = decDeg * DEG;
    const lat = latDeg * DEG;

    const cosZenith = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha);
    const zenithRad = Math.acos(Math.max(-1, Math.min(1, cosZenith)));

    if (zenithRad === 0) return 0; // Zenith point singularity check

    const sinAz = -Math.sin(ha) * Math.cos(decl) / Math.sin(zenithRad);
    const cosAz = (Math.sin(lat) * Math.cos(zenithRad) - Math.sin(decl)) / (Math.cos(lat) * Math.sin(zenithRad));

    return (Math.atan2(sinAz, -cosAz) * RAD + 180) % 360;
  }

  // Complete Planetary Ephemeris Array (Native JPL Horizons Mode)
  planetNodes = computed(() => {
    const coordsMap = this.ephemerisService.planetCoords();
    const lstDeg = this.siderealRotation();
    const latDeg = this.solarService.lat();

    // Baseline structural sizing utilizing realistic radius proportions and 4K SVG texture wrappers
    const basePlanets = [
      { name: 'MERCURY', defaultAz: 0, orbitRadius: 90, size: 2.5, color: 'url(#tex-mercury)' },
      { name: 'VENUS', defaultAz: 45, orbitRadius: 110, size: 4.5, color: 'url(#tex-venus)' },
      { name: 'MARS', defaultAz: 90, orbitRadius: 130, size: 3.5, color: 'url(#tex-mars)' },
      { name: 'JUPITER', defaultAz: 135, orbitRadius: 160, size: 12, color: 'url(#tex-jupiter)' },
      { name: 'SATURN', defaultAz: 180, orbitRadius: 190, size: 10, color: 'url(#tex-saturn)' },
      { name: 'URANUS', defaultAz: 225, orbitRadius: 220, size: 6.5, color: 'url(#tex-uranus)' },
      { name: 'NEPTUNE', defaultAz: 270, orbitRadius: 250, size: 6.5, color: 'url(#tex-neptune)' },
      { name: 'PLUTO', defaultAz: 315, orbitRadius: 280, size: 1.5, color: 'url(#tex-pluto)' }
    ];

    return basePlanets.map(p => {
      let azimuth = p.defaultAz;
      // Re-map natively matching coordinate projection when NASA streams connect
      if (this.ephemerisService.loadedStatus()) {
        const coords = coordsMap.get(p.name);
        if (coords) {
          azimuth = this.computePlanetaryAzimuth(coords.ra, coords.dec, lstDeg, latDeg);
        }
      }
      return { ...p, azimuth };
    });
  });

  // Physical Geometric Forecast Plotters
  forecastNodes = computed(() => {
    const nodes = this.weatherService.forecastArray();
    return nodes.map((node: any) => ({
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
      next: (res: any) => {
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
    public satService: SatelliteService,
    public ephemerisService: EphemerisService
  ) {}

  ngOnInit() {
    this.weatherService.fetchData();
    this.satService.fetchData(this.solarService.lat(), this.solarService.lon());
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
    this.globeRotX.update((v: number) => v - deltaX * 0.5);
    
    // Clamp Y rotation to avoid spinning over the poles
    this.globeRotY.update((v: number) => {
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

    // Convert raw pixel offset back to geographic matrices
    const globeW = target.offsetWidth;
    const globeH = target.offsetHeight;
    
    // The globe background spans 360° horizontally across the full container width.
    // globeRotX drives the CSS background-position, so the visible left edge longitude is (globeRotX - 180).
    let clickLon = (this.globeRotX() + (rectX / globeW) * 360 - 180) % 360;
    while (clickLon <= -180) clickLon += 360;
    while (clickLon > 180) clickLon -= 360;

    // Map container height to [-90, 90] and clamp to guard against clicks outside the element
    const clickLat = Math.max(-90, Math.min(90, 90 - (rectY / globeH) * 180));

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
      this.satService.fetchData(clickLat, clickLon);

      // Synthesize a runtime generic hotspot to wake the Eisenhower Matrix out of STANDBY
      this.activeHotspot.set({
        id: 'MAP',
        label: locName.toUpperCase(),
        lat: clickLat,
        lon: clickLon,
        group: 'GLOBAL',
        time: 'SYNCED'
      });
      
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
        this.globeRotX.update((v: number) => v + this.autoSpinSpeed);
        // Slowly return Y back to equator (0)
        this.globeRotY.update((v: number) => {
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
      default:          return 'bg-slate-400';
    }
  }

  uvTextColourClass(): string {
    switch (this.solarService.uvRisk()) {
      case 'Low':       return 'text-emerald-400';
      case 'Moderate':  return 'text-yellow-400';
      case 'High':      return 'text-orange-400';
      case 'Very High': return 'text-red-500';
      case 'Extreme':   return 'text-violet-500';
      default:          return 'text-slate-400';
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
