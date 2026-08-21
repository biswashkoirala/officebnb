import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { createBooking, fetchListingById } from '../lib/api';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatTime, generateBookingReference, hoursBetween, priceBreakdown } from '../lib/utils';
import Button from '../components/Button';
import Input from '../components/Input';
import type { Listing } from '../types';

export default function Booking() {
  const navigate = useNavigate();
  const { bookingDraft, setLastBooking, isLoggedIn, openLoginModal } = useApp();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [listing, setListing] = useState<Listing | null | undefined>(undefined);

  useEffect(() => {
    if (!bookingDraft) return;
    fetchListingById(bookingDraft.listingId)
      .then(setListing)
      .catch((err) => {
        console.error('Failed to load listing', err);
        setListing(null);
      });
  }, [bookingDraft]);

  const hours = useMemo(
    () => (bookingDraft ? hoursBetween(bookingDraft.startTime, bookingDraft.endTime) : 0),
    [bookingDraft],
  );
  const { subtotal, serviceFee, total } = useMemo(
    () => priceBreakdown(listing?.price ?? 0, hours),
    [listing, hours],
  );

  if (!bookingDraft || listing === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-950">No booking in progress</h1>
        <p className="mt-2 text-ink-500">Find a space and choose your hours to start a booking.</p>
        <Button className="mt-6" onClick={() => navigate('/explore')}>
          Explore spaces
        </Button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-950">Log in to continue</h1>
        <p className="mt-2 text-ink-500">You'll need to log in before confirming your booking.</p>
        <Button className="mt-6" onClick={openLoginModal}>
          Log in
        </Button>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-sm text-ink-400">Loading booking…</p>
      </div>
    );
  }

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    try {
      const booking = await createBooking({
        listingId: listing.id,
        listingName: listing.name,
        location: listing.location,
        date: bookingDraft.date,
        startTime: bookingDraft.startTime,
        endTime: bookingDraft.endTime,
        guests: bookingDraft.guests,
        hours,
        subtotal,
        serviceFee,
        total,
        reference: generateBookingReference(),
        hostName: listing.host.businessName,
      });
      setLastBooking(booking);
      navigate('/confirmation');
    } catch (err) {
      console.error('Failed to create booking', err);
      setError('Something went wrong confirming your booking. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-ink-950">Confirm your booking</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleConfirm} className="space-y-6">
          <div className="rounded-2xl border border-ink-100 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-ink-950">Payment details</h2>
            <div className="mt-1 flex items-center gap-1.5 rounded-lg bg-amber-glow/10 px-3 py-2 text-xs font-medium text-amber-glow">
              <ShieldCheck size={14} />
              This is a demo payment screen. No real payment will be processed.
            </div>

            <div className="mt-5 space-y-4">
              <Input
                label="Card number"
                icon={<CreditCard size={16} />}
                placeholder="4242 4242 4242 4242"
                defaultValue="4242 4242 4242 4242"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Expiry" placeholder="MM / YY" defaultValue="08 / 29" required />
                <Input label="CVC" icon={<Lock size={16} />} placeholder="123" defaultValue="123" required />
              </div>
              <Input label="Name on card" placeholder="Alex Renter" defaultValue="Alex Renter" required />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <Button type="submit" size="lg" fullWidth disabled={processing}>
            {processing ? 'Processing…' : `Confirm & Pay ${formatCurrency(total)}`}
          </Button>
        </form>

        <aside className="h-fit rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-ink-950">{listing.name}</h2>
          <p className="mt-1 text-sm text-ink-500">{listing.location}</p>

          <dl className="mt-5 space-y-3 border-t border-ink-100 pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Date</dt>
              <dd className="font-medium text-ink-900">{bookingDraft.date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Time</dt>
              <dd className="font-medium text-ink-900">
                {formatTime(bookingDraft.startTime)} – {formatTime(bookingDraft.endTime)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Guests</dt>
              <dd className="font-medium text-ink-900">{bookingDraft.guests}</dd>
            </div>
          </dl>

          <dl className="mt-5 space-y-2 border-t border-ink-100 pt-5 text-sm">
            <div className="flex justify-between text-ink-600">
              <dt>
                {hours} {hours === 1 ? 'hour' : 'hours'} × ${listing.price}
              </dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink-600">
              <dt>Service fee</dt>
              <dd>{formatCurrency(serviceFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-2 font-display text-base font-bold text-ink-950">
              <dt>Total</dt>
              <dd>{formatCurrency(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
