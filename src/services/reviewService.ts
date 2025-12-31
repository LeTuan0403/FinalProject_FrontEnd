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

    update: (id: number, data: Review) => {
        return axiosClient.put(`/danhgia/${id}`, data);
    }
};
