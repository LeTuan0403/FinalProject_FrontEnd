/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

interface ChatContextType {
    socket: Socket | null;
    isChatOpen: boolean;
    toggleChat: (isOpen: boolean) => void;
}

const ChatContext = createContext<ChatContextType>({
    socket: null,
    isChatOpen: false,
    toggleChat: () => { }
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Singleton socket instance
    // We use useMemo to keep the SAME socket object reference, 
    // but we will manage its connection state in useEffect.
    // Actually, 'io' returns a socket manager. 
    // If we want to truly clear session, disconnect/connect is enough.
    // We use useMemo to ensure we keep the SAME socket instance across renders
    const socket = useMemo(() => io("http://localhost:5000", {
        autoConnect: false
    }), []);

    useEffect(() => {
        // When component mounts OR user changes, we ensure connection
        // But if user logs out, we want to cycle the connection to clear Backend state
        if (socket.connected) {
            socket.disconnect();
        }

        socket.connect();

        // If logged in, we might want to emit "add_user" here if backend requires it manually
        // But backend usually uses socket.id or waits for specific event.
        if (user) {
            socket.emit("add_user", user.userId);
        }

        return () => {
            socket.disconnect();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.userId]); // Dependency on userId mainly

    return (
        <ChatContext.Provider value={{ socket, isChatOpen, toggleChat: setIsChatOpen }}>
            {children}

        </ChatContext.Provider>
    );
};
