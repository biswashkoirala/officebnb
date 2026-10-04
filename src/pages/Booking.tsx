import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { ShieldCheck } from 'lucide-react';
import { createPaymentIntent, fetchListingById } from '../lib/api';
import { getStripe } from '../lib/stripe';
import { useApp } from '../context/AppContext';
import { FREE_CANCELLATION_HOURS, formatCurrency, formatDate, formatTime, hoursBetween, priceBreakdown } from '../lib/utils';
import Button from '../components/Button';
import type { Listing } from '../types';

export default function Booking() {
  const navigate = useNavigate();
  const { bookingDraft, user, isLoggedIn, openLoginModal } = useApp();
  const [listing, setListing] = useState<Listing | null | undefined>(undefined);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [holdMinutes, setHoldMinutes] = useState(15);
  const [intentError, setIntentError] = useState('');

  useEffect(() => {
    if (!bookingDraft) return;
    fetchListingById(bookingDraft.listingId)
      .then(setListing)
      .catch((err) => {
        console.error('Failed to load listing', err);
        setListing(null);
      });
  }, [bookingDraft]);

  useEffect(() => {
    if (!bookingDraft || !isLoggedIn || !user || clientSecret) return;
    let cancelled = false;
    setIntentError('');
    createPaymentIntent({
      listingId: bookingDraft.listingId,
      date: bookingDraft.date,
      startTime: bookingDraft.startTime,
      endTime: bookingDraft.endTime,
      guests: bookingDraft.guests,
    })
      .then((result) => {
        if (cancelled) return;
        setClientSecret(result.clientSecret);
        setBookingId(result.bookingId);
        setHoldMinutes(result.holdMinutes);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to start payment', err);
        setIntentError(err instanceof Error ? err.message : 'Something went wrong starting your payment.');
      });
    return () => {
      cancelled = true;
    };
  }, [bookingDraft, isLoggedIn, user, clientSecret]);

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-ink-950">Confirm your booking</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {intentError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-medium text-red-700">{intentError}</p>
              <Button className="mt-4" variant="outline" onClick={() => navigate(`/space/${listing.id}`)}>
                Back to space
              </Button>
            </div>
          )}

          {!intentError && clientSecret && bookingId ? (
            <Elements stripe={getStripe()} options={{ clientSecret }}>
              <CheckoutForm bookingId={bookingId} total={total} holdMinutes={holdMinutes} />
            </Elements>
          ) : !intentError ? (
            <div className="rounded-2xl border border-ink-100 bg-white p-6">
              <p className="text-sm text-ink-400">Preparing your payment…</p>
            </div>
          ) : null}
        </div>

        <aside className="h-fit rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-ink-950">{listing.name}</h2>
          <p className="mt-1 text-sm text-ink-500">{listing.location}</p>

          <dl className="mt-5 space-y-3 border-t border-ink-100 pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Date</dt>
              <dd className="font-medium text-ink-900">{formatDate(bookingDraft.date)}</dd>
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

function CheckoutForm({ bookingId, total, holdMinutes }: { bookingId: string; total: number; holdMinutes: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError('');
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation?bookingId=${bookingId}`,
      },
    });
    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-ink-950">Payment details</h2>
        <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink-400">
          <ShieldCheck size={14} />
          Payments are processed securely by Stripe.
        </div>
        <div className="mt-5">
          <PaymentElement />
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <p className="text-xs leading-relaxed text-ink-500">
        We're holding this time for you for {holdMinutes} minutes. Free cancellation up to{' '}
        {FREE_CANCELLATION_HOURS} hours before your start time. By paying you agree to the{' '}
        <Link to="/terms" className="font-medium text-brand-600 underline" target="_blank">
          Terms
        </Link>{' '}
        and{' '}
        <Link to="/cancellation-policy" className="font-medium text-brand-600 underline" target="_blank">
          Cancellation policy
        </Link>
        . Prices are in Australian dollars.
      </p>

      <Button type="submit" size="lg" fullWidth disabled={!stripe || submitting}>
        {submitting ? 'Processing…' : `Confirm & Pay ${formatCurrency(total)}`}
      </Button>
    </form>
  );
}
