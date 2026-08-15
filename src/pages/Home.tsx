import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Coins,
  Compass,
  DoorOpen,
  Landmark,
  MapPinned,
  Search as SearchIcon,
  Wallet,
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ListingCard from '../components/ListingCard';
import Button from '../components/Button';
import { listings } from '../data/listings';
import { useApp } from '../context/AppContext';
import type { SearchParams } from '../types';

const RENTER_STEPS = [
  { icon: SearchIcon, title: 'Find', description: 'Discover professional spaces near you.' },
  { icon: Compass, title: 'Book', description: 'Choose the hours you need.' },
  { icon: DoorOpen, title: 'Work', description: 'Arrive and get things done.' },
];

const OWNER_STEPS = [
  { icon: Building2, title: 'List', description: 'Add your unused office space.' },
  { icon: MapPinned, title: 'Set availability', description: 'Choose evenings and weekends.' },
  { icon: Wallet, title: 'Earn', description: 'Make money from space that would otherwise sit empty.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { searchParams, setSearchParams } = useApp();
  const featured = listings.filter((l) => l.featured).slice(0, 6);
  const popular = featured.length >= 6 ? featured : listings.slice(0, 6);

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    navigate('/explore');
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1800&q=70"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/85 to-ink-950" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-brand-200 backdrop-blur">
              <Coins size={13} /> A new way to use commercial space
            </span>
            <h1 className="mt-5 text-balance font-display text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
              Turn empty office hours into income.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-balance text-base text-ink-200 sm:text-lg">
              Book professional office space by the hour — or monetize the space you're not using.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-5xl">
            <SearchBar initial={searchParams} onSearch={handleSearch} variant="hero" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-20 bg-paper py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-3xl font-bold text-ink-950 sm:text-4xl">
              How Officebnb works
            </h2>
            <p className="mt-3 text-ink-500">One marketplace, two sides of the same empty room.</p>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-8">
            <div>
              <h3 className="text-center font-display text-sm font-bold uppercase tracking-wide text-brand-600 lg:text-left">
                For renters
              </h3>
              <div className="mt-6 space-y-6">
                {RENTER_STEPS.map((step, i) => (
                  <div key={step.title} className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <step.icon size={20} />
                    </div>
                    <div>
                      <p className="font-display text-base font-semibold text-ink-950">
                        {i + 1}. {step.title}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-center font-display text-sm font-bold uppercase tracking-wide text-amber-glow lg:text-left">
                For owners
              </h3>
              <div className="mt-6 space-y-6">
                {OWNER_STEPS.map((step, i) => (
                  <div key={step.title} className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-glow/15 text-amber-glow">
                      <step.icon size={20} />
                    </div>
                    <div>
                      <p className="font-display text-base font-semibold text-ink-950">
                        {i + 1}. {step.title}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR SPACES */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-3xl font-bold text-ink-950 sm:text-4xl">
                Popular spaces near you
              </h2>
              <p className="mt-2 text-ink-500">Handpicked rooms ready for your next booking.</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/explore')}>
              View all spaces <ArrowRight size={16} />
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      {/* OWNER CTA */}
      <section className="bg-ink-950 py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <Landmark className="mx-auto text-brand-400" size={32} />
          <h2 className="mt-4 text-balance font-display text-3xl font-bold text-white sm:text-4xl">
            Your office is empty tonight. Why not earn from it?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-ink-300">
            List your unused meeting room, boardroom, or studio and start earning from hours that
            would otherwise go to waste.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-7"
            onClick={() => navigate('/list-your-space')}
          >
            List your space <ArrowRight size={16} />
          </Button>
        </div>
      </section>

      {/* WHY OFFICEBNB */}
      <section id="why" className="scroll-mt-20 bg-paper py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-3xl font-bold text-ink-950 sm:text-4xl">
              Why Officebnb?
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Wallet size={18} />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-950">
                For businesses
              </h3>
              <p className="mt-1.5 text-sm text-ink-500">Monetize unused office hours.</p>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-glow/15 text-amber-glow">
                <SearchIcon size={18} />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-950">
                For renters
              </h3>
              <p className="mt-1.5 text-sm text-ink-500">Pay only for the hours you need.</p>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
                <Landmark size={18} />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-950">For cities</h3>
              <p className="mt-1.5 text-sm text-ink-500">
                Make better use of existing commercial space.
              </p>
            </div>
          </div>

          {/* Visual flow */}
          <div className="mt-12 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              {[
                { label: 'Unused office', icon: Building2 },
                { label: 'Officebnb', icon: Compass },
                { label: 'New customer', icon: SearchIcon },
                { label: 'Extra income', icon: Coins },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-2 sm:items-start">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <step.icon size={20} />
                    </div>
                    <span className="text-sm font-semibold text-ink-800">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight className="hidden shrink-0 text-ink-300 sm:block" size={20} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Economics */}
          <div className="mt-6 grid gap-6 rounded-2xl border border-brand-100 bg-brand-50 p-6 sm:grid-cols-3 sm:p-8">
            <div>
              <p className="font-display text-2xl font-bold text-ink-950">$75</p>
              <p className="mt-1 text-sm text-ink-600">Average booking value</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-ink-950">10%</p>
              <p className="mt-1 text-sm text-ink-600">Officebnb service fee</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-ink-950">$1,500</p>
              <p className="mt-1 text-sm text-ink-600">Monthly GMV from 20 bookings on one room</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
