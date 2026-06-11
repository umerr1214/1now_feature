
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
    <div className="bg-brand-card border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-brand-text-primary">Fleet Pulse</h1>
            <p className="text-brand-text-secondary mt-1">
              Last {windowDays} days · {vehicleCount} vehicles
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="window-select" className="text-sm font-medium text-brand-text-secondary">
                Window:
              </label>
              <select
                id="window-select"
                value={windowDays}
                onChange={(e) => onWindowChange(Number(e.target.value))}
                className="bg-brand-surface border border-brand-border rounded-md px-3 py-1 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
              >
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="threshold-select" className="text-sm font-medium text-brand-text-secondary">
                Idle alert:
              </label>
              <select
                id="threshold-select"
                value={alertThreshold}
                onChange={(e) => onThresholdChange(Number(e.target.value))}
                className="bg-brand-surface border border-brand-border rounded-md px-3 py-1 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
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
  );
}