import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Plus, Star, TrendingUp, Wallet } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import RevenueChart from '../components/RevenueChart';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatTime } from '../lib/utils';
import { fetchBookingsForListingIds, fetchListingsByBusinessName } from '../lib/api';
import type { Booking, Listing } from '../types';

const REVENUE_DATA = [
  { day: 'Monday', value: 80 },
  { day: 'Tuesday', value: 120 },
  { day: 'Wednesday', value: 95 },
  { day: 'Thursday', value: 160 },
  { day: 'Friday', value: 110 },
  { day: 'Saturday', value: 280 },
  { day: 'Sunday', value: 195 },
];

const OWNER_BUSINESS_NAME = "Sarah's Workspace";

export default function Dashboard() {
  const navigate = useNavigate();
  const { lastBooking } = useApp();
  const [actionModal, setActionModal] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchListingsByBusinessName(OWNER_BUSINESS_NAME)
      .then(async (ownedSpaces) => {
        if (cancelled) return;
        setSpaces(ownedSpaces);
        const ownedBookings = await fetchBookingsForListingIds(ownedSpaces.map((s) => s.id));
        if (cancelled) return;
        setBookings(ownedBookings);
      })
      .catch((err) => console.error('Failed to load dashboard data', err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const monthlyEarnings = bookings.reduce((sum, b) => sum + b.total, 0);
  const officebnbFeeShare = bookings.reduce((sum, b) => sum + b.serviceFee, 0);
  const averageRating = spaces.length
    ? (spaces.reduce((sum, s) => sum + s.rating, 0) / spaces.length).toFixed(1)
    : '—';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">Good afternoon, Sarah 👋</h1>
          <p className="mt-1 text-ink-500">Here's how your unused space is performing.</p>
        </div>
        <Button onClick={() => navigate('/list-your-space')}>
          <Plus size={16} /> List another space
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="Total earnings" value={formatCurrency(monthlyEarnings)} icon={Wallet} trend="live" />
        <StatsCard label="Bookings" value={String(bookings.length)} icon={CalendarCheck} accent="amber" />
        <StatsCard label="Occupancy" value="68%" icon={TrendingUp} accent="ink" />
        <StatsCard label="Average rating" value={averageRating} icon={Star} accent="brand" />
      </div>

      <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-5 text-sm text-ink-700 sm:flex sm:items-center sm:justify-between">
        <p>
          Officebnb's 10% service fee on your {formatCurrency(monthlyEarnings)} in bookings means we earned{' '}
          <span className="font-semibold text-brand-700">{formatCurrency(officebnbFeeShare)}</span> facilitating
          your bookings.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-950">Weekly revenue</h2>
          <span className="text-sm text-ink-500">Illustrative last 7 days</span>
        </div>
        <div className="mt-6">
          <RevenueChart data={REVENUE_DATA} />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-bold text-ink-950">Your spaces</h2>
        {loading ? (
          <p className="mt-4 text-sm text-ink-400">Loading your spaces…</p>
        ) : spaces.length === 0 ? (
          <p className="mt-4 text-sm text-ink-400">You haven't listed a space yet.</p>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {spaces.map((space) => {
              const spaceBookings = bookings.filter((b) => b.listingId === space.id).length;
              return (
                <div key={space.id} className="rounded-2xl border border-ink-100 bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink-950">{space.name}</h3>
                      <p className="mt-1 text-sm text-ink-500">${space.price}/hour</p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                      <Star size={12} className="fill-brand-600 text-brand-600" /> {space.rating}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-ink-500">
                    {spaceBookings} booking{spaceBookings === 1 ? '' : 's'} so far
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setActionModal(`edit-${space.name}`)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setActionModal(`availability-${space.name}`)}>
                      Manage availability
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-bold text-ink-950">Upcoming bookings</h2>
        {loading ? (
          <p className="mt-4 text-sm text-ink-400">Loading bookings…</p>
        ) : bookings.length === 0 ? (
          <p className="mt-4 text-sm text-ink-400">No bookings yet — they'll show up here the moment someone books your space.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {bookings.map((booking) => {
              const isNew = lastBooking?.id === booking.id;
              return (
                <div
                  key={booking.id}
                  className={`flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
                    isNew ? 'border-brand-200 bg-brand-50' : 'border-ink-100 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm font-bold text-ink-950">{booking.date}</p>
                      {isNew && (
                        <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink-500">
                      {booking.listingName} · {formatTime(booking.startTime)} – {formatTime(booking.endTime)} ·{' '}
                      {booking.guests} guests
                    </p>
                  </div>
                  <p className="font-display text-lg font-bold text-ink-950">{formatCurrency(booking.total)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={!!actionModal} onClose={() => setActionModal(null)} maxWidth="max-w-sm">
        <h2 className="font-display text-lg font-bold text-ink-950">Demo action</h2>
        <p className="mt-2 text-sm text-ink-500">
          In the full product, this would open space editing tools. For this demo, it's a preview only.
        </p>
        <Button fullWidth className="mt-5" onClick={() => setActionModal(null)}>
          Got it
        </Button>
      </Modal>
    </div>
  );
}
