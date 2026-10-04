import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Banknote,
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
  LockKeyhole,
  Plus,
  Star,
  Store,
  Wallet,
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import RevenueChart from '../components/RevenueChart';
import Button from '../components/Button';
import CancelBookingModal from '../components/CancelBookingModal';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, formatTime, todayInSydney } from '../lib/utils';
import {
  fetchBookingsForOwner,
  fetchListingsByOwnerId,
  openPayoutDashboard,
  refreshPayoutStatus,
  setListingArchived,
  startPayoutOnboarding,
} from '../lib/api';
import type { Booking, Listing } from '../types';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Bookings the owner is paid for: confirmed, or cancelled late by the renter with no refund. */
function isPaidOut(b: Booking) {
  return b.status === 'confirmed' || (b.status === 'cancelled' && b.refundAmount === 0);
}

/** Owner payouts per day for the last 7 Sydney calendar days. */
function computeWeeklyRevenue(bookings: Booking[]): { day: string; value: number }[] {
  const totalsByDate = new Map<string, number>();
  for (const b of bookings) {
    if (!isPaidOut(b)) continue;
    totalsByDate.set(b.date, (totalsByDate.get(b.date) ?? 0) + b.hostPayout);
  }
  const [y, m, d] = todayInSydney().split('-').map(Number);
  const days: { day: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(Date.UTC(y, m - 1, d - i));
    const key = dt.toISOString().slice(0, 10);
    days.push({ day: WEEKDAY_LABELS[dt.getUTCDay()], value: totalsByDate.get(key) ?? 0 });
  }
  return days;
}

function isUpcoming(b: Booking) {
  return !!b.startsAt && new Date(b.startsAt).getTime() > Date.now();
}

