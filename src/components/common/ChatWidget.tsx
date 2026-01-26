import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Phone, Facebook } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import { Message, TourShort } from "../../types/chat";
import ChatWindow from "../chat/ChatWindow";
import { calculateDuration } from "../../utils/tourUtils";
import type { Tour } from "../../types";
import ZaloIcon from "../icons/ZaloIcon";

const ChatWidget = () => {
    const { socket } = useChat();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isRead, setIsRead] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const CONTACT_OPTIONS = [
        {
            label: 'Zalo',
            icon: <ZaloIcon className="w-5 h-5" />,
            color: 'bg-blue-600',
            href: 'https://zalo.me/0967087527',
            delay: 'delay-100'
        },
        {
            label: 'Facebook',
            icon: <Facebook size={20} />,
            color: 'bg-blue-800',
            href: 'https://www.facebook.com/le.tuan.10681/',
            delay: 'delay-200'
        },
        {
            label: 'Hotline',
            icon: <Phone size={20} />,
            color: 'bg-red-500',
            href: 'tel:0967087527',
            delay: 'delay-300'
        }
    ];

    // Unified User ID strategy (Hoisted)
    const currentUserId = user ? String(user.userId) : (localStorage.getItem("chat_guest_id") || `guest_${Date.now()}`);

    const QUICK_REPLIES = [
        "Giá tour bao nhiêu?",
        "Lịch khởi hành gần nhất?",
        "Chính sách hoàn tiền?"
    ];

    // Auto-scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [messages, isOpen]);

    // Ensure guest ID is saved if generated on render
    useEffect(() => {
        if (!user && !localStorage.getItem("chat_guest_id")) {
            localStorage.setItem("chat_guest_id", currentUserId);
        }
    }, [user, currentUserId]);

    // 1. Initialize Conversation
    useEffect(() => {
        const initChat = async () => {
            let savedConvId = localStorage.getItem("chat_conversation_id");

            // If logged in, prioritize fetching from API
            if (user) {
                try {
                    const res = await axios.get(`http://localhost:5000/api/chat/conversation/${user.userId}`);
                    if (res.data && res.data._id) {
                        savedConvId = res.data._id;
                        localStorage.setItem("chat_conversation_id", savedConvId!);
                    }
                } catch (e) {
                    // It's okay, maybe first time chatting
                }
            }

            if (!savedConvId) {
                // Reset if no saved ID (e.g. after logout)
                if (conversationId) {
                    setConversationId(null);
                    setMessages([]);
                }
            } else if (savedConvId && savedConvId !== conversationId) {
                setConversationId(savedConvId);
                // Fetch history
                try {
                    const res = await axios.get(`http://localhost:5000/api/chat/message/${savedConvId}`);
                    setMessages(res.data);
                    // Calculate unread count (from Admin and NOT read)
                    const unread = res.data.filter((m: Message) => m.senderId === 'admin' && !m.isRead).length;
                    setUnreadCount(unread);
                } catch (e) {
                    // Ignore error
                }
            }
        };
        initChat();
    }, [user, isOpen, conversationId]); // Re-run if user logs in/out

    // 2. Socket Listeners
    useEffect(() => {
        if (!socket) { return; }

        // Emit presence
        if (currentUserId) {
            socket.emit("add_user", currentUserId);
        }

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
            if (!isOpen) {
                setUnreadCount(prev => prev + 1);
            }
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

        // Typing Indicators
        socket.on("typing", () => {
            setIsTyping(true);
            scrollToBottom();
        });

        socket.on("stop_typing", () => {
            setIsTyping(false);
        });

        // Read Receipts
        socket.on("message_read", () => {
            setIsRead(true);
        });

        return () => {
            socket.off("receive_message");
            socket.off("conversation_deleted");
            socket.off("message_deleted");
            socket.off("typing");
            socket.off("stop_typing");
            socket.off("message_read");
        };
    }, [socket, conversationId, currentUserId, isOpen]);

    // Handle Input Change for Typing
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (socket && conversationId) {
            socket.emit("typing", conversationId);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stop_typing", conversationId);
            }, 2000);
        }
    };

    // Mark read when opening chat or receiving message
    useEffect(() => {
        if (isOpen && conversationId && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];

            // If last message is from admin, we should mark it as read (API + Socket)
            if (lastMsg.senderId === 'admin') {
                // 1. Emit socket for realtime UI update on Admin side
                if (socket) { socket.emit("mark_read", conversationId); }

                // 2. Persist to DB so it doesn't show as unread next time
                axios.put(`http://localhost:5000/api/chat/conversation/read/${conversationId}`, { role: 'user' })
                    .catch(() => {
                        // Ignore error
                    });
            }
        }
    }, [isOpen, messages, conversationId, socket]);

    const ensureConversation = useCallback(async (senderId: string) => {
        const res = await axios.post("http://localhost:5000/api/chat/conversation", {
            senderId,
            guestName: user ? user.hoTen : "Khách vãng lai"
        });
        return res.data._id;
    }, [user]);

    const shareTour = useCallback(async (tour: Tour) => {
        setIsOpen(true);
        const senderId = user ? String(user.userId) : (localStorage.getItem("chat_guest_id") || `guest_${Date.now()}`);
        let currentConvId = conversationId;

        // 1. Ensure Conversation Exists
        if (!currentConvId) {
            try {
                const newConvId = await ensureConversation(senderId);
                if (!newConvId) {
                    return;
                }
                currentConvId = newConvId;
                setConversationId(currentConvId);
                localStorage.setItem("chat_conversation_id", currentConvId as string);
                if (socket) {
                    socket.emit("join_room", currentConvId);
                }
            } catch (e) {
                console.error("Create conv failed", e);
                return;
            }
        }

        if (socket) {
            socket.emit("join_room", currentConvId);
        }

        // 2. Prepare Tour Message Data
        const tourShort: TourShort = {
            _id: tour._id || "",
            tourId: tour.tourId,
            tenTour: tour.tenTour,
            tongGiaDuKien: tour.tongGiaDuKien,
            hinhAnhBia: tour.hinhAnhBia || "",
            thoiGian: calculateDuration(tour)
        };

        const msgId1 = new Date().toISOString() + "_1";
        const msgId2 = new Date().toISOString() + "_2";

        const msgDataTextUI = {
            _id: msgId1,
            conversationId: currentConvId!,
            senderId,
            text: "Chào bạn, mình quan tâm đến tour này, nhờ bạn tư vấn giúp mình nhé!",
            type: 'text' as const,
            createdAt: new Date().toISOString()
        };

        const msgDataTextAPI = {
            conversationId: currentConvId,
            senderId,
            text: "Chào bạn, mình quan tâm đến tour này, nhờ bạn tư vấn giúp mình nhé!",
            type: 'text',
            createdAt: new Date().toISOString()
        };

        const msgDataCardUI = {
            _id: msgId2,
            conversationId: currentConvId!,
            senderId,
            text: "Shared a tour",
            type: 'tour_card' as const,
            tourId: tourShort,
            createdAt: new Date(Date.now() + 100).toISOString()
        };

        const msgDataCardAPI = {
            conversationId: currentConvId!,
            senderId,
            text: "Shared a tour",
            type: 'tour_card',
            tourId: tour._id,
            createdAt: new Date(Date.now() + 100).toISOString()
        };

        // 3. Optimistic Update
        setMessages(prev => [...prev, msgDataTextUI, msgDataCardUI]);

        // 4. Send to API & Socket
        try {
            await axios.post("http://localhost:5000/api/chat/message", msgDataTextAPI);
            if (socket) {
                socket.emit("send_message", msgDataTextUI);
            }
            await axios.post("http://localhost:5000/api/chat/message", msgDataCardAPI);
            if (socket) {
                socket.emit("send_message", msgDataCardUI);
            }
        } catch (e) {
            console.error("Send tour message failed", e);
        }
    }, [conversationId, socket, user, ensureConversation]);

    // Handle "Open Chat with Tour" Event (from TourDetail)
    useEffect(() => {
        const handleOpenWithTour = (e: Event) => {
            const customEvent = e as CustomEvent;
            const tour = customEvent.detail?.tour;
            if (tour) {
                shareTour(tour);
            }
        };
        window.addEventListener('open_chat_with_tour', handleOpenWithTour);
        return () => {
            window.removeEventListener('open_chat_with_tour', handleOpenWithTour);
        };
    }, [shareTour]);

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

        const senderId = user ? String(user.userId) : (localStorage.getItem("chat_guest_id") || `guest_${Date.now()}`);
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
            conversationId: currentConvId!,
            senderId: currentUserId, // Use consistent ID
            text: newMessage,
            createdAt: new Date().toISOString() // Optimistic
        };

        setMessages(prev => [...prev, msgData]);
        setIsRead(false); // <--- RESET READ STATUS ON NEW MESSAGE
        setNewMessage("");

        // Save to DB via API (more reliable than socket for persistence)
        try {
            await axios.post("http://localhost:5000/api/chat/message", msgData);
            // Send to Socket for Realtime
            if (socket) { socket.emit("send_message", msgData); }
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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const tourDataString = e.dataTransfer.getData("application/tour-data");
        if (tourDataString) {
            try {
                const tour = JSON.parse(tourDataString);
                shareTour(tour);
            } catch (err) {
                console.error("Failed to parse dropped tour data", err);
            }
        }
    };

    if (user?.role === 'Admin') { return null; }

    return (
        <div
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <ChatWindow
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                messages={messages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleSend={handleSend}
                handleInputChange={handleInputChange}
                handleDeleteChat={handleDeleteChat}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                conversationId={conversationId}
                isTyping={isTyping}
                isRead={isRead}
                quickReplies={QUICK_REPLIES}
            />

            {/* Quick Contact Options (Rendered on Hover) */}
            {!isOpen && (
                <div className={`flex flex-col gap-3 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                    {CONTACT_OPTIONS.map((opt, idx) => (
                        <a
                            key={idx}
                            href={opt.href}
                            target="_blank"
                            rel="noreferrer"
                            className={`pointer-events-auto flex items-center justify-end gap-2 pr-1 pl-4 py-1.5 rounded-full shadow-lg transform transition-all hover:scale-110 ${opt.delay} ${isHovered ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}
                        >
                            <span className="bg-white text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap">
                                {opt.label}
                            </span>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ${opt.color}`}>
                                {opt.icon}
                            </div>
                        </a>
                    ))}
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`pointer-events-auto p-4 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center relative ${isOpen ? 'bg-gray-400 text-white rotate-90' : 'bg-blue-600 text-white'
                    }`}
            >
                {isOpen ? <X size={24} /> : (
                    <>
                        <MessageCircle size={28} className="fill-current" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white animate-bounce-custom flex items-center justify-center px-1">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </>
                )}

                {!isOpen && !isHovered && (
                    <div className="absolute right-full mr-4 bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none font-medium text-sm arrow-right">
                        Chat với chúng tôi! 👋
                    </div>
                )}
            </button>
        </div>
    );
};

export default ChatWidget;
