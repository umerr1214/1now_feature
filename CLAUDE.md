# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Fleet Pulse — a Fleet Utilization & Idle Car Alert dashboard (built as a hiring exercise for 1Now). It computes each vehicle's utilization and idle streak over a rolling window, estimates unrealized revenue from idle vehicles, and surfaces dollar-framed pricing suggestions.

Two independent apps in one repo:
- **Frontend** (repo root): Vite + React 18 + TypeScript + Tailwind, fetches data from the backend API.
- **Backend** (`backend/`): FastAPI + Motor (async MongoDB driver), serves read-only vehicle/booking data.

## Commands

### Frontend (run from repo root)
```
npm run dev       # start dev server at http://localhost:5173
npm run build     # tsc typecheck + vite build -> dist/
npm run lint      # eslint . --ext ts,tsx --max-warnings 0
npm test          # vitest (watch mode)
npm test -- --run # vitest single run
npm test -- fleetStats        # run a single test file by name pattern
npm run preview   # preview production build
```
The frontend reads `VITE_API_URL` from `.env` (currently `http://localhost:8000`) to reach the backend.

### Backend (run from `backend/`)
```
pip install -r requirements.txt
uvicorn app.main:app --reload   # start API at http://localhost:8000
```
Requires `backend/.env` (see `backend/.env.example`) with `MONGODB_URI`, `DB_NAME`, `CORS_ORIGINS`. On startup, `seed_if_empty` populates the `vehicles`/`bookings` collections with deterministic demo data if they're empty — there's no seed data if the collections already have documents.

## Architecture

### Data flow
`backend` (FastAPI, `GET /api/vehicles`, `GET /api/bookings`) → `src/data/api.ts` (`fetchFleetData`) → `App.tsx` state → `buildFleetReport` (`src/lib/fleetStats.ts`) → `VehicleCard` components. The backend is a thin read-only data layer; **all business logic (utilization, idle detection, revenue, suggestions) lives in the frontend**, in `src/lib/fleetStats.ts`.

Mongo documents use `_id`; the API layer (`backend/app/main.py`) converts this to a string `id` field to match the frontend's `Vehicle`/`Booking` types (kept in sync between `backend/app/models.py` and `src/types/index.ts` — update both when changing the shape of these entities).

### Core calculation pipeline (`src/lib/fleetStats.ts`)
`buildFleetReport(vehicles, bookings, config, today)` is the single entry point the UI calls. For each vehicle it composes:
1. `getBookedDays` — dedupes overlapping bookings (Turo + direct) into a `Set` of `yyyy-MM-dd` strings, clipped to the rolling window (`getWindowBounds`).
2. `getEffectiveWindow` — for vehicles added to the fleet more recently than the window, uses `days-in-fleet` instead of `windowDays` as the denominator so new cars aren't penalized.
3. `getUtilization` = bookedDays / effectiveWindow.
4. `getIdleStreak` — determines `onTripNow`, `idleDays` (since last booking end, or since `addedDate` if never booked), and `nextBookingInDays`.
5. `getADR` — average daily rate from revenue of bookings overlapping the window; falls back to `vehicle.listedDailyRate` when there are no bookings.
6. `RuleBasedSuggestionEngine.evaluate` — thresholds on utilization/idle days produce one of `idle-critical` / `idle-warning` / `high-demand` / `healthy`, each with a message and `estimatedRecovery`. Idle alerts are suppressed when a booking starts within 3 days (`nextBookingInDays <= 3`).
7. `unrealizedRevenue` is only non-zero for `idle-critical`/`idle-warning` states (`idleDays × adr`).

Results are sorted by status priority (`idle-critical` → `idle-warning` → `healthy` → `high-demand`), then by `unrealizedRevenue` descending, within `buildFleetReport` itself.

`SuggestionEngine` (`src/types/index.ts`) is an explicit strategy interface — `RuleBasedSuggestionEngine` is meant to be swapped for an ML/AI pricing engine later without touching the rest of the pipeline.

### Frontend state (`src/App.tsx`)
All fleet state lives in `App.tsx` (no global store): `windowDays` (14/30/60), `alertThreshold` (3/5/7), fetched `vehicles`/`bookings`, locally-dismissed vehicle IDs, and locally-applied `overrideRates` from the discount action (UI-only — not persisted to the backend). `buildFleetReport` is recomputed via `useMemo` whenever inputs change.

### Styling
Tailwind with a custom dark theme under the `brand.*` namespace (`tailwind.config.ts`) — `brand-primary`/`brand-surface`/`brand-card` for backgrounds, `brand-text-{primary,secondary,muted}` for text, `brand-{success,warning,danger,live}` for state colors. Reuse these tokens rather than raw Tailwind colors or hex values when styling components.

## Testing

Vitest + React Testing Library, jsdom environment (configured in `vite.config.ts`, setup in `src/setupTests.ts`). Tests live under `src/lib/__tests__/`. Calculation tests (`fleetStats.test.ts`) anchor to a fixed `TODAY` date (e.g. `new Date('2024-08-15T12:00:00Z')`) for determinism — follow this pattern for any new date-dependent test rather than using `new Date()`.
