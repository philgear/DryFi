import { Injectable, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SpaceWeatherService implements OnDestroy {
  // Planetary K-index (0-9 scale). >= 4 indicates active/storm conditions
  kIndex = signal<number>(0);
  
  // Count of Near Earth Objects (asteroids) making close passes today
  neoCount = signal<number>(0);

  // Array of pseudo-random tracked anomalies based on NeoWs count to scatter on radar
  neoBlips = signal<{ x: number; y: number; r: number; delay: number }[]>([]);

  private intervalId: any;

  constructor(private http: HttpClient) {
    this.fetchSpaceWeather();
    // Refresh every 15 minutes
    this.intervalId = setInterval(() => this.fetchSpaceWeather(), 15 * 60_000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private fetchSpaceWeather() {
    this.fetchKIndex();
    this.fetchNeoWs();
  }

  private fetchKIndex() {
    this.http.get<string[][]>('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json')
      .subscribe({
        next: (data) => {
          if (data && data.length > 1) {
            // The last item in the array is the most recent (data[0] is header)
            const latest = data[data.length - 1];
            const kp = parseFloat(latest[1]);
            if (!isNaN(kp)) {
              this.kIndex.set(kp);
            }
          }
        },
        error: (err) => console.error('[SpaceWeather] Failed to fetch K-index', err)
      });
  }

  private fetchNeoWs() {
    const todayDate = new Date();
    // Formatting consistently YYYY-MM-DD
    const yyyy = todayDate.getFullYear();
    const mm = String(todayDate.getMonth() + 1).padStart(2, '0');
    const dd = String(todayDate.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    
    const neoUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${environment.NASA_API_KEY}`;
    
    this.http.get<any>(neoUrl).subscribe({
      next: (data) => {
        if (data && data.element_count !== undefined) {
          const count = data.element_count;
          this.neoCount.set(count);
          this.generateRadarBlips(count);
        }
      },
      error: (err) => console.error('[SpaceWeather] Failed to fetch NeoWs', err)
    });
  }

  /**
   * Generates polar coordinates for radar "ghost echoes" correlating with the NEO count.
   * Maps max ~15 blips to random positions on the unit circle to plot on the SVG.
   */
  private generateRadarBlips(count: number) {
    const blips = [];
    // Cap visual clutter on radar to max 15 anomaly blips
    const visuals = Math.min(count, 15);
    
    for (let i = 0; i < visuals; i++) {
        // SVG center is 0,0 and radius is 200
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 170 + 20; // 20 to 190 radius
        
        const x = Math.round(radius * Math.cos(angle));
        const y = Math.round(radius * Math.sin(angle));
        
        // Random relative size and fade delay
        const r = Math.random() * 2 + 1; // 1 to 3 units wide
        const delay = Math.random() * 8; // 0 to 8s sync offset
        
        blips.push({ x, y, r, delay });
    }
    this.neoBlips.set(blips);
  }
}
