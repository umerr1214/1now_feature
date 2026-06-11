# Fleet Pulse — Implementation Plan

## Overview

A standalone, demo-ready **Fleet Utilization & Idle Car Alert** dashboard widget built as a hiring exercise for 1Now (1now.ai). The widget computes each vehicle's utilization and idle streak over a rolling window, estimates unrealized revenue, and surfaces actionable, dollar-framed suggestions.

**Stack:** Vite + React 18 + TypeScript · Tailwind CSS · Vitest + React Testing Library · date-fns

---

## File Structure

```
fleet-pulse/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── index.ts
    ├── data/
    │   ├── seed.ts
    │   └── api.ts
    ├── lib/
    │   ├── fleetStats.ts
    │   └── __tests__/
    │       ├── fleetStats.test.ts
    │       └── VehicleCard.test.tsx
    └── components/
        ├── Header.tsx
        ├── SummaryRow.tsx
        ├── VehicleCard.tsx
        ├── SkeletonLoader.tsx
        └── Toast.tsx
```

---

## Step 1 — Scaffold & Config

### `package.json` (key deps)

| Package | Purpose |
|---|---|
| `react` / `react-dom` ^18.3 | UI framework |
| `date-fns` ^3.6 | Date arithmetic (no moment.js) |
| `vite` + `@vitejs/plugin-react` | Build tool |
| `tailwindcss` ^3.4 | Styling |
| `vitest` + `@testing-library/react` | Unit + component tests |
| `jsdom` | DOM environment for tests |

### `vite.config.ts`
- Plugin: `@vitejs/plugin-react`
- Test config: `environment: 'jsdom'`, `globals: true`, `setupFiles: './src/setupTests.ts'`

### `tailwind.config.ts` — Brand tokens
```js
theme: {
  extend: {
    colors: {
      brand: {
        primary: '#111827',  // TODO: replace with 1Now's primary button color
        accent:  '#16a34a',  // TODO: replace with 1Now's accent/link color
        surface: '#f9fafb',  // TODO: replace with their page background
        border:  '#e5e7eb',  // TODO: replace with their card border gray
      }
    },
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui']
    }
  }
}
```

### `index.html`
- Loads Inter via Google Fonts (weights 400, 500, 600)
- Mounts `<div id="root">`

---

## Step 2 — Types (`src/types/index.ts`)

```typescript
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  listedDailyRate: number;   // USD fallback when no booking history
  addedDate: string;          // ISO date
  imageColor?: string;        // hex for avatar color swatch
}

interface Booking {
  id: string;
  vehicleId: string;
  startDate: string;          // ISO datetime
  endDate: string;            // ISO datetime
  totalAmount: number;        // USD
  source: 'direct' | 'turo';
}

type SuggestionStatus = 'idle-critical' | 'idle-warning' | 'high-demand' | 'healthy';

interface Suggestion {
  status: SuggestionStatus;
  message: string | null;
  estimatedRecovery: number | null;  // $/mo, null when healthy
}

interface IdleStreakResult {
  idleDays: number;
  nextBookingInDays: number | null;
  onTripNow: boolean;
}

interface VehicleStats {
  vehicle: Vehicle;
  utilization: number;        // 0..1
  idleStreak: IdleStreakResult;
  adr: number;                // avg daily rate, whole dollars
  bookedDays: number;
  unrealizedRevenue: number;  // $0 when not in alert state
  suggestion: Suggestion;
}

interface FleetConfig {
  windowDays: number;         // 14 | 30 | 60
  alertThreshold: number;     // 3 | 5 | 7
}

// Swappable strategy interface — swap RuleBasedSuggestionEngine for ML/AI later
interface SuggestionEngine {
  evaluate(
    stats: Omit<VehicleStats, 'suggestion'>,
    config: FleetConfig
  ): Suggestion;
}
```

---

## Step 3 — Seed Data (`src/data/seed.ts`)

8 vehicles and ~40 bookings, **deterministic** (no `Math.random()`). Dates are generated relative to a fixed `SEED_TODAY` export so tests are reproducible and the demo never goes stale.

