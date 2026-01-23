import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { MessageCircle, Search, Send, MapPin, X, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import axios from "axios";
import { useChat } from "../../../context/ChatContext";
import { useNotification } from "../../../context/NotificationContext";

import { Message, Conversation, TourShort } from "../../../types/chat";
import ChatBubble from "../../../components/chat/ChatBubble";

const AdminChat = () => {
    const { socket } = useChat();
    const { refreshCounts } = useNotification();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [searchParams, setSearchParams] = useState({ guestName: '', messageContent: '' });

    // Tour Recommendation
    const [isTourModalOpen, setIsTourModalOpen] = useState(false);
    const [tours, setTours] = useState<TourShort[]>([]);
    const [tourSearch, setTourSearch] = useState("");

    // Typing & Read Status
    const [typingStatus, setTypingStatus] = useState<{ [key: string]: boolean }>({});
    const [hasCustomerRead, setHasCustomerRead] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    const fetchAllTours = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/tours");
            // Assuming API returns full list. Filter fields if possible, or just use full obj.
            setTours(res.data as TourShort[]);
        } catch (e) {
            console.error("Fetch tours failed", e);
        }
    };

    const handleRecommendTour = async (tour: TourShort) => {
        if (!selectedConv) { return; }
        setIsTourModalOpen(false);

        const msgData = {
            conversationId: selectedConv._id,
            senderId: "admin",
            text: "", // Empty text for card? Or some fallback text
            type: 'tour_card',
            tourId: tour._id, // Send ID for backend saving
            createdAt: new Date().toISOString()
        };

        // Optimistic (Need full object to display)
        const optimisticMsg: Message = {
            ...msgData,
            tourId: tour, // Full object for logic
            type: 'tour_card',
            text: ''
        } as Message; // Cast needed because tourId in msgData is string, but optimistic needs object

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            // Backend expects tourId as string
            await axios.post("http://localhost:5000/api/chat/message", msgData);

            // Socket expects... full object if we want recipient to see it immediately?
            // Or backend broadcasts full object?
            // Our backend `addMessage` populates it before response.
            // But `send_message` socket event in `index.js` just broadcasts what it receives?
            // Wait, `index.js` `send_message` handler:
            // socket.to().emit("receive_message", data);
            // So if we send `tourId: string` to socket, User receives string.
            // We need to send POPULATED object to socket.
            const socketMsg = { ...optimisticMsg };
            if (socket) { socket.emit("send_message", socketMsg); }

            // Update preview
            setConversations(prev => prev.map(c => c._id === selectedConv._id ? { ...c, lastMessage: "[Gợi ý Tour]" } : c));
        } catch (e) {
            console.error("Send tour failed", e);
        }
    };

    // Helper: Sort Conversations (Unread -> Oldest First; Read -> Newest First)
    const sortConversations = (convs: Conversation[]) => {
        return [...convs].sort((a, b) => {
            // Priority 1: Unread comes first
            if (a.isReadByAdmin !== b.isReadByAdmin) {
                return a.isReadByAdmin ? 1 : -1; // false (0) < true (1)
            }

            // Priority 2:
            // If Unread: Oldest unreadSince (FIFO - waiting longest)
            if (!a.isReadByAdmin) {
                // If unreadSince exists fallback to updatedAt for legacy data
                const dateA = a.unreadSince ? new Date(a.unreadSince).getTime() : new Date(a.updatedAt).getTime();
                const dateB = b.unreadSince ? new Date(b.unreadSince).getTime() : new Date(b.updatedAt).getTime();
                return dateA - dateB;
            }

            // If Read: Newest First (LIFO - recent history)
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
    };

    // 1. Fetch Conversations
    const fetchConversations = async (guestName = "", messageContent = "") => {
        try {
            const params = new URLSearchParams();
            if (guestName) { params.append('searchGuest', guestName); }
            if (messageContent) { params.append('searchContent', messageContent); }

            const queryString = params.toString();
            const url = `http://localhost:5000/api/chat/conversations${queryString ? `?${queryString}` : ''}`;

            const res = await axios.get(url);
            setConversations(sortConversations(res.data));
        } catch (e) {
            console.error("Fetch convs failed", e);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchConversations(searchParams.guestName, searchParams.messageContent);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // 2. Select Conversation & Fetch Messages
    useEffect(() => {
        if (selectedConv) {
            const fetchMessages = async () => {
                try {
                    const res = await axios.get(`http://localhost:5000/api/chat/message/${selectedConv._id}`);
                    setMessages(res.data);

                    // Only mark as read if it's currently unread
                    if (!selectedConv.isReadByAdmin) {
                        await axios.put(`http://localhost:5000/api/chat/conversation/read/${selectedConv._id}`, { role: 'admin' });
                        refreshCounts();

                        // Update local state and RE-SORT
                        setConversations(prev => {
                            const updated = prev.map(c =>
                                c._id === selectedConv._id ? { ...c, isReadByAdmin: true, unreadSince: undefined } : c
                            );
                            return sortConversations(updated);
                        });
                    }
                } catch (e) {
                    console.error("Fetch msgs failed", e);
                }
            };
            fetchMessages();

            // Join Room as Admin
            if (socket) {
                socket.emit("admin_join_room", selectedConv._id);
                socket.emit("mark_read", selectedConv._id); // Notify User that Admin entered/read

                // Handle Re-connection
                const handleConnect = () => {
                    socket.emit("admin_join_room", selectedConv._id);
                };
                socket.on("connect", handleConnect);
                return () => {
                    socket.off("connect", handleConnect);
                };
            }
        }
    }, [selectedConv, socket, refreshCounts]);

    // 3. Socket Listeners
    useEffect(() => {
        if (!socket) { return; }

        // Listen for new messages in current room
        socket.on("receive_message", (data: Message) => {
            // Only append if it belongs to current conversation
            if (selectedConv && data.senderId !== 'admin') {
                // If it matches current conversation
                if (data.conversationId === selectedConv._id) {
                    setMessages(prev => [...prev, data]);
                    // Mark read immediately if we are viewing this conversation
                    socket.emit("mark_read", selectedConv._id);
                }
            }
        });

        // Typing Indicators
        socket.on("typing", (convId: string) => {
            setTypingStatus(prev => ({ ...prev, [convId]: true }));
            // Auto scroll if current conv?
            if (selectedConv?._id === convId) {
                // messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        });

        socket.on("stop_typing", (convId: string) => {
            setTypingStatus(prev => ({ ...prev, [convId]: false }));
        });

        // Read Receipts - Update UI if user read our message
        socket.on("message_read", (convId: string) => {
            if (selectedConv?._id === convId) {
                setHasCustomerRead(true);
            }
        });

        // Presence
        socket.on("get_users", (users: string[]) => {
            setOnlineUsers(users);
        });

        // Listen for Global Notifications (to update conversation list order/badges)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleAdminNotification = (data: any) => {
            // data = { conversationId, text, senderId, unreadSince ... }
            if (data.senderId === 'admin') { return; } // Ignore self

            setConversations(prev => {
                const existingIndex = prev.findIndex(c => c._id === data.conversationId);
                const newList = [...prev];

                if (existingIndex > -1) {
                    const existing = newList[existingIndex];
                    // Update info
                    const updatedConv = {
                        ...existing,
                        lastMessage: data.text,
                        // If selected, it remains read. If not selected, it becomes unread.
                        isReadByAdmin: selectedConv?._id === data.conversationId,
                        updatedAt: new Date().toISOString(),
                        // If becoming unread (and wasn't before? or just update?)
                        // If it's ALREADY unread, backend sends the OLD unreadSince (or we keep existing)
                        // Backend data.unreadSince should be authoritative
                        unreadSince: selectedConv?._id === data.conversationId ? undefined : (data.unreadSince || existing.unreadSince || new Date().toISOString())
                    };

                    newList[existingIndex] = updatedConv;
                } else {
                    // New conversation, trigger fetch or add optimistically?
                    // Fetch safer to get guestName etc.
                    fetchConversations(searchParams.guestName, searchParams.messageContent);
                    return prev;
                }

                return sortConversations(newList);
            });

            // Play Sound?
            const audio = new Audio("/notification.mp3"); // Ensure this file exists or use URL
            audio.play().catch(() => { }); // Ignore auto-play errors
        };

        socket.on("admin_notification", handleAdminNotification);

        return () => {
            socket.off("receive_message");
            // IMPORTANT: Pass the handler to only remove THIS listener, not Global ones
            socket.off("admin_notification", handleAdminNotification);
            socket.off("typing");
            socket.off("stop_typing");
            socket.off("message_read");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, selectedConv, searchParams]); // selectedConv is dependency, so effect re-runs on change

    // Handle Input Change for Typing
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (socket && selectedConv) {
            socket.emit("typing", selectedConv._id);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stop_typing", selectedConv._id);
            }, 2000);
        }
    };

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, selectedConv]);

    const handleDeleteMessage = async (msgId: string) => {
        if (!selectedConv || !window.confirm("Xóa tin nhắn này?")) { return; }

        try {
            await axios.delete(`http://localhost:5000/api/chat/message/${msgId}`);
            setMessages(prev => prev.filter(m => m._id !== msgId));
            if (socket) { socket.emit("admin_delete_message", { conversationId: selectedConv._id, messageId: msgId }); }
        } catch (e) {
            console.error("Delete msg failed", e);
        }
    };

    const handleDeleteConversation = async () => {
        if (!selectedConv) { return; }
        if (!window.confirm("Bạn có chắc muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.")) { return; }

        try {
            await axios.delete(`http://localhost:5000/api/chat/conversation/${selectedConv._id}`);

            // Emit socket event to notify user
            if (socket) { socket.emit("admin_delete_conversation", selectedConv._id); }

            // Update local state
            setConversations(prev => prev.filter(c => c._id !== selectedConv._id));
            setSelectedConv(null);
            setMessages([]);
        } catch (e) {
            console.error("Delete conversation failed", e);
            toast.error("Có lỗi xảy ra khi xóa cuộc trò chuyện");
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConv) { return; }

        const msgData = {
            conversationId: selectedConv._id,
            senderId: "admin",
            text: newMessage,
            createdAt: new Date().toISOString()
        };

        // Optimistic
        setMessages(prev => [...prev, msgData]);
        setNewMessage("");
        setHasCustomerRead(false); // Reset read status on new message

        try {
            await axios.post("http://localhost:5000/api/chat/message", msgData);
            if (socket) { socket.emit("send_message", msgData); }

            // Update local conversation preview
            setConversations(prev => {
                const updatedList = prev.map(c =>
                    c._id === selectedConv._id
                        ? { ...c, lastMessage: msgData.text, updatedAt: new Date().toISOString() }
                        : c
                );
                return sortConversations(updatedList);
            });
        } catch (e) {
            console.error("Send failed", e);
        }
    };

    // Navigation for Search Matches
    const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
    const [matchIndices, setMatchIndices] = useState<number[]>([]);

    // Helper: Highlight Text
    const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
        if (!highlight.trim()) { return <>{text}</>; }

        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="bg-yellow-200 text-gray-800 font-semibold rounded-[2px] px-0.5 animate-pulse">
                            {part}
                        </span>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </>
        );
    };

    // Calculate matches when messages or search term changes
    useEffect(() => {
        if (!searchParams.messageContent.trim() || !messages.length) {
            setMatchIndices([]);
            setCurrentMatchIdx(0);
            return;
        }

        const indices = messages.reduce((acc, msg, idx) => {
            if (msg.text.toLowerCase().includes(searchParams.messageContent.toLowerCase())) {
                acc.push(idx);
            }
            return acc;
        }, [] as number[]);

        setMatchIndices(indices);
        // If matches found, jump to the last one (most recent usually) or remain?
        // Let's jump to the first one for now (oldest) or last?
        // Telegram style: jumps to newest match (bottom).
        if (indices.length > 0) {
            setCurrentMatchIdx(indices.length - 1); // Jump to last matching message
        } else {
            setCurrentMatchIdx(0);
        }
    }, [messages, searchParams.messageContent]);

    // Scroll to current match
    useEffect(() => {
        if (matchIndices.length > 0 && matchIndices[currentMatchIdx] !== undefined) {
            const msgIndex = matchIndices[currentMatchIdx];
            const el = document.getElementById(`msg-${msgIndex}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentMatchIdx, matchIndices]);

    const handleNextMatch = () => {
        if (matchIndices.length === 0) { return; }
        setCurrentMatchIdx(prev => (prev + 1) % matchIndices.length);
    };

    const handlePrevMatch = () => {
        if (matchIndices.length === 0) { return; }
        setCurrentMatchIdx(prev => (prev - 1 + matchIndices.length) % matchIndices.length);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">

            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MessageCircle /> Tin nhắn CSKH
            </h1>
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex">
                {/* Sidebar: Conversation List */}
                <div className="w-1/3 border-r border-gray-100 bg-gray-50 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            {(searchParams.guestName || searchParams.messageContent) ? "Kết quả tìm kiếm" : "Tin nhắn"} <span className="text-blue-600">({(searchParams.guestName || searchParams.messageContent) ? conversations.length : conversations.filter(c => !c.isReadByAdmin).length})</span>
                        </h2>
                        <div className="flex flex-col gap-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm tên khách..."
                                    className="w-full pl-9 pr-3 py-2 bg-gray-100 border-none rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                    value={searchParams.guestName}
                                    onChange={(e) => setSearchParams(prev => ({ ...prev, guestName: e.target.value }))}
                                />
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm nội dung tin nhắn..."
                                    className="w-full pl-9 pr-3 py-2 bg-gray-100 border-none rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                    value={searchParams.messageContent}
                                    onChange={(e) => setSearchParams(prev => ({ ...prev, messageContent: e.target.value }))}
                                />
                                <MessageCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {conversations.map(conv => (
                            <div
                                key={conv._id}
                                onClick={() => setSelectedConv(conv)}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-100 ${selectedConv?._id === conv._id ? 'bg-blue-50 hover:bg-blue-50' : ''
                                    } ${!conv.isReadByAdmin ? 'bg-blue-50/30' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-sm ${!conv.isReadByAdmin ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                        <HighlightText text={conv.guestName} highlight={searchParams.guestName} />
                                    </h4>
                                    <span className="text-[10px] text-gray-400">{new Date(conv.updatedAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-xs truncate max-w-[180px] ${!conv.isReadByAdmin ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                                        {conv.lastMessage ? (
                                            <HighlightText text={conv.lastMessage} highlight={searchParams.messageContent} />
                                        ) : "Hình ảnh/File..."}
                                    </p>
                                    {!conv.isReadByAdmin && (
                                        <span className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm animate-pulse"></span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedConv ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                        {selectedConv.guestName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{selectedConv.guestName}</h3>
                                        <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                                            {typingStatus[selectedConv._id] ? (
                                                <span className="text-blue-500 italic animate-pulse">Đang soạn tin...</span>
                                            ) : (
                                                <>
                                                    {selectedConv.members.some((m: string) => onlineUsers.includes(m) && m !== 'admin') ? (
                                                        <>
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400">Offline</span>
                                                    )}
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Controls: Search Navigation & Actions */}
                                <div className="flex items-center gap-3">
                                    {searchParams.messageContent && matchIndices.length > 0 && (
                                        <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                                            <span className="text-xs font-medium text-yellow-700">
                                                {currentMatchIdx + 1} / {matchIndices.length}
                                            </span>
                                            <div className="flex gap-1 border-l border-yellow-200 pl-2">
                                                <button onClick={handlePrevMatch} className="p-1 hover:bg-yellow-100 rounded text-yellow-600">
                                                    <ChevronUp size={14} />
                                                </button>
                                                <button onClick={handleNextMatch} className="p-1 hover:bg-yellow-100 rounded text-yellow-600">
                                                    <ChevronDown size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1">
                                        <button onClick={handleDeleteConversation} className="p-2 hover:bg-red-50 text-red-500 rounded-full transition" title="Xóa cuộc trò chuyện">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.senderId === 'admin';
                                    return (
                                        <div key={idx} id={`msg-${idx}`}>
                                            <ChatBubble
                                                message={msg}
                                                isMe={isMe}
                                                onDelete={handleDeleteMessage}
                                                highlight={searchParams.messageContent}
                                            />
                                            {/* Read Receipt */}
                                            {isMe && idx === messages.length - 1 && hasCustomerRead && (
                                                <div className="text-right mr-1">
                                                    <span className="text-[10px] text-gray-400 font-medium">Đã xem</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsTourModalOpen(true);
                                        if (tours.length === 0) { fetchAllTours(); }
                                    }}
                                    className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl transition"
                                    title="Gửi gợi ý Tour"
                                >
                                    <MapPin size={20} />
                                </button>
                                <form onSubmit={handleSend} className="flex-1 flex gap-3 items-center bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={handleInputChange}
                                        placeholder="Nhập tin nhắn..."
                                        className="flex-1 bg-transparent px-4 py-2 outline-none text-gray-700 font-medium placeholder-gray-400"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <MessageCircle size={40} className="text-gray-300" />
                            </div>
                            <p className="font-medium text-lg">Chọn một cuộc hội thoại để bắt đầu</p>
                        </div>
                    )}
                </div>
                {
                    isTourModalOpen && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                    <h3 className="font-bold text-gray-800">Chọn Tour để giới thiệu</h3>
                                    <button onClick={() => setIsTourModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-4 border-b">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm tour..."
                                            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={tourSearch}
                                            onChange={(e) => setTourSearch(e.target.value)}
                                        />
                                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4 auto-rows-max">
                                    {tours.filter(t => t.tenTour.toLowerCase().includes(tourSearch.toLowerCase())).map(tour => (
                                        <div key={tour._id} className="group border rounded-xl hover:shadow-lg cursor-pointer transition overflow-hidden bg-white flex flex-col h-full hover:border-blue-300" onClick={() => handleRecommendTour(tour)}>
                                            <div className="aspect-[4/3] overflow-hidden relative bg-gray-100">
                                                <img
                                                    src={tour.hinhAnhBia ? (tour.hinhAnhBia.startsWith('http') ? tour.hinhAnhBia : `http://localhost:5000${tour.hinhAnhBia}`) : "https://images.unsplash.com/photo-1540541338287-41700207dee6"}
                                                    alt=""
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                                                    {tour.thoiGian}
                                                </div>
                                            </div>
                                            <div className="p-3 flex flex-col flex-1">
                                                <h4 className="font-bold text-gray-800 text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">{tour.tenTour}</h4>
                                                <div className="mt-auto pt-2 flex justify-between items-center border-t border-gray-50">
                                                    <p className="font-bold text-blue-600 text-sm">{tour.tongGiaDuKien?.toLocaleString()}₫</p>
                                                    <span className="text-[10px] text-gray-400">Nhấn để gửi</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default AdminChat;
