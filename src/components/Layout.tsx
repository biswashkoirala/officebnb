import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import DemoBadge from './DemoBadge';
import LoginModal from './LoginModal';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <DemoBadge />
      <LoginModal />
    </div>
  );
}
