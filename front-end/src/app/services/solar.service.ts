/**
 * SolarService – Pure TypeScript NOAA Solar Position Algorithm (simplified SPA)
 *
 * References:
 *   Reda & Andreas (NREL/TP-560-34302, 2004) – Solar Position Algorithm
 *   Bird & Hulstrom (1981) – clear-sky irradiance (simplified)
 *   WHO UV Index Guide (2002)
 *
 * All math operates in UTC. The service refreshes every 60 seconds via an
 * interval and exposes everything as Angular Signals so the template stays
 * fully reactive with no zone.js trickery.
 */
import { Injectable, OnDestroy, signal, computed } from '@angular/core';
import { environment } from '../../environments/environment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SunPosition {
  elevationDeg: number;   // apparent elevation above horizon, degrees
  azimuthDeg: number;     // degrees clockwise from North (0 = N, 90 = E, …)
  zenithDeg: number;      // 90 – elevation
}

export interface SolarDay {
  sunrise: Date;
  solarNoon: Date;
  sunset: Date;
  daylightMinutes: number;
  daysToSolstice: number; // nearest solstice (summer or winter)

  // Golden Hour (Elevation between +6° and -4°)
  goldenHourMorningStart: Date | null; // Elev -4° (dawn)
  goldenHourMorningEnd: Date | null;   // Elev +6°
  goldenHourEveningStart: Date | null; // Elev +6°
  goldenHourEveningEnd: Date | null;   // Elev -4° (dusk)

  // Blue Hour (Elevation between -4° and -6°)
  blueHourMorningStart: Date | null;   // Elev -6°
  blueHourMorningEnd: Date | null;     // Elev -4°
  blueHourEveningStart: Date | null;   // Elev -4°
  blueHourEveningEnd: Date | null;     // Elev -6°
}

export type UvRisk = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const SOLAR_CONSTANT = 1361; // W/m²

// ---------------------------------------------------------------------------
// Pure math helpers – no Angular dependencies, easy to unit-test
// ---------------------------------------------------------------------------

/** Julian Day Number from a JS Date (UTC) */
function julianDay(d: Date): number {
  return d.getTime() / 86_400_000 + 2440587.5;
}

