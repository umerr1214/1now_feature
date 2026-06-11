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
    <div className="bg-brand-primary border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Fleet Utilization */}
          <div className="relative bg-gradient-to-br from-brand-card/90 to-brand-card/60 backdrop-blur-md rounded-2xl border border-brand-border/30 p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:border-brand-accent/50 hover:bg-gradient-to-br hover:from-brand-card/95 hover:to-brand-card/70 group hover:scale-[1.02] hover:shadow-brand-accent/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/0 to-brand-accent/0 group-hover:from-brand-accent/10 group-hover:to-brand-accent/5 rounded-2xl transition-all duration-500 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-text-secondary">Avg Fleet Utilization</p>
                  <p className="text-3xl font-bold text-brand-text-primary mt-2">
                    {avgUtilization}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Idle Cars */}
          <div className="relative bg-gradient-to-br from-brand-card/90 to-brand-card/60 backdrop-blur-md rounded-2xl border border-brand-border/30 p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:border-brand-accent/50 hover:bg-gradient-to-br hover:from-brand-card/95 hover:to-brand-card/70 group hover:scale-[1.02] hover:shadow-brand-accent/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/0 to-brand-accent/0 group-hover:from-brand-accent/10 group-hover:to-brand-accent/5 rounded-2xl transition-all duration-500 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-text-secondary">Idle Cars</p>
                  <p className={`text-3xl font-bold mt-2 ${
                    idleCars > 0 ? 'text-brand-danger' : 'text-brand-text-primary'
                  }`}>
                    {idleCars}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Unrealized Revenue */}
          <div className="relative bg-gradient-to-br from-brand-card/90 to-brand-card/60 backdrop-blur-md rounded-2xl border border-brand-border/30 p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:border-brand-accent/50 hover:bg-gradient-to-br hover:from-brand-card/95 hover:to-brand-card/70 group hover:scale-[1.02] hover:shadow-brand-accent/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/0 to-brand-accent/0 group-hover:from-brand-accent/10 group-hover:to-brand-accent/5 rounded-2xl transition-all duration-500 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-text-secondary">Unrealized Revenue</p>
                  <p className="text-3xl font-bold text-brand-accent mt-2">
                    ${unrealizedRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}