### Vehicle scenarios

| Vehicle | Scenario | Expected status |
|---|---|---|
| `v1` | Last booking ended 11 days ago, ~30% utilization | `idle-critical` |
| `v2` | Last booking ended 6 days ago, ~40% utilization | `idle-warning` |
| `v3` | Active booking ongoing right now, 85%+ utilization | `high-demand` |
| `v4` | Idle 4 days, future booking starting in 2 days | `healthy` (alert suppressed) |
| `v5` | `addedDate = today−10`, one 3-day booking | utilization over 10 days, not 30 |
| `v6` | Turo + direct booking overlapping same 3 days | deduped to 3 booked days |
| `v7` | Booking from `today−35` to `today−27` (straddles window) | only 3 days counted in a 30-day window |
| `v8` | Regular healthy car | ~65% utilization, `healthy` |

Mix of `direct` and `turo` sources distributed across all vehicles.

---

## Step 4 — Core Logic (`src/lib/fleetStats.ts`)

**Rules:** Zero React imports. Every function accepts `today: Date` explicitly — `new Date()` is only called at the app entry point.

### `getWindowBounds(windowDays, today)`
Returns `{ windowStart, windowEnd }`. `windowEnd` = end of today; `windowStart` = today minus `(windowDays − 1)` days, start of that day.

---

### `getBookedDays(vehicle, bookings, windowDays, today): Set<string>`

```
1. Filter bookings for this vehicleId
2. For each booking:
   a. Clip [startDate, endDate] to [windowStart, windowEnd]
   b. Iterate each calendar day in the clipped range
   c. Add 'YYYY-MM-DD' string to Set
3. Return Set  ← automatic dedup of overlapping bookings
```

Uses `date-fns/eachDayOfInterval` + `date-fns/format`.

---

### `getEffectiveWindow(vehicle, windowDays, today): number`

```
daysInFleet = differenceInDays(today, parseISO(vehicle.addedDate)) + 1
return max(1, min(windowDays, daysInFleet))
```

New cars (addedDate inside window) use days-in-fleet as the denominator.

---

### `getUtilization(vehicle, bookings, windowDays, today): number`

```
bookedDays    = getBookedDays(...).size
effectiveWin  = getEffectiveWindow(vehicle, windowDays, today)
return bookedDays / effectiveWin   // 0..1
```

---

### `getIdleStreak(vehicle, bookings, today): IdleStreakResult`

```
1. Find any booking where startDate <= today < endDate
   → if found: { idleDays: 0, nextBookingInDays: null, onTripNow: true }
2. Find latest past booking (endDate <= today)
   → idleDays = differenceInDays(today, endDate)
   → if none: idleDays = differenceInDays(today, addedDate)
3. Find earliest future booking (startDate > today)
   → nextBookingInDays = differenceInDays(startDate, today)
return { idleDays, nextBookingInDays, onTripNow: false }
```

---

### `getADR(vehicle, bookings, windowDays, today): number`

```
bookedDays   = getBookedDays(...).size
if bookedDays === 0: return vehicle.listedDailyRate
revenue      = sum totalAmount of bookings overlapping the window
return Math.round(revenue / bookedDays)
```

> **Assumption:** revenue is counted per overlapping booking (not pro-rated by day). Simpler and defensible for an interview; documented in README.

---

### `getUnrealizedRevenue(idleDays, adr): number`

```
// Idle days × ADR = total opportunity cost of the idle streak
return idleDays * adr
// Surfaced only when car is in alert state; caller guards this
```

---

### `getEstimatedRecovery(idleDays, adr): number`

```
// Assumption: a discount action recovers ~40% of idle days over the next month
// Conservative estimate — documented in README
recoveredDays = Math.round(idleDays * 0.40)
return recoveredDays * adr
```

---

### `RuleBasedSuggestionEngine implements SuggestionEngine`

