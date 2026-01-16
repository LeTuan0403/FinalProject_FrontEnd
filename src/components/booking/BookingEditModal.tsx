import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import BookingForm from './BookingForm';

interface BookingEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: (e: React.FormEvent, data: any) => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bookingData: any;
}

const BookingEditModal: React.FC<BookingEditModalProps> = ({ isOpen, onClose, onSubmit, bookingData }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formData, setFormData] = useState<any>(bookingData || {});

    useEffect(() => {
        setFormData(bookingData || {});
    }, [bookingData]);

    if (!isOpen || !bookingData) { return null; }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit(e, formData);
        } catch (err) {
            const error = err as any;
            const msg = error.response?.data?.msg || error.response?.data?.message || "Lỗi cập nhật!";
            toast.error(msg);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Cập nhật đơn đặt #{formData.donDatId}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <BookingForm
                        formData={formData}
                        onChange={setFormData}
                        tour={bookingData.tour}
                    />
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg text-gray-600 font-bold hover:bg-gray-100"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingEditModal;
