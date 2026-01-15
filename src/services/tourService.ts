import axiosClient from '../api/axiosClient';
import type { Tour, DiaDiem } from '../types';

export const tourService = {
  getAll: async (params?: Record<string, unknown>) => {
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