function PayoutsCard() {
  const { profile, refreshProfile } = useApp();
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const handledReturn = useRef(false);

  const goToOnboarding = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      window.location.assign(await startPayoutOnboarding());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open Stripe. Please try again.');
      setBusy(false);
    }
  }, []);

  // Stripe sends owners back here after onboarding (?payouts=return) or
  // when an onboarding link has expired (?payouts=refresh).
  useEffect(() => {
    const flag = params.get('payouts');
    if (!flag || handledReturn.current) return;
    handledReturn.current = true;
    setParams({}, { replace: true });
    if (flag === 'refresh') {
      goToOnboarding();
      return;
    }
    setBusy(true);
    refreshPayoutStatus()
      .then(() => refreshProfile())
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not check your Stripe account.'))
      .finally(() => setBusy(false));
  }, [params, setParams, goToOnboarding, refreshProfile]);

  const openDashboard = async () => {
    setBusy(true);
    setError('');
    try {
      window.open(await openPayoutDashboard(), '_blank', 'noopener');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open Stripe.');
    } finally {
      setBusy(false);
    }
  };

  if (!profile) return null;
  const ready = profile.stripeChargesEnabled && profile.stripePayoutsEnabled;

  return (
    <div
      className={`mt-6 rounded-2xl border p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 ${
        ready ? 'border-brand-100 bg-brand-50' : 'border-amber-glow/40 bg-amber-glow/10'
      }`}
    >
      <div className="flex items-start gap-3">
        {ready ? (
          <CheckCircle2 className="mt-0.5 shrink-0 text-brand-600" size={20} />
        ) : (
          <AlertCircle className="mt-0.5 shrink-0 text-amber-glow" size={20} />
        )}
        <div className="text-sm text-ink-700">
          {ready ? (
            <>
              <p className="font-semibold text-ink-950">Payouts are active</p>
              <p className="mt-0.5">
                Renters pay through Stripe and your share goes straight to your bank account on Stripe's payout
                schedule.
              </p>
            </>
          ) : profile.stripeChargesEnabled ? (
            <>
              <p className="font-semibold text-ink-950">Stripe needs a bit more information</p>
              <p className="mt-0.5">You can take bookings, but payouts to your bank are paused until you finish.</p>
            </>
          ) : profile.hasStripeAccount ? (
            <>
              <p className="font-semibold text-ink-950">Finish setting up payouts</p>
              <p className="mt-0.5">
                Your Stripe setup isn't complete yet. You'll be able to publish spaces once Stripe has verified your
                details (this can take a few minutes after you finish).
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-ink-950">Set up payouts to start earning</p>
              <p className="mt-0.5">
                Before you can publish a space, connect a bank account through Stripe (our payments partner). You'll
                need your ABN (if you have one), ID and bank details. Takes about 5 minutes.
              </p>
            </>
          )}
          {error && <p className="mt-2 font-medium text-red-600">{error}</p>}
        </div>
      </div>
      <div className="mt-4 shrink-0 sm:mt-0">
        {ready || profile.stripeDetailsSubmitted ? (
          <div className="flex flex-col gap-2">
            {!ready && (
              <Button size="sm" onClick={goToOnboarding} disabled={busy}>
                Update details
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={openDashboard} disabled={busy}>
              <ExternalLink size={14} /> Stripe dashboard
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={goToOnboarding} disabled={busy}>
            <Banknote size={15} /> {busy ? 'Opening Stripe…' : profile.hasStripeAccount ? 'Continue setup' : 'Set up payouts'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, lastBooking, isLoggedIn, role, displayName, openLoginModal } = useApp();
  const [spaces, setSpaces] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (role !== 'owner' || !user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchListingsByOwnerId(user.id), fetchBookingsForOwner(user.id)])
      .then(([ownedSpaces, ownedBookings]) => {
        if (cancelled) return;
        setSpaces(ownedSpaces);
        setBookings(ownedBookings);
      })
      .catch((err) => console.error('Failed to load dashboard data', err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [role, user]);

  if (role !== 'owner') {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink-100">
          <LockKeyhole size={22} className="text-ink-500" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-ink-950">Owner dashboard</h1>
        <p className="mt-2 text-ink-500">
          This dashboard is only available to space owners. Log in with an owner account to continue.
        </p>
        <Button className="mt-6" onClick={openLoginModal}>
          {isLoggedIn ? 'Switch to owner account' : 'Log in'}
        </Button>
      </div>
    );
  }

  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const earnings = bookings.filter(isPaidOut).reduce((sum, b) => sum + b.hostPayout, 0);
  const upcoming = confirmed.filter(isUpcoming);
  const recentlyCancelled = bookings.filter((b) => b.status === 'cancelled' && isUpcoming(b));
  const liveSpaces = spaces.filter((s) => !s.archived).length;
  const rated = spaces.filter((s) => s.rating != null);
  const averageRating = rated.length
    ? (rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length).toFixed(1)
    : 'No reviews yet';

  const toggleArchived = async (space: Listing) => {
    try {
      await setListingArchived(space.id, !space.archived);
      setSpaces((prev) => prev.map((s) => (s.id === space.id ? { ...s, archived: !s.archived } : s)));
    } catch (err) {
      console.error('Failed to update listing', err);
      setNotice('Could not update that listing. Please try again.');
    }
  };

  const onCancelled = (id: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled', cancelledBy: 'owner', refundAmount: b.total } : b)));
    setNotice('Booking cancelled and the renter has been refunded in full.');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">Welcome back, {displayName ?? 'there'}</h1>
          <p className="mt-1 text-ink-500">Here's how your unused space is performing. All times are Sydney time.</p>
        </div>
        <Button onClick={() => navigate('/list-your-space')}>
          <Plus size={16} /> List a space
        </Button>
      </div>

      <PayoutsCard />

      {notice && (
        <div className="mt-6 rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm text-ink-700">{notice}</div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="Your earnings" value={formatCurrency(earnings)} icon={Wallet} />
        <StatsCard label="Upcoming bookings" value={String(upcoming.length)} icon={CalendarCheck} accent="amber" />
        <StatsCard label="Live spaces" value={String(liveSpaces)} icon={Store} accent="ink" />
        <StatsCard label="Average rating" value={averageRating} icon={Star} accent="brand" />
      </div>

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-950">Your payouts by booking date</h2>
          <span className="text-sm text-ink-500">Last 7 days</span>
        </div>
        <div className="mt-6">
          <RevenueChart data={computeWeeklyRevenue(bookings)} />
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
              const spaceBookings = confirmed.filter((b) => b.listingId === space.id).length;
              return (
                <div
                  key={space.id}
                  className={`rounded-2xl border p-5 ${space.archived ? 'border-dashed border-ink-200 bg-ink-50' : 'border-ink-100 bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink-950">
                        <Link to={`/space/${space.id}`} className="hover:underline">
                          {space.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-ink-500">
                        {formatCurrency(space.price)}/hour · {space.location}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        space.archived ? 'bg-ink-200 text-ink-600' : 'bg-brand-50 text-brand-700'
                      }`}
                    >
                      {space.archived ? 'Hidden' : 'Live'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-ink-500">
                    {spaceBookings} confirmed booking{spaceBookings === 1 ? '' : 's'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/list-your-space?edit=${space.id}`)}>
                      Edit details & hours
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleArchived(space)}>
                      {space.archived ? 'Show on marketplace' : 'Hide from marketplace'}
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
        ) : upcoming.length === 0 ? (
          <p className="mt-4 text-sm text-ink-400">
            No upcoming bookings — they'll show up here the moment someone books your space.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {upcoming.map((booking) => {
              const isNew = lastBooking?.id === booking.id;
              return (
                <div
                  key={booking.id}
                  className={`flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
                    isNew ? 'border-brand-200 bg-brand-50' : 'border-ink-100 bg-white'
                  }`}
                >
                  <div>
                    <p className="font-display text-sm font-bold text-ink-950">{formatDate(booking.date)}</p>
                    <p className="mt-1 text-sm text-ink-500">
                      {booking.listingName} · {formatTime(booking.startTime)} – {formatTime(booking.endTime)} ·{' '}
                      {booking.guests} guests{booking.renterName ? ` · ${booking.renterName}` : ''}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-ink-400">{booking.reference}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCancelling(booking)}
                      className="text-sm font-semibold text-red-600 hover:text-red-700"
                    >
                      Cancel
                    </button>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-ink-950">{formatCurrency(booking.hostPayout)}</p>
                      <p className="text-xs text-ink-400">your payout</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {recentlyCancelled.length > 0 && (
          <p className="mt-4 text-sm text-ink-400">
            {recentlyCancelled.length} upcoming booking{recentlyCancelled.length === 1 ? ' was' : 's were'} cancelled.
          </p>
        )}
      </div>

      <CancelBookingModal booking={cancelling} actor="owner" onClose={() => setCancelling(null)} onCancelled={onCancelled} />
    </div>
  );
}
