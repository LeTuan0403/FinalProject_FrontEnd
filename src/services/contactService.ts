import axiosClient from '../api/axiosClient';

export interface Contact {
    lienHeId: number;
    hoTen: string;
    email: string;
    noiDung: string;
    ngayGui: string;
    trangThai: string;
}

export const contactService = {
    createContact: (data: { hoTen: string; email: string; noiDung: string }) => {
        return axiosClient.post('/LienHe', data);
    },
    getAllContacts: () => {
        return axiosClient.get<Contact[]>('/LienHe');
    },
    replyContact: (id: number, replyContent: string) => {
        return axiosClient.post('/LienHe/reply', { id, replyContent });
    },
    deleteContact: (id: number) => {
        return axiosClient.delete(`/LienHe/${id}`);
    }
};
