import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Booking, SearchParams } from '../types';

interface BookingDraft {
  listingId: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
}

interface AppContextValue {
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  bookingDraft: BookingDraft | null;
  setBookingDraft: (draft: BookingDraft) => void;
  lastBooking: Booking | null;
  setLastBooking: (booking: Booking) => void;
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const FAVORITES_KEY = 'officebnb:favorites';

const defaultSearchParams: SearchParams = {
  location: 'Sydney CBD',
  date: 'Saturday, 22 August',
  startTime: '18:00',
  endTime: '21:00',
  guests: 3,
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [searchParams, setSearchParams] = useState<SearchParams>(defaultSearchParams);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
    } catch {
      // ignore persistence errors in demo mode
    }
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const value = useMemo<AppContextValue>(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite: (id: string) => favorites.has(id),
      searchParams,
      setSearchParams,
      bookingDraft,
      setBookingDraft,
      lastBooking,
      setLastBooking,
      isLoggedIn,
      login: () => {
        setIsLoggedIn(true);
        setLoginModalOpen(false);
      },
      logout: () => setIsLoggedIn(false),
      loginModalOpen,
      openLoginModal: () => setLoginModalOpen(true),
      closeLoginModal: () => setLoginModalOpen(false),
    }),
    [favorites, searchParams, bookingDraft, lastBooking, isLoggedIn, loginModalOpen],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
