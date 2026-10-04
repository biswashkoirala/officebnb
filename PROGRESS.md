# Where we left off — 5 Oct 2026

## Live (test mode) at https://officebnb.vercel.app — end-to-end test PASSED
| Test | Result |
|---|---|
| Owner sign-up + profile | ✅ |
| Stripe Connect payout onboarding | ✅ (needed Stripe "Accounts v1 support" switched on) |
| Photo upload to Supabase storage | ✅ |
| Publish listing (host card + "New" rating set by server) | ✅ |
| Renter checkout holds the slot; abandoned checkout expires + PaymentIntent cancelled | ✅ |
| Payment with test card → webhook confirms booking ($55 = $50 owner + $5 platform) | ✅ |
| Same slot again → refused ("That time has just been booked…") | ✅ |
| Renter cancels >48h ahead → full $55 refund recorded | ✅ |

## Setup in place
- GitHub `main` → Vercel auto-deploys; CI runs tests/build.
- Supabase `officebnb-prod` (Sydney, ref `gmkhxdfurmefoikexnpo`): migrations, storage bucket,
  4 Edge Functions (JWT verification off — functions check login themselves), secrets.
- Stripe sandbox: 2 webhook endpoints, Connect, Accounts v1 support on.

## Small fixes still to do
- Vercel env `VITE_BUSINESS_LEGAL_NAME` contains "e.g. " — remove it (footer shows it).
- Google sign-in not enabled on the new Supabase project (see chat notes / DEPLOY.md).
- Edge Functions in Supabase were deployed by hand from bundles; for future changes use
  `npx supabase functions deploy` from this folder (or ask Claude to redeploy).

## Going live (DEPLOY.md step 10)
1. Stripe: activate the account (sole trader + ABN), turn on Accounts v1 support in LIVE mode,
   create the two live webhooks, put live keys/secrets into Supabase + `pk_live` into Vercel.
2. Lawyer review of /terms, /privacy, /cancellation-policy; ASIC business name; accountant re GST/SERR.
3. Delete the TEST listing/bookings and test accounts; one real small booking + refund.
