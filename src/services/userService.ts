import axiosClient from '../api/axiosClient';
import type { Tour } from '../types';

// Assuming User type includes favorites now, or we define a specific response
// Define minimal types needed

export const userService = {
    getProfile: async () => {
        return axiosClient.get('/users/me');
    },
    updateProfile: async (data: any) => {
        return axiosClient.put('/users/profile', data);
    },
    getMyFavorites: async () => {
        return axiosClient.get<Tour[]>('/users/favorites');
    },
    toggleFavorite: async (tourId: number) => {
        return axiosClient.post(`/users/favorites/${tourId}`);
    }
};
