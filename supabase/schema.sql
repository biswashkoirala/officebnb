-- Officebnb — Supabase schema + seed data
-- Run this whole file once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: it drops and recreates the two tables each time.

drop table if exists public.bookings;
drop table if exists public.listings;

-- ---------------------------------------------------------------------------
-- Listings: every space available on the marketplace, including ones created
-- through the "List your space" form.
-- ---------------------------------------------------------------------------
create table public.listings (
  id text primary key,
  name text not null,
  location text not null,
  suburb text not null,
  type text not null,
  description text not null,
  price numeric not null,
  capacity integer not null,
  rating numeric not null default 5,
  review_count integer not null default 0,
  amenities text[] not null default '{}',
  available_hours jsonb not null,
  images text[] not null default '{}',
  host jsonb not null,
  bookings_count integer not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Bookings: every reservation made through the booking flow.
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references public.listings(id) on delete cascade,
  listing_name text not null,
  location text not null,
  date text not null,
  start_time text not null,
  end_time text not null,
  guests integer not null,
  hours numeric not null,
  subtotal numeric not null,
  service_fee numeric not null,
  total numeric not null,
  reference text not null,
  host_name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security. This is a no-auth hackathon demo — every visitor shares
-- the same public anon key — so we allow open read/insert on both tables and
-- skip update/delete entirely (nothing in the app needs them).
-- ---------------------------------------------------------------------------
alter table public.listings enable row level security;
alter table public.bookings enable row level security;

create policy "Public read listings" on public.listings
  for select using (true);
create policy "Public insert listings" on public.listings
  for insert with check (true);

create policy "Public read bookings" on public.bookings
  for select using (true);
create policy "Public insert bookings" on public.bookings
  for insert with check (true);

-- ---------------------------------------------------------------------------
-- Seed data: the 12 demo Sydney listings.
-- ---------------------------------------------------------------------------
insert into public.listings
  (id, name, location, suburb, type, description, price, capacity, rating, review_count, amenities, available_hours, images, host, bookings_count, featured)
values
('modern-meeting-room-cbd', 'Modern Meeting Room', 'Sydney CBD', 'Sydney CBD', 'Meeting Room', 'A modern meeting room located in the heart of Sydney CBD. Perfect for team meetings, interviews, workshops and remote collaboration. Floor-to-ceiling windows with skyline views and a calm, professional atmosphere.', 25, 6, 4.9, 27, ARRAY['Wi-Fi', 'Large display', 'Whiteboard', 'Video conferencing', 'Air conditioning', 'Kitchen access', 'Power outlets']::text[], '{"weekdays":{"start":"18:00","end":"22:00"},"weekends":{"start":"09:00","end":"20:00"}}'::jsonb, ARRAY['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1560264280-88b68371db39?auto=format&fit=crop&w=1200&q=80']::text[], '{"name":"Sarah Johnson","businessName":"Sarah''s Workspace","avatar":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80","responseTime":"within an hour","joined":"2023"}'::jsonb, 18, true),
('creative-studio-office', 'Creative Studio Office', 'Surry Hills', 'Surry Hills', 'Private Office', 'A bright, design-led private office in Surry Hills, ideal for creative teams, photoshoots, and small workshops. Exposed brick, natural light, and a relaxed vibe.', 30, 8, 4.8, 19, ARRAY['Wi-Fi', 'Whiteboard', 'Kitchen', 'Air conditioning', 'Parking', 'Power outlets']::text[], '{"weekdays":{"start":"18:30","end":"22:00"},"weekends":{"start":"08:00","end":"21:00"}}'::jsonb, ARRAY['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1524230507669-5ff97982bb5e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80']::text[], '{"name":"Marcus Lee","businessName":"Studio Nine","avatar":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80","responseTime":"within 2 hours","joined":"2022"}'::jsonb, 14, true),
('executive-boardroom-barangaroo', 'Executive Boardroom', 'Barangaroo', 'Barangaroo', 'Boardroom', 'A premium executive boardroom with harbour views in Barangaroo. Perfect for board meetings, client presentations, and high-stakes negotiations.', 45, 10, 4.8, 32, ARRAY['Wi-Fi', 'Large display', 'Video conferencing', 'Air conditioning', 'Kitchen access', 'Power outlets', 'Parking']::text[], '{"weekdays":{"start":"18:00","end":"21:00"},"weekends":{"start":"09:00","end":"18:00"}}'::jsonb, ARRAY['https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80']::text[], '{"name":"Sarah Johnson","businessName":"Sarah''s Workspace","avatar":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80","responseTime":"within an hour","joined":"2023"}'::jsonb, 8, true),
('private-startup-office-parramatta', 'Private Startup Office', 'Parramatta', 'Parramatta', 'Private Office', 'A cozy, affordable private office in Parramatta perfect for small startup teams, side projects, and solo founders needing a quiet weekend workspace.', 20, 4, 4.7, 11, ARRAY['Wi-Fi', 'Whiteboard', 'Air conditioning', 'Power outlets']::text[], '{"weekdays":{"start":"18:00","end":"22:00"},"weekends":{"start":"08:00","end":"20:00"}}'::jsonb, ARRAY['https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80']::text[], '{"name":"David Chen","businessName":"Parra Business Hub","avatar":"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80","responseTime":"within 3 hours","joined":"2023"}'::jsonb, 9, false),
('training-room-north-sydney', 'Training Room', 'North Sydney', 'North Sydney', 'Training Room', 'A spacious training room in North Sydney with flexible seating, ideal for workshops, bootcamps, seminars, and corporate training sessions.', 40, 16, 4.8, 22, ARRAY['Wi-Fi', 'Projector', 'Whiteboard', 'Video conferencing', 'Air conditioning', 'Power outlets', 'Parking']::text[], '{"weekdays":{"start":"18:00","end":"21:30"},"weekends":{"start":"09:00","end":"19:00"}}'::jsonb, ARRAY['https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80']::text[], '{"name":"Emily Ward","businessName":"North Shore Learning Co","avatar":"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=1200&q=80","responseTime":"within an hour","joined":"2022"}'::jsonb, 16, true),
('bright-coworking-newtown', 'Bright Coworking Space', 'Newtown', 'Newtown', 'Coworking Space', 'A vibrant coworking space in Newtown with an eclectic, artsy feel. Great for freelancers, small teams, and pop-up events on weekends.', 22, 6, 4.6, 15, ARRAY['Wi-Fi', 'Whiteboard', 'Kitchen', 'Air conditioning', 'Power outlets']::text[], '{"weekdays":{"start":"19:00","end":"22:00"},"weekends":{"start":"08:00","end":"21:00"}}'::jsonb, ARRAY['https://images.unsplash.com/photo-1600508773958-6d9de1e1f0a4?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=1200&q=80']::text[], '{"name":"Jordan Blake","businessName":"Newtown Collective","avatar":"https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=1200&q=80","responseTime":"within 2 hours","joined":"2023"}'::jsonb, 12, false),
('skyline-boardroom-chatswood', 'Skyline Boardroom', 'Chatswood', 'Chatswood', 'Boardroom', 'A sleek boardroom in Chatswood with panoramic city views, perfect for evening client meetings and weekend strategy sessions.', 38, 8, 4.7, 9, ARRAY['Wi-Fi', 'Large display', 'Video conferencing', 'Air conditioning', 'Power outlets']::text[], '{"weekdays":{"start":"18:00","end":"21:00"},"weekends":{"start":"09:00","end":"18:00"}}'::jsonb, ARRAY['https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1462826303086-329426d1aef5?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80']::text[], '{"name":"Grace Kim","businessName":"Chatswood Executive Suites","avatar":"https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&w=1200&q=80","responseTime":"within an hour","joined":"2021"}'::jsonb, 7, false),
('harbourside-meeting-room-pyrmont', 'Harbourside Meeting Room', 'Pyrmont', 'Pyrmont', 'Meeting Room', 'A light-filled meeting room near Pyrmont Bay, great for small team syncs, client calls, and creative brainstorms after hours.', 28, 5, 4.8, 13, ARRAY['Wi-Fi', 'Whiteboard', 'Video conferencing', 'Air conditioning', 'Kitchen access']::text[], '{"weekdays":{"start":"18:00","end":"22:00"},"weekends":{"start":"09:00","end":"20:00"}}'::jsonb, ARRAY['https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1505409859467-3a796fd5798e?auto=format&fit=crop&w=1200&q=80']::text[], '{"name":"Liam O''Brien","businessName":"Pyrmont Studios","avatar":"https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80","responseTime":"within 2 hours","joined":"2022"}'::jsonb, 10, false),
('event-space-haymarket', 'Haymarket Event Space', 'Haymarket', 'Haymarket', 'Event Space', 'An open, adaptable event space in Haymarket suited for product launches, weekend workshops, pop-up demos, and community meetups.', 55, 30, 4.9, 21, ARRAY['Wi-Fi', 'Projector', 'Video conferencing', 'Air conditioning', 'Kitchen access', 'Power outlets', 'Parking']::text[], '{"weekdays":{"start":"18:00","end":"23:00"},"weekends":{"start":"08:00","end":"23:00"}}'::jsonb, ARRAY['https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80']::text[], '{"name":"Nina Patel","businessName":"Haymarket Venues","avatar":"https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80","responseTime":"within an hour","joined":"2020"}'::jsonb, 24, true),
('ultimo-training-room', 'Ultimo Training Room', 'Ultimo', 'Ultimo', 'Training Room', 'A modern training room near Ultimo, ideal for weekend certification courses, tutoring sessions, and small conferences.', 35, 12, 4.6, 8, ARRAY['Wi-Fi', 'Projector', 'Whiteboard', 'Air conditioning', 'Power outlets']::text[], '{"weekdays":{"start":"18:00","end":"21:00"},"weekends":{"start":"09:00","end":"19:00"}}'::jsonb, ARRAY['https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1571624436279-b272aff752b5?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80']::text[], '{"name":"Tom Reilly","businessName":"Ultimo Education Hub","avatar":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80","responseTime":"within 3 hours","joined":"2023"}'::jsonb, 6, false),
('private-office-cbd-two', 'CBD Quiet Office', 'Sydney CBD', 'Sydney CBD', 'Private Office', 'A calm, quiet private office in the CBD, ideal for focused solo work, client calls, and small consultations on weekends.', 24, 3, 4.7, 17, ARRAY['Wi-Fi', 'Air conditioning', 'Power outlets', 'Kitchen access']::text[], '{"weekdays":{"start":"18:00","end":"22:00"},"weekends":{"start":"09:00","end":"20:00"}}'::jsonb, ARRAY['https://images.unsplash.com/photo-1524749292158-7540c2494485?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1541558869434-2840d308329a?auto=format&fit=crop&w=1200&q=80']::text[], '{"name":"Sarah Johnson","businessName":"Sarah''s Workspace","avatar":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80","responseTime":"within an hour","joined":"2023"}'::jsonb, 11, false),
('coworking-cbd-collective', 'CBD Collective Desk Space', 'Sydney CBD', 'Sydney CBD', 'Coworking Space', 'A flexible open-plan coworking floor in the CBD, great for small teams and workshops that need extra elbow room after hours.', 26, 14, 4.8, 25, ARRAY['Wi-Fi', 'Whiteboard', 'Video conferencing', 'Kitchen', 'Air conditioning', 'Power outlets']::text[], '{"weekdays":{"start":"18:00","end":"22:00"},"weekends":{"start":"08:00","end":"20:00"}}'::jsonb, ARRAY['https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1524749292158-7540c2494485?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80']::text[], '{"name":"Alicia Wong","businessName":"Collective Sydney","avatar":"https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80","responseTime":"within an hour","joined":"2021"}'::jsonb, 20, false);

-- ---------------------------------------------------------------------------
-- Seed data: two example bookings on Sarah's spaces, so the Owner Dashboard
-- has "Upcoming bookings" to show immediately. Real bookings made through the
-- app get inserted alongside these.
-- ---------------------------------------------------------------------------
insert into public.bookings
  (listing_id, listing_name, location, date, start_time, end_time, guests, hours, subtotal, service_fee, total, reference, host_name)
values
('modern-meeting-room-cbd', 'Modern Meeting Room', 'Sydney CBD', 'Saturday, 22 August', '18:00', '21:00', 3, 3, 75, 7.5, 82.5, 'OFF-2026-1001', 'Sarah''s Workspace'),
('executive-boardroom-barangaroo', 'Executive Boardroom', 'Barangaroo', 'Sunday, 23 August', '10:00', '13:00', 8, 3, 135, 0, 135, 'OFF-2026-1002', 'Sarah''s Workspace');
