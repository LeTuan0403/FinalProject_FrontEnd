import { X } from "lucide-react";
import { Message } from "../../types/chat";

interface ChatBubbleProps {
    message: Message;
    isMe: boolean;
    onDelete?: (id: string) => void;
    isAdminView?: boolean;
    showAdminAvatar?: boolean;
}

const ChatBubble = ({ message, isMe, onDelete, showAdminAvatar = false }: ChatBubbleProps) => {
    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group hover:bg-gray-50/50 rounded-lg transition`}>
            {/* Admin Avatar for User View */}
            {showAdminAvatar && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 self-end mb-1 shrink-0">
                    <span className="text-xs font-bold text-blue-600">AD</span>
                </div>
            )}

            <div className={`relative max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                }`}>

                {/* Delete Button (Only if onDelete is provided) */}
                {onDelete && message._id && (
                    <button
                        onClick={() => onDelete(message._id!)}
                        className={`absolute -top-2 -right-2 p-1 rounded-full bg-red-100 text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 hover:scale-100 ${isMe ? '-left-2 right-auto' : '-right-2'}`}
                        title="Xóa tin nhắn"
                    >
                        <X size={12} />
                    </button>
                )}

                {/* Content */}
                {message.type === 'tour_card' && message.tourId && typeof message.tourId === 'object' ? (
                    <div className="bg-white text-gray-800 rounded-xl overflow-hidden shadow-sm max-w-[280px] -m-1">
                        <img
                            src={message.tourId.hinhAnhBia ? (message.tourId.hinhAnhBia.startsWith('http') ? message.tourId.hinhAnhBia : `http://localhost:5000${message.tourId.hinhAnhBia}`) : "https://images.unsplash.com/photo-1540541338287-41700207dee6"}
                            alt={message.tourId.tenTour}
                            className="w-full h-32 object-cover"
                        />
                        <div className="p-3">
                            <h4 className="font-bold text-sm mb-1 line-clamp-2">{message.tourId.tenTour}</h4>
                            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                <span>{message.tourId.thoiGian}</span>
                                <span className="font-bold text-blue-600">{message.tourId.tongGiaDuKien?.toLocaleString('vi-VN')}₫</span>
                            </div>
                            <a
                                href={`/tours/${message.tourId.tourId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center bg-blue-50 text-blue-600 py-1.5 rounded-lg font-bold text-xs hover:bg-blue-100 transition"
                            >
                                Xem chi tiết
                            </a>
                        </div>
                    </div>
                ) : (
                    <p>{message.text}</p>
                )}

                {/* Timestamp */}
                <p className={`text-[10px] mt-2 text-right ${isMe && message.type !== 'tour_card' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(message.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
};

export default ChatBubble;
