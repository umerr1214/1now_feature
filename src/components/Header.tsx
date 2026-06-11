
interface HeaderProps {
  windowDays: number;
  alertThreshold: number;
  vehicleCount: number;
  onWindowChange: (days: number) => void;
  onThresholdChange: (threshold: number) => void;
}

export function Header({ 
  windowDays, 
  alertThreshold, 
  vehicleCount, 
  onWindowChange, 
  onThresholdChange 
}: HeaderProps) {
  return (
    <div className="bg-brand-primary border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            {/* Category tag */}
            <div className="mb-4">
              <span className="text-xs font-medium text-brand-text-muted uppercase tracking-wider">
                FLEET AI • INTELLIGENCE
              </span>
            </div>
            
            {/* Main title */}
            <div className="mb-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-brand-text-primary leading-tight">
                The Operational Cost
              </h1>
              <h1 className="text-4xl lg:text-5xl font-bold text-brand-text-primary leading-tight">
                of <span className="text-brand-accent">Idle Vehicles.</span>
              </h1>
            </div>
            
            {/* Subtitle */}
            <p className="text-brand-text-secondary text-lg max-w-2xl">
              Real-time fleet utilization analytics with AI-powered suggestions to maximize revenue and minimize idle time across your {vehicleCount} vehicles.
            </p>
          </div>
          
          {/* Right side controls */}
          <div className="flex flex-col gap-4 lg:items-end">
            {/* Cost indicator */}
            <div className="mb-4">
              <div className="bg-brand-accent/10 border border-brand-accent/30 rounded-full px-4 py-2">
                <span className="text-brand-accent text-sm font-medium">
                  Analysis window • {windowDays} days
                </span>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="window-select" className="text-xs font-medium text-brand-text-muted uppercase tracking-wider">
                  Analysis Window
                </label>
                <select
                  id="window-select"
                  value={windowDays}
                  onChange={(e) => onWindowChange(Number(e.target.value))}
                  className="bg-brand-card border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all duration-200 hover:border-brand-accent/50 cursor-pointer"
                >
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-1">
                <label htmlFor="threshold-select" className="text-xs font-medium text-brand-text-muted uppercase tracking-wider">
                  Idle Alert Threshold
                </label>
                <select
                  id="threshold-select"
                  value={alertThreshold}
                  onChange={(e) => onThresholdChange(Number(e.target.value))}
                  className="bg-brand-card border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all duration-200 hover:border-brand-accent/50 cursor-pointer"
                >
                  <option value={3}>3 days</option>
                  <option value={5}>5 days</option>
                  <option value={7}>7 days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}