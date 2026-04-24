/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

// Reuse ChatContext socket if available, or just rely on API for v1. 
// Given ChatContext is global, we can use it.
import { useChat } from "./ChatContext";

interface NotificationCounts {
    bookings: number;
    tours: number;
    lastMinute: number;
    contacts: number;
    reviews: number;
    messages: number;
    posts: number;
    total: number;
}

interface NotificationContextType {
    counts: NotificationCounts;
    refreshCounts: () => void;
}

const defaultCounts: NotificationCounts = {
    bookings: 0,
    tours: 0,
    lastMinute: 0, // Default 0
    contacts: 0,
    reviews: 0,
    messages: 0,
    posts: 0,
    total: 0
};

const NotificationContext = createContext<NotificationContextType>({
    counts: defaultCounts,
    refreshCounts: () => { }
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { socket } = useChat();
    const [counts, setCounts] = useState<NotificationCounts>(defaultCounts);

    const fetchCounts = async () => {
        try {
            const apiUrl = ((import.meta as unknown as { env: { VITE_API_URL: string } }).env.VITE_API_URL || 'http://localhost:5000/api').trim();
            const res = await axios.get(`${apiUrl}/admin/notifications/counts`);
            if (res.data.success) {
                setCounts(res.data.counts);
            }
        } catch (e) {
            console.error("Failed to fetch notification counts", e);
        }
    };

    useEffect(() => {
        fetchCounts();

        // Polling interaction (every 60s as backup)
        const interval = setInterval(fetchCounts, 60000);

        return () => clearInterval(interval);
    }, []);

    // Socket Listener
    useEffect(() => {
        if (!socket) { return; }

        const handleNotification = (data: { message?: string, type?: string } | null | undefined) => {
            // Show toast if there's a message
            if (data && data.message) {
                toast(data.message, {
                    icon: data.type === 'post' ? '📝' : data.type === 'message' ? '💬' : '🔔',
                    duration: 4000,
                    style: {
                        background: '#3b82f6',
                        color: '#fff',
                        fontWeight: 'bold',
                    }
                });
            }

            if (data) { fetchCounts(); }
        };

        socket.on("admin_notification", handleNotification);

        return () => {
            socket.off("admin_notification", handleNotification);
        };
    }, [socket]);

    return (
        <NotificationContext.Provider value={{ counts, refreshCounts: fetchCounts }}>
            {children}
        </NotificationContext.Provider>
    );
};
