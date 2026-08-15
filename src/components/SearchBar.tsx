import { useState, type FormEvent } from 'react';
import { Calendar, Clock, MapPin, Search, Users } from 'lucide-react';
import type { SearchParams } from '../types';
import Button from './Button';

interface SearchBarProps {
  initial: SearchParams;
  onSearch: (params: SearchParams) => void;
  variant?: 'hero' | 'compact';
}

const TIME_OPTIONS = Array.from({ length: 32 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const label = `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  return { value, label };
});

export default function SearchBar({ initial, onSearch, variant = 'hero' }: SearchBarProps) {
  const [location, setLocation] = useState(initial.location);
  const [date, setDate] = useState(initial.date);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [guests, setGuests] = useState(initial.guests);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch({ location, date, startTime, endTime, guests });
  };

  const isHero = variant === 'hero';

  return (
    <form
      onSubmit={handleSubmit}
      className={`grid gap-3 rounded-2xl border border-ink-100 bg-white p-3 shadow-pop ${
        isHero
          ? 'sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_0.85fr_0.85fr_0.85fr_auto] lg:items-end lg:p-4'
          : 'sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.7fr_auto] lg:items-end lg:p-3 shadow-card'
      }`}
    >
      <div>
        <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <MapPin size={12} /> Location
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Sydney CBD"
          className="w-full rounded-lg border border-transparent bg-ink-50 px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <Calendar size={12} /> Date
        </label>
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="Saturday, 22 August"
          className="w-full rounded-lg border border-transparent bg-ink-50 px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <Clock size={12} /> Start
        </label>
        <select
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full rounded-lg border border-transparent bg-ink-50 px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
        >
          {TIME_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <Clock size={12} /> End
        </label>
        <select
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full rounded-lg border border-transparent bg-ink-50 px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
        >
          {TIME_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <Users size={12} /> Guests
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={guests}
          onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
          className="w-full rounded-lg border border-transparent bg-ink-50 px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <Button type="submit" size={isHero ? 'lg' : 'md'} className="w-full lg:w-auto">
        <Search size={16} />
        {isHero ? 'Find a space' : 'Search'}
      </Button>
    </form>
  );
}
