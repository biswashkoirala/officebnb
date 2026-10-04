import { supabase } from './supabaseClient';
import type { AvailableHours, Booking, BookingStatus, Host, Listing, SpaceType } from '../types';

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  role: 'renter' | 'owner';
  name: string;
  businessName: string | null;
  /** Owner has started Stripe onboarding. */
  hasStripeAccount: boolean;
  /** Stripe will accept payments for this owner — required to publish. */
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  stripeDetailsSubmitted: boolean;
}

interface ProfileRow {
  id: string;
  role: 'renter' | 'owner';
  name: string;
  business_name: string | null;
  stripe_account_id?: string | null;
  stripe_charges_enabled?: boolean;
  stripe_payouts_enabled?: boolean;
  stripe_details_submitted?: boolean;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    businessName: row.business_name,
    hasStripeAccount: !!row.stripe_account_id,
    stripeChargesEnabled: !!row.stripe_charges_enabled,
    stripePayoutsEnabled: !!row.stripe_payouts_enabled,
    stripeDetailsSubmitted: !!row.stripe_details_submitted,
  };
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as ProfileRow) : null;
}

export interface NewProfileInput {
  id: string;
  role: 'renter' | 'owner';
  name: string;
  businessName: string | null;
}

export async function createProfile(input: NewProfileInput): Promise<Profile> {
  const row = { id: input.id, role: input.role, name: input.name, business_name: input.businessName };
  const { data, error } = await supabase.from('profiles').insert(row).select().single();
  if (error) throw error;
  return mapProfile(data as ProfileRow);
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

interface ListingRow {
  id: string;
  name: string;
  location: string;
  suburb: string;
  type: SpaceType;
  description: string;
  price: number;
  capacity: number;
  rating: number | null;
  review_count: number;
  amenities: string[];
  available_hours: AvailableHours;
  images: string[];
  host: Host;
  bookings_count: number;
  featured: boolean;
  archived: boolean;
  owner_id: string | null;
}

function mapListing(row: ListingRow): Listing {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    suburb: row.suburb,
    type: row.type,
    description: row.description,
    price: Number(row.price),
    capacity: row.capacity,
    rating: row.rating == null ? null : Number(row.rating),
    reviewCount: row.review_count,
    amenities: row.amenities,
    availableHours: row.available_hours,
    images: row.images,
    host: row.host,
    bookingsCount: row.bookings_count,
    featured: row.featured,
    archived: !!row.archived,
    ownerId: row.owner_id,
  };
}

/** Public marketplace listings (never archived ones, even the viewer's own). */
export async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('archived', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ListingRow[]).map(mapListing);
}

export async function fetchListingById(id: string): Promise<Listing | null> {
  const { data, error } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapListing(data as ListingRow) : null;
}

export async function fetchListingsByOwnerId(ownerId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as ListingRow[]).map(mapListing);
}

/** The fields an owner controls. Host card, rating etc. are set by the server. */
export interface ListingInput {
  name: string;
  location: string;
  type: SpaceType;
  description: string;
  capacity: number;
  price: number;
  amenities: string[];
  availableHours: AvailableHours;
  images: string[];
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
  return `${base || 'space'}-${crypto.randomUUID().slice(0, 8)}`;
}

function toListingColumns(input: ListingInput) {
  return {
    name: input.name,
    location: input.location,
    type: input.type,
    description: input.description,
    price: input.price,
    capacity: input.capacity,
    amenities: input.amenities,
    available_hours: input.availableHours,
    images: input.images,
  };
}

export async function createListing(input: ListingInput, ownerId: string): Promise<Listing> {
  const row = { id: slugify(input.name), owner_id: ownerId, ...toListingColumns(input) };
  const { data, error } = await supabase.from('listings').insert(row).select().single();
  if (error) throw error;
  return mapListing(data as ListingRow);
}

