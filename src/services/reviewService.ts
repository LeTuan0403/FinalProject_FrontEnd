import axiosClient from '../api/axiosClient';
import { Review } from '../types';

export const reviewService = {
    getByTour: (tourId: number) => {
        return axiosClient.get<Review[]>(`/danhgia/tour/${tourId}`);
    },

    create: (data: Review) => {
        return axiosClient.post<Review>('/danhgia', data);
    },

    // Admin Methods
    getAll: () => {
        return axiosClient.get<Review[]>('/danhgia');
    },

    reply: (id: number, reply: string) => {
        return axiosClient.put(`/danhgia/${id}/reply`, { traLoi: reply });
    },

    delete: (id: number) => {
        return axiosClient.delete(`/danhgia/${id}`);
    },

    update: (id: number, data: Partial<Review>) => {
        return axiosClient.put(`/danhgia/${id}`, data);
    },

    // New Features
    uploadMedia: (formData: FormData) => {
        return axiosClient.post<{ msg: string; files: { type: 'image' | 'video'; url: string; }[] }>('/danhgia/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    like: (id: number) => {
        return axiosClient.put<string[]>(`/danhgia/${id}/like`);
    },

    comment: (id: number, content: string, isAnonymous: boolean, media?: { type: 'image' | 'video', url: string }[]) => {
        return axiosClient.post(`/danhgia/${id}/reply`, { content, isAnonymous, media });
    },

    likeReply: (id: number, replyId: string) => {
        return axiosClient.put<string[]>(`/danhgia/${id}/reply/${replyId}/like`);
    },

    deleteReply: (id: number, replyId: string) => {
        return axiosClient.delete(`/danhgia/${id}/reply/${replyId}`);
    },

    updateReply: (id: number, replyId: string, content: string, media?: any[]) => {
        return axiosClient.put(`/danhgia/${id}/reply/${replyId}`, { content, media });
    }
};
