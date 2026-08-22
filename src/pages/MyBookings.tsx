import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, LockKeyhole, MapPin, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchBookingsByUserId } from '../lib/api';
import { formatCurrency, formatTime } from '../lib/utils';
import Button from '../components/Button';
import type { Booking } from '../types';

export default function MyBookings() {
  const navigate = useNavigate();
  const { user, isLoggedIn, lastBooking, openLoginModal } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchBookingsByUserId(user.id)
      .then((data) => {
        if (!cancelled) setBookings(data);
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-ink-950">Your bookings</h1>
      <p className="mt-1 text-ink-500">Spaces you've reserved through Officebnb.</p>

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
        <div className="mt-8 space-y-4">
          {bookings.map((booking) => {
            const isNew = lastBooking?.id === booking.id;
            return (
              <div
                key={booking.id}
                className={`rounded-2xl border p-5 sm:p-6 ${
                  isNew ? 'border-brand-200 bg-brand-50' : 'border-ink-100 bg-white'
                }`}
              >
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg font-bold text-ink-950">{booking.listingName}</h2>
                      {isNew && (
                        <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
                      <MapPin size={14} /> {booking.location}
                    </p>
                  </div>
                  <Link
                    to={`/space/${booking.listingId}`}
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View space
                  </Link>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-ink-100 pt-4 text-sm text-ink-700 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-ink-400" /> {booking.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-ink-400" />
                    {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-ink-400" /> {booking.guests} guests
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
                  <span className="font-mono text-xs font-semibold text-ink-600">{booking.reference}</span>
                  <span className="font-display text-base font-bold text-ink-950">
                    {formatCurrency(booking.total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
