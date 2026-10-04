-- Production hardening + Stripe Connect.
--
-- What this migration changes, and why:
--   1. Profiles carry the owner's Stripe Connect account + whether Stripe has
--      enabled charges/payouts for it. Only the Edge Functions (service role)
--      can write those columns.
--   2. Listings: owners can no longer set their own rating / review count /
--      featured flag / host card — those are either server-maintained or
--      derived from the owner's profile by a trigger. Owners can now edit and
--      archive (soft-delete) their own listings. Publishing requires a
--      Stripe account that can accept charges.
--   3. Bookings: a pending (checkout in progress) booking now holds its slot
--      for a short window, so two renters can never both pay for the same
--      hour. Cancellation / refund / dispute bookkeeping columns added.
--      Deleting a listing can never cascade-delete paid bookings.

-- ---------------------------------------------------------------------------
-- 1. Profiles: Stripe Connect state
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column stripe_account_id text unique,
  add column stripe_charges_enabled boolean not null default false,
  add column stripe_payouts_enabled boolean not null default false,
  add column stripe_details_submitted boolean not null default false;

-- Clients may only ever write the four signup fields. Without this column
-- list, a user could insert their own profile with stripe_charges_enabled =
-- true and skip onboarding.
revoke insert on public.profiles from authenticated;
grant insert (id, role, name, business_name) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Listings
-- ---------------------------------------------------------------------------

-- A listing with no reviews has no rating (the UI shows "New"), rather than
-- a made-up 5.0.
alter table public.listings alter column rating drop not null;
alter table public.listings alter column rating set default null;
alter table public.listings add constraint listings_rating_range
  check (rating is null or (rating >= 1 and rating <= 5));

alter table public.listings
  add column archived boolean not null default false,
  add column updated_at timestamptz not null default now();

alter table public.listings add constraint listings_type_valid check (
  type in ('Meeting Room', 'Private Office', 'Boardroom', 'Training Room', 'Coworking Space', 'Event Space')
);
alter table public.listings add constraint listings_images_count
  check (cardinality(images) between 1 and 10);
alter table public.listings add constraint listings_amenities_count
  check (cardinality(amenities) <= 30);

-- available_hours must be {"weekdays":{"start":"HH:MM","end":"HH:MM"},
-- "weekends":{...}} with start < end — the booking function relies on it.
create or replace function public.valid_available_hours(h jsonb)
returns boolean
language sql
immutable
as $$
  select coalesce((
    select bool_and(
      (h -> k ->> 'start') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and (h -> k ->> 'end') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$|^24:00$'
      and (h -> k ->> 'start') < (h -> k ->> 'end')
    )
    from unnest(array['weekdays', 'weekends']) as k
  ), false)
$$;

alter table public.listings add constraint listings_available_hours_valid
  check (public.valid_available_hours(available_hours));

-- The host card shown on a listing is built from the owner's own profile,
-- never from what the browser sends — otherwise an owner could present
-- themselves as another business.
create or replace function public.listings_set_host()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles;
begin
  if tg_op = 'INSERT' then
    select * into p from public.profiles where id = new.owner_id;
    if p.id is not null then
      new.host := jsonb_build_object(
        'name', p.name,
        'businessName', coalesce(p.business_name, p.name),
        'avatar', '',
        'responseTime', '',
        'joined', to_char(p.created_at, 'YYYY')
      );
    end if;
    new.suburb := new.location;
  else
    new.updated_at := now();
    new.suburb := new.location;
  end if;
  return new;
end;
$$;

create trigger listings_set_host
  before insert or update on public.listings
  for each row execute function public.listings_set_host();

-- Column-level grants: owners supply content fields only. rating,
-- review_count, featured, bookings_count and host are server-controlled.
revoke insert on public.listings from authenticated;
grant insert (id, name, location, type, description, price, capacity, amenities, available_hours, images, owner_id)
  on public.listings to authenticated;
grant update (name, location, type, description, price, capacity, amenities, available_hours, images, archived)
  on public.listings to authenticated;

-- Publishing requires an owner profile whose Stripe account can take
-- payments, so every public listing is actually bookable.
drop policy "Owners insert own listings" on public.listings;
create policy "Owners insert own listings" on public.listings
  for insert with check (
    auth.uid() = owner_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'owner' and stripe_charges_enabled
    )
  );

create policy "Owners update own listings" on public.listings
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Archived listings disappear from the marketplace but stay visible to
-- their owner (so they can be restored) and keep their bookings intact.
drop policy "Public read listings" on public.listings;
create policy "Public read listings" on public.listings
  for select using (not archived or auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- 3. Bookings
-- ---------------------------------------------------------------------------

-- Any in-flight checkout attempts from before this migration can't be
-- holding a slot under the new rules; retire them first so the new
-- exclusion constraint below can be created.
update public.bookings set status = 'failed' where status = 'pending';

alter table public.bookings drop constraint bookings_status_check;
alter table public.bookings add constraint bookings_status_check check (
  status in ('pending', 'confirmed', 'failed', 'expired', 'cancelled', 'disputed')
);

alter table public.bookings
  add column owner_id uuid references auth.users(id) on delete set null,
  add column renter_name text,
  add column currency text not null default 'aud',
  add column host_payout numeric not null default 0 check (host_payout >= 0),
  add column platform_fee numeric not null default 0 check (platform_fee >= 0),
  add column stripe_destination_account text,
  add column hold_expires_at timestamptz,
  add column starts_at timestamptz,
  add column refund_amount numeric not null default 0 check (refund_amount >= 0),
  add column cancelled_at timestamptz,
  add column cancelled_by text check (cancelled_by in ('renter', 'owner', 'admin', 'system')),
  add column cancellation_reason text check (char_length(cancellation_reason) <= 500);

update public.bookings b
  set owner_id = l.owner_id,
      host_payout = b.subtotal,
      platform_fee = b.service_fee,
      starts_at = (b.booking_date + b.start_time) at time zone 'Australia/Sydney'
  from public.listings l
  where l.id = b.listing_id;

create index bookings_owner_id_idx on public.bookings (owner_id);
create index bookings_user_id_idx on public.bookings (user_id);
create index bookings_listing_date_idx on public.bookings (listing_id, booking_date);

-- A booking never disappears because its listing did — listings are
-- archived, not deleted, once they have bookings.
alter table public.bookings drop constraint bookings_listing_id_fkey;
alter table public.bookings add constraint bookings_listing_id_fkey
  foreign key (listing_id) references public.listings(id) on delete restrict;

-- A slot is taken by a confirmed booking *or* by a checkout in progress
-- (pending) — so two renters can never both be charged for the same hour.
-- Pending holds are short-lived: create-payment-intent expires stale ones
-- (and cancels their Stripe PaymentIntent) before creating a new hold. A
-- disputed booking still occupies its slot until the dispute is resolved.
alter table public.bookings drop constraint no_overlapping_confirmed_bookings;
alter table public.bookings add constraint no_overlapping_active_bookings
  exclude using gist (listing_id with =, time_range with &&)
  where (status in ('pending', 'confirmed', 'disputed'));

-- Renters see their own bookings; owners see bookings on their spaces.
-- (Uses the denormalised owner_id so it still works for archived listings.)
drop policy "Users read own bookings" on public.bookings;
create policy "Users read own bookings" on public.bookings
  for select using (auth.uid() = user_id or auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- 4. Storage: owners may delete photos from their own folder (used when
--    they remove a photo while editing a listing).
-- ---------------------------------------------------------------------------
create policy "Owners delete own photos" on storage.objects
  for delete using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
