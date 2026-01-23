import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import BookingForm, { BookingFormProps } from './BookingForm';

import type { DonDatTour } from '../../types';

interface BookingEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent, data: Partial<DonDatTour>) => Promise<void>;
    bookingData: DonDatTour;
}

const ComparisonView: React.FC<{
    bookingData: DonDatTour;
    formData: Partial<DonDatTour>;
    newTotal: number;
}> = ({ bookingData, formData, newTotal }) => (
    <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
            <h4 className="font-bold text-blue-900 border-b border-blue-200 pb-1">So sánh thay đổi</h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-700">
                <div className="font-medium text-gray-500">Thông tin cũ</div>
                <div className="font-medium text-blue-700">Thông tin mới</div>

                <div>{bookingData.soLuongNguoiLon} Lớn, {bookingData.soLuongTreEm} Trẻ</div>
                <div className="font-bold">{formData.soLuongNguoiLon} Lớn, {formData.soLuongTreEm} Trẻ</div>

                <div>{bookingData.ngayKhoiHanh ? new Date(bookingData.ngayKhoiHanh).toLocaleDateString('vi-VN') : ''}</div>
                <div className="font-bold">{formData.ngayKhoiHanh ? new Date(formData.ngayKhoiHanh).toLocaleDateString('vi-VN') : ''}</div>

                <div>Voucher đã áp dụng</div>
                <div className="font-bold">{formData.couponCode || 'Không có'} {(formData.discountAmount || 0) > 0 ? `(-${formData.discountAmount?.toLocaleString()}đ)` : ''}</div>

                <div className="col-span-2 border-t border-blue-100 my-2 pt-2"></div>

                <div className="text-gray-500">Tổng tiền cũ:</div>
                <div className="text-gray-500">Tổng tiền mới (ước tính):</div>

                <div className="text-lg font-bold text-gray-400">{bookingData.tongTienThanhToan?.toLocaleString()}đ</div>
                <div className="text-xl font-black text-blue-600">{newTotal.toLocaleString()}đ</div>
            </div>
        </div>
        <p className="text-xs text-gray-500 italic text-center">Lưu ý: Hệ thống sẽ tính toán lại giá chính xác theo chính sách giảm giá và voucher tại thời điểm bạn nhấn "Xác nhận & Lưu".</p>
    </div>
);

const BookingEditModal: React.FC<BookingEditModalProps> = ({ isOpen, onClose, onSubmit, bookingData }) => {
    const [formData, setFormData] = useState<Partial<DonDatTour>>(bookingData || {});
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        setFormData(bookingData || {});
        setIsConfirming(false);
    }, [bookingData]);

    if (!isOpen || !bookingData) { return null; }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit(e, formData);
            setIsConfirming(false);
        } catch (err) {
            const error = err as { response?: { data?: { msg?: string, message?: string } } };
            const msg = error.response?.data?.msg || error.response?.data?.message || "Lỗi cập nhật!";
            toast.error(msg);
        }
    };

    // Calculate New Price for Comparison (Simplified client-side estimation)
    let priceAdult = bookingData.tour?.isTuChon ? Math.round((bookingData.tour.tongGiaDuKien || 0) / (bookingData.tour.soLuongCho || 1)) : (bookingData.tour?.tongGiaDuKien || 0);
    if (bookingData.tour && bookingData.tour.discounts && formData.ngayKhoiHanh) {
        const selectedDate = formData.ngayKhoiHanh.includes('T') ? formData.ngayKhoiHanh.split('T')[0] : formData.ngayKhoiHanh;
        const discount = bookingData.tour.discounts.find((d: { date: string | Date; percentage: number }) => new Date(d.date).toISOString().split('T')[0] === selectedDate);
        if (discount) {
            priceAdult = priceAdult * (1 - discount.percentage / 100);
        }
    }
    const newTotal = (Number(formData.soLuongNguoiLon || 0) * priceAdult) + (Number(formData.soLuongTreEm || 0) * priceAdult * 0.75) - (formData.discountAmount || 0);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">
                        {isConfirming ? "Xác nhận thay đổi" : `Cập nhật đơn đặt #${formData.donDatId}`}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {!isConfirming ? (
                        <div className="space-y-4">
                            <BookingForm
                                formData={formData as BookingFormProps['formData']}
                                onChange={(data) => setFormData(data as Partial<DonDatTour>)}
                                tour={bookingData.tour}
                            />
                        </div>
                    ) : (
                        <ComparisonView
                            bookingData={bookingData}
                            formData={formData}
                            newTotal={newTotal}
                        />
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => isConfirming ? setIsConfirming(false) : onClose()}
                        className="px-4 py-2 border rounded-lg text-gray-600 font-bold hover:bg-gray-100"
                    >
                        {isConfirming ? "Quay lại" : "Hủy"}
                    </button>

                    {!isConfirming ? (
                        <button
                            type="button"
                            onClick={() => setIsConfirming(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
                        >
                            Tiếp theo
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200"
                        >
                            Xác nhận & Lưu
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingEditModal;
