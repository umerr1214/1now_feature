# Fleet Pulse

A standalone, demo-ready **Fleet Utilization & Idle Car Alert** dashboard widget built as a hiring exercise for 1Now (1now.ai). The widget computes each vehicle's utilization and idle streak over a rolling window, estimates unrealized revenue, and surfaces actionable, dollar-framed suggestions.

## Why This Feature for 1Now

Fleet Pulse addresses critical operational challenges for car-sharing platforms:

- **Fleet Metrics**: Real-time visibility into vehicle utilization patterns across different time windows
- **Yield Reporting**: Quantified revenue impact of idle vehicles with actionable recovery estimates
- **Dynamic Pricing Tiers**: Data-driven suggestions for rate adjustments based on demand patterns
- **Strategist Agent Integration**: Structured alerts that could feed into 1Now's AI agents for automated fleet optimization

This widget demonstrates how operational intelligence can be surfaced to fleet managers while providing the foundation for automated decision-making systems.

## How the Calculations Work

### Rolling Window Analysis
- **Window**: Configurable 14/30/60-day lookback period from today
- **Effective Window**: For new vehicles, uses `min(windowDays, daysSinceAdded + 1)` to avoid artificially low utilization

### Utilization Formula
```
utilization = bookedDays / effectiveWindow
bookedDays = unique calendar days with bookings (overlaps deduplicated)
```

### Average Daily Rate (ADR)
```
adr = totalRevenue / bookedDays
totalRevenue = sum of all booking amounts overlapping the window
fallback = vehicle.listedDailyRate (when no bookings)
```

### Idle Streak Detection
```
idleDays = days since last booking ended (or since added to fleet)
onTripNow = any booking where startDate ≤ today < endDate
nextBookingInDays = days until next future booking starts
```

### Revenue Impact
```
unrealizedRevenue = idleDays × adr (for alert-state vehicles only)
estimatedRecovery = Math.round(idleDays × 0.40) × adr (40% recovery assumption)
```

## Edge Cases Handled

1. **Overlapping Bookings**: Day-set deduplication ensures no double-counting when Turo and direct bookings overlap
2. **Window Clipping**: Bookings that straddle window boundaries are clipped to only count days within the analysis period
3. **Effective Window**: New vehicles use days-in-fleet as denominator to prevent artificially low utilization scores
4. **Future Booking Suppression**: Idle alerts are suppressed when a booking starts within 3 days
5. **Never-Booked Cars**: Idle streak calculated from `addedDate` when no booking history exists
6. **New Car Handling**: Utilization calculated over actual days in fleet, not full window period

## Assumptions

- **40% Recovery Rate**: Discount actions recover approximately 40% of idle days over the next month (conservative estimate)
- **Revenue Not Pro-Rated**: Full booking revenue counted for any booking overlapping the window (simpler, defensible approach)
- **Rule-Based Engine**: Current suggestion logic uses thresholds; designed for easy swap to ML/AI pricing engine

## How It Would Integrate into 1Now for Real

### Data Integration
- **Bookings API**: Replace seed data with live booking feed from 1Now's reservation system
- **Turo Sync**: Real-time integration with Turo API for external platform bookings
- **Vehicle Management**: Connect to fleet inventory system for real-time vehicle status

### AI Enhancement
- **Price Engine Swap**: Replace `RuleBasedSuggestionEngine` with 1Now's AI pricing algorithms
- **Market Intelligence**: Incorporate local demand patterns, seasonality, and competitive pricing
- **Predictive Analytics**: ML models for demand forecasting and optimal pricing strategies

### Operations Integration
- **Strategist Agent Push**: Automated alerts via email/SMS when vehicles enter critical idle state
- **Workflow Automation**: Direct integration with pricing management systems
- **Performance Tracking**: A/B testing framework for measuring suggestion effectiveness

## Running the Application

### Development
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to view the dashboard.

### Testing
```bash
npm test
```
Runs unit tests for core logic and component behavior.

### Production Build
```bash
npm run build
```
Creates optimized production build in `dist/` directory.

## What I'd Build Next

### Real-Time Features
- **Live WebSocket Updates**: Real-time booking status changes and utilization updates
- **Push Notifications**: Instant alerts when vehicles transition to critical idle state
- **Dynamic Refresh**: Auto-refresh dashboard when new bookings are detected

### Advanced Analytics
- **Per-Market ML Pricing**: Location-specific demand modeling and pricing optimization
- **Seasonal Adjustments**: Historical pattern recognition for seasonal pricing strategies
- **Competitive Intelligence**: Market rate monitoring and dynamic positioning

### Operational Enhancements
- **Turo Sync Conflict Resolution UI**: Interface for handling booking conflicts between platforms
- **Bulk Actions**: Multi-vehicle pricing updates and fleet-wide optimization tools
- **Performance Dashboards**: ROI tracking for implemented suggestions and pricing changes

### Integration Capabilities
- **API Gateway**: RESTful API for external system integration
- **Webhook Support**: Event-driven notifications for third-party systems
- **Export Functions**: CSV/Excel export for offline analysis and reporting

---

**Tech Stack**: Vite + React 18 + TypeScript · Tailwind CSS · Vitest + React Testing Library · date-fns

**Demo Data**: 8 vehicles with deterministic scenarios covering all alert states and edge cases