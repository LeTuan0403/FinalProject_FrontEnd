import axiosClient from '../api/axiosClient';

export const paymentService = {
    checkStatus: (bookingId: number | string) => {
        return axiosClient.get<{ status: string }>(`/payment/check-status/${bookingId}`);
    },


};