/** Julian Century from J2000.0 */
function julianCentury(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

/** Mean longitude of the sun, degrees */
function sunMeanLon(T: number): number {
  return (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
}

/** Mean anomaly of the sun, degrees */
function sunMeanAnomaly(T: number): number {
  return 357.52911 + T * (35999.05029 - T * 0.0001537);
}

/** Equation of centre (difference between mean and true anomaly), degrees */
function sunEquationOfCentre(T: number): number {
  const M = sunMeanAnomaly(T) * DEG;
  return (
    Math.sin(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M) * 0.000289
  );
}

/** Sun's true longitude, degrees */
function sunTrueLon(T: number): number {
  return sunMeanLon(T) + sunEquationOfCentre(T);
}

/** Sun's apparent longitude (corrected for aberration + nutation), degrees */
function sunApparentLon(T: number): number {
  const Omega = (125.04 - 1934.136 * T) * DEG;
  return sunTrueLon(T) - 0.00569 - 0.00478 * Math.sin(Omega);
}

/** Obliquity of the ecliptic, degrees */
function obliquity(T: number): number {
  const Omega = (125.04 - 1934.136 * T) * DEG;
  const e0 = 23 + 26 / 60 + 21.448 / 3600 - T * (46.8150 / 3600 + T * (0.00059 / 3600 - T * 0.001813 / 3600));
  return e0 + 0.00256 * Math.cos(Omega);
}

/** Solar declination, degrees */
function solarDeclination(T: number): number {
  const e = obliquity(T) * DEG;
  const lambda = sunApparentLon(T) * DEG;
  return Math.asin(Math.sin(e) * Math.sin(lambda)) * RAD;
}

/** Equation of time, minutes */
function equationOfTime(T: number): number {
  const e = obliquity(T) * DEG;
  const L0 = sunMeanLon(T) * DEG;
  const e_anom = (0.016708634 - T * (0.000042037 + 0.0000001267 * T));
  const M = sunMeanAnomaly(T) * DEG;
  const y = Math.tan(e / 2) ** 2;
  const Ey =
    y * Math.sin(2 * L0) -
    2 * e_anom * Math.sin(M) +
    4 * e_anom * y * Math.sin(M) * Math.cos(2 * L0) -
    0.5 * y * y * Math.sin(4 * L0) -
    1.25 * e_anom * e_anom * Math.sin(2 * M);
  return (Ey * 4 * RAD); // minutes
}

/**
 * Compute sun position for a given UTC Date + site coordinates.
 * Returns apparent elevation (corrected for atmospheric refraction) and azimuth.
 */
export function computeSunPosition(utcDate: Date, latDeg: number, lonDeg: number): SunPosition {
  const jd = julianDay(utcDate);
  const T = julianCentury(jd);

  const decl = solarDeclination(T) * DEG;     // radians
  const lat = latDeg * DEG;                    // radians

  // True solar time in minutes from midnight UTC
  const utcMinutes = utcDate.getUTCHours() * 60 + utcDate.getUTCMinutes() + utcDate.getUTCSeconds() / 60;
  const trueSolarTime = utcMinutes + equationOfTime(T) + lonDeg * 4; // minutes

  // Hour angle (degrees)
  let ha = (trueSolarTime / 4) - 180;

  // Zenith angle (before refraction)
  const cosZenith =
    Math.sin(lat) * Math.sin(decl) +
    Math.cos(lat) * Math.cos(decl) * Math.cos(ha * DEG);
  const zenithRad = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  const zenithDeg = zenithRad * RAD;

  // Atmospheric refraction correction (degrees) – Bennett's formula
  const elevRaw = 90 - zenithDeg;
  let refraction = 0;
  if (elevRaw > -0.575) {
    if (elevRaw > 85) {
      refraction = 0;
    } else if (elevRaw > 5) {
      refraction = 58.1 / Math.tan(elevRaw * DEG) -
                   0.07 / Math.tan(elevRaw * DEG) ** 3 +
                   0.000086 / Math.tan(elevRaw * DEG) ** 5;
      refraction /= 3600;
    } else if (elevRaw > -0.575) {
      refraction = 1735 + elevRaw * (-518.2 + elevRaw * (103.4 + elevRaw * (-12.79 + elevRaw * 0.711)));
      refraction /= 3600;
    }
  }
  const elevationDeg = elevRaw + refraction;

  // Azimuth (degrees clockwise from North)
  let azimuthDeg: number;
  const sinAz =
    -Math.sin(ha * DEG) * Math.cos(decl) /
    Math.sin(zenithRad);
  const cosAz =
    (Math.sin(lat) * Math.cos(zenithRad) - Math.sin(decl)) /
    (Math.cos(lat) * Math.sin(zenithRad));

  azimuthDeg = Math.atan2(sinAz, -cosAz) * RAD + 180;

  return { elevationDeg, azimuthDeg, zenithDeg: zenithDeg };
}

/**
 * Compute sunrise, solar noon, and sunset times for a given UTC Date.
 * Uses the NOAA algorithm (iterative approach via hour-angle at horizon).
 */
export function computeSolarDay(utcDate: Date, latDeg: number, lonDeg: number): SolarDay {
  // Work with local solar midnight (noon UTC - half day offset is fine for daily calcs)
  const jd = julianDay(utcDate);
  const T = julianCentury(jd);

  const decl = solarDeclination(T);
  const eqt  = equationOfTime(T);

  // Solar noon in decimal UTC hours
  const noonUtc = 12 - lonDeg / 15 - eqt / 60;

  // Helper to solve hour angle for a specific solar zenith (90 - elevationDeg)
  const solveForZenith = (zenithDeg: number): { morning: number, evening: number } | null => {
    const cosOm = (Math.cos(zenithDeg * DEG) - Math.sin(latDeg * DEG) * Math.sin(decl * DEG)) /
                  (Math.cos(latDeg * DEG) * Math.cos(decl * DEG));
    if (cosOm < -1 || cosOm > 1) return null; // Sun never crosses this elevation
    const haDeg = Math.acos(cosOm) * RAD;
    return {
      morning: noonUtc - haDeg / 15,
      evening: noonUtc + haDeg / 15
    };
  };

  // Standard Sunset/Sunrise (Zenith 90.833° Accounts for refraction horizon dip)
  const sunTimes = solveForZenith(90.833);
  let sunriseUtc = 0;
  let sunsetUtc = 24;
  let daylightMinutes = 1440;

  if (!sunTimes) {
    // Polar extremes
    const cosOmega = (Math.cos(90.833 * DEG) - Math.sin(latDeg * DEG) * Math.sin(decl * DEG)) / (Math.cos(latDeg * DEG) * Math.cos(decl * DEG));
    if (cosOmega > 1) { // Polar night
      sunriseUtc = noonUtc; sunsetUtc = noonUtc; daylightMinutes = 0;
    }
  } else {
    sunriseUtc = sunTimes.morning;
    sunsetUtc = sunTimes.evening;
    daylightMinutes = (sunsetUtc - sunriseUtc) * 60;
  }

  // Twilight Metrics
  const ghTop = solveForZenith(84); // Elev +6°
  const ghBot = solveForZenith(94); // Elev -4°
  const bhBot = solveForZenith(96); // Elev -6°

  const dateOnly = new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate()));
  const toDate = (utcHours: number): Date => new Date(dateOnly.getTime() + utcHours * 3_600_000);

  // Days to nearest solstice
  const month  = utcDate.getUTCMonth() + 1; // 1-12
  const day    = utcDate.getUTCDate();
  const year   = utcDate.getUTCFullYear();
  const summerSolstice = new Date(Date.UTC(year, 5, 21));  // ~Jun 21
  const winterSolstice = new Date(Date.UTC(year, 11, 21)); // ~Dec 21
  const msSummer = Math.abs(utcDate.getTime() - summerSolstice.getTime());
  const msWinter = Math.abs(utcDate.getTime() - winterSolstice.getTime());
  const daysToSolstice = Math.round(Math.min(msSummer, msWinter) / 86_400_000);

  return {
    sunrise: toDate(sunriseUtc),
    solarNoon: toDate(noonUtc),
    sunset: toDate(sunsetUtc),
    daylightMinutes,
    daysToSolstice,
    
    // Golden Hour: between Elev +6 (ghTop) and Elev -4 (ghBot)
    goldenHourMorningStart: ghBot ? toDate(ghBot.morning) : null,
    goldenHourMorningEnd: ghTop ? toDate(ghTop.morning) : null,
    goldenHourEveningStart: ghTop ? toDate(ghTop.evening) : null,
    goldenHourEveningEnd: ghBot ? toDate(ghBot.evening) : null,

    // Blue Hour: between Elev -4 (ghBot) and Elev -6 (bhBot)
    blueHourMorningStart: bhBot ? toDate(bhBot.morning) : null,
    blueHourMorningEnd: ghBot ? toDate(ghBot.morning) : null,
    blueHourEveningStart: ghBot ? toDate(ghBot.evening) : null,
    blueHourEveningEnd: bhBot ? toDate(bhBot.evening) : null,
  };
}

