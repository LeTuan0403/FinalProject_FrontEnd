import axiosClient from '../api/axiosClient';

export const paymentService = {
    checkStatus: (bookingId: number | string) => {
        return axiosClient.get<{ status: string }>(`/payment/check-status/${bookingId}`);
    },

    // Optional: Simulate webhook trigger from client (for testing only)
    // simulateWebhook: (bookingId: number | string, amount: number) => { ... } removed for production
};
