import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Building2 size={18} strokeWidth={2.25} />
              </span>
              <span className="font-display text-lg font-bold text-ink-950">Officebnb</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              Turn empty office hours into income.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-ink-900">For renters</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link to="/explore" className="hover:text-ink-900">Explore spaces</Link></li>
              <li><Link to="/explore" className="hover:text-ink-900">Meeting rooms</Link></li>
              <li><Link to="/explore" className="hover:text-ink-900">Boardrooms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-ink-900">For owners</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link to="/list-your-space" className="hover:text-ink-900">List your space</Link></li>
              <li><Link to="/dashboard" className="hover:text-ink-900">Owner dashboard</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-ink-900">How it works</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-ink-900">Officebnb</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link to="/#why" className="hover:text-ink-900">Why Officebnb</Link></li>
              <li><a href="#" className="hover:text-ink-900" onClick={(e) => e.preventDefault()}>Careers</a></li>
              <li><a href="#" className="hover:text-ink-900" onClick={(e) => e.preventDefault()}>Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-6 text-xs text-ink-400 sm:flex-row">
          <p>© 2026 Officebnb. A hackathon demo project — not a real company.</p>
          <p>Built for demo purposes only.</p>
        </div>
      </div>
    </footer>
  );
}
