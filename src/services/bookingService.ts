import axiosClient from '../api/axiosClient';
import type { DonDatTour } from '../types';

export const bookingService = {
    // Create new booking
    create: (data: Partial<DonDatTour>) => {
        return axiosClient.post('/dondattours', data);
    },

    // Get Booking by ID (supports both naming conventions)
    getById: (id: number | string) => {
        return axiosClient.get<DonDatTour>(`/dondattours/${id}`);
    },

    // Get My Bookings (User)
    getMyBookings: () => {
        return axiosClient.get<DonDatTour[]>('/dondattours/my-bookings');
    },

    // --- Admin / Generic Methods ---

    // Get All Bookings
    getAll: async () => {
        try {
            return await axiosClient.get<DonDatTour[]>('/dondattours/all');
        } catch (error) {
            console.warn("API /dondattours/all failed.");
            throw error;
        }
    },

    // Update Booking
    update: (id: number, data: Partial<DonDatTour>) => {
        return axiosClient.put(`/dondattours/${id}`, data);
    },

    // Delete Booking
    delete: (id: number) => {
        return axiosClient.delete(`/dondattours/${id}`);
    },

    // Cancel Booking
    cancel: (id: number, reason: string) => {
        return axiosClient.put(`/dondattours/${id}/cancel`, { lyDoHuy: reason });
    },

    // Update Status
    updateStatus: async (id: number, status: string) => {
        if (status === 'Cancelled' || status === 'Hủy') {
            return axiosClient.put(`/dondattours/${id}/cancel`, { lyDoHuy: "Admin cancelled" });
        }
        return axiosClient.put(`/dondattours/${id}`, { trangThai: status });
    },

    // --- Refund Methods ---
    requestRefund: (id: number, data: { bankName: string; accountNumber: string; accountHolder: string; reason: string; refundAmount: number }) => {
        return axiosClient.post(`/dondattours/${id}/request-refund`, data);
    },

    confirmRefund: (id: number, otp: string) => {
        return axiosClient.post(`/dondattours/${id}/confirm-refund`, { otp });
    },

    adminConfirmRefund: (id: number) => {
        return axiosClient.put(`/dondattours/${id}/admin-confirm-refund`);
    }
};
