import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Building2, Menu, X } from 'lucide-react';
import Button from './Button';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isLoggedIn, openLoginModal } = useApp();
  const navigate = useNavigate();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors hover:text-ink-950 ${isActive ? 'text-ink-950' : 'text-ink-600'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Building2 size={18} strokeWidth={2.25} />
          </span>
          <span className="font-display text-lg font-bold text-ink-950">Officebnb</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <NavLink to="/explore" className={linkClass}>
            Explore
          </NavLink>
          <NavLink to="/#how-it-works" className={linkClass}>
            How it works
          </NavLink>
          <NavLink to="/list-your-space" className={linkClass}>
            List your space
          </NavLink>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isLoggedIn ? (
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={openLoginModal}>
              Log in
            </Button>
          )}
          <Button variant="dark" size="sm" onClick={() => navigate('/explore')}>
            Get started
          </Button>
        </div>

        <button
          className="rounded-lg p-2 text-ink-700 hover:bg-ink-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-paper px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <NavLink to="/explore" className={linkClass} onClick={() => setOpen(false)}>
              Explore
            </NavLink>
            <NavLink to="/#how-it-works" className={linkClass} onClick={() => setOpen(false)}>
              How it works
            </NavLink>
            <NavLink to="/list-your-space" className={linkClass} onClick={() => setOpen(false)}>
              List your space
            </NavLink>
            <div className="mt-2 flex flex-col gap-2 border-t border-ink-100 pt-3">
              {isLoggedIn ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigate('/dashboard');
                    setOpen(false);
                  }}
                >
                  Dashboard
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    openLoginModal();
                    setOpen(false);
                  }}
                >
                  Log in
                </Button>
              )}
              <Button
                variant="dark"
                size="sm"
                onClick={() => {
                  navigate('/explore');
                  setOpen(false);
                }}
              >
                Get started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
