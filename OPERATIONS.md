# Operations runbook

Day-to-day operator tasks that are deliberately *not* self-service in the app,
because the underlying database policy is what actually enforces security —
adding a UI for these would mean adding a way to bypass that policy.

## Fixing a wrong role choice

`profiles.role` (`renter`/`owner`) is permanent once a user signs up — there's
no update policy on `public.profiles` on purpose, since that's what makes
"only an owner can publish a listing" (`supabase/migrations/`) an actual
security boundary rather than a UI suggestion.

If a user picks the wrong role and asks support to fix it, run this in the
Supabase dashboard's SQL editor (Project → SQL Editor → New query). This uses
your own dashboard access, which already bypasses RLS:

```sql
update public.profiles set role = 'owner' where id = '<user-id>';
-- or
update public.profiles set role = 'renter' where id = '<user-id>';
```

Find `<user-id>` via Authentication → Users (search by email), or:

```sql
select id, role, name, business_name from public.profiles where name ilike '%<name or business>%';
```

## Deploying and Stripe setup

See `DEPLOY.md` for the full step-by-step (Supabase project, Stripe Connect,
webhooks, secrets, Vercel, test checklist, switching to live).

## Setting up the listing-photos storage bucket

Create a bucket named `listing-photos` in the Supabase dashboard (Storage →
New bucket), public, then set:

- File size limit: 5MB
- Allowed MIME types: `image/jpeg,image/png,image/webp`

The storage RLS policies that scope uploads to each owner's own folder live
in `supabase/migrations/`.

## How money flows

Every booking is a Stripe **destination charge** on your platform account:

- the renter pays `total` = hourly price × hours + 10% service fee
- `host_payout` (the hourly price × hours) is transferred to the owner's
  Stripe Express account automatically; Stripe pays it out to their bank
- `platform_fee` (the service fee) stays with you as the application fee;
  Stripe's own processing fee comes out of your balance

Refunds made through the app (`cancel-booking`) pull the owner's share back
(`reverse_transfer`) and, on full refunds, return your fee too.

## Refunding a booking by hand

Prefer the app: the renter or owner presses **Cancel** and the refund rules
apply. For a goodwill refund outside the rules, refund the payment in the
Stripe dashboard and tick **Reverse the transfer** so the owner's share comes
back too. The `charge.refunded` webhook records the refund on the booking,
and a full refund marks it cancelled.

## Disputes (chargebacks)

With destination charges, **you** (the platform) are debited for a dispute,
not the owner. When `charge.dispute.created` arrives, the booking is marked
`disputed`.

1. Stripe dashboard → Disputes: respond with evidence (booking reference,
   times, the renter's confirmation, any messages).
2. If you want the owner to bear the loss (e.g. they didn't provide the space),
   reverse their transfer for that payment: Payments → the payment → Transfer →
   **Reverse**.
3. When the dispute closes, the webhook sets the booking back to `confirmed`
   (won) or `cancelled` (lost).

## A renter says they paid but the booking isn't there

Look the payment up in Stripe (search the renter's email). Its metadata has
the `booking_id`. Then:

```sql
select id, status, reference, cancellation_reason, refund_amount
from public.bookings where id = '<booking_id>';
```

`cancelled` with reason "Payment completed after the time slot was no longer
available" means it was refunded automatically. If it's still `pending`
several minutes after a successful payment, the webhook isn't arriving.
Check Stripe → Developers → Webhooks for failed deliveries and the Edge
Function logs. Stripe retries automatically for 3 days, and you can resend
the event from the dashboard.

## Removing a listing

Owners hide listings themselves (Dashboard → Hide from marketplace). Listings
with bookings can't be hard-deleted. That's deliberate, so booking and payment
history is never lost.
