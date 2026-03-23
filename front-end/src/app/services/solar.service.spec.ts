import {
  computeSunPosition,
  computeSolarDay,
  estimateGHI,
  ghiToUvIndex,
  uvIndexToRisk,
} from './solar.service';

// Portland, OR – the site coordinates used in DryFi
const LAT = 45.5;
const LON = -122.64;

describe('SolarService pure math helpers', () => {

  // ── computeSunPosition ───────────────────────────────────────────────────

  describe('computeSunPosition', () => {
    it('returns zero or negative elevation at midnight UTC', () => {
      // Local midnight Portland ≈ 07:00 UTC (PST) or 08:00 (PDT).
      // Using 08:00 UTC covers both offset cases safely.
      const midnight = new Date('2024-06-21T08:00:00Z');
      const pos = computeSunPosition(midnight, LAT, LON);
      expect(pos.elevationDeg).toBeLessThan(0);
    });

    it('returns positive elevation (>40°) at solar noon on summer solstice', () => {
      // Portland solar noon on Jun 21 ≈ 20:14 UTC (13:14 PDT)
      const noon = new Date('2024-06-21T20:14:00Z');
      const pos = computeSunPosition(noon, LAT, LON);
      expect(pos.elevationDeg).toBeGreaterThan(40);
    });

    it('azimuth is roughly south (150–220°) at solar noon on Jun 21', () => {
      // At solar noon, the sun transits the meridian — azimuth ≈ 180° (south) for mid-latitudes NH
      const noon = new Date('2024-06-21T20:14:00Z');
      const pos = computeSunPosition(noon, LAT, LON);
      expect(pos.azimuthDeg).toBeGreaterThan(150);
      expect(pos.azimuthDeg).toBeLessThan(220);
    });

    it('zenith + elevation ≈ 90°', () => {
      const noon = new Date('2024-06-21T20:14:00Z');
      const pos = computeSunPosition(noon, LAT, LON);
      expect(pos.elevationDeg + pos.zenithDeg).toBeCloseTo(90, 0);
    });
  });


  // ── computeSolarDay ──────────────────────────────────────────────────────

  describe('computeSolarDay', () => {
    it('sunrise is before solarNoon which is before sunset', () => {
      const day = computeSolarDay(new Date('2024-06-21T12:00:00Z'), LAT, LON);
      expect(day.sunrise.getTime()).toBeLessThan(day.solarNoon.getTime());
      expect(day.solarNoon.getTime()).toBeLessThan(day.sunset.getTime());
    });

    it('summer solstice day length is > 15 h for Portland (PDT)', () => {
      const day = computeSolarDay(new Date('2024-06-21T12:00:00Z'), LAT, LON);
      expect(day.daylightMinutes).toBeGreaterThan(15 * 60);
    });

    it('daysToSolstice is 0 on the day of summer solstice', () => {
      const day = computeSolarDay(new Date('2024-06-21T12:00:00Z'), LAT, LON);
      expect(day.daysToSolstice).toBe(0);
    });

    it('daysToSolstice is positive on any other day', () => {
      const day = computeSolarDay(new Date('2024-03-22T12:00:00Z'), LAT, LON);
      expect(day.daysToSolstice).toBeGreaterThan(0);
    });
  });

  // ── estimateGHI ──────────────────────────────────────────────────────────

  describe('estimateGHI', () => {
    it('returns 0 when sun is at or below horizon', () => {
      expect(estimateGHI(0)).toBe(0);
      expect(estimateGHI(-5)).toBe(0);
    });

    it('returns a positive W/m² value at 45° elevation', () => {
      const ghi = estimateGHI(45);
      expect(ghi).toBeGreaterThan(0);
      expect(ghi).toBeLessThanOrEqual(1300);
    });

    it('returns maximum near 90° elevation and does not exceed solar constant', () => {
      const ghi = estimateGHI(90);
      expect(ghi).toBeLessThanOrEqual(1361);
      expect(ghi).toBeGreaterThan(600);
    });
  });

  // ── ghiToUvIndex & uvIndexToRisk ─────────────────────────────────────────

  describe('ghiToUvIndex', () => {
    it('maps 0 GHI to UV index 0', () => {
      expect(ghiToUvIndex(0)).toBe(0);
    });

    it('maps ~540 W/m² to UV index ~9 (Very High)', () => {
      expect(ghiToUvIndex(540)).toBeCloseTo(9.0, 0);
    });
  });

  describe('uvIndexToRisk', () => {
    it('classifies 0–2 as Low', ()  => expect(uvIndexToRisk(2)).toBe('Low'));
    it('classifies 3–5 as Moderate', () => expect(uvIndexToRisk(4)).toBe('Moderate'));
    it('classifies 6–7 as High',     () => expect(uvIndexToRisk(6)).toBe('High'));
    it('classifies 8–10 as Very High', () => expect(uvIndexToRisk(9)).toBe('Very High'));
    it('classifies 11+ as Extreme',  () => expect(uvIndexToRisk(11)).toBe('Extreme'));
  });
});
