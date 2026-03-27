import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import express from 'express';
import cors from 'cors';

const ai = genkit({
  plugins: [googleAI()],
});

// ──────────────────────────────────────────────────────────────────────────────
// FLOW 1: Night Cycle Eisenhower Matrix (Original — Gemini 2.5 Pro)
// Derives a tactical Eisenhower priority matrix from live orbital telemetry.
// ──────────────────────────────────────────────────────────────────────────────

export const NightCycleMatrixSchema = z.object({
  riskLevel: z.string(),
  stats: z.string(),
  matrix: z.object({
    do: z.string(),
    decide: z.string(),
    delegate: z.string(),
    delete: z.string()
  })
});

export const generateNightCycleMatrix = ai.defineFlow({
  name: 'generateNightCycleMatrix',
  inputSchema: z.object({
    location: z.string(),
    albedo: z.number(),
    ndvi: z.number(),
    carbon: z.number()
  }),
  outputSchema: NightCycleMatrixSchema
}, async (input) => {
  const prompt = `You are a highly analytical orbital intelligence system formulating operational tactical tasks for environmental anomalies.
Based on the following live orbital telemetry:
- Location Code: ${input.location}
- Albedo Index: ${input.albedo.toFixed(1)}
- NDVI (Biomass): ${input.ndvi.toFixed(2)}
- Carbon Flux: ${input.carbon.toFixed(1)} kt

Analyze these metrics to establish a "Night Cycle" Eisenhower Matrix of actions to execute tomorrow.
The tone should be authoritative, sci-fi tactical, direct, and actionable.

Evaluate the severity to determine riskLevel (e.g., MODERATE, ELEVATED, CRITICAL, NOMINAL).
Generate a concise 'stats' string replicating this style: "NDVI ${input.ndvi.toFixed(2)} · FLUX ${input.carbon.toFixed(0)} kt · ALB ${input.albedo.toFixed(0)}%".
Then fill out the matrix (do, decide, delegate, delete) with distinct directives.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-pro',
    prompt,
    output: { schema: NightCycleMatrixSchema }
  });

  if (!output) {
      throw new Error("Failed to generate night cycle matrix");
  }

  return output;
});

// ──────────────────────────────────────────────────────────────────────────────
// FLOW 2: Indoor Climate Analyzer (Gemini 2.5 Flash — low latency)
// Interprets indoor sensor telemetry into a comfort score and coaching directives.
// ──────────────────────────────────────────────────────────────────────────────

export const ClimateInsightSchema = z.object({
  comfortScore: z.number().describe('0–100 comfort rating'),
  status: z.string().describe('Short status label e.g. OPTIMAL, DRY, STUFFY, HOT, COLD'),
  headline: z.string().describe('One concise tactical headline summarizing the indoor environment'),
  recommendations: z.array(z.string()).describe('2–4 specific, actionable recommendations')
});

export const analyzeIndoorClimate = ai.defineFlow({
  name: 'analyzeIndoorClimate',
  inputSchema: z.object({
    temp: z.number().describe('Indoor temperature in °F'),
    humidity: z.number().describe('Relative humidity percentage'),
    co2: z.number().describe('CO₂ concentration in ppm'),
    location: z.string().describe('Location label or site name')
  }),
  outputSchema: ClimateInsightSchema
}, async (input) => {
  const prompt = `You are an indoor environmental intelligence system analyzing live sensor telemetry.

Live readings at ${input.location}:
- Temperature: ${input.temp.toFixed(1)}°F
- Relative Humidity: ${input.humidity.toFixed(0)}%
- CO₂ Concentration: ${input.co2.toFixed(0)} ppm

Ideal indoor ranges: temperature 68–76°F, humidity 40–60%, CO₂ below 800 ppm (excellent) or below 1000 ppm (acceptable).

Generate a JSON response with:
- comfortScore: A 0–100 integer rating based on how all three metrics align with ideal ranges simultaneously.
- status: A single uppercase label (OPTIMAL, DRY, HUMID, STUFFY, HOT, COLD, CO2_HIGH, or BALANCED).
- headline: One authoritative one-liner summarizing the indoor environment for a mission-critical dashboard.
- recommendations: An array of 2–4 specific, actionable steps a person can immediately take to improve conditions.

Tone: precise, technical, minimalist. No filler. No markdown in text fields.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt,
    output: { schema: ClimateInsightSchema }
  });

  if (!output) {
    throw new Error("Indoor climate analysis failed");
  }

  return output;
});

// ──────────────────────────────────────────────────────────────────────────────
// FLOW 3: Anomaly Narrator (Gemini 2.5 Flash — per-hotspot digest)
// Generates a plain-English environmental narrative from satellite metrics.
// ──────────────────────────────────────────────────────────────────────────────

