import axiosClient from '../api/axiosClient';
import type { Tour, DiaDiem, DonDatTour } from '../types';

export const tourService = {
  getAll: async (params?: any) => {
    return axiosClient.get<Tour[]>('/tours', { params });
  },
  getById: async (id: number) => {
    return axiosClient.get<Tour>(`/tours/${id}`);
  },
  createCustom: async (data: Record<string, unknown>) => {
    return axiosClient.post('/tours/custom', data);
  },
  // Admin only
  createTour: async (data: Record<string, unknown>) => {
    return axiosClient.post('/tours', data);
  },
  updateTour: async (id: number, data: Record<string, unknown>) => {
    return axiosClient.put(`/tours/${id}`, data);
  },
  updateCustom: async (id: number, data: Record<string, unknown>) => {
    return axiosClient.put(`/tours/custom/${id}`, data);
  },
  deleteTour: async (id: number) => {
    return axiosClient.delete(`/tours/${id}`);
  },
  deleteCustom: async (id: number) => {
    return axiosClient.delete(`/tours/custom/${id}`);
  },
  approveTour: async (id: number) => {
    return axiosClient.put(`/tours/approve/${id}`);
  },

  // User
  getToursByUser: async () => {
    return axiosClient.get<Tour[]>('/tours/user/me');
  }
};

export const diaDiemService = {
  getAll: async () => {
    return axiosClient.get<DiaDiem[]>('/diadiems');
  },
  getById: async (id: number) => {
    return axiosClient.get<DiaDiem>(`/diadiems/${id}`);
  },
  create: async (data: Partial<DiaDiem>) => {
    return axiosClient.post<DiaDiem>('/diadiems', data);
  },
  update: async (id: number, data: Partial<DiaDiem>) => {
    return axiosClient.put(`/diadiems/${id}`, data);
  },
  delete: async (id: number) => {
    return axiosClient.delete(`/diadiems/${id}`);
  }
};

export const bookingService = {
  create: async (data: Partial<DonDatTour>) => {
    return axiosClient.post('/dondattours', data);
  },
  getMyBookings: async () => {
    return axiosClient.get<DonDatTour[]>('/dondattours/my-bookings');
  },
  getById: async (id: number) => {
    return axiosClient.get<DonDatTour>(`/dondattours/${id}`);
  },
  // Admin & Generic
  getAll: async () => {
    try {
      return await axiosClient.get<DonDatTour[]>('/dondattours/all');
    } catch (error) {
      console.warn("API /dondattours/all failed.");
      throw error;
    }
  },
  // Update Booking Details (Date, Pax, Contact)
  update: async (id: number, data: Partial<DonDatTour>) => {
    return axiosClient.put(`/dondattours/${id}`, data);
  },
  // Delete Booking (Hard Delete)
  delete: async (id: number) => {
    return axiosClient.delete(`/dondattours/${id}`);
  },
  // Cancel Booking (Change status to Cancel/Pending Cancel)
  cancel: async (id: number, reason: string) => {
    return axiosClient.put(`/dondattours/${id}/cancel`, { lyDoHuy: reason });
  },
  // Note: Previous updateStatus might be invalid if backend only supports specifics. 
  // Keeping for backward compat if there's other logic not shown, or should be replaced?
  // Ideally 'updateStatus' should check target status. If 'Hủy', use cancel.
  updateStatus: async (id: number, status: string) => {
    // Backend doesn't seem to have a generic status update endpoint provided in snippets.
    // But preserving this hook in case User has other controllers not shown.
    // For 'Hủy', we should prioritize 'cancel'.
    if (status === 'Cancelled' || status === 'Hủy') {
      return axiosClient.put(`/dondattours/${id}/cancel`, { lyDoHuy: "Admin cancelled" });
    }
    return axiosClient.put(`/dondattours/${id}`, { trangThai: status });
  }
};