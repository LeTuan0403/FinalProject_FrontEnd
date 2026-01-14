import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Mail, Star, MapPin, MessageCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { margin: false, id: '', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { margin: false, id: 'chat', label: 'Tin nhắn CSKH', icon: <MessageCircle size={20} /> }, // Added Link
        { margin: false, id: 'tours', label: 'Quản lý Tour', icon: <Calendar size={20} /> },
        { margin: false, id: 'locations', label: 'Quản lý Địa điểm', icon: <MapPin size={20} /> },
        { margin: false, id: 'bookings', label: 'Đơn đặt tour', icon: <Users size={20} /> },
        { margin: false, id: 'users', label: 'Quản lý Người dùng', icon: <Users size={20} /> },
        { margin: false, id: 'reviews', label: 'Đánh giá', icon: <Star size={20} /> },
        { margin: false, id: 'contacts', label: 'Liên hệ', icon: <Mail size={20} /> },
        { margin: true, id: 'settings', label: 'Cài đặt', icon: <Settings size={20} /> },
    ];

    return (
        <div className="w-64 bg-white shadow-lg z-10 flex flex-col fixed inset-y-0 left-0">
            <div className="p-6 border-b">
                <h2 className="text-2xl font-black text-blue-900 uppercase">Admin</h2>
            </div>
            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.id}
                        to={`/admin/${item.id}`}
                        end={item.id === ''}
                        className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${item.margin ? 'mt-8' : ''
                            } ${isActive
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                            }`}
                    >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t space-y-2">
                <button
                    onClick={() => navigate('/')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition font-bold"
                >
                    <LogOut size={20} className="rotate-180" />
                    <span>Về trang chủ</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition font-bold"
                >
                    <LogOut size={20} />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
