import { SEED_VEHICLES, SEED_BOOKINGS } from './seed';

export async function fetchFleetData() {
  // Artificial delay for loading state demo
  await new Promise(r => setTimeout(r, 600));
  return { vehicles: SEED_VEHICLES, bookings: SEED_BOOKINGS };
}