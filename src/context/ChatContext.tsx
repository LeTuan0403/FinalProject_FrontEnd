/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, ReactNode } from "react";
import io, { Socket } from "socket.io-client";
// import { useAuth } from "../hooks/useAuth";

interface ChatContextType {
    socket: Socket | null;
}

const ChatContext = createContext<ChatContextType>({ socket: null });

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    // const { user } = useAuth();

    // Singleton socket instance
    const socket = io("http://localhost:5000", {
        autoConnect: false
    });

    useEffect(() => {
        // When component mounts, connect
        socket.connect();

        return () => {
            socket.disconnect();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ChatContext.Provider value={{ socket }}>
            {children}
        </ChatContext.Provider>
    );
};
