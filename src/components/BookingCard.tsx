import { Booking, Vehicle } from '../types';
import { BookingStatus } from '../lib/bookingStats';

interface BookingCardProps {
  booking: Booking;
  vehicle: Vehicle | undefined;
  status: BookingStatus;
}

const statusConfig: Record<BookingStatus, { label: string; classes: string }> = {
  upcoming: {
    label: 'Upcoming',
    classes: 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30',
  },
  active: {
    label: 'Active',
    classes: 'bg-brand-live/20 text-brand-live border border-brand-live/30',
  },
  completed: {
    label: 'Completed',
    classes: 'bg-brand-text-muted/20 text-brand-text-secondary border border-brand-border',
  },
};

const sourceConfig: Record<Booking['source'], { label: string; classes: string }> = {
  direct: {
    label: 'Direct',
    classes: 'bg-brand-success/20 text-brand-success border border-brand-success/30',
  },
  turo: {
    label: 'Turo',
    classes: 'bg-brand-warning/20 text-brand-warning border border-brand-warning/30',
  },
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function nightsBetween(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function BookingCard({ booking, vehicle, status }: BookingCardProps) {
  const statusCfg = statusConfig[status];
  const sourceCfg = sourceConfig[booking.source];
  const nights = nightsBetween(booking.startDate, booking.endDate);

  return (
    <div className="relative bg-gradient-to-br from-brand-card/90 to-brand-card/60 backdrop-blur-md rounded-2xl border border-brand-border/30 p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:border-brand-accent/50 hover:bg-gradient-to-br hover:from-brand-card/95 hover:to-brand-card/70 group hover:scale-[1.02] hover:shadow-brand-accent/20">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/0 to-brand-accent/0 group-hover:from-brand-accent/10 group-hover:to-brand-accent/5 rounded-2xl transition-all duration-500 pointer-events-none"></div>
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: vehicle?.imageColor ?? '#666666' }}
            />
            <div className="min-w-0">
              <h3 className="font-medium text-brand-text-primary truncate">
                {vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year}` : 'Unknown vehicle'}
              </h3>
              {vehicle && (
                <p className="text-xs text-brand-text-muted">{vehicle.plate}</p>
              )}
            </div>
          </div>

          <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${statusCfg.classes}`}>
            {statusCfg.label}
          </span>
        </div>

        {/* Date range */}
        <div className="text-sm text-brand-text-secondary mb-3">
          {formatDate(booking.startDate)} – {formatDate(booking.endDate)} · {nights} {nights === 1 ? 'night' : 'nights'}
        </div>

        {/* Footer: amount + source */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-brand-text-primary">
            ${booking.totalAmount.toLocaleString()}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${sourceCfg.classes}`}>
            {sourceCfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}
