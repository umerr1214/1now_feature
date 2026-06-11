import { Vehicle, Booking } from '../types';

// Fixed anchor date for deterministic testing
export const SEED_TODAY = new Date('2024-08-15T12:00:00Z');

export const SEED_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    plate: 'ABC123',
    listedDailyRate: 85,
    addedDate: '2024-07-01',
    imageColor: '#ef4444'
  },
  {
    id: 'v2',
    make: 'Honda',
    model: 'Civic',
    year: 2023,
    plate: 'DEF456',
    listedDailyRate: 75,
    addedDate: '2024-06-15',
    imageColor: '#3b82f6'
  },
  {
    id: 'v3',
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    plate: 'GHI789',
    listedDailyRate: 120,
    addedDate: '2024-05-01',
    imageColor: '#10b981'
  },
  {
    id: 'v4',
    make: 'Nissan',
    model: 'Altima',
    year: 2022,
    plate: 'JKL012',
    listedDailyRate: 70,
    addedDate: '2024-06-01',
    imageColor: '#f59e0b'
  },
  {
    id: 'v5',
    make: 'Ford',
    model: 'Mustang',
    year: 2023,
    plate: 'MNO345',
    listedDailyRate: 95,
    addedDate: '2024-08-05', // 10 days ago from SEED_TODAY
    imageColor: '#8b5cf6'
  },
  {
    id: 'v6',
    make: 'BMW',
    model: '3 Series',
    year: 2023,
    plate: 'PQR678',
    listedDailyRate: 110,
    addedDate: '2024-07-10',
    imageColor: '#ec4899'
  },
  {
    id: 'v7',
    make: 'Audi',
    model: 'A4',
    year: 2022,
    plate: 'STU901',
    listedDailyRate: 105,
    addedDate: '2024-06-20',
    imageColor: '#06b6d4'
  },
  {
    id: 'v8',
    make: 'Mercedes',
    model: 'C-Class',
    year: 2023,
    plate: 'VWX234',
    listedDailyRate: 115,
    addedDate: '2024-05-15',
    imageColor: '#84cc16'
  }
];

