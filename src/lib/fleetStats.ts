import { 
  Vehicle, 
  Booking, 
  VehicleStats, 
  FleetConfig, 
  IdleStreakResult, 
  Suggestion, 
  SuggestionEngine,
  SuggestionStatus 
} from '../types';
import { 
  differenceInDays, 
  parseISO, 
  eachDayOfInterval, 
  format, 
  startOfDay, 
  endOfDay,
  subDays,
  isAfter,
  isBefore,
  isEqual
} from 'date-fns';

export function getWindowBounds(windowDays: number, today: Date) {
  const windowEnd = endOfDay(today);
  const windowStart = startOfDay(subDays(today, windowDays - 1));
  return { windowStart, windowEnd };
}

export function getBookedDays(
  vehicle: Vehicle, 
  bookings: Booking[], 
  windowDays: number, 
  today: Date
): Set<string> {
  const { windowStart, windowEnd } = getWindowBounds(windowDays, today);
  const vehicleBookings = bookings.filter(b => b.vehicleId === vehicle.id);
  const bookedDaysSet = new Set<string>();

  for (const booking of vehicleBookings) {
    const bookingStart = parseISO(booking.startDate);
    const bookingEnd = parseISO(booking.endDate);

    // Clip booking to window bounds
    const clippedStart = isAfter(bookingStart, windowStart) ? bookingStart : windowStart;
    const clippedEnd = isBefore(bookingEnd, windowEnd) ? bookingEnd : windowEnd;

    // Skip if booking doesn't overlap with window
    if (isAfter(clippedStart, clippedEnd)) continue;

    // Add each day in the clipped range
    const daysInRange = eachDayOfInterval({ start: clippedStart, end: clippedEnd });
    for (const day of daysInRange) {
      bookedDaysSet.add(format(day, 'yyyy-MM-dd'));
    }
  }

  return bookedDaysSet;
}

export function getEffectiveWindow(vehicle: Vehicle, windowDays: number, today: Date): number {
  const addedDate = parseISO(vehicle.addedDate);
  const daysInFleet = differenceInDays(today, addedDate) + 1;
  return Math.max(1, Math.min(windowDays, daysInFleet));
}

export function getIdleStreak(vehicle: Vehicle, bookings: Booking[], today: Date): IdleStreakResult {
  const vehicleBookings = bookings.filter(b => b.vehicleId === vehicle.id);
  
  // Check if currently on a trip
  const currentBooking = vehicleBookings.find(booking => {
    const start = parseISO(booking.startDate);
    const end = parseISO(booking.endDate);
    return (isBefore(start, today) || isEqual(start, today)) && isAfter(end, today);
  });

  if (currentBooking) {
    return { idleDays: 0, nextBookingInDays: null, onTripNow: true };
  }

  // Find latest past booking
  const pastBookings = vehicleBookings
    .filter(booking => {
      const end = parseISO(booking.endDate);
      return isBefore(end, today) || isEqual(end, today);
    })
    .sort((a, b) => parseISO(b.endDate).getTime() - parseISO(a.endDate).getTime());

  let idleDays: number;
  if (pastBookings.length > 0) {
    const lastBookingEnd = parseISO(pastBookings[0].endDate);
    idleDays = differenceInDays(today, lastBookingEnd);
  } else {
    // No past bookings, idle since added to fleet
    const addedDate = parseISO(vehicle.addedDate);
    idleDays = differenceInDays(today, addedDate);
  }

  // Find earliest future booking
  const futureBookings = vehicleBookings
    .filter(booking => {
      const start = parseISO(booking.startDate);
      return isAfter(start, today);
    })
    .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());

  const nextBookingInDays = futureBookings.length > 0 
    ? differenceInDays(parseISO(futureBookings[0].startDate), today)
    : null;

  return { idleDays, nextBookingInDays, onTripNow: false };
}

