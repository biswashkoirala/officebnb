// Cancels a confirmed booking, by either the renter or the space owner.
//
// Refund rules (see src/pages/Legal.tsx → Cancellation policy):
//   - Owner cancels: renter is always refunded in full.
//   - Renter cancels ≥ FREE_CANCELLATION_HOURS before start: full refund.
//   - Renter cancels later than that: no refund, but the slot is released.
// Bookings that have already started can't be cancelled here.
import { admin, HttpError, json, readJson, requireUser, serve } from '../_shared/http.ts';
import { refundBookingPayment } from '../_shared/stripe.ts';
import { toCents } from '../_shared/pricing.ts';
import { renterRefundAmount } from '../_shared/time.ts';
import { type BookingForEmail, sendBookingCancelledEmails } from '../_shared/email.ts';

serve('cancel-booking', async (req, origin) => {
  const user = await requireUser(req);
  const { bookingId, reason } = await readJson<{ bookingId?: unknown; reason?: unknown }>(req);
  if (typeof bookingId !== 'string') throw new HttpError(400, 'Missing booking.');
  const cleanReason = typeof reason === 'string' ? reason.trim().slice(0, 500) || null : null;

  const { data: booking, error } = await admin.from('bookings').select('*').eq('id', bookingId).maybeSingle();
  if (error) throw error;
  const actor = booking?.user_id === user.id ? 'renter' : booking?.owner_id === user.id ? 'owner' : null;
  if (!booking || !actor) throw new HttpError(404, 'Booking not found.');
  if (booking.status !== 'confirmed') throw new HttpError(409, 'Only confirmed bookings can be cancelled.');
  if (!booking.starts_at || new Date(booking.starts_at).getTime() <= Date.now()) {
    throw new HttpError(409, 'This booking has already started. Contact support if something went wrong.');
  }

  const total = Number(booking.total);
  const refund = actor === 'owner' ? total : renterRefundAmount(total, booking.starts_at);

  // Claim the cancellation first so two clicks (or renter + owner at once)
  // can't both refund.
  const { data: claimed, error: claimError } = await admin
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_by: actor,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: cleanReason,
      refund_amount: refund,
    })
    .eq('id', booking.id)
    .eq('status', 'confirmed')
    .select()
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) throw new HttpError(409, 'This booking was just changed — please refresh.');

  if (refund > 0 && booking.stripe_payment_intent_id) {
    try {
      await refundBookingPayment({
        bookingId: booking.id,
        paymentIntentId: booking.stripe_payment_intent_id,
        amountCents: toCents(refund),
        fullRefund: refund >= total,
      });
    } catch (err) {
      // Put it back so nobody believes a refund happened when it didn't.
      await admin
        .from('bookings')
        .update({ status: 'confirmed', cancelled_by: null, cancelled_at: null, cancellation_reason: null, refund_amount: 0 })
        .eq('id', booking.id)
        .eq('status', 'cancelled');
      throw err;
    }
  }

  await sendBookingCancelledEmails(claimed as BookingForEmail);
  return json({ status: 'cancelled', refundAmount: refund }, 200, origin);
});
