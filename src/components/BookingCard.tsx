import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Listing } from '../types';
import { formatCurrency, hoursBetween, priceBreakdown } from '../lib/utils';
import { useApp } from '../context/AppContext';
import Button from './Button';

interface BookingCardProps {
  listing: Listing;
}

const TIME_OPTIONS = Array.from({ length: 32 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return { value, label: `${displayH}:${String(m).padStart(2, '0')} ${period}` };
});

export default function BookingCard({ listing }: BookingCardProps) {
  const navigate = useNavigate();
  const { searchParams, setBookingDraft, isLoggedIn, openLoginModal } = useApp();
  const [date, setDate] = useState(searchParams.date);
  const [startTime, setStartTime] = useState(searchParams.startTime);
  const [endTime, setEndTime] = useState(searchParams.endTime);
  const [guests, setGuests] = useState(Math.min(searchParams.guests, listing.capacity));
  const [error, setError] = useState('');

  const hours = useMemo(() => hoursBetween(startTime, endTime), [startTime, endTime]);
  const { subtotal, serviceFee, total } = useMemo(
    () => priceBreakdown(listing.price, hours),
    [listing.price, hours],
  );

  const handleReserve = () => {
    if (hours <= 0) {
      setError('End time must be after start time.');
      return;
    }
    setError('');
    setBookingDraft({ listingId: listing.id, date, startTime, endTime, guests });
    if (!isLoggedIn) openLoginModal();
    navigate('/booking');
  };

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-pop sm:p-6">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-xl font-bold text-ink-950">
          ${listing.price} <span className="text-sm font-normal text-ink-500">/ hour</span>
        </p>
        <span className="flex items-center gap-1 text-sm font-medium text-ink-800">
          <Star size={13} className="fill-amber-glow text-amber-glow" />
          {listing.rating}
          <span className="text-ink-400">({listing.reviewCount})</span>
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
            Date
          </label>
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
              Start
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
              End
            </label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
            Guests
          </label>
          <input
            type="number"
            min={1}
            max={listing.capacity}
            value={guests}
            onChange={(e) => setGuests(Math.min(listing.capacity, Math.max(1, Number(e.target.value))))}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <p className="mt-1 text-xs text-ink-400">Max {listing.capacity} people</p>
        </div>
      </div>

      {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}

      <div className="mt-5 space-y-2 border-t border-ink-100 pt-4 text-sm">
        <div className="flex justify-between text-ink-600">
          <span>
            {hours > 0 ? hours : 0} {hours === 1 ? 'hour' : 'hours'} × ${listing.price}
          </span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink-600">
          <span>Service fee</span>
          <span>{formatCurrency(serviceFee)}</span>
        </div>
        <div className="flex justify-between border-t border-ink-100 pt-2 font-display text-base font-bold text-ink-950">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <Button fullWidth size="lg" className="mt-5" onClick={handleReserve}>
        Reserve
      </Button>
      <p className="mt-3 text-center text-xs text-ink-400">You won't be charged yet</p>
    </div>
  );
}