| Condition | Status | Suggestion |
|---|---|---|
| `idleDays >= 10` and no booking within 3 days | `idle-critical` | "Try a 15–20% discount or lower minimum trip length" + est. recovery $/mo |
| `idleDays >= alertThreshold` (5–9) and no booking within 3 days | `idle-warning` | "Try a 10% weekday discount" + est. recovery $/mo |
| `utilization >= 0.85` | `high-demand` | "Consider raising your daily rate by ~8–10%" + est. upside $/mo |
| otherwise | `healthy` | none |

Near-future booking check: `nextBookingInDays !== null && nextBookingInDays <= 3` → suppress idle alert regardless of streak.

---

### `buildFleetReport(vehicles, bookings, config, today): VehicleStats[]`

```
1. Compute VehicleStats for each vehicle
2. Sort:
   idle-critical → idle-warning → healthy → high-demand (last)
   Within same status: sort by unrealizedRevenue descending
3. Return sorted array
```

---

## Step 5 — Tests (`src/lib/__tests__/`)

Fixed anchor: `TODAY = new Date('2024-08-15T12:00:00Z')`

### Unit tests — `fleetStats.test.ts` (minimum 10 cases)

| # | Test | Assertion |
|---|---|---|
| 1 | Overlapping bookings (v6) | `getBookedDays` returns Set of size 3, not 6 |
| 2 | Window-straddling booking (v7) | only 3 days counted in 30-day window |
| 3 | Ongoing booking (v3) | `onTripNow = true`, `idleDays = 0` |
| 4 | Never-booked car | `idleDays = daysSinceAddedDate`, `utilization = 0`, `adr = listedDailyRate` |
| 5 | New car (10 days old, v5) | `getEffectiveWindow` = 10, not 30 |
| 6 | Future booking in 2 days (v4) | suggestion status = `healthy`, not an idle alert |
| 7 | 9 idle days, threshold=5 | `idle-warning` |
| 8 | 10 idle days | `idle-critical` (threshold-independent) |
| 9 | 88% utilization | `high-demand` suggestion |
| 10 | Revenue formula | `idleDays=12, adr=85` → `unrealizedRevenue=1020`, `estimatedRecovery=408` |

### Component test — `VehicleCard.test.tsx`

- Renders idle-critical stats → badge text "Idle alert", red styling
- Renders high-demand stats → badge text "High demand"
- Renders healthy stats → no suggestion line in DOM
- Clicks "Apply Discount" → toast appears with updated rate

---

## Step 6 — UI Components

### `App.tsx` — State model

```typescript
windowDays:     14 | 30 | 60        = 30
alertThreshold: 3 | 5 | 7           = 5
vehicles:       Vehicle[] | null     = null   // null = loading
bookings:       Booking[] | null     = null
dismissedIds:   Set<string>          = new Set()
overrideRates:  Record<string,number> = {}    // vehicleId → updated rate
toast:          { message: string } | null = null
```

`useEffect` calls `fetchFleetData()` (600ms artificial delay).

`useMemo` derives `report = buildFleetReport(...)` whenever state or config changes.

---

### `Header.tsx`

- `<h1>` "Fleet Pulse" · subtitle "Last N days · M vehicles"
- `<select>` Window: 14 / 30 / 60 days
- `<select>` Idle alert threshold: 3 / 5 / 7 days

---

### `SummaryRow.tsx` — Three metric cards

| Card | Value | Accent |
|---|---|---|
| Avg Fleet Utilization | `(sum / count).toFixed(0)%` | — |
| Idle Cars | count where status ∈ {critical, warning} | red text when > 0 |
| Unrealized Revenue | `$X,XXX` (locale-formatted) | sum of alert-state cars |

---

### `VehicleCard.tsx`

```
[color-swatch]  [Make Model Year · Plate]            [Status Badge]
                [Idle N days · ADR $X · Util Y%]
                [Progress bar — colored by status]
                [Suggestion text + est. recovery $/mo]
                [Apply Discount]  [Dismiss]   ← alert cards only
```

**Status badge colors**

| Status | Badge classes |
|---|---|
| `idle-critical` | `bg-red-50 text-red-700` |
| `idle-warning` | `bg-amber-50 text-amber-700` |
| `high-demand` | `bg-green-50 text-green-700` |
| `healthy` | `bg-gray-100 text-gray-600` |

