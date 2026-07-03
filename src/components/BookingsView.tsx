import { useMemo, useState } from 'react';
import { Booking, Vehicle } from '../types';
import { getBookingStatus, BookingStatus } from '../lib/bookingStats';
import { BookingCard } from './BookingCard';

type StatusFilter = 'all' | BookingStatus;
type SourceFilter = 'all' | Booking['source'];
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

interface BookingsViewProps {
  vehicles: Vehicle[];
  bookings: Booking[];
}

const selectClasses =
  'bg-brand-card border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all duration-200 hover:border-brand-accent/50 cursor-pointer';

export function BookingsView({ vehicles, bookings }: BookingsViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const vehiclesById = useMemo(() => {
    const map = new Map<string, Vehicle>();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const now = useMemo(() => new Date(), []);

  const visibleBookings = useMemo(() => {
    let result = bookings.map((booking) => ({
      booking,
      status: getBookingStatus(booking, now),
    }));

    if (statusFilter !== 'all') {
      result = result.filter((entry) => entry.status === statusFilter);
    }
    if (sourceFilter !== 'all') {
      result = result.filter((entry) => entry.booking.source === sourceFilter);
    }
    if (vehicleFilter !== 'all') {
      result = result.filter((entry) => entry.booking.vehicleId === vehicleFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.booking.startDate.localeCompare(a.booking.startDate);
        case 'date-asc':
          return a.booking.startDate.localeCompare(b.booking.startDate);
        case 'amount-desc':
          return b.booking.totalAmount - a.booking.totalAmount;
        case 'amount-asc':
          return a.booking.totalAmount - b.booking.totalAmount;
      }
    });

    return result;
  }, [bookings, statusFilter, sourceFilter, vehicleFilter, sortBy, now]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filter & sort controls */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-8">
        <div className="flex flex-col gap-1">
          <label htmlFor="status-filter" className="text-xs font-medium text-brand-text-muted uppercase tracking-wider">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={selectClasses}
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="source-filter" className="text-xs font-medium text-brand-text-muted uppercase tracking-wider">
            Source
          </label>
          <select
            id="source-filter"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
            className={selectClasses}
          >
            <option value="all">All</option>
            <option value="direct">Direct</option>
            <option value="turo">Turo</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="vehicle-filter" className="text-xs font-medium text-brand-text-muted uppercase tracking-wider">
            Vehicle
          </label>
          <select
            id="vehicle-filter"
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className={selectClasses}
          >
            <option value="all">All vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model} · {v.plate}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:ml-auto">
          <label htmlFor="sort-by" className="text-xs font-medium text-brand-text-muted uppercase tracking-wider">
            Sort by
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className={selectClasses}
          >
            <option value="date-desc">Start date (newest)</option>
            <option value="date-asc">Start date (oldest)</option>
            <option value="amount-desc">Amount (high to low)</option>
            <option value="amount-asc">Amount (low to high)</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {visibleBookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-brand-text-muted mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-brand-text-primary mb-2">No bookings match your filters</h3>
            <p className="text-brand-text-secondary">Try adjusting the filters above.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleBookings.map(({ booking, status }) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              vehicle={vehiclesById.get(booking.vehicleId)}
              status={status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
