import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/**
 * Main layout component that wraps all application pages.
 *
 * Provides:
 * - Sticky top navigation bar
 * - Content area via React Router's <Outlet />
 * - Professional footer
 *
 * This layout is used for all routes defined in App.jsx.
 */
const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Navigation */}
      <Navbar />

      {/* Main Content Area — renders the matched child route */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
