// Receives Stripe events and keeps bookings/profiles in step with what
// actually happened to the money. Deploy with `--no-verify-jwt` — Stripe
// can't supply a Supabase JWT, so the Stripe-Signature check below is the
// real auth boundary.
//
// Two Stripe webhook endpoints point at this one function:
//   - "Your account" events      → signing secret STRIPE_WEBHOOK_SECRET
//   - "Connected accounts" events → signing secret STRIPE_CONNECT_WEBHOOK_SECRET
//     (only account.updated is needed from those)
//
// Stripe delivers events at least once and not necessarily in order, so
// every handler is idempotent: status changes are guarded by the status
// they're moving *from*. Returning non-2xx makes Stripe retry.
import { admin } from '../_shared/http.ts';
import { cryptoProvider, refundBookingPayment, Stripe, stripe, syncConnectedAccount } from '../_shared/stripe.ts';
import { toCents } from '../_shared/pricing.ts';
import { type BookingForEmail, sendBookingCancelledEmails, sendBookingConfirmedEmails } from '../_shared/email.ts';

const secrets = [Deno.env.get('STRIPE_WEBHOOK_SECRET'), Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET')].filter(
  (s): s is string => !!s,
);

async function verify(body: string, signature: string): Promise<Stripe.Event | null> {
  for (const secret of secrets) {
    try {
      return await stripe.webhooks.constructEventAsync(body, signature, secret, undefined, cryptoProvider);
    } catch {
      // try the next secret
    }
  }
  return null;
}

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  const body = await req.text();
  const event = await verify(body, signature);
  if (!event) {
    console.error('Webhook signature verification failed');
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await onPaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.canceled':
        await setStatusByIntent(event.data.object.id, 'pending', { status: 'expired' });
        break;
      case 'payment_intent.payment_failed':
        // The renter can retry with another card on the same checkout, so a
        // decline doesn't end the booking; the hold simply lapses if they
        // give up.
        console.log('Payment attempt failed', event.data.object.id);
        break;
      case 'charge.refunded':
        await onChargeRefunded(event.data.object);
        break;
      case 'charge.dispute.created':
        await setStatusByIntent(intentId(event.data.object.payment_intent), 'confirmed', { status: 'disputed' });
        break;
      case 'charge.dispute.closed':
        await onDisputeClosed(event.data.object);
        break;
      case 'account.updated':
        await syncConnectedAccount(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`Webhook handling error for ${event.type} ${event.id}`, err);
    return new Response('Webhook handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

function intentId(ref: string | Stripe.PaymentIntent | null): string | null {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.id;
}

async function setStatusByIntent(paymentIntentId: string | null, fromStatus: string, patch: Record<string, unknown>) {
  if (!paymentIntentId) return;
  const { error } = await admin
    .from('bookings')
    .update(patch)
    .eq('stripe_payment_intent_id', paymentIntentId)
    .eq('status', fromStatus);
  if (error) throw error;
}

async function onPaymentSucceeded(intent: Stripe.PaymentIntent) {
  const { data: booking, error } = await admin
    .from('bookings')
    .select('*')
    .eq('stripe_payment_intent_id', intent.id)
    .maybeSingle();
  if (error) throw error;
  if (!booking) {
    console.warn('No booking for succeeded PaymentIntent', intent.id);
    return;
  }
  if (booking.status === 'confirmed' || booking.status === 'disputed' || booking.status === 'cancelled') return;

  if (booking.status === 'pending') {
    const { data: confirmed, error: confirmError } = await admin
      .from('bookings')
      .update({ status: 'confirmed', hold_expires_at: null })
      .eq('id', booking.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle();
    if (!confirmError && confirmed) {
      await sendBookingConfirmedEmails(confirmed as BookingForEmail);
      return;
    }
    if (confirmError && confirmError.code !== '23P01') throw confirmError;
    if (!confirmError && !confirmed) return; // raced with another delivery of this event
  }

  // The renter paid, but the booking can't stand (its hold had already been
  // released, or the slot is now taken). Never keep money for a booking that
  // doesn't exist: refund in full and record why.
  await refundBookingPayment({
    bookingId: booking.id,
    paymentIntentId: intent.id,
    amountCents: toCents(Number(booking.total)),
    fullRefund: true,
  });
  const { data: cancelled, error: cancelError } = await admin
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_by: 'system',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Payment completed after the time slot was no longer available — refunded automatically.',
      refund_amount: booking.total,
      hold_expires_at: null,
    })
    .eq('id', booking.id)
    .neq('status', 'cancelled')
    .select()
    .maybeSingle();
  if (cancelError) throw cancelError;
  if (cancelled) await sendBookingCancelledEmails(cancelled as BookingForEmail);
}

/**
 * Keeps refund_amount in step with Stripe, including refunds issued by hand
 * from the Stripe dashboard. A full refund of a still-confirmed booking
 * means someone refunded it outside the app: treat it as cancelled.
 */
async function onChargeRefunded(charge: Stripe.Charge) {
  const piId = intentId(charge.payment_intent);
  if (!piId) return;
  const refunded = charge.amount_refunded / 100;
  const { error } = await admin
    .from('bookings')
    .update({ refund_amount: refunded })
    .eq('stripe_payment_intent_id', piId)
    .lt('refund_amount', refunded);
  if (error) throw error;
  if (charge.refunded) {
    await setStatusByIntent(piId, 'confirmed', {
      status: 'cancelled',
      cancelled_by: 'admin',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Refunded from the Stripe dashboard.',
    });
  }
}

async function onDisputeClosed(dispute: Stripe.Dispute) {
  const piId = intentId(dispute.payment_intent);
  if (dispute.status === 'won') {
    await setStatusByIntent(piId, 'disputed', { status: 'confirmed' });
  } else if (dispute.status === 'lost') {
    await setStatusByIntent(piId, 'disputed', {
      status: 'cancelled',
      cancelled_by: 'system',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Payment disputed by the cardholder (chargeback lost).',
    });
  }
}
