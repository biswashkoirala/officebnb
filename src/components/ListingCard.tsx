import { useNavigate } from 'react-router-dom';
import { Heart, Star, Users } from 'lucide-react';
import type { Listing } from '../types';
import { useApp } from '../context/AppContext';
import ListingImage from './ListingImage';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useApp();
  const favorited = isFavorite(listing.id);

  return (
    <article
      onClick={() => navigate(`/space/${listing.id}`)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ListingImage
          src={listing.images[0]}
          alt={listing.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(listing.id);
          }}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-sm backdrop-blur transition-transform hover:scale-110"
        >
          <Heart size={16} className={favorited ? 'fill-brand-600 text-brand-600' : ''} />
        </button>
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink-800 shadow-sm backdrop-blur">
          {listing.type}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[15px] font-semibold leading-snug text-ink-950">
            {listing.name}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-ink-800">
            <Star size={13} className="fill-amber-glow text-amber-glow" />
            {listing.rating}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-ink-500">{listing.location}</p>

        <div className="mt-2.5 flex items-center gap-1 text-xs text-ink-500">
          <Users size={13} />
          {listing.capacity} people
        </div>

        <p className="mt-2 truncate text-xs text-ink-400">
          {listing.amenities.slice(0, 3).join(' · ')}
        </p>

        <div className="mt-3 flex items-baseline gap-1 border-t border-ink-100 pt-3">
          <span className="font-display text-base font-bold text-ink-950">${listing.price}</span>
          <span className="text-sm text-ink-500">/hour</span>
        </div>
      </div>
    </article>
  );
}
