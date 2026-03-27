import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// ─────────────────────────────────────────────────────────────────
// Typed contracts mirroring the Zod schemas in agent/src/index.ts
// ─────────────────────────────────────────────────────────────────

export interface ClimateInsight {
  comfortScore: number;
  status: string;
  headline: string;
  recommendations: string[];
}

export interface AnomalyNarrative {
  title: string;
  narrative: string;
  severity: 'NOMINAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
  keywords: string[];
}

export interface NightCycleMatrix {
  riskLevel: string;
  stats: string;
  matrix: {
    do: string;
    decide: string;
    delegate: string;
    delete: string;
  };
}

export interface ForecastComparison {
  delta: string;
  insight: string;
  recommendation: string;
  weatherMood: 'COZY' | 'STUFFY' | 'BALANCED' | 'BREEZY' | 'CHILLY' | 'PERFECT';
}

export interface HotspotOverview {
  narrative: string;
  keyFacts: string[];
  threatLevel: 'NOMINAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
}

// ─────────────────────────────────────────────────────────────────
// Typed payloads for each POST request
// ─────────────────────────────────────────────────────────────────

export interface ClimatePayload {
  temp: number;
  humidity: number;
  co2: number;
  location: string;
}

export interface AnomalyPayload {
  albedo: number;
  ndvi: number;
  carbon: number;
  location: string;
  timestamp: string;
}

export interface NightCyclePayload {
  albedo: number;
  ndvi: number;
  carbon: number;
  location: string;
}

export interface ForecastPayload {
  indoorTemp: number;
  indoorHumidity: number;
  outdoorTemp: number;
  outdoorHumidity: number;
  cloudCover: number;
  precipMm: number;
  location: string;
}

export interface HotspotOverviewPayload {
  location: string;
  lat: number;
  lon: number;
}

// ─────────────────────────────────────────────────────────────────
// Fallback stubs rendered when the agent server is offline
// ─────────────────────────────────────────────────────────────────

const CLIMATE_FALLBACK: ClimateInsight = {
  comfortScore: 72,
  status: 'BALANCED',
  headline: 'AMBIENT CONDITIONS — AGENT OFFLINE. DISPLAYING CACHED BASELINE.',
  recommendations: [
    'Verify Genkit agent is running on port 3400.',
    'Check network connectivity to localhost.',
  ]
};

const ANOMALY_FALLBACK: AnomalyNarrative = {
  title: 'TELEMETRY STANDBY — AGENT OFFLINE',
  narrative: 'Environmental narrative generation requires the Genkit agent on port 3400. Displaying baseline metrics. All satellite feeds remain active.',
  severity: 'NOMINAL',
  keywords: ['offline', 'standby', 'baseline']
};

const FORECAST_FALLBACK: ForecastComparison = {
  delta: '—',
  insight: 'Forecast comparison offline. Start the Genkit agent to enable real-time indoor/outdoor analysis.',
  recommendation: 'Run `npm start` in the /agent directory.',
  weatherMood: 'BALANCED'
};

const HOTSPOT_OVERVIEW_FALLBACK: HotspotOverview = {
  narrative: 'Geographic grounding is offline. Launch the Genkit agent server on port 3400 to parse live planetary telemetry feeds and generate a grounded local threat assessment overview.',
  keyFacts: [
    'Telemetry module offline',
    'Run `npm start` inside the root workspace /agent directory'
  ],
  threatLevel: 'NOMINAL'
};

// ─────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────

const AGENT_URL = 'http://localhost:3400';

@Injectable({ providedIn: 'root' })
export class AiInsightsService {
  private http = inject(HttpClient);

  // ── Signal State ────────────────────────────────────────────────

  readonly climateInsight   = signal<ClimateInsight | null>(null);
  readonly anomalyNarrative = signal<AnomalyNarrative | null>(null);
  readonly forecastComparison = signal<ForecastComparison | null>(null);
  readonly hotspotOverview = signal<HotspotOverview | null>(null);
  readonly nightCycleMatrix = signal<NightCycleMatrix | null>(null);

  readonly climateLoading   = signal(false);
  readonly anomalyLoading   = signal(false);
  readonly forecastLoading  = signal(false);
  readonly hotspotOverviewLoading = signal(false);
  readonly nightCycleLoading = signal(false);

  readonly climateError     = signal<string | null>(null);
  readonly anomalyError     = signal<string | null>(null);
  readonly forecastError    = signal<string | null>(null);
  readonly hotspotOverviewError = signal<string | null>(null);
  readonly nightCycleError  = signal<string | null>(null);

