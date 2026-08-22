# Officebnb

**Turn empty office hours into income.**

An Airbnb-style marketplace for renting unused office spaces — meeting rooms, boardrooms,
private offices, training rooms, coworking spaces, and event spaces — during the hours
businesses aren't using them: evenings, weekends, and public holidays.

Built as a hackathon MVP demo. Listings, bookings, and accounts are backed by real
Supabase (database + auth) — there's still no real payment processing, though; checkout
is a clearly-labeled demo form.

## Stack

React · TypeScript · Vite · Tailwind CSS v4 · React Router · Lucide React · Supabase

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

```bash
npm run build    # production build
npm run preview  # preview the production build
```

### Supabase setup

Copy `.env.example` to `.env` and fill in your project's URL and publishable key, then
run `supabase/schema.sql` once in the Supabase SQL editor (Project → SQL Editor → New
query) to create the `listings` and `bookings` tables, RLS policies, and seed data. If
you see 401s from the REST API afterward, the `anon`/`authenticated` roles likely still
need explicit grants:

```sql
grant usage on schema public to anon, authenticated;
grant select, insert on public.listings to anon, authenticated;
grant select, insert on public.bookings to anon, authenticated;
```

Signup/login use real Supabase Auth (email + password, or Google). For a smoother demo,
turn off **Authentication → Sign In / Providers → Email → Confirm email** in the
Supabase dashboard so new accounts can log in immediately instead of needing to click a
confirmation link — it's a project setting, safe to toggle back on later.

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
- **Booking** — checkout with a clearly-labeled demo payment form
- **Booking Confirmation** — success screen with a generated booking reference
- **Owner Dashboard** — earnings, occupancy, weekly revenue chart, upcoming bookings
- **List Your Space** — multi-step listing form ending in a publish success modal

## Notes

- Favorites persist via `localStorage`; listings, bookings, and login sessions persist via Supabase.
- The "Available now" filter checks the real system clock against each listing's mock hours.
- Photo "upload" on the listing form selects from a small set of stock thumbnails.
