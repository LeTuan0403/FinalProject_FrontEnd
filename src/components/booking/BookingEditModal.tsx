import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BookingEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent, data: any) => Promise<void>;
    bookingData: any;
}

const BookingEditModal: React.FC<BookingEditModalProps> = ({ isOpen, onClose, onSubmit, bookingData }) => {
    const [formData, setFormData] = useState<any>(bookingData || {});

    useEffect(() => {
        setFormData(bookingData || {});
    }, [bookingData]);

    if (!isOpen || !bookingData) return null;

    const handleSubmit = (e: React.FormEvent) => {
        onSubmit(e, formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Cập nhật đơn đặt #{formData.donDatId}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Người liên hệ</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-lg"
                                value={formData.nguoiLienHe || ''}
                                onChange={e => setFormData({ ...formData, nguoiLienHe: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-lg"
                                value={formData.sdtLienHe || ''}
                                onChange={e => setFormData({ ...formData, sdtLienHe: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full p-3 border rounded-lg"
                                value={formData.emailLienHe || ''}
                                onChange={e => setFormData({ ...formData, emailLienHe: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Số người lớn</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full p-3 border rounded-lg"
                                value={formData.soLuongNguoiLon || 0}
                                onChange={e => setFormData({ ...formData, soLuongNguoiLon: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Số trẻ em</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full p-3 border rounded-lg"
                                value={formData.soLuongTreEm || 0}
                                onChange={e => setFormData({ ...formData, soLuongTreEm: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Ngày khởi hành</label>
                            <input
                                type="date"
                                className="w-full p-3 border rounded-lg"
                                value={formData.ngayKhoiHanh ? formData.ngayKhoiHanh.split('T')[0] : ''}
                                onChange={e => setFormData({ ...formData, ngayKhoiHanh: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú</label>
                            <textarea
                                className="w-full p-3 border rounded-lg h-24"
                                value={formData.ghiChu || ''}
                                onChange={e => setFormData({ ...formData, ghiChu: e.target.value })}
                            />
                        </div>
                    </div>
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