export const AnomalyNarrativeSchema = z.object({
  title: z.string().describe('Short tactical headline for the anomaly report'),
  narrative: z.string().describe('2–3 sentence plain-English digest of environmental conditions'),
  severity: z.string().describe('NOMINAL | WATCH | WARNING | CRITICAL'),
  keywords: z.array(z.string()).describe('3–5 single-word environmental tags')
});

export const anomalyNarrator = ai.defineFlow({
  name: 'anomalyNarrator',
  inputSchema: z.object({
    albedo: z.number().describe('Surface albedo reflectance index 0–100'),
    ndvi: z.number().describe('NDVI vegetation index 0–1'),
    carbon: z.number().describe('Carbon flux estimate in kt'),
    location: z.string().describe('Location code or site label'),
    timestamp: z.string().describe('ISO 8601 timestamp of the reading')
  }),
  outputSchema: AnomalyNarrativeSchema
}, async (input) => {
  const prompt = `You are an orbital environmental intelligence system generating concise anomaly reports.

TELEMETRY SNAPSHOT — ${input.location} @ ${input.timestamp}
- Surface Albedo: ${input.albedo.toFixed(1)} (normal range: 50–80 for healthy ecosystems)
- NDVI Biomass Index: ${input.ndvi.toFixed(2)} (healthy: >0.6, stressed: 0.3–0.6, critical: <0.3)
- Carbon Flux: ${input.carbon.toFixed(1)} kt (baseline: <60kt normal, 60–100kt elevated, >100kt critical)

Generate a concise environmental anomaly report with:
- title: A punchy tactical headline (max 8 words).
- narrative: 2–3 sentences interpreting the combined metrics in plain English. Mention specific values. Be direct.
- severity: One of NOMINAL, WATCH, WARNING, CRITICAL — determined by the worst individual metric.
- keywords: 3–5 single-word environmental tags (e.g., "deforestation", "albedo-loss", "sequestration").

Do not use markdown. Be authoritative, not alarmist.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt,
    output: { schema: AnomalyNarrativeSchema }
  });

  if (!output) {
    throw new Error("Anomaly narration failed");
  }

  return output;
});

// ──────────────────────────────────────────────────────────────────────────────
// FLOW 4: Forecast Comparison (Gemini 2.5 Flash — indoor vs outdoor)
// Compares indoor vs outdoor conditions and surfaces an actionable insight.
// ──────────────────────────────────────────────────────────────────────────────

export const ForecastComparisonSchema = z.object({
  delta: z.string().describe('Concise delta string e.g. "+8°F warmer indoors"'),
  insight: z.string().describe('One sentence insight about the comparison'),
  recommendation: z.string().describe('One specific actionable recommendation'),
  weatherMood: z.string().describe('Single word mood label: COZY | STUFFY | BALANCED | BREEZY | CHILLY | PERFECT')
});

export const forecastComparison = ai.defineFlow({
  name: 'forecastComparison',
  inputSchema: z.object({
    indoorTemp: z.number().describe('Indoor temperature in °F'),
    indoorHumidity: z.number().describe('Indoor relative humidity %'),
    outdoorTemp: z.number().describe('Outdoor temperature in °F'),
    outdoorHumidity: z.number().describe('Outdoor relative humidity %'),
    cloudCover: z.number().describe('Cloud cover percentage 0–100'),
    precipMm: z.number().describe('Precipitation in mm'),
    location: z.string().describe('Site or city name')
  }),
  outputSchema: ForecastComparisonSchema
}, async (input) => {
  const tempDiff = (input.indoorTemp - input.outdoorTemp).toFixed(1);
  const humDiff  = (input.indoorHumidity - input.outdoorHumidity).toFixed(0);

  const prompt = `You are an environmental intelligence system comparing indoor and outdoor conditions at ${input.location}.

INDOOR: ${input.indoorTemp.toFixed(1)}°F / ${input.indoorHumidity.toFixed(0)}% RH
OUTDOOR: ${input.outdoorTemp.toFixed(1)}°F / ${input.outdoorHumidity.toFixed(0)}% RH
Cloud Cover: ${input.cloudCover.toFixed(0)}%
Precipitation: ${input.precipMm.toFixed(1)} mm
Temperature Delta: indoor is ${Number(tempDiff) > 0 ? '+' : ''}${tempDiff}°F relative to outside
Humidity Delta: indoor is ${Number(humDiff) > 0 ? '+' : ''}${humDiff}% relative to outside

Analyze the comparison and generate:
- delta: A concise, human-readable delta string (e.g. "+8°F warmer indoors", "matching humidity").
- insight: One sentence explaining what this means for comfort or energy use.
- recommendation: One specific actionable step (e.g. "Open north-facing windows", "Run dehumidifier").
- weatherMood: One of: COZY, STUFFY, BALANCED, BREEZY, CHILLY, PERFECT.

No markdown. Direct and pithy.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt,
    output: { schema: ForecastComparisonSchema }
  });

  if (!output) {
    throw new Error("Forecast comparison failed");
  }

  return output;
});

