import { Injectable, signal } from '@angular/core';

export interface SatelliteMetrics {
  albedoIndex: number;  // 0 - 100% (Alpine reflection)
  carbonFlux: number;   // 0 - 200 units (Supply Chain emissions)
  ndviBuffer: number;   // 0.0 - 1.0 (Mangrove vegetation density)
}

@Injectable({
  providedIn: 'root'
})
export class SatelliteService {
  metrics = signal<SatelliteMetrics>({
    albedoIndex: 75,
    carbonFlux: 80,
    ndviBuffer: 0.6
  });

  fetchData(lat: number, lon: number) {
    // Generate deterministic geo-mocked satellite metrics for journalistic verification prototype
    const seed = Math.abs(lat * lon);
    
    // 1. Alpine Glaciers (Tracking high albedo in the Alps, low albedo elsewhere)
    let albedo = 30 + (seed % 60); 
    if (lat > 44 && lat < 48 && lon > 5 && lon < 15) {
      albedo = 85 + (seed % 12); // Deep Swiss/French Alps (Chamonix/Zermatt) simulate high reflective ice mass
    } else if (lat > 49 && lat < 55 && lon < -110) {
      albedo = 82 + (seed % 10); // Canadian Rockies (Banff/Whistler)
    }

    // 2. Net-Zero Supply Chain (Tracking intense marine/aviation carbon flux)
    let carbon = 40 + (seed % 50);
    // Rotterdam(51, 4), Singapore(1, 103), Shanghai(31, 121), LA(33, -118)
    if (
      (lat > 50 && lat < 53 && lon > 0 && lon < 6) || // Rotterdam scope
      (lat > 0 && lat < 3 && lon > 100 && lon < 105) || // Singapore scope
      (lat > 30 && lat < 35 && lon > 115 && lon < 125) || // Shanghai scope
      (lat > 32 && lat < 35 && lon < -115 && lon > -120) // LA scope
    ) {
      carbon = 140 + (seed % 50); // Heavy flux emissions mimicking dirty corridors
    }

    // 3. Mangroves & Coastal Cities (Tracking true NDVI coastal defense buffering)
    let ndvi = 0.2 + ((seed % 40) / 100);
    // Guayaquil (-2, -79), Sundarbans (21, 89), Everglades (25, -80)
    if (
      (lat < 0 && lat > -5 && lon < -75 && lon > -85) || // Ecuador scope
      (lat > 20 && lat < 23 && lon > 85 && lon < 90) || // India/Bangladesh scope
      (lat > 24 && lat < 28 && lon < -79 && lon > -82) // Florida scope
    ) {
      ndvi = 0.70 + ((seed % 28) / 100); // Dense mangrove buffering verified
    }

    this.metrics.set({
      albedoIndex: Math.floor(albedo),
      carbonFlux: Math.floor(carbon),
      ndviBuffer: Number(ndvi.toFixed(2))
    });
  }
}
