import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FloatingContact from './common/FloatingContact';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        <Outlet />
      </main>
      <Footer />
      <Footer />
      <FloatingContact />
    </div>
  );
};

export default Layout;
