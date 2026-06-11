import { useState, useEffect, useMemo } from 'react';
import { Vehicle, Booking, FleetConfig } from './types';
import { buildFleetReport } from './lib/fleetStats';
import { fetchFleetData } from './data/api';
import { SEED_TODAY } from './data/seed';
import { Header } from './components/Header';
import { SummaryRow } from './components/SummaryRow';
import { VehicleCard } from './components/VehicleCard';
import { SkeletonLoader } from './components/SkeletonLoader';
import { Toast } from './components/Toast';

function App() {
  // State
  const [windowDays, setWindowDays] = useState<14 | 30 | 60>(30);
  const [alertThreshold, setAlertThreshold] = useState<3 | 5 | 7>(5);
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [overrideRates, setOverrideRates] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ message: string } | null>(null);

  // Load data
  useEffect(() => {
    fetchFleetData().then(({ vehicles, bookings }) => {
      setVehicles(vehicles);
      setBookings(bookings);
    });
  }, []);

  // Compute fleet report
  const report = useMemo(() => {
    if (!vehicles || !bookings) return [];
    
    const config: FleetConfig = { windowDays, alertThreshold };
    return buildFleetReport(vehicles, bookings, config, SEED_TODAY);
  }, [vehicles, bookings, windowDays, alertThreshold]);

  // Filter out dismissed vehicles
  const visibleReport = useMemo(() => {
    return report.filter(stats => !dismissedIds.has(stats.vehicle.id));
  }, [report, dismissedIds]);

  // Handlers
  const handleApplyDiscount = (vehicleId: string, newRate: number) => {
    setOverrideRates(prev => ({ ...prev, [vehicleId]: newRate }));
    setToast({ message: `Rate updated to $${newRate}/day — we'll watch the next 7 days` });
  };

  const handleDismiss = (vehicleId: string) => {
    setDismissedIds(prev => new Set([...prev, vehicleId]));
  };

  const handleToastDismiss = () => {
    setToast(null);
  };

  const handleWindowChange = (days: number) => {
    setWindowDays(days as 14 | 30 | 60);
  };

  const handleThresholdChange = (threshold: number) => {
    setAlertThreshold(threshold as 3 | 5 | 7);
  };

  // Loading state
  if (!vehicles || !bookings) {
    return <SkeletonLoader />;
  }

  // Empty state
  const hasAlerts = visibleReport.some(stats => 
    stats.suggestion.status === 'idle-critical' || stats.suggestion.status === 'idle-warning'
  );

  return (
    <div className="min-h-screen bg-brand-primary">
      <Header
        windowDays={windowDays}
        alertThreshold={alertThreshold}
        vehicleCount={vehicles.length}
        onWindowChange={handleWindowChange}
        onThresholdChange={handleThresholdChange}
      />
      
      <SummaryRow stats={visibleReport} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {visibleReport.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="text-brand-text-muted mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-brand-text-primary mb-2">Your fleet is fully working</h3>
              <p className="text-brand-text-secondary">All vehicles have been dismissed or are performing well.</p>
            </div>
          </div>
        ) : !hasAlerts ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="text-brand-success mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-brand-text-primary mb-2">Fleet is healthy</h3>
              <p className="text-brand-text-secondary">No vehicles need immediate attention.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visibleReport.map((stats) => (
              <VehicleCard
                key={stats.vehicle.id}
                stats={stats}
                onApplyDiscount={handleApplyDiscount}
                onDismiss={handleDismiss}
                overrideRate={overrideRates[stats.vehicle.id]}
              />
            ))}
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} onDismiss={handleToastDismiss} />
      )}
    </div>
  );
}

export default App;