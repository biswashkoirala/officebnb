import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, MapPin, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTime } from '../lib/utils';
import Button from '../components/Button';

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const { lastBooking } = useApp();

  if (!lastBooking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-950">No recent booking</h1>
        <p className="mt-2 text-ink-500">Book a space to see your confirmation here.</p>
        <Button className="mt-6" onClick={() => navigate('/explore')}>
          Explore spaces
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
          <CheckCircle2 size={44} className="text-brand-600" strokeWidth={1.75} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-ink-950">You're booked!</h1>
        <p className="mt-2 text-ink-500">Your workspace is confirmed.</p>
      </div>

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-ink-100 pb-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold text-ink-950">{lastBooking.listingName}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
              <MapPin size={14} /> {lastBooking.location}
            </p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
            Confirmed
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <Calendar size={16} className="text-ink-400" /> {lastBooking.date}
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <Clock size={16} className="text-ink-400" />
            {formatTime(lastBooking.startTime)} – {formatTime(lastBooking.endTime)}
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <Users size={16} className="text-ink-400" /> {lastBooking.guests} guests
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
          <span className="text-sm font-medium text-ink-600">Booking reference</span>
          <span className="font-mono text-sm font-semibold text-ink-950">{lastBooking.reference}</span>
        </div>

        <div className="mt-6 border-t border-ink-100 pt-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-500">
            Your host
          </h3>
          <p className="mt-2 font-display font-semibold text-ink-950">{lastBooking.hostName}</p>
          <p className="mt-1 text-sm text-ink-500">
            Your access instructions will be available before your booking.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button fullWidth size="lg" onClick={() => navigate('/dashboard')}>
          View booking
        </Button>
        <Button fullWidth size="lg" variant="outline" onClick={() => navigate('/explore')}>
          Back to explore
        </Button>
      </div>
    </div>
  );
}
