# Officebnb

**Turn empty office hours into income.**

An Airbnb-style marketplace for renting unused office spaces — meeting rooms, boardrooms,
private offices, training rooms, coworking spaces, and event spaces — during the hours
businesses aren't using them: evenings, weekends, and public holidays.

Listings, bookings, and accounts are backed by Supabase (database + auth + storage).
Payments run through **Stripe Connect**: renters pay by card, owners are paid out
automatically to their own bank account, and the platform keeps the service fee.

- **`DEPLOY.md`** — step-by-step to go live with real payments
- **`OPERATIONS.md`** — day-to-day runbook (refunds, disputes, fixing a user's role)

## Stack

React · TypeScript · Vite · Tailwind CSS v4 · React Router · Lucide React · Supabase · Stripe

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

```bash
npm run build    # production build
npm run preview  # preview the production build
npm test         # run the vitest suite (pricing/availability logic)
```

### Supabase setup

Copy `.env.example` to `.env` and fill in your project's URL, publishable key, and
Stripe publishable key. The database schema lives in `supabase/migrations/` and is
applied with the Supabase CLI:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`supabase/seed.sql` contains 12 **fake** demo listings for local development only
(`npx supabase db reset` on a local database). Never load it into production.

`public.bookings` intentionally has **no** insert/update grant for `authenticated`:
every booking is created, confirmed, cancelled and refunded by the Edge Functions in
`supabase/functions/` (running with the service-role key), never directly by the
client.

Signup/login use real Supabase Auth (email + password, or Google). For local testing
you can turn off **Authentication → Sign In / Providers → Email → Confirm email**,
but leave it on in production.

To enable **Sign in with Google**:

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create
   an OAuth 2.0 Client ID (Web application). Add your Supabase callback URL as an
   Authorized redirect URI — it's shown on the Google provider settings page in step 2
   below, typically `https://<project-ref>.supabase.co/auth/v1/callback`. Add
   `http://localhost:5173` (and `5174`, etc. for other dev ports) plus your production
   URL as Authorized JavaScript origins.
2. In the Supabase dashboard, go to **Authentication → Sign In / Providers → Google**,
   enable it, and paste in the Client ID and Client Secret from step 1.
3. Under **Authentication → URL Configuration**, make sure **Site URL** (and, for
   preview/dev, **Redirect URLs**) includes the URL the app runs on, since that's where
   Google redirects back to after sign-in.

Google accounts skip the signup form's role/business-name fields, so first-time Google
sign-ins are prompted to finish setup (choose renter/owner, business name if owner)
before continuing.

## Pages

- **Home** — hero search, how-it-works, popular spaces, owner CTA, business model section
- **Explore** — live search + filters over Sydney listings stored in Supabase
- **Space Details** — gallery, amenities, host info, sticky booking widget
- **Booking** — Stripe checkout (Payment Element); the slot is held for 15 minutes while paying
- **Booking Confirmation** — polls for the webhook-confirmed booking, then shows the reference
- **My Bookings** — upcoming/past bookings, cancel with automatic refund per the policy
- **Owner Dashboard** — Stripe payouts setup, earnings, upcoming bookings (cancel), edit/hide spaces
- **List Your Space** — create or edit a listing, with photo uploads to Supabase Storage
- **Terms / Privacy / Cancellation policy / Contact** — legal pages (have them reviewed before launch)

## How bookings and money work

- Prices are in **AUD**; all dates and times are **Sydney time**, whatever the
  browser's timezone.
- Pricing, time and cancellation rules live in `supabase/functions/_shared/`
  (`pricing.ts`, `time.ts`) and are imported by both the Edge Functions and the
  React app, so the preview and the real charge can never drift apart.
- `create-payment-intent` re-derives the price from the database, checks the
  requested time (not in the past, within the space's hours, on the half hour),
  and inserts a `pending` booking that **holds the slot** (a database exclusion
  constraint stops two active bookings overlapping). It then creates a Stripe
  destination charge to the owner's connected account.
- `stripe-webhook` confirms the booking when payment succeeds. If a payment ever
  completes for a slot that's no longer available, it is refunded in full
  automatically. It also records refunds, disputes and owners' Stripe onboarding.
- `cancel-booking` lets the renter (full refund 48h+ before start, otherwise
  none) or the owner (always a full refund) cancel.
- `stripe-connect` handles owners' Stripe Express onboarding and dashboard links.
  Owners must finish onboarding before they can publish a listing (enforced in the
  database).
- Owners can't set their own ratings, review counts, "featured" flag or host card:
  those columns aren't writable by clients.
- Favourites persist via `localStorage`.
