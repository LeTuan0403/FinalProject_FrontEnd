import { useState } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useNotification } from '../../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from '../../../components/NotificationDropdown';

const AdminHeader = ({ onMenuClick }: { onMenuClick?: () => void }) => {
    const { user, logout } = useAuth();
    const { counts } = useNotification();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const notifications = [
        { id: 'bookings', label: 'đơn đặt tour mới', count: counts.bookings, path: '/admin/bookings', color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'lastMinute', label: 'tour đang ở trạng thái giờ chót', count: counts.lastMinute, path: '/admin/tours', color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'contacts', label: 'liên hệ mới', count: counts.contacts, path: '/admin/contacts', color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'reviews', label: 'đánh giá chưa trả lời', count: counts.reviews, path: '/admin/reviews', color: 'text-yellow-600', bg: 'bg-yellow-50' },
        { id: 'tours', label: 'tour cần duyệt', count: counts.tours, path: '/admin/tours', color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'messages', label: 'tin nhắn mới', count: counts.messages, path: '/admin/chat', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ].filter(n => n.count > 0);

    return (
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                    <Menu size={20} />
                </button>
            </div>

            <div className="flex items-center gap-4">
                {/* Combined Notifications */}
                <NotificationDropdown
                    extraCount={counts.total}
                    extraSection={
                        notifications.length > 0 ? (
                            <div>
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Cần xử lý
                                </div>
                                {notifications.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => navigate(item.path)}
                                        className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${item.color.replace('text', 'bg')}`}></div>
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition">
                                                {item.label}
                                            </span>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.bg} ${item.color}`}>
                                            {item.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : null
                    }
                />

                {/* Vertical Divider */}
                <div className="h-6 w-px bg-gray-200"></div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-lg transition"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {user?.hoTen?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <span className="text-sm font-medium text-gray-700 hidden md:inline">{user?.hoTen || 'Admin'}</span>
                    </button>

                    {isProfileOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-40 animate-fade-in origin-top-right">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 text-sm font-medium transition"
                                >
                                    <LogOut size={16} /> Đăng xuất
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
