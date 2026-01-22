export interface TourShort {
    _id: string;
    tourId: number;
    tenTour: string;
    tongGiaDuKien: number;
    hinhAnhBia: string;
    thoiGian: string;
}

export interface Message {
    _id?: string;
    senderId: string;
    text: string;
    type?: 'text' | 'tour_card';
    tourId?: string | TourShort; // Populated tour
    createdAt?: string; // Optional for optimistic/new messages
    updatedAt?: string;
    conversationId?: string;
    isRead?: boolean;
}

export interface Conversation {
    _id: string;
    members: string[];
    lastMessage: string;
    isReadByAdmin: boolean;
    guestName: string;
    updatedAt: string;
    unreadSince?: string | Date; // Added field
}
