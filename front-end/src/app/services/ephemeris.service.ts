import { Injectable, signal } from '@angular/core';

export interface EphemerisCoords {
  ra: number;
  dec: number;
}

@Injectable({
  providedIn: 'root'
})
export class EphemerisService {
  // Planet Horizons System IDs
  private planetIds = {
    'MERCURY': 199,
    'VENUS': 299,
    'MARS': 499,
    'JUPITER': 599,
    'SATURN': 699,
    'URANUS': 799,
    'NEPTUNE': 899,
    'PLUTO': 999
  };

  // Signal storing the physical geometry coordinates mapping
  public planetCoords = signal<Map<string, EphemerisCoords>>(new Map());
  public loadedStatus = signal<boolean>(false);

  constructor() {
    this.hydrateEphemeris();
  }

  private async hydrateEphemeris() {
    const today = new Date();
    // Format YYYY-MM-DD explicitly
    const startStr = today.toISOString().split('T')[0];
    
    // Stop date is exactly tomorrow to fetch exactly 1 line
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const stopStr = tomorrow.toISOString().split('T')[0];

    const currentMap = new Map<string, EphemerisCoords>();

    // Sequential loop executed deliberately to respect NASA Horizons API rate limits
    for (const [name, id] of Object.entries(this.planetIds)) {
      try {
        const query = `format=json&COMMAND='${id}'&MAKE_EPHEM=YES&EPHEM_TYPE=OBSERVER&CENTER='500@399'&START_TIME='${startStr}'&STOP_TIME='${stopStr}'&STEP_SIZE='1d'&QUANTITIES='1'&CSV_FORMAT='YES'&ANG_FORMAT='DEG'`;
        // Route through Angular dev-server proxy to avoid CORS (proxy.conf.json maps /api/horizons.api → https://ssd.jpl.nasa.gov/api/horizons.api)
        const res = await fetch(`/api/horizons.api?${query}`);
        const data = await res.json();
        
        if (data && data.result) {
          // Parse the fixed-width table utilizing the bounding $$SOE/$$EOE markers
          const soeMatch = data.result.match(/\$\$SOE\n(.*?)\n\$\$EOE/s);
          if (soeMatch) {
            const firstLine = soeMatch[1].split('\n')[0].trim();
            const parts = firstLine.split(',');
            // Extracted from CSV structure provided by ANG_FORMAT=DEG + CSV_FORMAT=YES
            const ra = parseFloat(parts[3]);
            const dec = parseFloat(parts[4]);
            if (!isNaN(ra) && !isNaN(dec)) {
              currentMap.set(name, { ra, dec });
            }
          }
        }
      } catch (err) {
        console.error(`JPL Horizons Ephemeris Failed for ${name}:`, err);
      }
    }

    // Flush the native coordinate map locally to unlock the rendering cycles
    this.planetCoords.set(currentMap);
    this.loadedStatus.set(true);
  }
}