**Progress bar colors:** red-500 / amber-500 / brand.accent / brand.primary

**Apply Discount:** computes `Math.round(listedDailyRate × 0.85)`, updates `overrideRates`, fires toast "Rate updated to $X/day — we'll watch the next 7 days".

**Dismiss:** adds `vehicleId` to `dismissedIds`, card disappears for the session.

---

### `SkeletonLoader.tsx`

4 skeleton card outlines with `animate-pulse` gray blocks (600ms while data loads).

---

### `Toast.tsx`

Fixed bottom-right overlay. `bg-gray-900 text-white` rounded pill. Auto-dismisses after 3.5 s. Triggered by Apply Discount.

---

### `src/data/api.ts`

```typescript
export async function fetchFleetData() {
  await new Promise(r => setTimeout(r, 600));  // artificial delay for loading state demo
  return { vehicles: SEED_VEHICLES, bookings: SEED_BOOKINGS };
}
```

---

## Step 7 — README.md

Sections:
1. **What it is** — 2–3 sentences
2. **Why this feature for 1Now** — fleet metrics, yield reporting, dynamic pricing tiers, Strategist agent
3. **How the calculations work** — window, day-set, ADR, idle streak, with formulas
4. **Edge cases handled** — overlapping bookings, window clipping, effective window, future booking suppression, never-booked car, new car
5. **Assumptions** — 40% recovery rate, revenue not pro-rated, rule-based engine
6. **How it would integrate into 1Now for real** — bookings API + Turo sync, AI Price Engine swap, Operations agent push (email/SMS)
7. **Running it** — `npm i && npm run dev` · `npm test`
8. **What I'd build next** — live WebSocket updates, per-market ML pricing, Turo sync conflict resolution UI

---

## Implementation Order

| Step | Deliverable | Done when |
|---|---|---|
| 1 | Scaffold (package.json, vite, tailwind, tsconfig, index.html) | `npm install` succeeds |
| 2 | `src/types/index.ts` | TypeScript compiles |
| 3 | `src/data/seed.ts` + `src/data/api.ts` | All 8 scenarios covered |
| 4 | `src/lib/fleetStats.ts` | All pure functions implemented |
| 5 | Tests | `npm test` passes — all 10+ cases green |
| 6 | UI components | Dev server renders all 8 cards correctly |
| 7 | README.md | All 8 sections complete |
| 8 | Final verification | `npm test` ✓ · `npm run build` ✓ · responsive at 375px ✓ |

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Day-set via `Set<string>`** | Guarantees no double-counting of overlapping bookings regardless of order |
| **Effective window denominator** | `min(windowDays, daysSinceAddedDate + 1)` — new cars aren't penalized with artificially low utilization |
| **Critical threshold fixed at 10** | `alertThreshold` selector tunes warning sensitivity; critical is always ≥ 10 idle days |
| **Revenue not pro-rated** | Count full `totalAmount` of any overlapping booking — simpler, defensible, documented |
| **`SuggestionEngine` interface** | Explicit seam for swapping in 1Now's AI pricing engine without touching UI code |
| **`today` as explicit parameter** | Zero `new Date()` calls inside `src/lib/` — all logic is deterministically testable |

---

## Verification Checklist

```bash
npm install
npm test          # all unit + component tests pass
npm run build     # TypeScript compiles, Vite bundles cleanly
npm run dev       # open localhost:5173
```

**Manual checks:**
- [ ] Loading skeleton visible for ~600ms on refresh
- [ ] All 8 vehicle cards render with correct badge and suggestion text
- [ ] Window selector (14/30/60) instantly recomputes — v5 (10-day-old car) utilization changes visibly
- [ ] Threshold selector (3/5/7) shifts which cards show `idle-warning`
- [ ] "Apply Discount" on v1 shows toast, button state changes
- [ ] "Dismiss" removes card for the session
- [ ] Resize to 375px — cards stack, summary grid wraps to 1 column
- [ ] All alerts dismissed → "Your fleet is fully working" empty state appears
