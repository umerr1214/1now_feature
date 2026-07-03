import { describe, it, expect } from 'vitest';
import {
  getBookedDays,
  getEffectiveWindow,
  getIdleStreak,
  getADR,
  getUnrealizedRevenue,
  getEstimatedRecovery,
  RuleBasedSuggestionEngine
} from '../fleetStats';
import { Vehicle, Booking, FleetConfig } from '../../types';

// Fixed anchor date for deterministic testing
const TODAY = new Date('2024-08-15T12:00:00Z');

const testVehicle: Vehicle = {
  id: 'test-v1',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  plate: 'TEST123',
  listedDailyRate: 85,
  addedDate: '2024-07-01',
  imageColor: '#ef4444',
  utilization: 0.5
};

const testBookings: Booking[] = [
  {
    id: 'b1',
    vehicleId: 'test-v1',
    startDate: '2024-07-25T10:00:00Z',
    endDate: '2024-07-28T10:00:00Z', // 3 days
    totalAmount: 255,
    source: 'direct'
  },
  {
    id: 'b2',
    vehicleId: 'test-v1',
    startDate: '2024-07-26T10:00:00Z',
    endDate: '2024-07-29T10:00:00Z', // overlaps with b1
    totalAmount: 255,
    source: 'turo'
  }
];

