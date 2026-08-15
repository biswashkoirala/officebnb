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
import ListYourSpace from './pages/ListYourSpace';

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
            <Route path="/list-your-space" element={<ListYourSpace />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
