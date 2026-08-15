# Officebnb

**Turn empty office hours into income.**

An Airbnb-style marketplace for renting unused office spaces — meeting rooms, boardrooms,
private offices, training rooms, coworking spaces, and event spaces — during the hours
businesses aren't using them: evenings, weekends, and public holidays.

Built as a hackathon MVP demo. No real payments, auth, or backend — everything runs on
local mock data and React state.

## Stack

React · TypeScript · Vite · Tailwind CSS v4 · React Router · Lucide React

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

## Pages

- **Home** — hero search, how-it-works, popular spaces, owner CTA, business model section
- **Explore** — live search + filters over mock Sydney listings
- **Space Details** — gallery, amenities, host info, sticky booking widget
- **Booking** — checkout with a clearly-labeled demo payment form
- **Booking Confirmation** — success screen with a generated booking reference
- **Owner Dashboard** — earnings, occupancy, weekly revenue chart, upcoming bookings
- **List Your Space** — multi-step listing form ending in a publish success modal

## Notes

- Favorites persist via `localStorage`; bookings and session state are in-memory only.
- The "Available now" filter checks the real system clock against each listing's mock hours.
- Photo "upload" on the listing form selects from a small set of stock thumbnails.