/**
 * Bird's simplified clear-sky GHI (W/m²).
 * τ_b ≈ 0.56 (typical broadband transmittance for Portland, moderate turbidity).
 */
export function estimateGHI(elevationDeg: number): number {
  if (elevationDeg <= 0) return 0;
  const zenithRad = (90 - elevationDeg) * DEG;
  const cosZ = Math.cos(zenithRad);
  if (cosZ <= 0) return 0;
  // Simplified Bird model: GHI = I₀ · cosZ · τ_b
  const tau_b = 0.56;
  return Math.round(SOLAR_CONSTANT * cosZ * tau_b);
}

/**
 * Map GHI (W/m²) → approximate UV Index using WHO conversion.
 * Rule of thumb: UV Index ≈ GHI / 60  (at sea level, clear sky).
 */
export function ghiToUvIndex(ghi: number): number {
  return Math.round((ghi / 60) * 10) / 10;
}

export function uvIndexToRisk(uvi: number): UvRisk {
  if (uvi < 3)  return 'Low';
  if (uvi < 6)  return 'Moderate';
  if (uvi < 8)  return 'High';
  if (uvi < 11) return 'Very High';
  return 'Extreme';
}

// ---------------------------------------------------------------------------
// Moon Phase (synodic period algorithm)
// ---------------------------------------------------------------------------

