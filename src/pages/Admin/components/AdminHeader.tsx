import { useState } from 'react';
import { Bell, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useNotification } from '../../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const AdminHeader = ({ onMenuClick }: { onMenuClick?: () => void }) => {
    const { user, logout } = useAuth();
    const { counts } = useNotification();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const notifications = [
        { id: 'bookings', label: 'đơn đặt tour mới', count: counts.bookings, path: '/admin/bookings', color: 'text-blue-600', bg: 'bg-blue-50' },
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
                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="p-2 hover:bg-gray-100 rounded-full transition relative"
                    >
                        <Bell size={20} className="text-gray-600" />
                        {counts.total > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsNotifOpen(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-40 animate-fade-in origin-top-right">
                                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800">Thông báo</h3>
                                    {counts.total > 0 && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">{counts.total} mới</span>}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    navigate(item.path);
                                                    setIsNotifOpen(false);
                                                }}
                                                className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition flex items-start gap-3"
                                            >
                                                <div className={`w-2 h-2 mt-2 rounded-full ${item.color.replace('text', 'bg')}`}></div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        Bạn có <span className={`font-bold ${item.color}`}>{item.count}</span> {item.label}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">Nhấn để xem chi tiết</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 text-sm">
                                            Không có thông báo mới
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

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
