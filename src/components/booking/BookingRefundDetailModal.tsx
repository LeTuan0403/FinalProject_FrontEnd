import React, { useState, useEffect } from 'react';
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
    const [step, setStep] = useState<'form' | 'success'>('form');

    // Reset step when booking ID changes
    useEffect(() => {
        if (booking) {
            setStep('form');
        }
    }, [booking?.donDatId]);

    // Auto-switch to success if status becomes 'Đã hoàn tiền' (Real-time update)
    useEffect(() => {
        if (booking?.trangThai === 'Đã hoàn tiền' && isOpen) {
            setStep('success');
        }
    }, [booking?.trangThai, isOpen]);

    if (!isOpen || !booking) { return null; }

    const handleConfirmRefund = async () => {
        if (!window.confirm("Xác nhận đã chuyển tiền hoàn lại cho khách hàng? Hành động này không thể hoàn tác.")) { return; }

        setIsLoading(true);
        try {
            await bookingService.adminConfirmRefund(booking.donDatId);

            // Show success screen
            setStep('success');

            // Refresh data
            onSuccess();
        } catch (error) {
            const e = error as any;
            toast.error(e.response?.data?.msg || "Lỗi xác nhận hoàn tiền");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStep('form');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-fade-in relative flex flex-col">

                {step === 'form' ? (
                    <>
                        <div className="flex justify-between items-center p-4 border-b bg-red-50 flex-shrink-0">
                            <h3 className="font-bold text-lg text-red-800 flex items-center gap-2">
                                <AlertOctagon size={24} />
                                Yêu cầu hoàn tiền #{booking.donDatId}
                            </h3>
                            <button onClick={handleClose} className="p-1 hover:bg-red-200 rounded-full text-red-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
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
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-r-lg text-sm mb-4">
                                    <div className="space-y-3">
                                        <div>
                                            <strong className="text-blue-900 text-base">🚀 Hướng dẫn Admin:</strong>
                                        </div>

                                        <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                                            <p className="font-bold text-green-700 mb-2">✅ Cách 1: Tự động (Khuyến nghị)</p>
                                            <p className="text-gray-700 leading-relaxed">
                                                Quét mã QR hoặc chuyển khoản với nội dung <span className="font-mono bg-yellow-100 px-2 py-0.5 rounded text-xs font-bold">Hoan tien Tour {booking.donDatId}</span>.
                                                Hệ thống sẽ <strong>tự động xác nhận</strong> và gửi email cho khách ngay khi nhận được thông báo từ ngân hàng.
                                            </p>
                                        </div>

                                        <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                                            <p className="font-bold text-blue-700 mb-2">⚙️ Cách 2: Thủ công</p>
                                            <p className="text-gray-700 leading-relaxed">
                                                Nếu chuyển khoản qua ngân hàng khác hoặc nội dung khác, sau khi chuyển thành công,
                                                nhấn nút <strong>"Xác nhận đã hoàn tiền"</strong> bên dưới để gửi email thông báo cho khách.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleClose}
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
                    </>
                ) : (
                    <>
                        {/* SUCCESS SCREEN */}
                        <div className="p-8 text-center space-y-6">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                                <CheckCircle size={48} className="text-green-600" />
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Hoàn Tiền Thành Công!</h2>
                                <p className="text-gray-600">
                                    Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi.<br />
                                    Vé điện tử đã được gửi đến email của khách hàng.
                                </p>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl space-y-4 text-left">
                                <h3 className="font-bold text-gray-800 border-b pb-2">Thông tin đơn hàng #{booking.donDatId}</h3>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Khách hàng</span>
                                        <span className="font-medium">{booking.nguoiLienHe}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Số tiền hoàn</span>
                                        <span className="font-bold text-green-600 text-lg">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.refundAmountEst || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
                            >
                                Đóng
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default BookingRefundDetailModal;
