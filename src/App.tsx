import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Client/Home';
import Tours from './pages/Client/Tours';
import TourDetail from './pages/Client/TourDetail';
import Booking from './pages/Client/Booking';
import CustomTour from './pages/Client/CustomTour';
import Gallery from './pages/Client/Gallery';
import Contact from './pages/Client/Contact';
import MyTours from './pages/Client/MyTours';
import MyBookings from './pages/Client/MyBookings';
import MyFavorites from './pages/Client/MyFavorites';
import Profile from './pages/Client/Profile';
import PaymentPage from './pages/Client/PaymentPage';
import BookingSuccess from './pages/Client/BookingSuccess';
import ComparePage from './pages/Client/ComparePage';

import AuthPage from './pages/Auth/AuthPage';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import VerifyAccount from './pages/Auth/VerifyAccount';

import Dashboard from './pages/Admin/pages/Dashboard';
import TourManagement from './pages/Admin/pages/TourManagement';
import BookingManagement from './pages/Admin/pages/BookingManagement';
import AdminEditTour from './pages/Admin/pages/EditTour';

import { useAuth } from './hooks/useAuth';

import UserManagement from './pages/Admin/pages/UserManagement';
import LocationManagement from './pages/Admin/pages/LocationManagement';
import ContactManagement from './pages/Admin/pages/ContactManagement';
import Settings from './pages/Admin/pages/Settings';
import AdminReviews from './pages/Admin/pages/AdminReviews';
import AdminChat from './pages/Admin/pages/AdminChat';

import { ComparisonProvider } from './context/ComparisonContext';
import ComparisonFloatingBar from './components/common/ComparisonFloatingBar';
import ChatWidget from './components/common/ChatWidget';
import AdminLayout from './pages/Admin/components/AdminLayout';
import { NotificationProvider } from './context/NotificationContext';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {return <div>Loading...</div>;}
  if (!user || user.role !== 'Admin') {return <div>Bạn không có quyền truy cập trang này</div>;}
  return children;
};

function App() {
  return (
    <ComparisonProvider>
      <Routes>
        {/* Client Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="tours" element={<Tours />} />
          <Route path="tours/:id" element={<TourDetail />} />
          <Route path="booking/:id" element={<Booking />} />
          <Route path="payment/:bookingId" element={<PaymentPage />} />
          <Route path="booking-success/:bookingId" element={<BookingSuccess />} />
          <Route path="custom-tour" element={<CustomTour />} />
          <Route path="my-tours" element={<MyTours />} />
          <Route path="my-bookings" element={<MyBookings />} />
          <Route path="my-favorites" element={<MyFavorites />} />
          <Route path="profile" element={<Profile />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="contact" element={<Contact />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="login" element={<AuthPage />} />
          <Route path="register" element={<AuthPage />} />
          <Route path="verify-account" element={<VerifyAccount />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        {/* Root Redirect removed - Handled by index route in Client Routes */}

        {/* Auth Routes Removed from here */}

        {/* Admin Routes - Flattened, no Layout wrapper */}
        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <NotificationProvider>
              <AdminLayout />
            </NotificationProvider>
          </AdminRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="tours" element={<TourManagement />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="locations" element={<LocationManagement />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="contacts" element={<ContactManagement />} />
          <Route path="chat" element={<AdminChat />} />
          <Route path="settings" element={<Settings />} />

          <Route path="tours/create" element={<AdminEditTour />} />
          <Route path="tours/edit/:id" element={<AdminEditTour />} />
        </Route>

      </Routes>
      <ComparisonFloatingBar />
      <ChatWidget />
    </ComparisonProvider>
  );
}

export default App;