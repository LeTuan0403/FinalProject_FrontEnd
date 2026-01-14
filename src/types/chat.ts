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
    createdAt: string;
    type?: 'text' | 'tour_card';
    tourId?: TourShort;
}

export interface Conversation {
    _id: string;
    members: string[];
    lastMessage: string;
    isReadByAdmin: boolean;
    guestName: string;
    updatedAt: string;
}
