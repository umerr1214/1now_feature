import { VehicleStats, SuggestionStatus } from '../types';

interface VehicleCardProps {
  stats: VehicleStats;
  onApplyDiscount: (vehicleId: string, newRate: number) => void;
  onDismiss: (vehicleId: string) => void;
  overrideRate?: number;
}

const statusConfig: Record<SuggestionStatus, {
  badgeText: string;
  badgeClasses: string;
  progressColor: string;
}> = {
  'idle-critical': {
    badgeText: 'Idle alert',
    badgeClasses: 'bg-red-50 text-red-700',
    progressColor: 'bg-red-500'
  },
  'idle-warning': {
    badgeText: 'Idle alert',
    badgeClasses: 'bg-amber-50 text-amber-700',
    progressColor: 'bg-amber-500'
  },
  'high-demand': {
    badgeText: 'High demand',
    badgeClasses: 'bg-green-50 text-green-700',
    progressColor: 'bg-brand-accent'
  },
  'healthy': {
    badgeText: 'Healthy',
    badgeClasses: 'bg-gray-100 text-gray-600',
    progressColor: 'bg-brand-primary'
  }
};

export function VehicleCard({ stats, onApplyDiscount, onDismiss, overrideRate }: VehicleCardProps) {
  const { vehicle, utilization, idleStreak, adr, suggestion } = stats;
  const config = statusConfig[suggestion.status];
  
  const handleApplyDiscount = () => {
    const discountedRate = Math.round(vehicle.listedDailyRate * 0.85);
    onApplyDiscount(vehicle.id, discountedRate);
  };

  const isAlertState = suggestion.status === 'idle-critical' || suggestion.status === 'idle-warning';
  const showActions = isAlertState && !overrideRate;

  return (
    <div className="bg-white rounded-lg border border-brand-border p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Color swatch */}
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: vehicle.imageColor }}
          />
          <div>
            <h3 className="font-medium text-brand-primary">
              {vehicle.make} {vehicle.model} {vehicle.year} · {vehicle.plate}
            </h3>
          </div>
        </div>
        
        {/* Status badge */}
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.badgeClasses}`}>
          {config.badgeText}
        </span>
      </div>

      {/* Stats line */}
      <div className="text-sm text-gray-600 mb-3">
        {idleStreak.onTripNow ? 'On trip now' : `Idle ${idleStreak.idleDays} days`} · 
        ADR ${adr} · 
        Util {Math.round(utilization * 100)}%
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${config.progressColor}`}
            style={{ width: `${Math.min(utilization * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Suggestion */}
      {suggestion.message && (
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-1">{suggestion.message}</p>
          {suggestion.estimatedRecovery && (
            <p className="text-sm text-gray-600">
              Est. recovery: ${suggestion.estimatedRecovery}/mo
            </p>
          )}
        </div>
      )}

      {/* Override rate message */}
      {overrideRate && (
        <div className="mb-4">
          <p className="text-sm text-green-700 font-medium">
            Rate updated to ${overrideRate}/day — we'll watch the next 7 days
          </p>
        </div>
      )}

      {/* Action buttons */}
      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={handleApplyDiscount}
            className="px-3 py-1.5 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors"
          >
            Apply Discount
          </button>
          <button
            onClick={() => onDismiss(vehicle.id)}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}