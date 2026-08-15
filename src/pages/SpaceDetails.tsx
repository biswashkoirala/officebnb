import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Heart, MapPin, Share2, Star, Users } from 'lucide-react';
import { getListingById } from '../data/listings';
import { useApp } from '../context/AppContext';
import AmenityList from '../components/AmenityList';
import BookingCard from '../components/BookingCard';
import ListingImage from '../components/ListingImage';
import Button from '../components/Button';
import { formatTime } from '../lib/utils';

export default function SpaceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const listing = id ? getListingById(id) : undefined;
  const { isFavorite, toggleFavorite } = useApp();
  const [activeImage, setActiveImage] = useState(0);

  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-950">Space not found</h1>
        <p className="mt-2 text-ink-500">This listing may have been removed.</p>
        <Button className="mt-6" onClick={() => navigate('/explore')}>
          Back to Explore
        </Button>
      </div>
    );
  }

  const favorited = isFavorite(listing.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        to="/explore"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ChevronLeft size={16} /> Back to search
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-950 sm:text-3xl">{listing.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {listing.location}
            </span>
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-amber-glow text-amber-glow" />
              {listing.rating} · {listing.reviewCount} reviews
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} /> Up to {listing.capacity} people
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
            <Share2 size={15} /> Share
          </Button>
          <Button variant="outline" size="sm" onClick={() => toggleFavorite(listing.id)}>
            <Heart size={15} className={favorited ? 'fill-brand-600 text-brand-600' : ''} />
            {favorited ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Gallery */}
      <div className="mt-5 grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:h-[420px]">
        <div className="col-span-4 row-span-2 sm:col-span-2">
          <ListingImage
            src={listing.images[activeImage]}
            alt={listing.name}
            className="h-64 w-full object-cover sm:h-full"
          />
        </div>
        {listing.images.slice(0, 2).map((img, i) => (
          <button
            key={img + i}
            onClick={() => setActiveImage(i)}
            className="hidden sm:block sm:col-span-2"
          >
            <ListingImage src={img} alt={`${listing.name} ${i + 2}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-xl font-bold text-ink-950">About this space</h2>
            <p className="mt-3 leading-relaxed text-ink-600">{listing.description}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink-950">Amenities</h2>
            <div className="mt-4">
              <AmenityList amenities={listing.amenities} />
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink-950">Capacity</h2>
            <p className="mt-3 flex items-center gap-2 text-ink-600">
              <Users size={16} /> Up to {listing.capacity} people
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink-950">Available hours</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-ink-100 bg-white p-4">
                <p className="text-sm font-semibold text-ink-800">Monday – Friday</p>
                <p className="mt-1 text-sm text-ink-500">
                  {formatTime(listing.availableHours.weekdays.start)} – {formatTime(listing.availableHours.weekdays.end)}
                </p>
              </div>
              <div className="rounded-xl border border-ink-100 bg-white p-4">
                <p className="text-sm font-semibold text-ink-800">Saturday – Sunday</p>
                <p className="mt-1 text-sm text-ink-500">
                  {formatTime(listing.availableHours.weekends.start)} – {formatTime(listing.availableHours.weekends.end)}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink-950">Hosted by</h2>
            <div className="mt-4 flex items-center gap-4 rounded-xl border border-ink-100 bg-white p-4">
              <ListingImage
                src={listing.host.avatar}
                alt={listing.host.businessName}
                className="h-14 w-14 rounded-full object-cover"
              />
              <div>
                <p className="font-display font-semibold text-ink-950">{listing.host.businessName}</p>
                <p className="text-sm text-ink-500">
                  Hosted by {listing.host.name} · Responds {listing.host.responseTime}
                </p>
                <p className="text-xs text-ink-400">Member since {listing.host.joined}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <BookingCard listing={listing} />
        </div>
      </div>
    </div>
  );
}