// ──────────────────────────────────────────────────────────────────────────────
// FLOW 5: Grounded Geographic Hotspot Overview (Gemini 2.5 Pro)
// Leverages Google Search grounding to return a detailed, up-to-date briefing.
// ──────────────────────────────────────────────────────────────────────────────

export const HotspotOverviewSchema = z.object({
  narrative: z.string().describe('A rich, 3-paragraph tactical overview of the location combining ecological, geographic, and economic context.'),
  keyFacts: z.array(z.string()).describe('3-5 bullet points of unique, up-to-date facts about the area.'),
  threatLevel: z.string().describe('One of NOMINAL, WATCH, WARNING, CRITICAL')
});

export const analyzeHotspotTarget = ai.defineFlow({
  name: 'analyzeHotspotTarget',
  inputSchema: z.object({
    location: z.string().describe('Location name or site label'),
    lat: z.number().describe('Latitude'),
    lon: z.number().describe('Longitude')
  }),
  outputSchema: HotspotOverviewSchema
}, async (input) => {
  const prompt = `You are a strategic intelligence system providing a grounded geographical briefing for a telemetry dashboard.
  
Target: ${input.location}
Coordinates: ${input.lat.toFixed(4)}, ${input.lon.toFixed(4)}

Generate a comprehensive geographical and ecological profile for this exact location using current grounded search data.
- Narrative: Provide a rich, 3-paragraph tactical overview combining its geographical importance, current ecological status (e.g., climate change impacts, shipping volume, or glacial retreat based on the type of area), and strategic profile. Make it read like a mission briefing.
- Key Facts: 3-5 unique, up-to-date, grounded facts about the target point (e.g. recent temperatures, environmental policies, or geographical trivia).
- Threat Level: Assess an overall environmental risk level: NOMINAL, WATCH, WARNING, or CRITICAL.

Tone: Authoritative, sci-fi tactical, highly precise. NO fallback filler. Focus entirely on grounded reality.

CRITICAL INSTRUCTION: You MUST output your response as raw, valid JSON matching this exact structure:
{
  "narrative": "A rich, 3-paragraph tactical overview...",
  "keyFacts": ["Fact 1", "Fact 2", "Fact 3"],
  "threatLevel": "One of NOMINAL, WATCH, WARNING, or CRITICAL"
}
Do NOT include \`\`\`json markdown blocks or any conversational text.`;

  const { text } = await ai.generate({
    model: 'googleai/gemini-2.5-pro',
    config: { googleSearchRetrieval: true },
    prompt
  });

  if (!text) {
    throw new Error("Grounded area overview failed to generate text.");
  }

  // Strip arbitrary markdown wrapping just in case the model ignores the instruction
  const cleanText = text.replace(/^```(json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  
  return JSON.parse(cleanText);
});

// ──────────────────────────────────────────────────────────────────────────────
// Express HTTP Server
// ──────────────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

app.post('/generateNightCycleMatrix', async (req, res) => {
  try {
    const result = await generateNightCycleMatrix(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error generating matrix:', error);
    res.status(500).json({ error: String(error) });
  }
});

app.post('/analyzeIndoorClimate', async (req, res) => {
  try {
    const result = await analyzeIndoorClimate(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error analyzing indoor climate:', error);
    res.status(500).json({ error: String(error) });
  }
});

app.post('/anomalyNarrator', async (req, res) => {
  try {
    const result = await anomalyNarrator(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error narrating anomaly:', error);
    res.status(500).json({ error: String(error) });
  }
});

app.post('/forecastComparison', async (req, res) => {
  try {
    const result = await forecastComparison(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error comparing forecast:', error);
    res.status(500).json({ error: String(error) });
  }
});

app.post('/analyzeHotspotTarget', async (req, res) => {
  try {
    const result = await analyzeHotspotTarget(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error analyzing hotspot target:', error);
    res.status(500).json({ error: String(error) });
  }
});

const port = 3400;
app.listen(port, () => {
  console.log(`Genkit agent server running on port ${port}`);
  console.log(`  POST /generateNightCycleMatrix`);
  console.log(`  POST /analyzeIndoorClimate`);
  console.log(`  POST /anomalyNarrator`);
  console.log(`  POST /forecastComparison`);
});
