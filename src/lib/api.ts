import { supabase } from './supabaseClient';
import type { AvailableHours, Booking, Host, Listing, SpaceType } from '../types';

interface ListingRow {
  id: string;
  name: string;
  location: string;
  suburb: string;
  type: SpaceType;
  description: string;
  price: number;
  capacity: number;
  rating: number;
  review_count: number;
  amenities: string[];
  available_hours: AvailableHours;
  images: string[];
  host: Host;
  bookings_count: number;
  featured: boolean;
  owner_id: string | null;
}

interface BookingRow {
  id: string;
  listing_id: string;
  listing_name: string;
  location: string;
  date: string;
  start_time: string;
  end_time: string;
  guests: number;
  hours: number;
  subtotal: number;
  service_fee: number;
  total: number;
  reference: string;
  host_name: string;
  created_at: string;
  user_id: string | null;
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
    rating: Number(row.rating),
    reviewCount: row.review_count,
    amenities: row.amenities,
    availableHours: row.available_hours,
    images: row.images,
    host: row.host,
    bookingsCount: row.bookings_count,
    featured: row.featured,
  };
}

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    listingId: row.listing_id,
    listingName: row.listing_name,
    location: row.location,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    guests: row.guests,
    hours: Number(row.hours),
    subtotal: Number(row.subtotal),
    serviceFee: Number(row.service_fee),
    total: Number(row.total),
    reference: row.reference,
    hostName: row.host_name,
  };
}

export async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ListingRow[]).map(mapListing);
}

export async function fetchListingById(id: string): Promise<Listing | null> {
  const { data, error } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapListing(data as ListingRow) : null;
}

export interface NewListingInput {
  name: string;
  location: string;
  type: SpaceType;
  description: string;
  capacity: number;
  price: number;
  amenities: string[];
  availableHours: AvailableHours;
  images: string[];
  ownerId: string;
  host: Host;
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base || 'space'}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createListing(input: NewListingInput): Promise<Listing> {
  const row = {
    id: slugify(input.name),
    name: input.name,
    location: input.location,
    suburb: input.location,
    type: input.type,
    description: input.description,
    price: input.price,
    capacity: input.capacity,
    rating: 5,
    review_count: 0,
    amenities: input.amenities,
    available_hours: input.availableHours,
    images: input.images.length
      ? input.images
      : ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'],
    host: input.host,
    bookings_count: 0,
    featured: false,
    owner_id: input.ownerId,
  };
  const { data, error } = await supabase.from('listings').insert(row).select().single();
  if (error) throw error;
  return mapListing(data as ListingRow);
}

export interface NewBookingInput {
  listingId: string;
  listingName: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
  hours: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  reference: string;
  hostName: string;
  userId: string;
}

export async function createBooking(input: NewBookingInput): Promise<Booking> {
  const row = {
    listing_id: input.listingId,
    listing_name: input.listingName,
    location: input.location,
    date: input.date,
    start_time: input.startTime,
    end_time: input.endTime,
    guests: input.guests,
    hours: input.hours,
    subtotal: input.subtotal,
    service_fee: input.serviceFee,
    total: input.total,
    reference: input.reference,
    host_name: input.hostName,
    user_id: input.userId,
  };
  const { data, error } = await supabase.from('bookings').insert(row).select().single();
  if (error) throw error;
  return mapBooking(data as BookingRow);
}

export async function fetchBookingsForListingIds(listingIds: string[]): Promise<Booking[]> {
  if (listingIds.length === 0) return [];
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .in('listing_id', listingIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as BookingRow[]).map(mapBooking);
}

export async function fetchBookingsByUserId(userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as BookingRow[]).map(mapBooking);
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
