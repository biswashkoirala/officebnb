import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Building2, CalendarCheck, LayoutDashboard, LogOut, Menu, User, X } from 'lucide-react';
import Button from './Button';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn, openLoginModal, logout } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!accountOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [accountOpen]);

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
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((v) => !v)}
                aria-label="Account menu"
                aria-expanded={accountOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
              >
                <User size={17} strokeWidth={2.25} />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-ink-100 bg-white py-1.5 shadow-lg shadow-ink-950/5">
                  <button
                    onClick={() => {
                      navigate('/my-bookings');
                      setAccountOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <CalendarCheck size={16} />
                    Your bookings
                  </button>
                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setAccountOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setAccountOpen(false);
                      navigate('/');
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              )}
            </div>
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
                <>
                  <div className="flex items-center gap-2 px-1 py-1 text-sm font-medium text-ink-950">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white">
                      <User size={14} strokeWidth={2.25} />
                    </span>
                    Your account
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigate('/my-bookings');
                      setOpen(false);
                    }}
                  >
                    Your bookings
                  </Button>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      logout();
                      setOpen(false);
                      navigate('/');
                    }}
                  >
                    Log out
                  </Button>
                </>
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
