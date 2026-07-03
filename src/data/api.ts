import { Vehicle, Booking } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchFleetData(): Promise<{ vehicles: Vehicle[]; bookings: Booking[] }> {
  const [vehiclesRes, bookingsRes] = await Promise.all([
    fetch(`${API_URL}/api/vehicles`),
    fetch(`${API_URL}/api/bookings`),
  ]);

  if (!vehiclesRes.ok || !bookingsRes.ok) {
    throw new Error('Failed to fetch fleet data');
  }

  const [vehicles, bookings] = await Promise.all([vehiclesRes.json(), bookingsRes.json()]);
  return { vehicles, bookings };
}
