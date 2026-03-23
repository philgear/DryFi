# DryFi Project Context for AI Agents

## Overview
DryFi is an IoT environmental monitoring dashboard displaying real-time indoor and outdoor metrics.
- **Backend/IoT**: Arduino C++ hardware nodes pushing data into Adafruit IO.
- **Frontend**: Angular 21 application built alongside Tailwind CSS v4.

## Tech Stack Directives
1. **Angular 21+**: Utilize modern Angular conventions. Rely on the new Control Flow Syntax (`@if`, `@for`), and heavily utilize **Signals** (`signal<T>`) for reactive state management.
2. **Tailwind CSS v4**: Build interfaces using utility classes exclusively. Keep `*.component.css` files empty and avoid custom CSS logic unless bridging complex keyframe animations or legacy integrations.
3. **Data Architecture**: The Angular `HttpClient` manages REST calls inside `WeatherService`. Ensure API requests reference `environment.ts` parameters and avoid hardcoding raw string endpoints.

## Visual Design & UX Standards
- **Aesthetic Benchmark**: The UI must be exceptionally premium feeling, leveraging clean glassmorphism patterns (e.g., `backdrop-blur-2xl`, translucent `/40` background opacities).
- **Color Palettes**: Rely on curated deep tailwind palettes (e.g., `slate-950` backgrounds) offset by vibrant element indicators (e.g., `emerald-400`, `blue-400`).
- **Tactility & Micro-animations**: Components should "breathe" logically (e.g., utilizing `transition-all duration-500 hover:-translate-y-2` on cards, and subtle `.animate-pulse` dots for real-time status indicators). Do not generate flat, unresponsive MVPs.
