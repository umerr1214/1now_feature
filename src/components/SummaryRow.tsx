import { VehicleStats } from '../types';

interface SummaryRowProps {
  stats: VehicleStats[];
}

export function SummaryRow({ stats }: SummaryRowProps) {
  const avgUtilization = stats.length > 0 
    ? Math.round((stats.reduce((sum, s) => sum + s.utilization, 0) / stats.length) * 100)
    : 0;

  const idleCars = stats.filter(s => 
    s.suggestion.status === 'idle-critical' || s.suggestion.status === 'idle-warning'
  ).length;

  const unrealizedRevenue = stats.reduce((sum, s) => sum + s.unrealizedRevenue, 0);

  return (
    <div className="bg-brand-surface border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Fleet Utilization */}
          <div className="bg-white rounded-lg border border-brand-border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Avg Fleet Utilization</p>
                <p className="text-2xl font-semibold text-brand-primary mt-1">
                  {avgUtilization}%
                </p>
              </div>
            </div>
          </div>

          {/* Idle Cars */}
          <div className="bg-white rounded-lg border border-brand-border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Idle Cars</p>
                <p className={`text-2xl font-semibold mt-1 ${
                  idleCars > 0 ? 'text-red-600' : 'text-brand-primary'
                }`}>
                  {idleCars}
                </p>
              </div>
            </div>
          </div>

          {/* Unrealized Revenue */}
          <div className="bg-white rounded-lg border border-brand-border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Unrealized Revenue</p>
                <p className="text-2xl font-semibold text-brand-primary mt-1">
                  ${unrealizedRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}