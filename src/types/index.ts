export type SpaceType =
  | 'Meeting Room'
  | 'Private Office'
  | 'Boardroom'
  | 'Training Room'
  | 'Coworking Space'
  | 'Event Space';

export interface Host {
  name: string;
  businessName: string;
  avatar: string;
  responseTime: string;
  joined: string;
}

export interface AvailableHours {
  weekdays: { start: string; end: string };
  weekends: { start: string; end: string };
}

export interface Listing {
  id: string;
  name: string;
  location: string;
  suburb: string;
  type: SpaceType;
  description: string;
  price: number;
  capacity: number;
  /** null until the space has real reviews — shown as "New". */
  rating: number | null;
  reviewCount: number;
  amenities: string[];
  availableHours: AvailableHours;
  images: string[];
  host: Host;
  bookingsCount: number;
  featured?: boolean;
  archived: boolean;
  ownerId: string | null;
}

export interface SearchParams {
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
}

export interface FilterState {
  priceMax: number;
  types: SpaceType[];
  minCapacity: number;
  amenities: string[];
  availableNow: boolean;
  eveningAvailability: boolean;
  weekendAvailability: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'failed' | 'expired' | 'cancelled' | 'disputed';

export interface Booking {
  id: string;
  listingId: string;
  listingName: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  /** Start as an absolute instant (Sydney time converted to UTC). */
  startsAt: string | null;
  guests: number;
  hours: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  /** What the space owner receives for this booking. */
  hostPayout: number;
  refundAmount: number;
  status: BookingStatus;
  reference: string;
  hostName: string;
  renterName: string | null;
  cancelledBy: 'renter' | 'owner' | 'admin' | 'system' | null;
  cancellationReason: string | null;
}
