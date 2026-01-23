import api from '../api/axiosClient';

export const couponService = {
    // Admin
    getAll: () => api.get('/coupons'),
    create: (data: any) => api.post('/coupons', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => api.put(`/coupons/${id}`, data),
    toggle: (id: string) => api.put(`/coupons/${id}/toggle`),
    delete: (id: string) => api.delete(`/coupons/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assign: (id: string, userIds: string[]) => api.put(`/coupons/${id}/assign`, { userIds }),
    assignAll: (id: string) => api.put(`/coupons/${id}/assign-all`),

    // Client
    getAvailable: () => api.get('/coupons/available'),
    validate: (code: string, orderValue: number) => api.post('/coupons/validate', { code, orderValue })
};
