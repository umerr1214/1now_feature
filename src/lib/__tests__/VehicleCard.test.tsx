import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VehicleCard } from '../../components/VehicleCard';
import { VehicleStats } from '../../types';

const mockIdleCriticalStats: VehicleStats = {
  vehicle: {
    id: 'v1',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    plate: 'ABC123',
    listedDailyRate: 85,
    addedDate: '2024-07-01',
    imageColor: '#ef4444',
    utilization: 0.3
  },
  utilization: 0.3,
  idleStreak: { idleDays: 12, nextBookingInDays: null, onTripNow: false },
  adr: 85,
  bookedDays: 9,
  unrealizedRevenue: 1020,
  suggestion: {
    status: 'idle-critical',
    message: 'Try a 15–20% discount or lower minimum trip length',
    estimatedRecovery: 408
  }
};

const mockHighDemandStats: VehicleStats = {
  vehicle: {
    id: 'v3',
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    plate: 'GHI789',
    listedDailyRate: 120,
    addedDate: '2024-05-01',
    imageColor: '#10b981',
    utilization: 0.88
  },
  utilization: 0.88,
  idleStreak: { idleDays: 0, nextBookingInDays: null, onTripNow: true },
  adr: 125,
  bookedDays: 26,
  unrealizedRevenue: 0,
  suggestion: {
    status: 'high-demand',
    message: 'Consider raising your daily rate by ~8–10%',
    estimatedRecovery: 200
  }
};

const mockHealthyStats: VehicleStats = {
  vehicle: {
    id: 'v8',
    make: 'Mercedes',
    model: 'C-Class',
    year: 2023,
    plate: 'VWX234',
    listedDailyRate: 115,
    addedDate: '2024-05-15',
    imageColor: '#84cc16',
    utilization: 0.65
  },
  utilization: 0.65,
  idleStreak: { idleDays: 3, nextBookingInDays: null, onTripNow: false },
  adr: 118,
  bookedDays: 19,
  unrealizedRevenue: 0,
  suggestion: {
    status: 'healthy',
    message: null,
    estimatedRecovery: null
  }
};

describe('VehicleCard', () => {
  const mockOnApplyDiscount = vi.fn();
  const mockOnDismiss = vi.fn();
  const mockOverrideRate = undefined;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render idle-critical stats with red styling', () => {
    render(
      <VehicleCard
        stats={mockIdleCriticalStats}
        onApplyDiscount={mockOnApplyDiscount}
        onDismiss={mockOnDismiss}
        overrideRate={mockOverrideRate}
      />
    );

    expect(screen.getByText('Idle alert')).toBeInTheDocument();
    expect(screen.getByText('Toyota Camry 2022 · ABC123')).toBeInTheDocument();
    expect(screen.getByText('Idle 12 days · ADR $85 · Util 30%')).toBeInTheDocument();
    expect(screen.getByText(/Try a 15–20% discount/)).toBeInTheDocument();
    expect(screen.getByText(/Est\. recovery: \$408\/mo/)).toBeInTheDocument();
    
    // Should have red badge styling
    const badge = screen.getByText('Idle alert');
    expect(badge).toHaveClass('bg-red-50', 'text-red-700');
  });

  it('should render high-demand stats with green styling', () => {
    render(
      <VehicleCard
        stats={mockHighDemandStats}
        onApplyDiscount={mockOnApplyDiscount}
        onDismiss={mockOnDismiss}
        overrideRate={mockOverrideRate}
      />
    );

    expect(screen.getByText('High demand')).toBeInTheDocument();
    expect(screen.getByText('Tesla Model 3 2024 · GHI789')).toBeInTheDocument();
    expect(screen.getByText('On trip now · ADR $125 · Util 88%')).toBeInTheDocument();
    
    // Should have green badge styling
    const badge = screen.getByText('High demand');
    expect(badge).toHaveClass('bg-green-50', 'text-green-700');
  });

  it('should render healthy stats without suggestion line', () => {
    render(
      <VehicleCard
        stats={mockHealthyStats}
        onApplyDiscount={mockOnApplyDiscount}
        onDismiss={mockOnDismiss}
        overrideRate={mockOverrideRate}
      />
    );

    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Mercedes C-Class 2023 · VWX234')).toBeInTheDocument();
    expect(screen.getByText('Idle 3 days · ADR $118 · Util 65%')).toBeInTheDocument();
    
    // Should not have suggestion text or action buttons
    expect(screen.queryByText(/Try a/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Est\. recovery/)).not.toBeInTheDocument();
    expect(screen.queryByText('Apply Discount')).not.toBeInTheDocument();
    expect(screen.queryByText('Dismiss')).not.toBeInTheDocument();
  });

  it('should call onApplyDiscount when Apply Discount is clicked', () => {
    render(
      <VehicleCard
        stats={mockIdleCriticalStats}
        onApplyDiscount={mockOnApplyDiscount}
        onDismiss={mockOnDismiss}
        overrideRate={mockOverrideRate}
      />
    );

    const applyButton = screen.getByText('Apply Discount');
    fireEvent.click(applyButton);

    expect(mockOnApplyDiscount).toHaveBeenCalledWith('v1', 72); // 85 * 0.85 = 72.25 → 72
  });

  it('should call onDismiss when Dismiss is clicked', () => {
    render(
      <VehicleCard
        stats={mockIdleCriticalStats}
        onApplyDiscount={mockOnApplyDiscount}
        onDismiss={mockOnDismiss}
        overrideRate={mockOverrideRate}
      />
    );

    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledWith('v1');
  });

  it('should show updated rate when overrideRate is provided', () => {
    render(
      <VehicleCard
        stats={mockIdleCriticalStats}
        onApplyDiscount={mockOnApplyDiscount}
        onDismiss={mockOnDismiss}
        overrideRate={72}
      />
    );

    expect(screen.getByText('Rate updated to $72/day')).toBeInTheDocument();
  });
});