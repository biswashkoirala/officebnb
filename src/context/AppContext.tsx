import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
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
  user: User | null;
  authLoading: boolean;
  isLoggedIn: boolean;
  role: 'renter' | 'owner' | null;
  displayName: string | null;
  businessName: string | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
    } catch {
      // ignore persistence errors in demo mode
    }
  }, [favorites]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

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
      user,
      authLoading,
      isLoggedIn: !!user,
      role: (user?.user_metadata?.role as 'renter' | 'owner' | undefined) ?? null,
      displayName: (user?.user_metadata?.name as string | undefined) ?? null,
      businessName: (user?.user_metadata?.businessName as string | undefined) ?? null,
      logout: () => {
        supabase.auth.signOut();
      },
      loginModalOpen,
      openLoginModal: () => setLoginModalOpen(true),
      closeLoginModal: () => setLoginModalOpen(false),
    }),
    [favorites, searchParams, bookingDraft, lastBooking, user, authLoading, loginModalOpen],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
