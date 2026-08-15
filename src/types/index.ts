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
  rating: number;
  reviewCount: number;
  amenities: string[];
  availableHours: AvailableHours;
  images: string[];
  host: Host;
  bookingsCount: number;
  featured?: boolean;
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

export interface Booking {
  id: string;
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
}
