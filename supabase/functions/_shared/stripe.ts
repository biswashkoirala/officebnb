import Stripe from 'npm:stripe@17.5.0';
import { admin } from './http.ts';

export { Stripe };

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  // Pinned so a Stripe-side default change can never alter behaviour.
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

export const cryptoProvider = Stripe.createSubtleCryptoProvider();

/** Copies a connected account's onboarding state onto the owner's profile. */
export async function syncConnectedAccount(account: Stripe.Account) {
  const { error } = await admin
    .from('profiles')
    .update({
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_details_submitted: account.details_submitted,
    })
    .eq('stripe_account_id', account.id);
  if (error) throw error;
}

/**
 * Refunds a booking's payment. With destination charges the owner's share
 * is pulled back from their Stripe balance (reverse_transfer) and, on a full
 * refund, the platform's fee is returned too — so nobody keeps money for a
 * booking that didn't happen. Idempotent per booking.
 */
export async function refundBookingPayment(opts: {
  bookingId: string;
  paymentIntentId: string;
  amountCents: number;
  fullRefund: boolean;
}) {
  return await stripe.refunds.create(
    {
      payment_intent: opts.paymentIntentId,
      amount: opts.amountCents,
      reverse_transfer: true,
      refund_application_fee: opts.fullRefund,
      metadata: { booking_id: opts.bookingId },
    },
    { idempotencyKey: `refund-${opts.bookingId}-${opts.amountCents}` },
  );
}
