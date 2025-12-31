import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Menu, X, Map, Phone } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [extraMenuOpen, setExtraMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md relative z-50">
      {/* Top Info Bar */}
      <div className="bg-blue-900 text-white py-2">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span className="font-bold text-sm md:text-base">Hotline: <span className="text-yellow-400 text-lg">1900 1234</span></span>
            <span className="hidden md:inline text-xs opacity-80">▼</span>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4 text-sm font-medium">

            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative">
                  <div
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 cursor-pointer hover:text-yellow-200 transition select-none"
                  >
                    <User size={18} />
                    <span>{user.hoTen}</span>
                  </div>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white text-gray-800 rounded-xl shadow-xl py-2 z-50 animate-fade-in border border-gray-100 overflow-hidden">
                        <button onClick={handleLogout} className="block w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-medium">Đăng xuất</button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-1 hover:text-yellow-200 transition">
                    <User size={18} />
                    <span>Đăng nhập</span>
                  </Link>
                  <span className="opacity-50">/</span>
                  <Link to="/register" className="hover:text-yellow-200 transition">
                    <span>Đăng ký</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center shrink-0 gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Map className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-blue-900 text-2xl font-black tracking-tight leading-none">TravelBooking</span>
                <span className="text-sm text-blue-600 font-medium tracking-widest uppercase">Khám phá thế giới</span>
              </div>
            </Link>

            <nav className="hidden lg:flex gap-6 items-center uppercase font-bold text-sm text-gray-700">
              <Link to="/" className="hover:text-blue-600 transition text-blue-600">TRANG CHỦ</Link>
              <Link to="/tours" className="hover:text-blue-600 transition">DANH SÁCH TOUR</Link>
              <Link to="/custom-tour" className="hover:text-blue-600 transition">TỰ THIẾT KẾ</Link>
              <Link to="/gallery" className="hover:text-blue-600 transition">HÌNH ẢNH</Link>
              <Link to="/contact" className="hover:text-blue-600 transition">LIÊN HỆ</Link>
              {user?.role === 'Admin' && (
                <Link to="/admin" className="text-orange-500 hover:text-orange-600 transition">ADMIN</Link>
              )}
              {/* Extra Menu Button (Hamburger) - Keeping as is */}
              <div className="relative">
                <button
                  onClick={() => setExtraMenuOpen(!extraMenuOpen)}
                  className="hover:text-blue-600 flex items-center"
                >
                  <Menu size={24} />
                </button>
                {extraMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setExtraMenuOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                      <div className="p-2">
                        {user ? (
                          <>
                            <Link to="/profile" className="block px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium">Hồ sơ cá nhân</Link>
                            <Link to="/my-tours" className="block px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium">Tour của tôi</Link>
                            <Link to="/my-favorites" className="block px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium">Danh sách yêu thích</Link>
                            <Link to="/my-bookings" className="block px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium">Đơn đặt của tôi</Link>
                          </>
                        ) : (
                          <div className="px-4 py-2 text-gray-500 text-xs italic">Vui lòng đăng nhập</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-gray-800 hover:bg-gray-100 p-2 rounded transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 py-2 shadow-lg absolute w-full left-0 z-40">
          <Link to="/" className="block px-4 py-3 hover:bg-gray-50 font-bold text-sm text-gray-800 border-b border-gray-100">TRANG CHỦ</Link>
          <Link to="/tours" className="block px-4 py-3 hover:bg-gray-50 font-bold text-sm text-gray-800 border-b border-gray-100">DANH SÁCH TOUR</Link>
          <Link to="/custom-tour" className="block px-4 py-3 hover:bg-gray-50 font-bold text-sm text-gray-800 border-b border-gray-100">TỰ THIẾT KẾ</Link>
          <Link to="/gallery" className="block px-4 py-3 hover:bg-gray-50 font-bold text-sm text-gray-800 border-b border-gray-100">HÌNH ẢNH</Link>
          <Link to="/contact" className="block px-4 py-3 hover:bg-gray-50 font-bold text-sm text-gray-800 border-b border-gray-100">LIÊN HỆ</Link>
          {user && (
            <>
              <Link to="/profile" className="block px-4 py-3 hover:bg-gray-50 font-bold text-sm text-blue-600 border-b border-gray-100">HỒ SƠ CÁ NHÂN</Link>
              <Link to="/my-tours" className="block px-4 py-3 hover:bg-gray-50 font-bold text-sm text-blue-600 border-b border-gray-100">TOUR CỦA TÔI</Link>
              <Link to="/my-favorites" className="block px-4 py-3 hover:bg-gray-50 font-bold text-sm text-blue-600 border-b border-gray-100">DANH SÁCH YÊU THÍCH</Link>
              <Link to="/my-bookings" className="block px-4 py-3 hover:bg-gray-50 font-bold text-sm text-blue-600 border-b border-gray-100">ĐƠN ĐẶT CỦA TÔI</Link>
            </>
          )}
          {user?.role === 'Admin' && (
            <Link to="/admin" className="block px-4 py-3 hover:bg-gray-50 font-bold text-sm text-orange-600 border-b border-gray-100">ADMIN</Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