export async function updateListing(id: string, input: ListingInput): Promise<Listing> {
  const { data, error } = await supabase.from('listings').update(toListingColumns(input)).eq('id', id).select().single();
  if (error) throw error;
  return mapListing(data as ListingRow);
}

/** Hides a listing from the marketplace (or restores it). Bookings are kept. */
export async function setListingArchived(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase.from('listings').update({ archived }).eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

interface BookingRow {
  id: string;
  listing_id: string;
  listing_name: string;
  location: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  starts_at: string | null;
  guests: number;
  hours: number;
  subtotal: number;
  service_fee: number;
  total: number;
  host_payout: number;
  refund_amount: number;
  status: BookingStatus;
  reference: string;
  host_name: string;
  renter_name: string | null;
  cancelled_by: Booking['cancelledBy'];
  cancellation_reason: string | null;
}

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    listingId: row.listing_id,
    listingName: row.listing_name,
    location: row.location,
    date: row.booking_date,
    // Postgres returns "18:00:00"; the app works in "18:00".
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    startsAt: row.starts_at,
    guests: row.guests,
    hours: Number(row.hours),
    subtotal: Number(row.subtotal),
    serviceFee: Number(row.service_fee),
    total: Number(row.total),
    hostPayout: Number(row.host_payout),
    refundAmount: Number(row.refund_amount),
    status: row.status,
    reference: row.reference,
    hostName: row.host_name,
    renterName: row.renter_name,
    cancelledBy: row.cancelled_by,
    cancellationReason: row.cancellation_reason,
  };
}

export async function fetchBookingById(id: string): Promise<Booking | null> {
  const { data, error } = await supabase.from('bookings').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapBooking(data as BookingRow) : null;
}

/** Bookings on spaces the given user owns. */
export async function fetchBookingsForOwner(ownerId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('owner_id', ownerId)
    .in('status', ['confirmed', 'cancelled', 'disputed'])
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return (data as BookingRow[]).map(mapBooking);
}

export async function fetchBookingsByUserId(userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return (data as BookingRow[]).map(mapBooking);
}

// ---------------------------------------------------------------------------
// Edge Functions (anything involving money runs server-side)
// ---------------------------------------------------------------------------

async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) {
    // FunctionsHttpError's `context` is the raw Response — the friendly
    // { error: string } message the function returned lives in its body.
    const context = (error as { context?: Response }).context;
    let message: string | null = null;
    if (context) {
      try {
        const payload = await context.clone().json();
        message = typeof payload?.error === 'string' ? payload.error : null;
      } catch {
        message = null;
      }
    }
    throw message ? new Error(message) : error;
  }
  if (!data) throw new Error(`No response from ${name}`);
  return data;
}

export interface CreatePaymentIntentInput {
  listingId: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
}

export interface CreatePaymentIntentResult {
  clientSecret: string;
  bookingId: string;
  holdMinutes: number;
}

// Booking rows are never inserted directly by the client — the server
// re-derives the price, holds the slot, and creates the Stripe
// PaymentIntent. The booking only becomes `confirmed` once the
// stripe-webhook function sees the payment succeed.
export function createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
  return invoke('create-payment-intent', { ...input });
}

export function cancelBooking(bookingId: string, reason?: string): Promise<{ refundAmount: number }> {
  return invoke('cancel-booking', { bookingId, reason });
}

export interface PayoutStatus {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

/** Stripe-hosted onboarding page where owners add their ABN and bank account. */
export async function startPayoutOnboarding(): Promise<string> {
  const { url } = await invoke<{ url: string }>('stripe-connect', { action: 'onboard' });
  return url;
}

export function refreshPayoutStatus(): Promise<PayoutStatus> {
  return invoke('stripe-connect', { action: 'refresh' });
}

export async function openPayoutDashboard(): Promise<string> {
  const { url } = await invoke<{ url: string }>('stripe-connect', { action: 'dashboard' });
  return url;
}