export const SEED_BOOKINGS: Booking[] = [
  // v1 - Last booking ended 11 days ago, ~30% utilization (idle-critical)
  {
    id: 'b1',
    vehicleId: 'v1',
    startDate: '2024-07-20T10:00:00Z',
    endDate: '2024-07-23T10:00:00Z',
    totalAmount: 255,
    source: 'direct'
  },
  {
    id: 'b2',
    vehicleId: 'v1',
    startDate: '2024-07-28T10:00:00Z',
    endDate: '2024-08-04T10:00:00Z', // ended 11 days ago
    totalAmount: 595,
    source: 'turo'
  },

  // v2 - Last booking ended 6 days ago, ~40% utilization (idle-warning)
  {
    id: 'b3',
    vehicleId: 'v2',
    startDate: '2024-07-18T10:00:00Z',
    endDate: '2024-07-22T10:00:00Z',
    totalAmount: 300,
    source: 'direct'
  },
  {
    id: 'b4',
    vehicleId: 'v2',
    startDate: '2024-07-25T10:00:00Z',
    endDate: '2024-07-30T10:00:00Z',
    totalAmount: 375,
    source: 'turo'
  },
  {
    id: 'b5',
    vehicleId: 'v2',
    startDate: '2024-08-02T10:00:00Z',
    endDate: '2024-08-09T10:00:00Z', // ended 6 days ago
    totalAmount: 525,
    source: 'direct'
  },

  // v3 - Active booking ongoing right now, 85%+ utilization (high-demand)
  {
    id: 'b6',
    vehicleId: 'v3',
    startDate: '2024-07-16T10:00:00Z',
    endDate: '2024-07-20T10:00:00Z',
    totalAmount: 480,
    source: 'direct'
  },
  {
    id: 'b7',
    vehicleId: 'v3',
    startDate: '2024-07-22T10:00:00Z',
    endDate: '2024-07-28T10:00:00Z',
    totalAmount: 720,
    source: 'turo'
  },
  {
    id: 'b8',
    vehicleId: 'v3',
    startDate: '2024-07-30T10:00:00Z',
    endDate: '2024-08-05T10:00:00Z',
    totalAmount: 720,
    source: 'direct'
  },
  {
    id: 'b9',
    vehicleId: 'v3',
    startDate: '2024-08-07T10:00:00Z',
    endDate: '2024-08-18T10:00:00Z', // ongoing through today
    totalAmount: 1320,
    source: 'turo'
  },

  // v4 - Idle 4 days, future booking starting in 2 days (healthy - alert suppressed)
  {
    id: 'b10',
    vehicleId: 'v4',
    startDate: '2024-07-20T10:00:00Z',
    endDate: '2024-07-25T10:00:00Z',
    totalAmount: 350,
    source: 'direct'
  },
  {
    id: 'b11',
    vehicleId: 'v4',
    startDate: '2024-08-01T10:00:00Z',
    endDate: '2024-08-11T10:00:00Z', // ended 4 days ago
    totalAmount: 700,
    source: 'turo'
  },
  {
    id: 'b12',
    vehicleId: 'v4',
    startDate: '2024-08-17T10:00:00Z', // starts in 2 days
    endDate: '2024-08-22T10:00:00Z',
    totalAmount: 350,
    source: 'direct'
  },

  // v5 - addedDate = today−10, one 3-day booking (utilization over 10 days, not 30)
  {
    id: 'b13',
    vehicleId: 'v5',
    startDate: '2024-08-08T10:00:00Z',
    endDate: '2024-08-11T10:00:00Z',
    totalAmount: 285,
    source: 'direct'
  },

  // v6 - Turo + direct booking overlapping same 3 days (deduped to 3 booked days)
  {
    id: 'b14',
    vehicleId: 'v6',
    startDate: '2024-07-25T10:00:00Z',
    endDate: '2024-07-28T10:00:00Z', // 3 days
    totalAmount: 330,
    source: 'direct'
  },
  {
    id: 'b15',
    vehicleId: 'v6',
    startDate: '2024-07-26T10:00:00Z',
    endDate: '2024-07-29T10:00:00Z', // overlaps with above
    totalAmount: 330,
    source: 'turo'
  },
  {
    id: 'b16',
    vehicleId: 'v6',
    startDate: '2024-08-05T10:00:00Z',
    endDate: '2024-08-10T10:00:00Z',
    totalAmount: 550,
    source: 'direct'
  },

  // v7 - Booking from today−35 to today−27 (straddles window, only 3 days counted in 30-day window)
  {
    id: 'b17',
    vehicleId: 'v7',
    startDate: '2024-07-11T10:00:00Z', // 35 days ago
    endDate: '2024-07-19T10:00:00Z', // 27 days ago, only last 3 days count in 30-day window
    totalAmount: 840,
    source: 'direct'
  },
  {
    id: 'b18',
    vehicleId: 'v7',
    startDate: '2024-08-01T10:00:00Z',
    endDate: '2024-08-06T10:00:00Z',
    totalAmount: 525,
    source: 'turo'
  },

  // v8 - Regular healthy car (~65% utilization, healthy)
  {
    id: 'b19',
    vehicleId: 'v8',
    startDate: '2024-07-18T10:00:00Z',
    endDate: '2024-07-23T10:00:00Z',
    totalAmount: 575,
    source: 'direct'
  },
  {
    id: 'b20',
    vehicleId: 'v8',
    startDate: '2024-07-26T10:00:00Z',
    endDate: '2024-08-01T10:00:00Z',
    totalAmount: 690,
    source: 'turo'
  },
  {
    id: 'b21',
    vehicleId: 'v8',
    startDate: '2024-08-05T10:00:00Z',
    endDate: '2024-08-12T10:00:00Z',
    totalAmount: 805,
    source: 'direct'
  }
];