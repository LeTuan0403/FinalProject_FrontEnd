import React, { useState } from 'react';
import { X, CheckCircle, AlertOctagon, HelpCircle } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import toast from 'react-hot-toast';
import type { Booking } from '../../types';

interface BookingRefundDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | null;
    onSuccess: () => void;
}

const BookingRefundDetailModal: React.FC<BookingRefundDetailModalProps> = ({ isOpen, onClose, booking, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen || !booking) { return null; }

    const handleConfirmRefund = async () => {
        if (!window.confirm("Xác nhận đã chuyển tiền hoàn lại cho khách hàng? Hành động này không thể hoàn tác.")) { return; }

        setIsLoading(true);
        try {
            await bookingService.adminConfirmRefund(booking.donDatId);
            toast.success("Xác nhận hoàn tiền thành công!");
            onSuccess();
            onClose();
        } catch (error) {
            const e = error as any;
            toast.error(e.response?.data?.msg || "Lỗi xác nhận hoàn tiền");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in relative">

                <div className="flex justify-between items-center p-4 border-b bg-red-50">
                    <h3 className="font-bold text-lg text-red-800 flex items-center gap-2">
                        <AlertOctagon size={24} />
                        Yêu cầu hoàn tiền #{booking.donDatId}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-red-200 rounded-full text-red-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border space-y-2">
                        <div>
                            <span className="text-gray-500 text-sm">Lý do hủy:</span>
                            <p className="font-medium text-gray-800">{booking.refundReason || 'Không có lý do'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500 text-sm">Số tiền hoàn dự kiến:</span>
                            <p className="font-bold text-red-600 text-xl">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.refundAmountEst || 0)}
                            </p>
                        </div>
                        <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <HelpCircle size={12} /> Cam kết: Đã xác thực OTP bởi người dùng
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-bold text-gray-800 mb-3 uppercase text-sm">Thông tin hoàn tiền & QR</h4>
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Left: Info */}
                            <div className="flex-1 grid grid-cols-1 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-500 block">Ngân hàng</span>
                                    <span className="font-medium text-lg">{booking.refundBankName}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Số tài khoản</span>
                                    <span className="font-medium font-mono bg-yellow-50 px-2 py-1 rounded border border-yellow-200 inline-block text-lg">
                                        {booking.refundAccountNumber}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Chủ tài khoản</span>
                                    <span className="font-bold uppercase text-blue-700 text-lg">{booking.refundAccountHolder}</span>
                                </div>
                            </div>

                            {/* Right: QR Code */}
                            <div className="flex flex-col items-center justify-center bg-white p-2 border rounded-xl shadow-sm">
                                <img
                                    src={`https://img.vietqr.io/image/${encodeURIComponent(booking.refundBankName || '')}-${booking.refundAccountNumber || ''}-compact.jpg?amount=${booking.refundAmountEst || 0}&addInfo=${encodeURIComponent('Hoan tien Tour ' + booking.donDatId)}&accountName=${encodeURIComponent(booking.refundAccountHolder || '')}`}
                                    alt="QR Chuyển khoản"
                                    className="w-40 h-40 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://placehold.co/150x150?text=Invalid+Bank`;
                                    }}
                                />
                                <span className="text-[10px] text-gray-400 mt-1 text-center max-w-[150px]">
                                    Quét để chuyển khoản tự động
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mt-2">
                        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
                            <strong>Hướng dẫn Admin:</strong> Vui lòng chuyển khoản số tiền trên đến tài khoản khách hàng. Sau khi chuyển thành công, nhấn "Xác nhận đã hoàn tiền" để hệ thống gửi email thông báo cho khách.
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-gray-100 font-bold text-gray-600 rounded-xl hover:bg-gray-200"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleConfirmRefund}
                                disabled={isLoading}
                                className="flex-1 py-3 bg-red-600 font-bold text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 flex justify-center items-center gap-2"
                            >
                                {isLoading ? 'Đang xử lý...' : (
                                    <>
                                        <CheckCircle size={18} /> Xác nhận đã hoàn tiền
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BookingRefundDetailModal;