  // ── Public API ──────────────────────────────────────────────────

  fetchClimateInsight(payload: ClimatePayload): void {
    this.climateLoading.set(true);
    this.climateError.set(null);
    this.http.post<ClimateInsight>(`${AGENT_URL}/analyzeIndoorClimate`, payload).subscribe({
      next: (data) => {
        this.climateInsight.set(data);
        this.climateLoading.set(false);
      },
      error: (err) => {
        console.warn('[AiInsightsService] analyzeIndoorClimate offline — using fallback.', err);
        this.climateInsight.set(CLIMATE_FALLBACK);
        this.climateLoading.set(false);
      }
    });
  }

  fetchAnomalyNarrative(payload: AnomalyPayload): void {
    this.anomalyLoading.set(true);
    this.anomalyError.set(null);
    this.http.post<AnomalyNarrative>(`${AGENT_URL}/anomalyNarrator`, payload).subscribe({
      next: (data) => {
        this.anomalyNarrative.set(data);
        this.anomalyLoading.set(false);
      },
      error: (err) => {
        console.warn('[AiInsightsService] anomalyNarrator offline — using fallback.', err);
        this.anomalyNarrative.set(ANOMALY_FALLBACK);
        this.anomalyLoading.set(false);
      }
    });
  }

  fetchForecastComparison(payload: ForecastPayload): void {
    this.forecastLoading.set(true);
    this.forecastError.set(null);
    this.http.post<ForecastComparison>(`${AGENT_URL}/forecastComparison`, payload).subscribe({
      next: (data) => {
        this.forecastComparison.set(data);
        this.forecastLoading.set(false);
      },
      error: (err) => {
        console.warn('[AiInsightsService] forecastComparison offline — using fallback.', err);
        this.forecastComparison.set(FORECAST_FALLBACK);
        this.forecastLoading.set(false);
      }
    });

  }

  fetchHotspotOverview(payload: HotspotOverviewPayload): void {
    this.hotspotOverviewLoading.set(true);
    this.hotspotOverviewError.set(null);
    this.http.post<HotspotOverview>(`${AGENT_URL}/analyzeHotspotTarget`, payload).subscribe({
      next: (data) => {
        this.hotspotOverview.set(data);
        this.hotspotOverviewLoading.set(false);
      },
      error: (err) => {
        console.warn('[AiInsightsService] analyzeHotspotTarget offline — using fallback.', err);
        this.hotspotOverview.set(HOTSPOT_OVERVIEW_FALLBACK);
        this.hotspotOverviewLoading.set(false);
      }
    });
  }

  fetchNightCycleMatrix(payload: NightCyclePayload): void {
    this.nightCycleLoading.set(true);
    this.nightCycleError.set(null);
    this.http.post<NightCycleMatrix>(`${AGENT_URL}/generateNightCycleMatrix`, payload).subscribe({
      next: (data) => {
        this.nightCycleMatrix.set(data);
        this.nightCycleLoading.set(false);
      },
      error: (err) => {
        console.warn('[AiInsightsService] generateNightCycleMatrix failed or offline.', err);
        this.nightCycleError.set(err.message || 'Error');
        this.nightCycleLoading.set(false);
      }
    });
  }

  /** Clears all cached AI data — call when navigating away or resetting location. */
  clear(): void {
    this.climateInsight.set(null);
    this.anomalyNarrative.set(null);
    this.forecastComparison.set(null);
    this.hotspotOverview.set(null);
    this.nightCycleMatrix.set(null);
    this.climateError.set(null);
    this.anomalyError.set(null);
    this.forecastError.set(null);
    this.hotspotOverviewError.set(null);
    this.nightCycleError.set(null);
  }

  /** Helper: returns a Tailwind colour class for a severity level. */
  severityColor(severity: string | null | undefined): string {
    switch (severity) {
      case 'CRITICAL': return 'text-red-400';
      case 'WARNING':  return 'text-orange-400';
      case 'WATCH':    return 'text-yellow-400';
      default:         return 'text-emerald-400';
    }
  }

  /** Helper: returns a Tailwind colour class for a weatherMood. */
  moodColor(mood: string | null | undefined): string {
    switch (mood) {
      case 'STUFFY':  return 'text-orange-400';
      case 'CHILLY':  return 'text-blue-400';
      case 'BREEZY':  return 'text-cyan-400';
      case 'COZY':    return 'text-amber-400';
      case 'PERFECT': return 'text-emerald-400';
      default:        return 'text-slate-400';
    }
  }
}
