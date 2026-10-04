import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import Explore from './pages/Explore';
import SpaceDetails from './pages/SpaceDetails';
import Booking from './pages/Booking';
import BookingConfirmation from './pages/BookingConfirmation';
import Dashboard from './pages/Dashboard';
import MyBookings from './pages/MyBookings';
import ListYourSpace from './pages/ListYourSpace';
import NotFound from './pages/NotFound';
import { CancellationPolicyPage, ContactPage, PrivacyPage, TermsPage } from './pages/Legal';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/space/:id" element={<SpaceDetails />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/confirmation" element={<BookingConfirmation />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/list-your-space" element={<ListYourSpace />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
