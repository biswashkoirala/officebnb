import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, MapPin, Users, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchBookingById } from '../lib/api';
import { formatCurrency, formatDate, formatTime } from '../lib/utils';
import Button from '../components/Button';
import type { Booking } from '../types';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setLastBooking } = useApp();
  const bookingId = searchParams.get('bookingId');
  // Stripe appends redirect_status to the return URL; 'failed' means the
  // payment didn't complete (e.g. 3-D Secure was declined).
  const redirectFailed = searchParams.get('redirect_status') === 'failed';
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setBooking(null);
      return;
    }
    let cancelled = false;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const result = await fetchBookingById(bookingId);
        if (cancelled) return;
        if (result && (result.status !== 'pending' || redirectFailed)) {
          setBooking(result);
          if (result.status === 'confirmed') setLastBooking(result);
          return;
        }
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          setTimedOut(true);
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load booking', err);
          setBooking(null);
        }
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [bookingId, redirectFailed, setLastBooking]);

  if (!bookingId || booking === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-950">No recent booking</h1>
        <p className="mt-2 text-ink-500">Book a space to see your confirmation here.</p>
        <Button className="mt-6" onClick={() => navigate('/explore')}>
          Explore spaces
        </Button>
      </div>
    );
  }

  if (booking === undefined) {
    if (timedOut) {
      return (
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold text-ink-950">Still confirming your payment</h1>
          <p className="mt-2 text-ink-500">
            This is taking longer than expected. Check "My bookings" in a moment — it'll update once
            payment is confirmed.
          </p>
          <Button className="mt-6" onClick={() => navigate('/my-bookings')}>
            View my bookings
          </Button>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-sm text-ink-400">Confirming your payment…</p>
      </div>
    );
  }

  if (booking.status !== 'confirmed') {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <XCircle size={44} className="text-red-500" strokeWidth={1.75} />
          </div>
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink-950">Payment didn't go through</h1>
        <p className="mt-2 text-ink-500">
          {booking.status === 'cancelled' && booking.refundAmount > 0
            ? `This time slot was no longer available, so we've refunded your ${formatCurrency(booking.refundAmount)} in full.`
            : "You haven't been charged. Please try booking again."}
        </p>
        <Button className="mt-6" onClick={() => navigate('/explore')}>
          Explore spaces
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
          <CheckCircle2 size={44} className="text-brand-600" strokeWidth={1.75} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-ink-950">You're booked!</h1>
        <p className="mt-2 text-ink-500">Your workspace is confirmed.</p>
      </div>

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-ink-100 pb-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold text-ink-950">{booking.listingName}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
              <MapPin size={14} /> {booking.location}
            </p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
            Confirmed
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <Calendar size={16} className="text-ink-400" /> {formatDate(booking.date)}
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <Clock size={16} className="text-ink-400" />
            {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <Users size={16} className="text-ink-400" /> {booking.guests} guests
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
          <span className="text-sm font-medium text-ink-600">Booking reference</span>
          <span className="font-mono text-sm font-semibold text-ink-950">{booking.reference}</span>
        </div>

        <div className="mt-6 border-t border-ink-100 pt-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-500">
            Your host
          </h3>
          <p className="mt-2 font-display font-semibold text-ink-950">{booking.hostName}</p>
          <p className="mt-1 text-sm text-ink-500">
            A receipt is on its way to your email. Free cancellation from “My bookings” until 48 hours
            before your start time.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button fullWidth size="lg" onClick={() => navigate('/my-bookings')}>
          View booking
        </Button>
        <Button fullWidth size="lg" variant="outline" onClick={() => navigate('/explore')}>
          Back to explore
        </Button>
      </div>
    </div>
  );
}
