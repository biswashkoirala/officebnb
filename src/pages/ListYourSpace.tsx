import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Check, LockKeyhole, PartyPopper } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import PhotoUploader from '../components/PhotoUploader';
import { createListing, fetchListingById, updateListing, type ListingInput } from '../lib/api';
import { useApp } from '../context/AppContext';
import type { SpaceType } from '../types';

const SPACE_TYPES: SpaceType[] = [
  'Meeting Room',
  'Private Office',
  'Boardroom',
  'Training Room',
  'Coworking Space',
  'Event Space',
];

const AMENITY_OPTIONS = [
  'Wi-Fi',
  'Projector',
  'Large display',
  'Whiteboard',
  'Video conferencing',
  'Kitchen',
  'Kitchen access',
  'Parking',
  'Air conditioning',
  'Power outlets',
];

const STEPS = ['Details', 'Amenities', 'Availability', 'Photos', 'Review'];

export default function ListYourSpace() {
  const navigate = useNavigate();
  const { user, isLoggedIn, role, profile, openLoginModal } = useApp();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'missing'>(editId ? 'loading' : 'idle');
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState<SpaceType>('Meeting Room');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(6);
  const [price, setPrice] = useState(25);
  const [amenities, setAmenities] = useState<string[]>(['Wi-Fi']);
  const [weekdayStart, setWeekdayStart] = useState('18:00');
  const [weekdayEnd, setWeekdayEnd] = useState('22:00');
  const [weekendStart, setWeekendStart] = useState('09:00');
  const [weekendEnd, setWeekendEnd] = useState('20:00');
  const [photos, setPhotos] = useState<string[]>([]);

  // Editing an existing listing: load it and pre-fill the form.
  useEffect(() => {
    if (!editId || !user) return;
    let cancelled = false;
    setLoadState('loading');
    fetchListingById(editId)
      .then((l) => {
        if (cancelled) return;
        if (!l || l.ownerId !== user.id) {
          setLoadState('missing');
          return;
        }
        setName(l.name);
        setType(l.type);
        setLocation(l.location);
        setDescription(l.description);
        setCapacity(l.capacity);
        setPrice(l.price);
        setAmenities(l.amenities);
        setWeekdayStart(l.availableHours.weekdays.start);
        setWeekdayEnd(l.availableHours.weekdays.end);
        setWeekendStart(l.availableHours.weekends.start);
        setWeekendEnd(l.availableHours.weekends.end);
        setPhotos(l.images);
        setLoadState('idle');
      })
      .catch(() => !cancelled && setLoadState('missing'));
    return () => {
      cancelled = true;
    };
  }, [editId, user]);

  const canPublishNew = !!profile?.stripeChargesEnabled;

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const canContinue = () => {
    if (step === 0) {
      return (
        name.trim() &&
        location.trim() &&
        description.trim() &&
        price > 0 &&
        price < 10000 &&
        capacity >= 1 &&
        capacity <= 500
      );
    }
    if (step === 2) return weekdayStart < weekdayEnd && weekendStart < weekendEnd;
    if (step === 3) return photos.length > 0 && photos.length <= 10;
    return true;
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (photos.length === 0) {
      setPublishError('Add at least one photo before publishing.');
      return;
    }
    if (!editId && !canPublishNew) {
      setPublishError('Set up payouts on your dashboard before publishing.');
      return;
    }
    setPublishing(true);
    setPublishError('');
    const input: ListingInput = {
      name: name.trim(),
      location: location.trim(),
      type,
      description: description.trim(),
      capacity,
      price,
      amenities,
      availableHours: {
        weekdays: { start: weekdayStart, end: weekdayEnd },
        weekends: { start: weekendStart, end: weekendEnd },
      },
      images: photos,
    };
    try {
      if (editId) await updateListing(editId, input);
      else await createListing(input, user.id);
      setSuccess(true);
    } catch (err) {
      console.error('Failed to publish listing', err);
      setPublishError(
        editId
          ? 'Something went wrong saving your changes. Please try again.'
          : 'Something went wrong publishing your space. Please check your payouts are set up and try again.',
      );
    } finally {
      setPublishing(false);
    }
  };

  if (role !== 'owner') {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink-100">
          <LockKeyhole size={22} className="text-ink-500" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-ink-950">List your space</h1>
        <p className="mt-2 text-ink-500">
          Only space owner accounts can list a space. Log in with an owner account, or sign up as
          one, to continue.
        </p>
        <Button className="mt-6" onClick={openLoginModal}>
          {isLoggedIn ? 'Switch to owner account' : 'Log in'}
        </Button>
      </div>
    );
  }

  if (loadState !== 'idle') {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        {loadState === 'loading' ? (
          <p className="text-sm text-ink-400">Loading your listing…</p>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-ink-950">Listing not found</h1>
            <p className="mt-2 text-ink-500">You can only edit spaces you own.</p>
            <Button className="mt-6" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-ink-950 text-balance">
        {editId ? `Edit ${name || 'your space'}` : 'Turn your unused space into income'}
      </h1>
      <p className="mt-2 text-ink-500">
        {editId
          ? 'Changes apply to new bookings. Existing bookings keep the price and times they were booked at.'
          : 'List in minutes. Set your own hours and price.'}
      </p>

      {!editId && !canPublishNew && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-glow/40 bg-amber-glow/10 p-4 text-sm text-ink-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-glow" />
          <p>
            You can fill this in now, but you'll need to{' '}
            <Link to="/dashboard" className="font-semibold text-brand-600 underline">
              set up payouts
            </Link>{' '}
            before you can publish, so renters' payments can reach your bank account.
          </p>
        </div>
      )}

      {/* Stepper */}
      <div className="mt-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i < step
                    ? 'bg-brand-600 text-white'
                    : i === step
                      ? 'bg-ink-950 text-white'
                      : 'bg-ink-100 text-ink-400'
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`hidden text-[11px] font-medium sm:block ${i <= step ? 'text-ink-800' : 'text-ink-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 rounded ${i < step ? 'bg-brand-600' : 'bg-ink-100'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handlePublish} className="mt-10 rounded-2xl border border-ink-100 bg-white p-6 sm:p-8">
        {step === 0 && (
          <div className="space-y-5">
            <Input
              label="Space name"
              placeholder="e.g. Modern Meeting Room"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              required
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Space type</label>
              <div className="flex flex-wrap gap-2">
                {SPACE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                      type === t ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:border-ink-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Location"
              placeholder="e.g. Sydney CBD"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={120}
              required
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={4000}
                placeholder="Describe your space, what it's great for, and what makes it special..."
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Capacity"
                type="number"
                min={1}
                max={500}
                value={capacity}
                onChange={(e) => setCapacity(Math.min(500, Math.max(1, Number(e.target.value))))}
              />
              <Input
                label="Price per hour (AUD)"
                type="number"
                min={5}
                max={9999}
                value={price}
                onChange={(e) => setPrice(Math.min(9999, Math.max(0, Number(e.target.value))))}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-display text-lg font-bold text-ink-950">Amenities</h2>
            <p className="mt-1 text-sm text-ink-500">Select everything your space offers.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AMENITY_OPTIONS.map((a) => (
                <label
                  key={a}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium transition-colors ${
                    amenities.includes(a) ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:border-ink-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={amenities.includes(a)}
                    onChange={() => toggleAmenity(a)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-lg font-bold text-ink-950">Availability</h2>
            <p className="mt-1 text-sm text-ink-500">
              Choose the hours your space is free to rent (Sydney time). Renters can book in half-hour steps within
              these hours.
            </p>
            {!(weekdayStart < weekdayEnd && weekendStart < weekendEnd) && (
              <p className="mt-2 text-sm font-medium text-red-600">Each end time must be after its start time.</p>
            )}

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-semibold text-ink-800">Weekdays</p>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <Input label="Start time" type="time" value={weekdayStart} onChange={(e) => setWeekdayStart(e.target.value)} />
                  <Input label="End time" type="time" value={weekdayEnd} onChange={(e) => setWeekdayEnd(e.target.value)} />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-800">Weekends</p>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <Input label="Start time" type="time" value={weekendStart} onChange={(e) => setWeekendStart(e.target.value)} />
                  <Input label="End time" type="time" value={weekendEnd} onChange={(e) => setWeekendEnd(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-lg font-bold text-ink-950">Add photos</h2>
            <p className="mt-1 text-sm text-ink-500">Upload a few photos that show off your space.</p>
            <div className="mt-5">
              {user && <PhotoUploader ownerId={user.id} value={photos} onChange={setPhotos} />}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-display text-lg font-bold text-ink-950">Review your listing</h2>
            <div className="mt-5 space-y-3 rounded-xl bg-ink-50 p-5 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Name</span><span className="font-medium text-ink-900">{name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Type</span><span className="font-medium text-ink-900">{type}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Location</span><span className="font-medium text-ink-900">{location || '—'}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Capacity</span><span className="font-medium text-ink-900">{capacity} people</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Price</span><span className="font-medium text-ink-900">${price}/hour</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Amenities</span><span className="max-w-[60%] text-right font-medium text-ink-900">{amenities.join(', ') || '—'}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Weekday hours</span><span className="font-medium text-ink-900">{weekdayStart} – {weekdayEnd}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Weekend hours</span><span className="font-medium text-ink-900">{weekendStart} – {weekendEnd}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Photos</span><span className="font-medium text-ink-900">{photos.length} selected</span></div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-ink-100 pt-6">
          <Button type="button" variant="ghost" onClick={handleBack} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} disabled={!canContinue()}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={publishing || (!editId && !canPublishNew)}>
              {publishing ? 'Saving…' : editId ? 'Save changes' : 'Publish your space'}
            </Button>
          )}
        </div>
        {publishError && <p className="mt-3 text-right text-sm font-medium text-red-600">{publishError}</p>}
      </form>

      <Modal open={success} onClose={() => setSuccess(false)} maxWidth="max-w-sm">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
            <PartyPopper size={30} className="text-brand-600" />
          </div>
          <h2 className="mt-5 font-display text-xl font-bold text-ink-950">
            {editId ? 'Changes saved' : 'Your space is live!'}
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            {editId
              ? 'Your listing has been updated.'
              : 'You can now earn from hours that would otherwise remain unused.'}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button fullWidth onClick={() => navigate('/dashboard')}>
              Go to dashboard
            </Button>
            <Button fullWidth variant="ghost" onClick={() => navigate('/explore')}>
              Explore other spaces
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