const SYNODIC_PERIOD = 29.53058770576; // days

/** Known new-moon epoch (2000-01-06 18:14 UTC) */
const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14, 0) / 86_400_000;

export type MoonPhaseName =
  | 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous'
  | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';

export interface MoonPhaseData {
  phase: number;           // 0–1 (0 = new, 0.5 = full)
  name: MoonPhaseName;
  illumination: number;    // 0–100%
}

export function computeMoonPhase(d: Date): MoonPhaseData {
  const daysSinceEpoch = d.getTime() / 86_400_000 - NEW_MOON_EPOCH;
  const cycles = daysSinceEpoch / SYNODIC_PERIOD;
  const phase = cycles - Math.floor(cycles); // 0–1

  // Illumination: 0 at new/full → 0/100, using cos curve
  const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);

  let name: MoonPhaseName;
  if (phase < 0.0625)      name = 'New Moon';
  else if (phase < 0.1875) name = 'Waxing Crescent';
  else if (phase < 0.3125) name = 'First Quarter';
  else if (phase < 0.4375) name = 'Waxing Gibbous';
  else if (phase < 0.5625) name = 'Full Moon';
  else if (phase < 0.6875) name = 'Waning Gibbous';
  else if (phase < 0.8125) name = 'Last Quarter';
  else if (phase < 0.9375) name = 'Waning Crescent';
  else                     name = 'New Moon';

  return { phase, name, illumination };
}

// ---------------------------------------------------------------------------
// Angular Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class SolarService implements OnDestroy {

  lat = signal(environment.SITE_LAT);
  lon = signal(environment.SITE_LON);
  locationName = signal("LOCAL TELEMETRY");

  // Core reactive state
  sunPosition  = signal<SunPosition>({ elevationDeg: 0, azimuthDeg: 180, zenithDeg: 90 });
  solarDay     = signal<SolarDay>(this.#computeDay(new Date()));
  estimatedGHI = signal<number>(0);
  uvIndex      = signal<number>(0);
  uvRisk       = signal<UvRisk>('Low');

  // Moon
  moonPhase       = signal<number>(0);
  moonPhaseName   = signal<MoonPhaseName>('New Moon');
  moonIllumination = signal<number>(0);

  // Derived
  isSunAboveHorizon = computed(() => this.sunPosition().elevationDeg > 0);
  minutesToSunset   = computed(() => {
    const now    = Date.now();
    const sunset = this.solarDay().sunset.getTime();
    return Math.max(0, Math.round((sunset - now) / 60_000));
  });

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.#tick();
    this.intervalId = setInterval(() => this.#tick(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  public updateLocation(lat: number, lon: number, name: string): void {
    this.lat.set(lat);
    this.lon.set(lon);
    this.locationName.set(name);
    this.#tick();
  }

  /**
   * Detect potential solar bias in the external temperature sensor.
   * Returns the estimated bias in °F (0 if not applicable).
   */
  estimatedSensorBiasF = computed(() => {
    const pos = this.sunPosition();
    if (pos.elevationDeg < 20) return 0;
    return Math.round(this.estimatedGHI() * 0.015);
  });

  #tick(): void {
    const now = new Date();
    const pos = computeSunPosition(now, this.lat(), this.lon());
    const ghi = estimateGHI(pos.elevationDeg);
    const uvi = ghiToUvIndex(ghi);

    this.sunPosition.set(pos);
    this.estimatedGHI.set(ghi);
    this.uvIndex.set(uvi);
    this.uvRisk.set(uvIndexToRisk(uvi));

    // Moon phase
    const moon = computeMoonPhase(now);
    this.moonPhase.set(moon.phase);
    this.moonPhaseName.set(moon.name);
    this.moonIllumination.set(moon.illumination);

    // Only recompute solar day once per minute
    this.solarDay.set(this.#computeDay(now));
  }

  #computeDay(d: Date): SolarDay {
    return computeSolarDay(d, this.lat(), this.lon());
  }
}
