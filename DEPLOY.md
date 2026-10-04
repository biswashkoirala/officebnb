# Going live: step-by-step

This takes you from the code in this folder to a live site taking real payments.
Do every step in **Stripe test mode first** (steps 1–8), run the test checklist
(step 9), and only then switch to live keys (step 10).

You'll need:

- your ABN (sole trader is fine)
- a domain name (e.g. from VentraIP or Crazy Domains)
- accounts at [Supabase](https://supabase.com), [Stripe](https://stripe.com/au),
  [Vercel](https://vercel.com) and (optional, for booking emails) [Resend](https://resend.com)
- Node.js 22. Run the Supabase CLI through `npx supabase …` (it downloads itself on
  first use; a global `npm install -g supabase` is not supported)

---

## 1. Create the production Supabase project

1. In Supabase, create a **new project** for production. Keep your existing one
   for development, so test data never mixes with real customers.
   Choose region **Sydney (ap-southeast-2)**.
2. In this folder, link the CLI to that project and apply the database:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-prod-project-ref>
   npx supabase db push
   ```

   `db push` runs the files in `supabase/migrations/` in order. It **does not**
   load `supabase/seed.sql` (the fake demo listings), which is what you want.

   > Upgrading a project that was set up with the old `schema.sql`? Mark the
   > baseline as already applied first, then push:
   > `npx supabase migration repair --status applied 20260101000000` then `npx supabase db push`

3. **Storage** → New bucket → name `listing-photos`, **Public**, file size limit
   `5 MB`, allowed MIME types `image/jpeg,image/png,image/webp`.

## 2. Supabase Auth settings

- **Authentication → URL Configuration**: Site URL = `https://yourdomain.com.au`.
  Add the same URL (and `https://www.yourdomain.com.au` if you use it) under Redirect URLs.
- **Authentication → Sign In / Providers → Email**: leave **Confirm email ON**
  in production.
- **Authentication → Emails → SMTP Settings**: set up custom SMTP (Resend works
  well). Supabase's built-in email sender only allows a handful of emails per hour,
  so without this, signups will fail once you have real traffic.
- Google sign-in: follow the README section, using your production domain.

## 3. Stripe: activate your account and Connect

1. Sign up at stripe.com/au and **activate** the account as an individual / sole
   trader with your ABN and bank account. Live payments stay switched off until
   Stripe has verified you.
2. **Connect → Get started**. Choose **Platform or marketplace**, and pick
   **Express** accounts for owners. Fill in the platform profile: you collect
   payments on behalf of owners and pay them out.
3. **Settings → Connect → Branding**: add your name, icon and colour. Owners see
   these during onboarding.
4. **Settings → Business → Customer emails**: turn on "Successful payments" and
   "Refunds" so renters get Stripe receipts.
5. Set a **statement descriptor** (Settings → Business → Public details), e.g.
   `OFFICEBNB`, so renters recognise the charge.

## 4. Stripe webhooks (two endpoints, same URL)

Your webhook URL is `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`.

In **Developers → Webhooks**, add:

| Endpoint | "Listen to" | Events | Secret goes in |
|---|---|---|---|
| A | Events on **your account** | `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed` | `STRIPE_WEBHOOK_SECRET` |
| B | Events on **Connected accounts** | `account.updated` | `STRIPE_CONNECT_WEBHOOK_SECRET` |

Copy each endpoint's signing secret (`whsec_…`).

## 5. Server secrets and functions

Run each line separately (this works in Windows PowerShell and on Mac/Linux):

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...A...
npx supabase secrets set STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...B...
npx supabase secrets set SITE_URL=https://yourdomain.com.au
npx supabase secrets set ALLOWED_ORIGINS=https://yourdomain.com.au,https://www.yourdomain.com.au

# optional — booking confirmation/cancellation emails to renters and owners
npx supabase secrets set RESEND_API_KEY=re_...
npx supabase secrets set "EMAIL_FROM=Officebnb <bookings@yourdomain.com.au>"

npx supabase functions deploy
```

`supabase/config.toml` already turns off Supabase login checks for
`stripe-webhook` only, because Stripe's signature is what authenticates it.

## 6. Deploy the website on Vercel

1. Vercel → **Add New → Project** → import `biswashkoirala/officebnb` from GitHub.
   Framework preset: Vite (auto-detected).
2. **Environment Variables** (all of them from `.env.example`):
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`
   (`pk_test_…` for now), `VITE_BUSINESS_LEGAL_NAME` (e.g. "Your Name trading as
   Officebnb"), `VITE_BUSINESS_ABN`, `VITE_SUPPORT_EMAIL`.
3. Deploy, then **Settings → Domains** → add your domain and follow the DNS steps.
4. Every push to `main` now redeploys automatically. GitHub runs the checks in
   `.github/workflows/ci.yml` first.

## 7. Have the legal pages reviewed

`/terms`, `/privacy` and `/cancellation-policy` are written for an Australian
sole-trader marketplace, but they're a starting point, **not legal advice**.
Get a lawyer to review them before launch. The key areas are host obligations,
insurance and liability.

## 8. Business admin

- **Business name**: if you trade as "Officebnb" (or any name other than your own
  legal name), register it with ASIC. Also check the name doesn't infringe a
  trade mark: "…bnb" names are close to Airbnb's.
- **GST**: you must register once turnover reaches $75,000. Ask an accountant how
  the ATO treats your marketplace fees versus the booking amounts.
- **Sharing Economy Reporting Regime**: marketplace operators must report
  owners' earnings to the ATO twice a year (by 31 January and 31 July). Stripe
  holds the owner details you'll need. Confirm with your accountant how this
  applies to hourly office rentals.
- Keep records for 5 years. The `bookings` table plus Stripe's reports cover this.

## 9. Test everything in test mode

Use test card `4242 4242 4242 4242`, any future expiry and any CVC.

1. Sign up as an **owner** → Dashboard → **Set up payouts**. In Stripe's test
   onboarding use the test values Stripe suggests (bank BSB `110000`, account
   `000123456`). Back on the dashboard it should say *Payouts are active*.
2. List a space with photos. It should appear on Explore.
3. In another browser (or private window), sign up as a **renter** and book it:
   - it should be confirmed within a few seconds
   - Stripe dashboard → Payments: the charge shows a transfer to the owner and
     your application fee
   - the owner's dashboard shows the booking and their payout
4. **Double-booking test**: open checkout for the same slot in two renter
   accounts at the same time. The second should be told the time is taken.
5. **3-D Secure**: card `4000 0027 6000 3184`. **Decline**: card `4000 0000 0000 0002`.
   The booking must not be confirmed, and the renter can retry with another card.
6. **Cancellations**: renter cancels a booking 3+ days away (full refund); renter
   cancels one within 48 hours (no refund); owner cancels (full refund). Check
   each in Stripe → Payments → Refunds.
7. **Dispute**: pay with `4000 0000 0000 0259`. The booking should show "Payment
   disputed".
8. Check the Edge Function logs (Supabase → Edge Functions → Logs) for errors.

## 10. Switch to live

1. Stripe dashboard → turn off **Test mode**. Recreate **both** webhook endpoints
   in live mode (step 4). Live endpoints have new signing secrets.
2. Replace the three Stripe secrets with the live ones (`npx supabase secrets set STRIPE_SECRET_KEY=sk_live_...`,
   and the same for both webhook secrets), then `npx supabase functions deploy`.
3. Vercel → set `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...` → Redeploy.
4. Owners who onboarded in test mode must onboard again. Test and live Stripe
   accounts are separate. Clear test data first: in the SQL editor,
   `update profiles set stripe_account_id = null, stripe_charges_enabled = false, stripe_payouts_enabled = false, stripe_details_submitted = false;`
   (and delete test bookings/listings if you used the production project for testing).
5. Make one real booking on a cheap listing with your own card, check it end to
   end, then cancel it for a refund.

See `OPERATIONS.md` for day-to-day tasks (disputes, manual refunds, role fixes).
