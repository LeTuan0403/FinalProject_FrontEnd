import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User, ChevronDown, Trash2 } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import { Message } from "../../types/chat";
import ChatBubble from "../chat/ChatBubble";

const ChatWidget = () => {
    const { socket } = useChat();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // 1. Initialize Conversation
    useEffect(() => {
        const initChat = async () => {
            // Check LocalStorage or API
            const savedConvId = localStorage.getItem("chat_conversation_id");
            const senderId = user ? String(user.userId) : (localStorage.getItem("chat_guest_id") || `guest_${Date.now()}`);

            if (!user && !localStorage.getItem("chat_guest_id")) {
                localStorage.setItem("chat_guest_id", senderId);
            }

            if (!savedConvId && isOpen) {
                // If open and no convId, create one
                // Or wait for first message? 
                // Better: Create on first open to show greeting?
                // For now: Fetch existing or create new on OPEN
            } else if (savedConvId) {
                setConversationId(savedConvId);
                // Fetch history
                try {
                    const res = await axios.get(`http://localhost:5000/api/chat/message/${savedConvId}`);
                    setMessages(res.data);
                } catch (e) {
                    console.error("Failed to load messages", e);
                }
            }
        }
        initChat();
    }, [user, isOpen]); // Re-run if user logs in

    // 2. Socket Listeners
    useEffect(() => {
        if (!socket) { return; }

        // Ensure we are in the room if we have a conversationId
        if (conversationId) {
            socket.emit("join_room", conversationId);
        }

        const handleConnect = () => {
            if (conversationId) { socket.emit("join_room", conversationId); }
        };
        socket.on("connect", handleConnect);

        socket.on("receive_message", (data: Message) => {
            setMessages((prev) => [...prev, data]);
        });

        socket.on("conversation_deleted", () => {
            setMessages([]);
            setConversationId(null);
            localStorage.removeItem("chat_conversation_id");
            // Optional: Add a system message?
            // setMessages([{ senderId: 'system', text: 'Cuộc trò chuyện đã kết thúc.', createdAt: new Date().toISOString() }]);
        });

        socket.on("message_deleted", (msgId: string) => {
            setMessages(prev => prev.filter(m => m._id !== msgId));
        });

        return () => {
            socket.off("receive_message");
            socket.off("conversation_deleted");
            socket.off("message_deleted");
        }
    }, [socket, conversationId]);

    // 3. Handle Greeting on First Open
    useEffect(() => {
        if (isOpen && messages.length === 0 && !conversationId) {
            // Fake Greeting
            const greeting: Message = {
                senderId: "admin",
                text: "Xin chào! 👋 Bạn cần hỗ trợ tư vấn tour nào không ạ?",
                createdAt: new Date().toISOString()
            };
            setMessages([greeting]);
        }
    }, [isOpen, messages.length, conversationId]);

    // 4. Send Message
    const handleSend = async () => {
        if (!newMessage.trim()) { return; }

        const senderId = user ? String(user.userId) : localStorage.getItem("chat_guest_id")!;
        let currentConvId = conversationId;

        // If no conversation, create one first
        if (!currentConvId) {
            try {
                const res = await axios.post("http://localhost:5000/api/chat/conversation", {
                    senderId,
                    guestName: user ? user.hoTen : "Khách vãng lai"
                });
                currentConvId = res.data._id;
                setConversationId(currentConvId);
                localStorage.setItem("chat_conversation_id", currentConvId!);

                // Join Room
                if (socket) { socket.emit("join_room", currentConvId); }
            } catch (e) {
                console.error("Create conv failed", e);
                return;
            }
        }

        // Ensure joined room (idempotent)
        if (socket) { socket.emit("join_room", currentConvId); }

        const msgData = {
            conversationId: currentConvId,
            senderId,
            text: newMessage,
            createdAt: new Date().toISOString() // Optimistic
        };

        // Optimistic UI
        // setMessages(prev => [...prev, msgData]); // Wait for server ack/broadcast? 
        // Actually, our backend broadcasts to sender too if using io.in().emit
        // But we used socket.to().emit which excludes sender.
        // So we MUST add manually.
        setMessages(prev => [...prev, msgData]);

        // Save to DB via API (more reliable than socket for persistence)
        try {
            await axios.post("http://localhost:5000/api/chat/message", msgData);
            // Send to Socket for Realtime
            if (socket) { socket.emit("send_message", msgData); }

            setNewMessage("");
        } catch (e) {
            console.error("Send failed", e);
        }
    };

    const handleDeleteChat = async () => {
        if (!conversationId) { return; }
        if (!window.confirm("Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện này?")) { return; }

        try {
            await axios.delete(`http://localhost:5000/api/chat/conversation/${conversationId}`);
            setMessages([]);
            setConversationId(null);
            localStorage.removeItem("chat_conversation_id");
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    if (user?.role === 'Admin') { return null; }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">

            {/* Chat Window */}
            {isOpen && (
                <div className="pointer-events-auto bg-white w-[350px] h-[500px] rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-4 animate-scale-in origin-bottom-right">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 flex justify-between items-center text-white shadow-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <User size={20} className="text-white" />
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-blue-600 rounded-full"></span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Hỗ trợ trực tuyến</h3>
                                <p className="text-xs text-blue-100 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    Thường trả lời ngay
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {conversationId && (
                                <button onClick={handleDeleteChat} className="p-1.5 hover:bg-white/20 rounded-full transition text-blue-100 hover:text-white mr-1" title="Xóa cuộc trò chuyện">
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition">
                                <ChevronDown size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4 scroll-smooth">
                        {messages.map((msg, idx) => {
                            const isMe = msg.senderId !== 'admin';
                            // Admin check: if not me, assume admin
                            return <ChatBubble key={idx} message={msg} isMe={isMe} showAdminAvatar={!isMe} />;
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer Input */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
                        >
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Nhập nội dung tin nhắn..."
                                className="flex-1 bg-transparent px-4 py-2 text-sm outline-none text-gray-700 placeholder-gray-400"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition transform active:scale-95 shadow-sm"
                            >
                                <Send size={16} className={newMessage.trim() ? "ml-0.5" : ""} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto p-4 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center relative group ${isOpen ? 'bg-gray-400 text-white rotate-90' : 'bg-blue-600 text-white'
                    }`}
            >
                {isOpen ? <X size={24} /> : (
                    <>
                        <MessageCircle size={28} className="fill-current" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce-custom"></span>
                    </>
                )}

                {/* Tooltip */}
                {!isOpen && (
                    <div className="absolute right-full mr-4 bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none font-medium text-sm arrow-right">
                        Chat với chúng tôi! 👋
                    </div>
                )}
            </button>
        </div>
    );
};

export default ChatWidget;
