import axiosClient from '../api/axiosClient';
import type { Tour, NguoiDung } from '../types';

// Assuming User type includes favorites now, or we define a specific response
// Define minimal types needed

export const userService = {
    getProfile: async () => {
        return axiosClient.get<NguoiDung>('/users/me');
    },
    updateProfile: async (data: Partial<NguoiDung>) => {
        return axiosClient.put('/users/profile', data);
    },
    getMyFavorites: async () => {
        return axiosClient.get<Tour[]>('/users/favorites');
    },
    toggleFavorite: async (tourId: number) => {
        return axiosClient.post(`/users/favorites/${tourId}`);
    },
    updateRole: async (userId: number, isAdmin: number) => {
        return axiosClient.put(`/users/${userId}/role`, { isAdmin });
    }
};
