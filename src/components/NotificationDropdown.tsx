import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '../context/ChatContext';

const API_URL = ((import.meta as unknown as { env: { VITE_API_URL: string } }).env.VITE_API_URL || 'http://localhost:5000/api').trim() + '/notifications';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

interface NotificationDropdownProps {
    extraSection?: React.ReactNode;
    extraCount?: number;
}

const NotificationDropdown = ({ extraSection, extraCount = 0 }: NotificationDropdownProps) => {
    const { user } = useAuth();
    const { socket, toggleChat } = useChat();
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        if (!user) { return; }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setNotifications(res.data.notifications);
                setUnreadCount(res.data.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]); // Removed Interval, using Socket instead

    // Socket Listener
    useEffect(() => {
        if (!socket || !user) { return; }

        // Join room logic should ideally be in ChatContext or here
        // ChatContext emits "add_user" (maps socket.id to userId globally)
        // BUT we need to join a specific ROOM to receive targeted messages easily.
        // Let's emit a join_room event for consistency with plans.
        // Join room logic
        socket.emit('join_room', `user_${user.userId}`);

        const handleNewNotification = (newNotif: Notification) => {
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Optional: Play a sound
            // const audio = new Audio('/notification.mp3');
            // audio.play();
        };

        socket.on('user_notification', handleNewNotification);

        return () => {
            socket.off('user_notification', handleNewNotification);
        };
    }, [socket, user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close dropdown when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }
        setIsOpen(false);

        // If in admin dashboard, prioritize navigation
        if (location.pathname.startsWith('/admin') && notification.link) {
            navigate(notification.link);
            return;
        }

        if (notification.type === 'HISTORY_DELETED' || notification.type === 'MESSAGE') {
            toggleChat(true);
            return;
        }

        if (notification.link) {
            navigate(notification.link);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const deleteNotification = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent triggering click on notification item
        if (!confirm('Bạn có chắc muốn xóa thông báo này?')) { return; }
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setNotifications(prev => prev.filter(n => n._id !== id));
            // If it was unread, decrease count
            const wasUnread = notifications.find(n => n._id === id && !n.isRead);
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    if (!user) { return null; }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 bg-white text-gray-700 hover:text-blue-600 transition-all rounded-full shadow-md hover:shadow-lg border border-gray-100 active:scale-95"
            >
                <Bell size={22} />
                {(unreadCount + extraCount) > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full border-2 border-white shadow-sm">
                        {(unreadCount + extraCount) > 99 ? '99+' : (unreadCount + extraCount)}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in-down">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-700">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline">
                                Đánh dấu đã đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {extraSection && (
                            <div className="border-b border-gray-100 bg-gray-50/30">
                                {extraSection}
                            </div>
                        )}
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm py-8">
                                Không có thông báo nào
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition relative ${!notification.isRead ? 'bg-blue-50' : ''} cursor-pointer group`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <h4 className={`text-sm ${!notification.isRead ? 'font-bold text-blue-800' : 'font-semibold text-gray-700'}`}>
                                                {notification.title}
                                            </h4>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-2">
                                                {new Date(notification.createdAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0"></div>
                                        )}
                                        <button
                                            onClick={(e) => deleteNotification(e, notification._id)}
                                            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Xóa thông báo"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