describe('Fleet Statistics', () => {
  describe('getBookedDays', () => {
    it('should deduplicate overlapping bookings', () => {
      const bookedDays = getBookedDays(testVehicle, testBookings, 30, TODAY);
      // Should be 4 unique days (25th, 26th, 27th, 28th), not 6
      expect(bookedDays.size).toBe(4);
      expect(bookedDays.has('2024-07-25')).toBe(true);
      expect(bookedDays.has('2024-07-26')).toBe(true);
      expect(bookedDays.has('2024-07-27')).toBe(true);
      expect(bookedDays.has('2024-07-28')).toBe(true);
    });

    it('should clip bookings to window bounds', () => {
      const straddlingBooking: Booking = {
        id: 'b3',
        vehicleId: 'test-v1',
        startDate: '2024-07-11T10:00:00Z', // 35 days ago
        endDate: '2024-07-19T10:00:00Z', // 27 days ago
        totalAmount: 840,
        source: 'direct'
      };
      
      const bookedDays = getBookedDays(testVehicle, [straddlingBooking], 30, TODAY);
      // Only last 3 days should count in 30-day window (17th, 18th, 19th)
      expect(bookedDays.size).toBe(3);
      expect(bookedDays.has('2024-07-17')).toBe(true);
      expect(bookedDays.has('2024-07-18')).toBe(true);
      expect(bookedDays.has('2024-07-19')).toBe(true);
    });
  });

  describe('getIdleStreak', () => {
    it('should detect ongoing booking', () => {
      const ongoingBooking: Booking = {
        id: 'b4',
        vehicleId: 'test-v1',
        startDate: '2024-08-10T10:00:00Z',
        endDate: '2024-08-20T10:00:00Z', // ongoing through today
        totalAmount: 1000,
        source: 'direct'
      };
      
      const result = getIdleStreak(testVehicle, [ongoingBooking], TODAY);
      expect(result.onTripNow).toBe(true);
      expect(result.idleDays).toBe(0);
      expect(result.nextBookingInDays).toBe(null);
    });

    it('should calculate idle days from last booking end', () => {
      const pastBooking: Booking = {
        id: 'b5',
        vehicleId: 'test-v1',
        startDate: '2024-08-01T10:00:00Z',
        endDate: '2024-08-05T10:00:00Z', // ended 10 days ago
        totalAmount: 400,
        source: 'direct'
      };
      
      const result = getIdleStreak(testVehicle, [pastBooking], TODAY);
      expect(result.onTripNow).toBe(false);
      expect(result.idleDays).toBe(10);
    });

    it('should calculate idle days from added date when never booked', () => {
      const neverBookedVehicle: Vehicle = {
        ...testVehicle,
        addedDate: '2024-08-05' // 10 days ago
      };
      
      const result = getIdleStreak(neverBookedVehicle, [], TODAY);
      expect(result.idleDays).toBe(10);
      expect(result.onTripNow).toBe(false);
    });

    it('should detect future booking', () => {
      const futureBooking: Booking = {
        id: 'b6',
        vehicleId: 'test-v1',
        startDate: '2024-08-17T10:00:00Z', // starts in 2 days
        endDate: '2024-08-20T10:00:00Z',
        totalAmount: 300,
        source: 'direct'
      };
      
      const result = getIdleStreak(testVehicle, [futureBooking], TODAY);
      expect(result.nextBookingInDays).toBe(2);
    });
  });

  describe('getEffectiveWindow', () => {
    it('should use days in fleet for new cars', () => {
      const newVehicle: Vehicle = {
        ...testVehicle,
        addedDate: '2024-08-05' // 10 days ago
      };
      
      const effectiveWindow = getEffectiveWindow(newVehicle, 30, TODAY);
      expect(effectiveWindow).toBe(10); // not 30
    });

    it('should use full window for established cars', () => {
      const effectiveWindow = getEffectiveWindow(testVehicle, 30, TODAY);
      expect(effectiveWindow).toBe(30);
    });
  });

  describe('getADR', () => {
    it('should return listed rate when no bookings', () => {
      const adr = getADR(testVehicle, [], 30, TODAY);
      expect(adr).toBe(85); // listedDailyRate
    });

    it('should calculate ADR from overlapping bookings', () => {
      // Total revenue: 255 + 255 = 510, booked days: 4, ADR = 510/4 = 127.5 → 128
      const adr = getADR(testVehicle, testBookings, 30, TODAY);
      expect(adr).toBe(128);
    });
  });

  describe('RuleBasedSuggestionEngine', () => {
    const engine = new RuleBasedSuggestionEngine();
    const config: FleetConfig = { windowDays: 30, alertThreshold: 5 };

    it('should suggest idle-critical for 10+ idle days', () => {
      const stats = {
        vehicle: testVehicle,
        utilization: 0.3,
        idleStreak: { idleDays: 12, nextBookingInDays: null, onTripNow: false },
        adr: 85,
        bookedDays: 9,
        unrealizedRevenue: 0
      };
      
      const suggestion = engine.evaluate(stats, config);
      expect(suggestion.status).toBe('idle-critical');
      expect(suggestion.message).toContain('15–20% discount');
      expect(suggestion.estimatedRecovery).toBe(408); // 12 * 0.4 * 85 = 408
    });

    it('should suggest idle-warning for threshold+ idle days', () => {
      const stats = {
        vehicle: testVehicle,
        utilization: 0.4,
        idleStreak: { idleDays: 7, nextBookingInDays: null, onTripNow: false },
        adr: 85,
        bookedDays: 12,
        unrealizedRevenue: 0
      };
      
      const suggestion = engine.evaluate(stats, config);
      expect(suggestion.status).toBe('idle-warning');
      expect(suggestion.message).toContain('10% weekday discount');
    });

    it('should suggest high-demand for 85%+ utilization', () => {
      const stats = {
        vehicle: testVehicle,
        utilization: 0.88,
        idleStreak: { idleDays: 2, nextBookingInDays: null, onTripNow: false },
        adr: 85,
        bookedDays: 26,
        unrealizedRevenue: 0
      };
      
      const suggestion = engine.evaluate(stats, config);
      expect(suggestion.status).toBe('high-demand');
      expect(suggestion.message).toContain('raising your daily rate');
    });

    it('should suppress idle alert when future booking within 3 days', () => {
      const stats = {
        vehicle: testVehicle,
        utilization: 0.3,
        idleStreak: { idleDays: 7, nextBookingInDays: 2, onTripNow: false },
        adr: 85,
        bookedDays: 9,
        unrealizedRevenue: 0
      };
      
      const suggestion = engine.evaluate(stats, config);
      expect(suggestion.status).toBe('healthy');
    });

    it('should return healthy for normal cars', () => {
      const stats = {
        vehicle: testVehicle,
        utilization: 0.65,
        idleStreak: { idleDays: 3, nextBookingInDays: null, onTripNow: false },
        adr: 85,
        bookedDays: 19,
        unrealizedRevenue: 0
      };
      
      const suggestion = engine.evaluate(stats, config);
      expect(suggestion.status).toBe('healthy');
      expect(suggestion.message).toBe(null);
    });
  });

  describe('Revenue calculations', () => {
    it('should calculate unrealized revenue correctly', () => {
      const unrealized = getUnrealizedRevenue(12, 85);
      expect(unrealized).toBe(1020); // 12 * 85
    });

    it('should calculate estimated recovery correctly', () => {
      const recovery = getEstimatedRecovery(12, 85);
      expect(recovery).toBe(408); // Math.round(12 * 0.4) * 85 = 5 * 85
    });
  });
});