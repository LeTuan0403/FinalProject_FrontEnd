import api from '../api/axiosClient';

export const couponService = {
    // Admin
    getAll: () => api.get('/coupons'),
    create: (data: Record<string, unknown>) => api.post('/coupons', data),
    update: (id: string, data: Record<string, unknown>) => api.put(`/coupons/${id}`, data),
    toggle: (id: string) => api.put(`/coupons/${id}/toggle`),
    delete: (id: string) => api.delete(`/coupons/${id}`),
    assign: (id: string, userIds: string[]) => api.put(`/coupons/${id}/assign`, { userIds }),
    assignAll: (id: string) => api.put(`/coupons/${id}/assign-all`),

    // Client
    getAvailable: (bookingId?: string) => api.get('/coupons/available', { params: { bookingId } }),
    validate: (code: string, orderValue: number, bookingId?: string) => api.post('/coupons/validate', { code, orderValue, bookingId })
};
