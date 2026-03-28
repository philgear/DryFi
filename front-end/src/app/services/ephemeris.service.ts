import { Injectable, signal, computed } from '@angular/core';

export interface EphemerisCoords {
  ra: number;       // Right Ascension (degrees)
  dec: number;      // Declination (degrees)
  mag?: number;     // Visual magnitude (n.a. for Sun)
  angDiam?: number; // Angular diameter (arcsec)
  phase?: number;   // Illuminated fraction 0–100 (Moon, inner planets)
}

@Injectable({
  providedIn: 'root'
})
export class EphemerisService {

  // JPL Horizons COMMAND IDs — Sun + Moon added alongside planets
  private bodyIds: Record<string, number> = {
    'SUN': 10,
    'MOON': 301,
    'MERCURY': 199,
    'VENUS': 299,
    'MARS': 499,
    'JUPITER': 599,
    'SATURN': 699,
    'URANUS': 799,
    'NEPTUNE': 899,
    'PLUTO': 999,
  };

  /** Full coordinate map — keyed by body name */
  public planetCoords = signal<Map<string, EphemerisCoords>>(new Map());
  public loadedStatus = signal<boolean>(false);

  // ── Convenience computed accessors ────────────────────────
  /** Sun RA/Dec today — drives light-source angle in starmap shading */
  public sunCoords = computed(() => this.planetCoords().get('SUN'));

  /** Moon RA/Dec + phase fraction — drives crescent renderer */
  public moonCoords = computed(() => this.planetCoords().get('MOON'));

  constructor() {
    this.hydrateEphemeris();
  }

  private async hydrateEphemeris() {
    const today = new Date();
    const startStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const stopStr = tomorrow.toISOString().split('T')[0];

    const currentMap = new Map<string, EphemerisCoords>();

    // Sequential loop — respect NASA Horizons rate limits (1 req/sec ceiling)
    for (const [name, id] of Object.entries(this.bodyIds)) {
      try {
        // QUANTITIES:
        //  1  → RA & Dec
        //  9  → Visual magnitude
        // 10  → Illuminated fraction (phase) — crucial for Moon / inner planets
        // 13  → Angular diameter
        const query =
          `format=json` +
          `&COMMAND='${id}'` +
          `&MAKE_EPHEM=YES` +
          `&EPHEM_TYPE=OBSERVER` +
          `&CENTER='500@399'` +
          `&START_TIME='${startStr}'` +
          `&STOP_TIME='${stopStr}'` +
          `&STEP_SIZE='1d'` +
          `&QUANTITIES='1,9,10,13'` +
          `&CSV_FORMAT='YES'` +
          `&ANG_FORMAT='DEG'`;

        const targetUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?${query}`;
        const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxiedUrl);
        const data = await res.json();

        if (data?.result) {
          const soeMatch = data.result.match(/\$\$SOE\n(.*?)\n\$\$EOE/s);
          if (soeMatch) {
            const firstLine = soeMatch[1].split('\n')[0].trim();
            const parts = firstLine.split(',');

            // CSV column layout when QUANTITIES='1,9,10,13' & ANG_FORMAT=DEG:
            // [0] date/time  [1] obscuring body  [2] dummy
            // [3] RA (deg)   [4] Dec (deg)
            // [5] mag        [6] surface_bright
            // [7] illum_frac [8] ang_width
            const ra = parseFloat(parts[3]);
            const dec = parseFloat(parts[4]);
            const mag = parseFloat(parts[5]);   // NaN for Sun — guarded below
            const phase = parseFloat(parts[7]);   // illuminated %
            const angDiam = parseFloat(parts[8]);

            if (!isNaN(ra) && !isNaN(dec)) {
              currentMap.set(name, {
                ra,
                dec,
                mag: isNaN(mag) ? undefined : mag,
                phase: isNaN(phase) ? undefined : phase,
                angDiam: isNaN(angDiam) ? undefined : angDiam,
              });
            }
          }
        }
      } catch (err) {
        console.error(`JPL Horizons Ephemeris failed for ${name}:`, err);
      }
    }

    this.planetCoords.set(currentMap);
    this.loadedStatus.set(true);
  }
}
