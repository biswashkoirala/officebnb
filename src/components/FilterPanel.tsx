import type { FilterState, SpaceType } from '../types';

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const SPACE_TYPES: SpaceType[] = [
  'Meeting Room',
  'Private Office',
  'Boardroom',
  'Training Room',
  'Coworking Space',
  'Event Space',
];

const AMENITIES = [
  'Wi-Fi',
  'Projector',
  'Whiteboard',
  'Video conferencing',
  'Kitchen',
  'Parking',
  'Air conditioning',
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between py-1.5"
    >
      <span className="text-sm text-ink-700">{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-ink-200'}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </span>
    </button>
  );
}

export default function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const toggleType = (type: SpaceType) => {
    const types = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onChange({ ...filters, types });
  };

  const toggleAmenity = (amenity: string) => {
    const amenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity];
    onChange({ ...filters, amenities });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-ink-950">Filters</h3>
        <button onClick={onReset} className="text-xs font-medium text-brand-600 hover:underline">
          Reset all
        </button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-ink-800">Max price</span>
          <span className="text-sm font-semibold text-ink-950">${filters.priceMax}/hr</span>
        </div>
        <input
          type="range"
          min={15}
          max={60}
          step={5}
          value={filters.priceMax}
          onChange={(e) => onChange({ ...filters, priceMax: Number(e.target.value) })}
          className="w-full accent-brand-600"
        />
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-ink-800">Space type</span>
        <div className="flex flex-wrap gap-2">
          {SPACE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filters.types.includes(type)
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-ink-200 text-ink-600 hover:border-ink-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-ink-800">Min capacity</span>
          <span className="text-sm font-semibold text-ink-950">{filters.minCapacity}+ people</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          step={1}
          value={filters.minCapacity}
          onChange={(e) => onChange({ ...filters, minCapacity: Number(e.target.value) })}
          className="w-full accent-brand-600"
        />
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-ink-800">Amenities</span>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => (
            <button
              key={amenity}
              onClick={() => toggleAmenity(amenity)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filters.amenities.includes(amenity)
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-ink-200 text-ink-600 hover:border-ink-400'
              }`}
            >
              {amenity}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1 border-t border-ink-100 pt-4">
        <Toggle
          checked={filters.availableNow}
          onChange={(v) => onChange({ ...filters, availableNow: v })}
          label="Available now"
        />
        <Toggle
          checked={filters.eveningAvailability}
          onChange={(v) => onChange({ ...filters, eveningAvailability: v })}
          label="Evening availability"
        />
        <Toggle
          checked={filters.weekendAvailability}
          onChange={(v) => onChange({ ...filters, weekendAvailability: v })}
          label="Weekend availability"
        />
      </div>
    </div>
  );
}
