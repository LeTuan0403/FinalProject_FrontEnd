import axiosClient from '../api/axiosClient';
import type { LoginResponse, NguoiDung } from '../types';

interface LoginData {
  email: string;
  matKhau: string;
}

export const authService = {
  login: async (data: LoginData) => {
    return axiosClient.post<LoginResponse>('/auth/login', data);
  },
  register: async (data: Record<string, unknown>) => {
    return axiosClient.post('/auth/register', data);
  },
  verifyAccount: async (email: string, code: string) => {
    return axiosClient.post<LoginResponse>('/auth/verify', { email, code });
  },
  loginGoogle: async (idToken: string) => {
    return axiosClient.post<LoginResponse>('/auth/google-login', { idToken });
  },
  forgotPassword: async (email: string) => {
    return axiosClient.post('/auth/forgot-password', { email });
  },
  resetPassword: async (data: { email: string; token: string; newPassword: string }) => {
    return axiosClient.post('/auth/reset-password', data);
  }
};

export const userService = {
  getAll: async (params?: Record<string, unknown>) => {
    return axiosClient.get<NguoiDung[]>('/users', { params });
  },
  delete: async (id: number) => {
    return axiosClient.delete(`/users/${id}`);
  },
  getMe: async () => {
    return axiosClient.get<NguoiDung>('/users/me');
  },
  updateProfile: async (data: { hoTen: string; soDienThoai?: string; diaChi?: string; ngaySinh?: string }) => {
    return axiosClient.put('/users/profile', data);
  },
  updateRole: async (userId: number, isAdmin: number) => {
    return axiosClient.put(`/users/${userId}/role`, { isAdmin });
  }
};