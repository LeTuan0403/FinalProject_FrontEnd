import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import toast from 'react-hot-toast';
import { Booking } from '../../types';

interface RefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking;
    onSuccess: () => void;
}

const RefundModal: React.FC<RefundModalProps> = ({ isOpen, onClose, booking, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Step 1: Info State
    const [formData, setFormData] = useState({
        reason: '',
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        isCommitted: false
    });

    // Step 2: OTP State
    const [otp, setOtp] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);

    // Calculate Refund (Mock logic for now, you can enhance based on policy)
    // Example: 100% refund for now
    // Calculate Refund Policy
    const { refundAmount, refundInfo } = React.useMemo(() => {
        if (!booking) return { refundAmount: 0, refundInfo: '' };

        const departureDate = new Date(booking.ngayKhoiHanh);
        const now = new Date();
        const diffTime = departureDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let percent = 0;
        if (diffDays > 7) {
            percent = 100;
        } else if (diffDays >= 3) {
            percent = 50;
        } else {
            percent = 0;
        }

        return {
            refundAmount: (booking.tongTienThanhToan * percent) / 100,
            refundInfo: `(Hủy trước ${diffDays} ngày: Hoàn ${percent}%)`
        };
    }, [booking]);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFormData({
                reason: '',
                bankName: '',
                accountNumber: '',
                accountHolder: '',
                isCommitted: false
            });
            setOtp('');
            setIsLoading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (step === 2 && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [step, timeLeft]);

    const handleSendOtp = async () => {
        if (!formData.reason || !formData.bankName || !formData.accountNumber || !formData.accountHolder) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setIsLoading(true);
        try {
            await bookingService.requestRefund(booking.donDatId, {
                ...formData,
                refundAmount
            });
            setStep(2);
            setTimeLeft(60);
            toast.success('Mã OTP đã được gửi đến email của bạn');
        } catch (err) {
            const error = err as any;
            toast.error(error.response?.data?.msg || 'Gửi OTP thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmRefund = async () => {
        if (otp.length !== 6) {
            toast.error('Vui lòng nhập mã OTP 6 số');
            return;
        }

        setIsLoading(true);
        try {
            await bookingService.confirmRefund(booking.donDatId, otp);
            setStep(3);
            onSuccess();
        } catch (err) {
            const error = err as any;
            toast.error(error.response?.data?.msg || 'Xác thực thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) { return null; }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">
                        {step === 1 && 'Yêu cầu hoàn tiền'}
                        {step === 2 && 'Xác thực bảo mật'}
                        {step === 3 && 'Hoàn tất'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">

                    {/* STEP 1: Form & Disclaimer */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                                <p className="text-sm text-blue-800 font-medium">Số tiền dự kiến hoàn lại:</p>
                                <p className="text-xl font-bold text-blue-700">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(refundAmount)}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">{refundInfo}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do hủy tour *</label>
                                <select
                                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                >
                                    <option value="">-- Chọn lý do --</option>
                                    <option value="Bận việc đột xuất">Bận việc đột xuất</option>
                                    <option value="Sức khỏe không đảm bảo">Sức khỏe không đảm bảo</option>
                                    <option value="Thay đổi kế hoạch">Thay đổi kế hoạch</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-bold text-gray-700 uppercase border-b pb-1">Thông tin nhận tiền</p>
                                <select
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                >
                                    <option value="">-- Chọn ngân hàng --</option>
                                    <option value="VCB">Vietcombank (VCB)</option>
                                    <option value="MB">MBBank (MB)</option>
                                    <option value="TCB">Techcombank (TCB)</option>
                                    <option value="ACB">ACB</option>
                                    <option value="BIDV">BIDV</option>
                                    <option value="ICB">VietinBank (ICB)</option>
                                    <option value="VPB">VPBank (VPB)</option>
                                    <option value="TPB">TPBank (TPB)</option>
                                    <option value="STB">Sacombank (STB)</option>
                                    <option value="HDB">HDBank (HDB)</option>
                                    <option value="VIB">VIB</option>
                                    <option value="VBA">Agribank (VBA)</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Số tài khoản"
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.accountNumber}
                                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Tên chủ tài khoản (Viết hoa không dấu)"
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                    value={formData.accountHolder}
                                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                                />
                            </div>

                            <label className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    checked={formData.isCommitted}
                                    onChange={(e) => setFormData({ ...formData, isCommitted: e.target.checked })}
                                />
                                <span className="text-sm text-gray-600 select-none">
                                    Tôi cam kết thông tin tài khoản là chính xác và tự chịu trách nhiệm nếu có sai sót.
                                </span>
                            </label>

                            <button
                                disabled={!formData.isCommitted || isLoading}
                                onClick={handleSendOtp}
                                className={`w-full py-3 rounded-xl font-bold text-white transition-all flex justify-center items-center gap-2
                  ${formData.isCommitted && !isLoading ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-gray-300 cursor-not-allowed'}
                `}
                            >
                                {isLoading && <RefreshCw className="animate-spin" size={18} />}
                                Tiếp tục
                            </button>
                        </div>
                    )}

                    {/* STEP 2: OTP Verification */}
                    {step === 2 && (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                                <AlertTriangle size={32} />
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-800 text-lg">Xác thực OTP</h4>
                                <p className="text-gray-500 text-sm mt-1">
                                    Mã xác thực 6 số đã được gửi đến email đăng ký của bạn.
                                </p>
                            </div>

                            <input
                                type="text"
                                className="text-center text-3xl font-bold tracking-[10px] w-full p-4 border rounded-xl focus:border-blue-500 outline-none uppercase"
                                placeholder="------"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                            />

                            <div className="space-y-3">
                                <button
                                    disabled={isLoading || otp.length !== 6}
                                    onClick={handleConfirmRefund}
                                    className={`w-full py-3 rounded-xl font-bold text-white transition-all
                    ${otp.length === 6 && !isLoading ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-gray-300 cursor-not-allowed'}
                  `}
                                >
                                    {isLoading ? 'Đang xác thực...' : 'Xác nhận'}
                                </button>

                                <div className="flex justify-center items-center gap-2 text-sm">
                                    {timeLeft > 0 ? (
                                        <span className="text-gray-400">Gửi lại mã sau {timeLeft}s</span>
                                    ) : (
                                        <button
                                            onClick={handleSendOtp}
                                            className="text-blue-600 font-bold hover:underline"
                                        >
                                            Gửi lại mã
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Success */}
                    {step === 3 && (
                        <div className="text-center space-y-6 py-4">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 animate-bounce">
                                <CheckCircle size={40} />
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-800 text-xl">Đã gửi yêu cầu!</h4>
                                <p className="text-gray-500 mt-2">
                                    Hệ thống đã ghi nhận yêu cầu hủy tour của bạn.
                                </p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl text-sm text-yellow-800">
                                <strong>Lưu ý:</strong> Số tiền hoàn lại sẽ được chuyển vào tài khoản của bạn trong vòng 24 giờ làm việc.
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                Đóng
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default RefundModal;
