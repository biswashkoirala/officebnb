import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, PartyPopper } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { createListing } from '../lib/api';
import type { SpaceType } from '../types';

const SPACE_TYPES: SpaceType[] = [
  'Meeting Room',
  'Private Office',
  'Boardroom',
  'Training Room',
  'Coworking Space',
  'Event Space',
];

const AMENITY_OPTIONS = ['Wi-Fi', 'Projector', 'Whiteboard', 'Video conferencing', 'Kitchen', 'Parking', 'Air conditioning'];

const PHOTO_OPTIONS = [
  'photo-1497366216548-37526070297c',
  'photo-1524758631624-e2822e304c36',
  'photo-1568992687947-868a62a9f521',
  'photo-1560264280-88b68371db39',
  'photo-1522071820081-009f0129c71c',
  'photo-1531973576160-7125cd663d86',
].map((id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=60`);

const STEPS = ['Details', 'Amenities', 'Availability', 'Photos', 'Review'];

export default function ListYourSpace() {
  const navigate = useNavigate();
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

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const togglePhoto = (url: string) =>
    setPhotos((prev) => (prev.includes(url) ? prev.filter((x) => x !== url) : [...prev, url]));

  const canContinue = () => {
    if (step === 0) return name.trim() && location.trim() && description.trim();
    return true;
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    setPublishError('');
    try {
      await createListing({
        name,
        location,
        type,
        description,
        capacity,
        price,
        amenities,
        availableHours: {
          weekdays: { start: weekdayStart, end: weekdayEnd },
          weekends: { start: weekendStart, end: weekendEnd },
        },
        images: photos,
      });
      setSuccess(true);
    } catch (err) {
      console.error('Failed to publish listing', err);
      setPublishError('Something went wrong publishing your space. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-ink-950 text-balance">
        Turn your unused space into income
      </h1>
      <p className="mt-2 text-ink-500">List in minutes. Set your own hours and price.</p>

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
            <Input label="Space name" placeholder="e.g. Modern Meeting Room" value={name} onChange={(e) => setName(e.target.value)} required />

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

            <Input label="Location" placeholder="e.g. Sydney CBD" value={location} onChange={(e) => setLocation(e.target.value)} required />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
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
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
              <Input
                label="Price per hour ($)"
                type="number"
                min={5}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
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
            <p className="mt-1 text-sm text-ink-500">Choose the hours your space is free to rent.</p>

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
            <p className="mt-1 text-sm text-ink-500">Pick a few photos that show off your space.</p>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {PHOTO_OPTIONS.map((url) => (
                <button
                  type="button"
                  key={url}
                  onClick={() => togglePhoto(url)}
                  className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
                    photos.includes(url) ? 'border-brand-600' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="Space option" className="h-full w-full object-cover" />
                  {photos.includes(url) && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-200 text-ink-400 hover:border-ink-400 hover:text-ink-600">
                <Camera size={20} />
                <span className="text-xs font-medium">Upload</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={() => {}} />
              </label>
            </div>
            <p className="mt-3 text-xs text-ink-400">{photos.length} photo{photos.length === 1 ? '' : 's'} selected</p>
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
            <Button type="submit" disabled={publishing}>
              {publishing ? 'Publishing…' : 'Publish your space'}
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
          <h2 className="mt-5 font-display text-xl font-bold text-ink-950">Your space is live!</h2>
          <p className="mt-2 text-sm text-ink-500">
            You can now earn from hours that would otherwise remain unused.
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
