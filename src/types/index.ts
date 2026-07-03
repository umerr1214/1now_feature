export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  listedDailyRate: number;   // USD fallback when no booking history
  addedDate: string;          // ISO date
  imageColor?: string;        // hex for avatar color swatch
  utilization: number;        // 0..1, computed & stored server-side (fixed 30-day window)
}

export interface Booking {
  id: string;
  vehicleId: string;
  startDate: string;          // ISO datetime
  endDate: string;            // ISO datetime
  totalAmount: number;        // USD
  source: 'direct' | 'turo';
}

export type SuggestionStatus = 'idle-critical' | 'idle-warning' | 'high-demand' | 'healthy';

export interface Suggestion {
  status: SuggestionStatus;
  message: string | null;
  estimatedRecovery: number | null;  // $/mo, null when healthy
}

export interface IdleStreakResult {
  idleDays: number;
  nextBookingInDays: number | null;
  onTripNow: boolean;
}

export interface VehicleStats {
  vehicle: Vehicle;
  utilization: number;        // 0..1
  idleStreak: IdleStreakResult;
  adr: number;                // avg daily rate, whole dollars
  bookedDays: number;
  unrealizedRevenue: number;  // $0 when not in alert state
  suggestion: Suggestion;
}

export interface FleetConfig {
  windowDays: number;         // 14 | 30 | 60
  alertThreshold: number;     // 3 | 5 | 7
}

// Swappable strategy interface — swap RuleBasedSuggestionEngine for ML/AI later
export interface SuggestionEngine {
  evaluate(
    stats: Omit<VehicleStats, 'suggestion'>,
    config: FleetConfig
  ): Suggestion;
}