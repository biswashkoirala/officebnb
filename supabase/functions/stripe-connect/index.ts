// Stripe Connect for space owners. Owners get a Stripe Express account:
// Stripe hosts the onboarding (identity, ABN, bank account) and the payout
// dashboard, so bank details never touch this app.
//
// POST { action: 'onboard' }   → { url } Stripe-hosted onboarding link
// POST { action: 'refresh' }   → current onboarding state, synced to profile
// POST { action: 'dashboard' } → { url } one-time link to their Stripe Express dashboard
import { admin, HttpError, json, readJson, requireUser, serve, siteUrl } from '../_shared/http.ts';
import { stripe, syncConnectedAccount } from '../_shared/stripe.ts';

type Action = 'onboard' | 'refresh' | 'dashboard';

serve('stripe-connect', async (req, origin) => {
  const user = await requireUser(req);
  const { action } = await readJson<{ action?: Action }>(req);

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, role, name, business_name, stripe_account_id')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!profile || profile.role !== 'owner') throw new HttpError(403, 'Only space owner accounts can set up payouts.');

  if (action === 'onboard') {
    let accountId: string | null = profile.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create(
        {
          type: 'express',
          country: 'AU',
          email: user.email ?? undefined,
          capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
          business_profile: {
            name: profile.business_name ?? profile.name,
            product_description: 'Hourly rental of office and meeting space',
          },
          metadata: { user_id: user.id },
        },
        { idempotencyKey: `acct-${user.id}` },
      );
      // Only store it if no account was saved concurrently (double click).
      const { data: saved, error: saveError } = await admin
        .from('profiles')
        .update({ stripe_account_id: account.id })
        .eq('id', user.id)
        .is('stripe_account_id', null)
        .select('stripe_account_id')
        .maybeSingle();
      if (saveError) throw saveError;
      if (saved) {
        accountId = account.id;
      } else {
        const { data: current } = await admin.from('profiles').select('stripe_account_id').eq('id', user.id).single();
        accountId = current!.stripe_account_id;
      }
    }
    const link = await stripe.accountLinks.create({
      account: accountId!,
      type: 'account_onboarding',
      refresh_url: `${siteUrl()}/dashboard?payouts=refresh`,
      return_url: `${siteUrl()}/dashboard?payouts=return`,
    });
    return json({ url: link.url }, 200, origin);
  }

  if (!profile.stripe_account_id) {
    return json({ chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false }, 200, origin);
  }

  if (action === 'refresh') {
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    await syncConnectedAccount(account);
    return json(
      {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      },
      200,
      origin,
    );
  }

  if (action === 'dashboard') {
    const link = await stripe.accounts.createLoginLink(profile.stripe_account_id);
    return json({ url: link.url }, 200, origin);
  }

  throw new HttpError(400, 'Unknown action.');
});
