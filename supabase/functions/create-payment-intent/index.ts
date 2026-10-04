// Starts checkout for a booking. The browser sends only *what* it wants to
// book; everything about money is derived here from the database:
//   - price from the listing's current row,
//   - the owner's Stripe account to pay out to (destination charge),
//   - the platform's cut (application fee).
// A pending booking row is created first and holds the slot for
// HOLD_MINUTES (enforced by an exclusion constraint), so two renters can
// never both be charged for the same hour.
import { admin, HttpError, json, readJson, requireUser, serve } from '../_shared/http.ts';
import { stripe } from '../_shared/stripe.ts';
import { CURRENCY, isWithinAvailableHours, priceBreakdown, toCents } from '../_shared/pricing.ts';
import { checkBookingTime, HOLD_MINUTES } from '../_shared/time.ts';

const MAX_PENDING_PER_HOUR = 10;

interface RequestBody {
  listingId?: unknown;
  date?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  guests?: unknown;
}

interface PendingRow {
  id: string;
  stripe_payment_intent_id: string | null;
}

/**
 * Releases a pending hold: cancels its PaymentIntent (so it can no longer
 * be paid) and marks the row expired. If Stripe says the payment already
 * went through or is mid-flight, the hold is left alone — the webhook will
 * confirm it.
 */
async function releaseHold(row: PendingRow): Promise<boolean> {
  if (row.stripe_payment_intent_id) {
    try {
      await stripe.paymentIntents.cancel(row.stripe_payment_intent_id);
    } catch (err) {
      const intent = await stripe.paymentIntents.retrieve(row.stripe_payment_intent_id).catch(() => null);
      if (!intent || intent.status !== 'canceled') {
        console.warn('Could not release hold', row.id, intent?.status, err);
        return false;
      }
    }
  }
  const { error } = await admin.from('bookings').update({ status: 'expired' }).eq('id', row.id).eq('status', 'pending');
  if (error) throw error;
  return true;
}

serve('create-payment-intent', async (req, origin) => {
  const user = await requireUser(req);
  const body = await readJson<RequestBody>(req);
  const { listingId, date, startTime, endTime, guests } = body;

  if (typeof listingId !== 'string' || !Number.isInteger(guests) || (guests as number) <= 0) {
    throw new HttpError(400, 'Missing or invalid booking details.');
  }
  const time = checkBookingTime({ date: date as string, startTime: startTime as string, endTime: endTime as string });
  if (!time.ok) throw new HttpError(400, time.error);
  const bookingDate = date as string;
  const start = startTime as string;
  const end = endTime as string;

  const { data: listing, error: listingError } = await admin
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .eq('archived', false)
    .maybeSingle();
  if (listingError) throw listingError;
  if (!listing) throw new HttpError(404, 'This space is no longer available.');
  if (!listing.owner_id) throw new HttpError(409, "This space isn't taking bookings right now.");
  if (listing.owner_id === user.id) throw new HttpError(400, "You can't book your own space.");

  const { data: owner, error: ownerError } = await admin
    .from('profiles')
    .select('stripe_account_id, stripe_charges_enabled')
    .eq('id', listing.owner_id)
    .maybeSingle();
  if (ownerError) throw ownerError;
  if (!owner?.stripe_account_id || !owner.stripe_charges_enabled) {
    throw new HttpError(409, "This space isn't taking bookings right now.");
  }

  if ((guests as number) > listing.capacity) {
    throw new HttpError(400, `This space holds up to ${listing.capacity} guests.`);
  }
  if (!isWithinAvailableHours(listing.available_hours, bookingDate, start, end)) {
    throw new HttpError(400, "Those hours are outside this space's available hours.");
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentAttempts, error: countError } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneHourAgo)
    .in('status', ['pending', 'expired', 'failed']);
  if (countError) throw countError;
  if ((recentAttempts ?? 0) >= MAX_PENDING_PER_HOUR) {
    throw new HttpError(429, 'Too many booking attempts — please try again in a little while.');
  }

  // Free up overlapping holds that have lapsed, plus this renter's own
  // earlier attempt at the same slot (e.g. they refreshed the page).
  const nowMs = Date.now();
  const { data: overlapping, error: overlapError } = await admin
    .from('bookings')
    .select('id, user_id, hold_expires_at, stripe_payment_intent_id')
    .eq('listing_id', listingId)
    .eq('booking_date', bookingDate)
    .eq('status', 'pending')
    .lt('start_time', end)
    .gt('end_time', start);
  if (overlapError) throw overlapError;
  for (const row of overlapping ?? []) {
    const lapsed = !row.hold_expires_at || new Date(row.hold_expires_at).getTime() < nowMs;
    if (lapsed || row.user_id === user.id) await releaseHold(row);
  }

  const { data: renterProfile } = await admin.from('profiles').select('name').eq('id', user.id).maybeSingle();
  const renterName = renterProfile?.name ?? user.email?.split('@')[0] ?? 'Renter';

  const price = priceBreakdown(Number(listing.price), time.hours);
  const reference = `OFF-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .insert({
      listing_id: listing.id,
      listing_name: listing.name,
      location: listing.location,
      booking_date: bookingDate,
      start_time: start,
      end_time: end,
      starts_at: time.startsAt.toISOString(),
      guests,
      hours: time.hours,
      subtotal: price.subtotal,
      service_fee: price.serviceFee,
      total: price.total,
      host_payout: price.hostPayout,
      platform_fee: price.platformFee,
      currency: CURRENCY,
      status: 'pending',
      hold_expires_at: new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString(),
      reference,
      host_name: listing.host?.businessName ?? 'Host',
      user_id: user.id,
      owner_id: listing.owner_id,
      renter_name: renterName,
      stripe_destination_account: owner.stripe_account_id,
    })
    .select()
    .single();
  if (bookingError) {
    // 23P01 = exclusion_violation: the slot is confirmed or mid-checkout.
    if (bookingError.code === '23P01') {
      throw new HttpError(409, 'That time has just been booked, or someone is checking out for it right now. Please pick another time.');
    }
    throw bookingError;
  }

  let clientSecret: string | null;
  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: toCents(price.total),
        currency: CURRENCY,
        // Cards only (incl. Apple Pay / Google Pay): they settle instantly, so
        // a booking is never left waiting days on a bank debit.
        payment_method_types: ['card'],
        application_fee_amount: toCents(price.platformFee),
        transfer_data: { destination: owner.stripe_account_id },
        receipt_email: user.email ?? undefined,
        description: `${listing.name} · ${bookingDate} ${start}–${end} · ${reference}`,
        metadata: { booking_id: booking.id, reference, listing_id: listing.id },
      },
      { idempotencyKey: `pi-${booking.id}` },
    );
    clientSecret = intent.client_secret;
    const { error: updateError } = await admin
      .from('bookings')
      .update({ stripe_payment_intent_id: intent.id })
      .eq('id', booking.id);
    if (updateError) throw updateError;
  } catch (err) {
    // Don't leave a hold behind for a checkout that can never be paid.
    await admin.from('bookings').update({ status: 'failed' }).eq('id', booking.id).eq('status', 'pending');
    throw err;
  }

  return json({ clientSecret, bookingId: booking.id, holdMinutes: HOLD_MINUTES }, 200, origin);
});
