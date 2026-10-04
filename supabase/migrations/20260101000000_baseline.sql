-- Baseline: the schema as it existed before the production migration.
-- Identical to the old supabase/schema.sql minus its `drop table` lines and
-- seed data. If your existing Supabase project was set up by running the old
-- schema.sql, mark this migration as already applied instead of running it:
--   supabase migration repair --status applied 20260101000000
-- A brand-new project just runs it normally via `supabase db push`.

create extension if not exists btree_gist;


-- ---------------------------------------------------------------------------
-- Profiles: one row per signed-up user, created once at signup. Holds the
-- role (renter/owner) and, for owners, their business name. There is no
-- update policy below, so once written these fields can never be changed by
-- the user — a renter can't self-promote to owner after the fact, and this
-- is what the "Owners insert own listings" policy actually checks. If a
-- signed-up user picks the wrong role, support fixes it directly via the SQL
-- editor — see OPERATIONS.md — rather than through a self-service path.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('renter', 'owner')),
  name text not null check (char_length(trim(name)) > 0 and char_length(name) <= 120),
  business_name text check (
    business_name is null or (char_length(trim(business_name)) > 0 and char_length(business_name) <= 120)
  ),
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness so a new signup can't claim a business name
-- another account already owns.
create unique index profiles_business_name_key on public.profiles (lower(business_name))
  where business_name is not null;

-- ---------------------------------------------------------------------------
-- Listings: every space available on the marketplace, including ones created
-- through the "List your space" form. Price/capacity/text-length bounds are
-- enforced here, not just in the UI, since the client can always be bypassed.
-- ---------------------------------------------------------------------------
create table public.listings (
  id text primary key,
  name text not null check (char_length(trim(name)) > 0 and char_length(name) <= 120),
  location text not null check (char_length(trim(location)) > 0 and char_length(location) <= 120),
  suburb text not null,
  type text not null,
  description text not null check (char_length(description) <= 4000),
  price numeric not null check (price > 0 and price < 10000),
  capacity integer not null check (capacity between 1 and 500),
  rating numeric not null default 5,
  review_count integer not null default 0,
  amenities text[] not null default '{}',
  available_hours jsonb not null,
  images text[] not null default '{}',
  host jsonb not null,
  bookings_count integer not null default 0,
  featured boolean not null default false,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Bookings: every reservation made through the booking flow. `booking_date`/
-- `start_time`/`end_time` are real date/time columns (not free text) so an
-- overlap constraint is possible at all. `status` starts at 'pending' and can
-- only ever be moved to 'confirmed'/'failed' by the Stripe webhook Edge
-- Function, which runs with the service-role key and bypasses RLS — no
-- `authenticated` grant exists for insert/update on this table (see grants
-- below), so a client can never write a booking row, its status, or its
-- money fields directly. `time_range` is a generated column used only by the
-- exclusion constraint that blocks a second confirmed booking from
-- overlapping an existing one on the same listing.
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references public.listings(id) on delete cascade,
  listing_name text not null,
  location text not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  time_range tsrange generated always as (
    tsrange(booking_date + start_time, booking_date + end_time)
  ) stored,
  guests integer not null check (guests > 0),
  hours numeric not null check (hours > 0),
  subtotal numeric not null check (subtotal >= 0),
  service_fee numeric not null check (service_fee >= 0),
  total numeric not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed', 'cancelled')),
  stripe_payment_intent_id text unique,
  reference text not null unique,
  host_name text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Two confirmed bookings can never overlap on the same listing. `pending`
-- rows are exempt so a not-yet-paid attempt doesn't block anyone else from
-- also attempting to pay for the same slot; only the first one to actually
-- reach `confirmed` wins, and the Edge Function that creates PaymentIntents
-- additionally pre-checks for a confirmed overlap before charging.
alter table public.bookings add constraint no_overlapping_confirmed_bookings
  exclude using gist (listing_id with =, time_range with &&) where (status = 'confirmed');

-- ---------------------------------------------------------------------------
-- Row Level Security. Listings stay publicly browsable (it's a marketplace),
-- but creating a listing requires a real signed-in Supabase Auth user whose
-- profile has role = 'owner', enforced here in the database, not just in the
-- UI. Bookings are read-only from the client's perspective — every booking
-- is created and confirmed by Edge Functions running with the service-role
-- key (see supabase/functions/), so there is deliberately no insert/update
-- grant for `authenticated` on public.bookings.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on public.profiles to authenticated;
grant select on public.listings to anon, authenticated;
grant insert on public.listings to authenticated;
grant select on public.bookings to authenticated;

create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Public read listings" on public.listings
  for select using (true);
create policy "Owners insert own listings" on public.listings
  for insert with check (
    auth.uid() = owner_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );

create policy "Users read own bookings" on public.bookings
  for select using (
    auth.uid() = user_id
    or listing_id in (select id from public.listings where owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Storage: listing photos. The bucket itself (`listing-photos`, public,
-- 5MB/file, image/jpeg|png|webp only) is created once via the Supabase
-- dashboard — see OPERATIONS.md. These policies scope uploads to a folder
-- named after the uploader's own user id, which is what src/components/
-- PhotoUploader.tsx relies on when it writes to `<ownerId>/<uuid>.jpg`.
-- ---------------------------------------------------------------------------
create policy "Owners upload to own folder" on storage.objects
  for insert with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Public read listing photos" on storage.objects
  for select using (bucket_id = 'listing-photos');
