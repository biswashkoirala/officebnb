# Officebnb

**Turn empty office hours into income.**

An Airbnb-style marketplace for renting unused office spaces — meeting rooms, boardrooms,
private offices, training rooms, coworking spaces, and event spaces — during the hours
businesses aren't using them: evenings, weekends, and public holidays.

Built as a hackathon MVP demo. Listings and bookings are backed by a real Supabase
database; there's still no real payment processing or auth — checkout is a clearly-labeled
demo form and login is mocked.

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
you see 401s from the REST API afterward, the `anon` role likely still needs explicit
grants:

```sql
grant usage on schema public to anon, authenticated;
grant select, insert on public.listings to anon, authenticated;
grant select, insert on public.bookings to anon, authenticated;
```

## Pages

- **Home** — hero search, how-it-works, popular spaces, owner CTA, business model section
- **Explore** — live search + filters over Sydney listings stored in Supabase
- **Space Details** — gallery, amenities, host info, sticky booking widget
- **Booking** — checkout with a clearly-labeled demo payment form
- **Booking Confirmation** — success screen with a generated booking reference
- **Owner Dashboard** — earnings, occupancy, weekly revenue chart, upcoming bookings
- **List Your Space** — multi-step listing form ending in a publish success modal

## Notes

- Favorites persist via `localStorage`; listings and bookings persist in Supabase, session/login state is in-memory only.
- The "Available now" filter checks the real system clock against each listing's mock hours.
- Photo "upload" on the listing form selects from a small set of stock thumbnails.