export function getADR(
  vehicle: Vehicle, 
  bookings: Booking[], 
  windowDays: number, 
  today: Date
): number {
  const bookedDays = getBookedDays(vehicle, bookings, windowDays, today).size;
  
  if (bookedDays === 0) {
    return vehicle.listedDailyRate;
  }

  const { windowStart, windowEnd } = getWindowBounds(windowDays, today);
  const vehicleBookings = bookings.filter(b => b.vehicleId === vehicle.id);
  
  let totalRevenue = 0;
  for (const booking of vehicleBookings) {
    const bookingStart = parseISO(booking.startDate);
    const bookingEnd = parseISO(booking.endDate);
    
    // Check if booking overlaps with window
    if (isBefore(bookingEnd, windowStart) || isAfter(bookingStart, windowEnd)) {
      continue;
    }
    
    totalRevenue += booking.totalAmount;
  }

  return Math.round(totalRevenue / bookedDays);
}

export function getUnrealizedRevenue(idleDays: number, adr: number): number {
  return idleDays * adr;
}

export function getEstimatedRecovery(idleDays: number, adr: number): number {
  // Assumption: a discount action recovers ~40% of idle days over the next month
  const recoveredDays = Math.round(idleDays * 0.40);
  return recoveredDays * adr;
}

export class RuleBasedSuggestionEngine implements SuggestionEngine {
  evaluate(
    stats: Omit<VehicleStats, 'suggestion'>,
    config: FleetConfig
  ): Suggestion {
    const { idleStreak, utilization, adr } = stats;
    const { alertThreshold } = config;
    const { idleDays, nextBookingInDays } = idleStreak;

    // Suppress idle alerts if booking within 3 days
    const hasNearFutureBooking = nextBookingInDays !== null && nextBookingInDays <= 3;

    // High demand check
    if (utilization >= 0.85) {
      const estimatedUpside = getEstimatedRecovery(7, Math.round(adr * 0.09)); // ~9% rate increase
      return {
        status: 'high-demand',
        message: 'Consider raising your daily rate by ~8–10%',
        estimatedRecovery: estimatedUpside
      };
    }

    // Idle critical (10+ days, regardless of threshold)
    if (idleDays >= 10 && !hasNearFutureBooking) {
      const recovery = getEstimatedRecovery(idleDays, adr);
      return {
        status: 'idle-critical',
        message: 'Try a 15–20% discount or lower minimum trip length',
        estimatedRecovery: recovery
      };
    }

    // Idle warning (threshold to 9 days)
    if (idleDays >= alertThreshold && idleDays < 10 && !hasNearFutureBooking) {
      const recovery = getEstimatedRecovery(idleDays, adr);
      return {
        status: 'idle-warning',
        message: 'Try a 10% weekday discount',
        estimatedRecovery: recovery
      };
    }

    // Healthy
    return {
      status: 'healthy',
      message: null,
      estimatedRecovery: null
    };
  }
}

export function buildFleetReport(
  vehicles: Vehicle[],
  bookings: Booking[],
  config: FleetConfig,
  today: Date
): VehicleStats[] {
  const suggestionEngine = new RuleBasedSuggestionEngine();
  
  const stats = vehicles.map(vehicle => {
    const utilization = vehicle.utilization;
    const idleStreak = getIdleStreak(vehicle, bookings, today);
    const adr = getADR(vehicle, bookings, config.windowDays, today);
    const bookedDays = getBookedDays(vehicle, bookings, config.windowDays, today).size;
    
    const baseStats = {
      vehicle,
      utilization,
      idleStreak,
      adr,
      bookedDays,
      unrealizedRevenue: 0 // Will be set below based on suggestion status
    };
    
    const suggestion = suggestionEngine.evaluate(baseStats, config);
    
    // Calculate unrealized revenue only for alert states
    const unrealizedRevenue = (suggestion.status === 'idle-critical' || suggestion.status === 'idle-warning')
      ? getUnrealizedRevenue(idleStreak.idleDays, adr)
      : 0;

    return {
      ...baseStats,
      unrealizedRevenue,
      suggestion
    };
  });

  // Sort: idle-critical → idle-warning → healthy → high-demand
  // Within same status: sort by unrealizedRevenue descending
  const statusPriority: Record<SuggestionStatus, number> = {
    'idle-critical': 1,
    'idle-warning': 2,
    'healthy': 3,
    'high-demand': 4
  };

  return stats.sort((a, b) => {
    const priorityDiff = statusPriority[a.suggestion.status] - statusPriority[b.suggestion.status];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Within same status, sort by unrealized revenue descending
    return b.unrealizedRevenue - a.unrealizedRevenue;
  });
}