import { useRef, useEffect } from "react";
import { User, ChevronDown, Trash2, Send } from "lucide-react";
import { Message } from "../../types/chat";
import ChatBubble from "../chat/ChatBubble";

interface ChatWindowProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    messages: Message[];
    newMessage: string;
    setNewMessage: (msg: string) => void;
    handleSend: () => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeleteChat: () => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    conversationId: string | null;
    isTyping: boolean;
    isRead: boolean;
    quickReplies: string[];
}

const ChatWindow = ({
    isOpen,
    setIsOpen,
    messages,
    newMessage,
    setNewMessage,
    handleSend,
    handleInputChange,
    handleDeleteChat,
    handleDragOver,
    handleDrop,
    conversationId,
    isTyping,
    isRead,
    quickReplies
}: ChatWindowProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    if (!isOpen) { return null; }

    return (
        <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="pointer-events-auto bg-white w-[350px] h-[500px] rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-4 animate-scale-in origin-bottom-right"
        >
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

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-start text-xs text-gray-500 italic ml-2 mb-2 animate-pulse">
                        Admin đang soạn tin...
                    </div>
                )}

                {/* Read Receipt (Only show for my last message if isRead is true) */}
                {isRead && messages.length > 0 && messages[messages.length - 1].senderId !== 'admin' && (
                    <div className="flex justify-end text-[10px] text-gray-400 mr-2 -mt-2 mb-2">
                        Đã xem
                    </div>
                )}
            </div>

            {/* Quick Replies */}
            <div className="px-4 pb-2 bg-gray-50 flex gap-2 overflow-x-auto no-scrollbar">
                {quickReplies.map((reply, idx) => (
                    <button
                        key={idx}
                        onClick={() => { setNewMessage(reply); }}
                        className="whitespace-nowrap bg-white border border-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs hover:bg-blue-50 transition shadow-sm"
                    >
                        {reply}
                    </button>
                ))}
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
                        onChange={handleInputChange}
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
    );
};

export default ChatWindow;
