import { useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import ListingCard from '../components/ListingCard';
import Button from '../components/Button';
import { listings } from '../data/listings';
import { useApp } from '../context/AppContext';
import type { FilterState } from '../types';

const DEFAULT_FILTERS: FilterState = {
  priceMax: 60,
  types: [],
  minCapacity: 1,
  amenities: [],
  availableNow: false,
  eveningAvailability: false,
  weekendAvailability: false,
};

function isAvailableNow(availableHours: { weekdays: { start: string; end: string }; weekends: { start: string; end: string } }) {
  const now = new Date();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  const window = isWeekend ? availableHours.weekends : availableHours.weekdays;
  const current = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = window.start.split(':').map(Number);
  const [eh, em] = window.end.split(':').map(Number);
  return current >= sh * 60 + sm && current <= eh * 60 + em;
}

export default function Explore() {
  const { searchParams, setSearchParams } = useApp();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const locationQuery = searchParams.location.trim().toLowerCase();
    const effectiveMinCapacity = Math.max(filters.minCapacity, searchParams.guests || 1);

    return listings.filter((listing) => {
      if (locationQuery && !listing.location.toLowerCase().includes(locationQuery)) return false;
      if (listing.price > filters.priceMax) return false;
      if (listing.capacity < effectiveMinCapacity) return false;
      if (filters.types.length && !filters.types.includes(listing.type)) return false;
      if (filters.amenities.length && !filters.amenities.every((a) => listing.amenities.includes(a)))
        return false;
      if (filters.availableNow && !isAvailableNow(listing.availableHours)) return false;
      if (filters.eveningAvailability && listing.availableHours.weekdays.start > '18:30') return false;
      if (filters.weekendAvailability && listing.availableHours.weekends.start > '09:00') return false;
      return true;
    });
  }, [filters, searchParams]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink-950">Find your perfect workspace</h1>
        <p className="mt-1 text-ink-500">{filtered.length} spaces available for your search.</p>
      </div>

      <SearchBar initial={searchParams} onSearch={setSearchParams} variant="compact" />

      <div className="mt-6 flex items-center justify-between lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setMobileFiltersOpen(true)}>
          <SlidersHorizontal size={15} /> Filters
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
            <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
          </div>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white py-24 text-center">
              <p className="font-display text-lg font-semibold text-ink-900">No spaces match your filters</p>
              <p className="mt-1 text-sm text-ink-500">Try widening your search or resetting filters.</p>
              <Button variant="outline" className="mt-4" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-white p-5 shadow-pop">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink-950">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100"
              >
                <X size={18} />
              </button>
            </div>
            <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
            <Button fullWidth className="mt-6" onClick={() => setMobileFiltersOpen(false)}>
              Show {filtered.length} spaces
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
