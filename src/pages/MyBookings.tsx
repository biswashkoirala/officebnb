import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, LockKeyhole, MapPin, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchBookingsByUserId } from '../lib/api';
import { formatCurrency, formatDate, formatTime } from '../lib/utils';
import Button from '../components/Button';
import CancelBookingModal from '../components/CancelBookingModal';
import type { Booking } from '../types';

function isUpcoming(b: Booking) {
  return !!b.startsAt && new Date(b.startsAt).getTime() > Date.now();
}

function StatusBadge({ booking }: { booking: Booking }) {
  const styles: Record<string, [string, string]> = {
    confirmed: ['bg-brand-50 text-brand-700', 'Confirmed'],
    cancelled: ['bg-ink-100 text-ink-600', 'Cancelled'],
    disputed: ['bg-red-50 text-red-700', 'Payment disputed'],
  };
  const [cls, label] = styles[booking.status] ?? ['bg-ink-100 text-ink-600', booking.status];
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>{label}</span>;
}

export default function MyBookings() {
  const navigate = useNavigate();
  const { user, isLoggedIn, lastBooking, openLoginModal } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchBookingsByUserId(user.id)
      .then((data) => {
        // Checkouts that were abandoned (or are still being paid) aren't
        // reservations yet — the confirmation page covers in-flight payments.
        if (!cancelled) setBookings(data.filter((b) => b.status !== 'failed' && b.status !== 'expired' && b.status !== 'pending'));
      })
      .catch((err) => console.error('Failed to load your bookings', err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink-100">
          <LockKeyhole size={22} className="text-ink-500" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-ink-950">Log in to see your bookings</h1>
        <p className="mt-2 text-ink-500">Your bookings are tied to your account.</p>
        <Button className="mt-6" onClick={openLoginModal}>
          Log in
        </Button>
      </div>
    );
  }

  const upcoming = bookings.filter((b) => isUpcoming(b) && b.status !== 'cancelled');
  const past = bookings.filter((b) => !upcoming.includes(b)).reverse();

  const onCancelled = (id: string, refund: number) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled', refundAmount: refund } : b)));
    setNotice(
      refund > 0
        ? `Booking cancelled. ${formatCurrency(refund)} is being refunded to your original payment method.`
        : 'Booking cancelled.',
    );
  };

  const renderBooking = (booking: Booking) => {
    const isNew = lastBooking?.id === booking.id;
    const canCancel = booking.status === 'confirmed' && isUpcoming(booking);
    return (
      <div
        key={booking.id}
        className={`rounded-2xl border p-5 sm:p-6 ${isNew ? 'border-brand-200 bg-brand-50' : 'border-ink-100 bg-white'}`}
      >
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-ink-950">{booking.listingName}</h2>
              <StatusBadge booking={booking} />
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
              <MapPin size={14} /> {booking.location}
            </p>
          </div>
          <Link to={`/space/${booking.listingId}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View space
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-ink-100 pt-4 text-sm text-ink-700 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-ink-400" /> {formatDate(booking.date)}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-ink-400" />
            {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-ink-400" /> {booking.guests} guests
          </div>
        </div>

        {booking.status === 'cancelled' && (
          <p className="mt-3 text-sm text-ink-500">
            {booking.cancelledBy === 'owner' ? 'Cancelled by the host. ' : ''}
            {booking.refundAmount > 0 ? `Refunded ${formatCurrency(booking.refundAmount)}.` : 'No refund applied.'}
            {booking.cancellationReason ? ` “${booking.cancellationReason}”` : ''}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-ink-50 px-4 py-3">
          <span className="font-mono text-xs font-semibold text-ink-600">{booking.reference}</span>
          <div className="flex items-center gap-3">
            {canCancel && (
              <button
                onClick={() => setCancelling(booking)}
                className="text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Cancel
              </button>
            )}
            <span className="font-display text-base font-bold text-ink-950">{formatCurrency(booking.total)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-ink-950">Your bookings</h1>
      <p className="mt-1 text-ink-500">Spaces you've reserved through Officebnb. All times are Sydney time.</p>

      {notice && (
        <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-ink-400">Loading your bookings…</p>
      ) : bookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-10 text-center">
          <h2 className="font-display text-lg font-bold text-ink-950">No bookings yet</h2>
          <p className="mt-2 text-sm text-ink-500">
            When you book a space, it'll show up here so you can find the details again.
          </p>
          <Button className="mt-6" onClick={() => navigate('/explore')}>
            Explore spaces
          </Button>
        </div>
      ) : (
        <>
          <h2 className="mt-8 font-display text-lg font-bold text-ink-950">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-ink-400">Nothing coming up.</p>
          ) : (
            <div className="mt-4 space-y-4">{upcoming.map(renderBooking)}</div>
          )}
          {past.length > 0 && (
            <>
              <h2 className="mt-10 font-display text-lg font-bold text-ink-950">Past & cancelled</h2>
              <div className="mt-4 space-y-4">{past.map(renderBooking)}</div>
            </>
          )}
        </>
      )}

      <CancelBookingModal booking={cancelling} actor="renter" onClose={() => setCancelling(null)} onCancelled={onCancelled} />
    </div>
  );
}
