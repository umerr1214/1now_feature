import { parseISO, isBefore, isAfter } from 'date-fns';
import { Booking } from '../types';

export type BookingStatus = 'upcoming' | 'active' | 'completed';

export function getBookingStatus(booking: Booking, now: Date): BookingStatus {
  const start = parseISO(booking.startDate);
  const end = parseISO(booking.endDate);

  if (isBefore(now, start)) return 'upcoming';
  if (isAfter(now, end)) return 'completed';
  return 'active';
}
