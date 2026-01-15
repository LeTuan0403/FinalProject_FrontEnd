import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import { bookingService } from '../../services/bookingService';
import { Copy, Loader2, AlertCircle } from 'lucide-react';
import PaymentTimer from '../../components/common/PaymentTimer';

const PaymentPage = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isExpired, setIsExpired] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);

    // Check status periodically
    useEffect(() => {
        if (!bookingId) { return; }

        // Polling function
        const interval = setInterval(async () => {
            try {
                const res = await paymentService.checkStatus(bookingId);
                if (res.data.status === 'CONFIRMED' || res.data.status === 'PAID') {
                    navigate(`/booking-success/${bookingId}`); // Pass ID to success page
                }
                // Also check if cancelled remotely
                if (res.data.status === 'Đã hủy' || res.data.status === 'Cancelled') {
                    setIsCancelled(true);
                    clearInterval(interval);
                }
            } catch (e) {
                console.error("Error checking status", e);
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [bookingId, navigate]);

    useEffect(() => {
        const fetchBooking = async () => {
            if (!bookingId) { return; }
            try {
                const res = await bookingService.getById(Number(bookingId));
                setBooking(res.data);
                // Initial check
                if (res.data.trangThai === 'Đã hủy' || res.data.trangThai === 'Cancelled') {
                    setIsCancelled(true);
                }
            } catch (e) {
                console.error("Failed to load booking", e);
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [bookingId]);

    if (loading) { return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-600" size={48} /></div>; }

    // Safety check for cancelled booking
    if (isCancelled || booking?.trangThai === 'Đã hủy' || booking?.trangThai === 'Cancelled') {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-50">
                <div className="text-center p-10 bg-white rounded-2xl shadow-xl max-w-md w-full border border-red-100">
                    <div className="w-16 h-16 bg-red-100/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Đơn hàng đã bị hủy</h2>
                    <p className="text-gray-500 mb-6">Đơn hàng này đã bị hủy và không thể thực hiện thanh toán. Vui lòng đặt lại tour nếu bạn vẫn muốn tham gia.</p>
                    <div className="space-y-3">
                        <button onClick={() => navigate(`/tours/${booking.tourId}`)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
                            Đặt Lại Tour Này
                        </button>
                        <button onClick={() => navigate('/my-bookings')} className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition">
                            Xem Danh Sách Đơn Hàng
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center p-4">
                <div className="text-center p-10 bg-white rounded-2xl shadow-xl max-w-md w-full">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy đơn hàng</h2>
                    <p className="text-gray-500 mb-6">Đơn hàng này có thể đã bị xóa hoặc không tồn tại.</p>
                    <div className="space-y-3">
                        <button onClick={() => navigate('/my-bookings')} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
                            Xem Đơn Hàng Của Tôi
                        </button>
                        <button onClick={() => navigate('/')} className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition">
                            Về Trang Chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Helper to safety normalize Vietnamese names for banking
    const removeAccents = (str: string) => {
        return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }

    const BANK_ID = "MB";
    const ACCOUNT_NO = "0967087527";
    const TEMPLATE = "compact"; // or print
    const AMOUNT = booking.tongTienThanhToan;
    const DESCRIPTION = `TOUR ${booking.donDatId} ${removeAccents(booking.nguoiLienHe || '').toUpperCase()}`.trim();
    const ACCOUNT_NAME = "LE PHUONG TUAN";

    const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${AMOUNT}&addInfo=${encodeURIComponent(DESCRIPTION)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

                {/* Left: Booking Info */}
                <div className="md:w-1/2 p-8 border-r border-gray-100 flex flex-col justify-center">
                    <h2 className="text-2xl font-black text-blue-900 mb-6 uppercase">Thanh Toán Đơn Hàng</h2>

                    <div className="space-y-4 text-gray-600">
                        <div className="flex justify-between border-b pb-2">
                            <span>Mã đơn hàng</span>
                            <span className="font-bold text-gray-900">#{booking.donDatId}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span>Khách hàng</span>
                            <span className="font-bold text-gray-900">{booking.nguoiLienHe}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span>Số tiền</span>
                            <span className="font-black text-2xl text-red-600">{booking.tongTienThanhToan.toLocaleString()} ₫</span>
                        </div>
                        <div className="flex justify-between pb-2">
                            <span>Nội dung chuyển khoản</span>
                            <div className="flex flex-col items-end">
                                <span className="font-bold text-blue-600 flex items-center gap-2">
                                    {DESCRIPTION}
                                    <Copy size={14} className="cursor-pointer hover:text-blue-800" onClick={() => navigator.clipboard.writeText(DESCRIPTION)} />
                                </span>
                                <span className="text-xs text-gray-400 italic mt-1">(Cú pháp: TOUR + Mã đơn hàng)</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100 flex items-start gap-3">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold mb-1">Lưu ý quan trọng:</p>
                            <p className="mb-2">Hệ thống sẽ <strong>tự động xác nhận</strong> trong vòng 1-3 phút sau khi chuyển khoản.</p>

                            {/* Deadline Explanation */}
                            {(() => {
                                const created = new Date(booking.ngayDat).getTime();
                                const departure = new Date(booking.ngayKhoiHanh).getTime();
                                const standardDeadline = created + 12 * 60 * 60 * 1000;
                                const deadlineTimestamp = Math.min(standardDeadline, departure);
                                const deadlineDate = new Date(deadlineTimestamp);

                                const isLastMinute = departure < standardDeadline;

                                return (
                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                        <p className="font-bold text-red-600">
                                            Hạn chót thanh toán: {deadlineDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {' '}
                                            ngày {deadlineDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </p>
                                        {isLastMinute && (
                                            <p className="text-xs text-red-500 mt-1">
                                                * Thời gian giữ chỗ được điều chỉnh ngắn hơn do tour sắp khởi hành.
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Right: QR Code */}
                <div className={`md:w-1/2 p-8 flex flex-col items-center justify-center text-white relative transition-colors ${isExpired ? 'bg-gray-800' : 'bg-blue-600'}`}>

                    {/* Timer */}
                    {!isExpired && (
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                            <PaymentTimer
                                createdAt={booking.ngayDat}
                                departureDate={booking.ngayKhoiHanh}
                                onExpire={() => setIsExpired(true)}
                                className="text-white font-black"
                            />
                        </div>
                    )}

                    <h3 className="text-xl font-bold mb-6">{isExpired ? 'Đơn hàng đã hết hạn' : 'Quét mã để thanh toán'}</h3>

                    <div className={`bg-white p-4 rounded-xl shadow-2xl transition-opacity ${isExpired ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                        {isExpired ? (
                            <div className="w-64 h-64 flex flex-col items-center justify-center text-gray-500">
                                <AlertCircle size={48} className="mb-2" />
                                <span className="text-center">QR Thanh toán<br />đã bị vô hiệu hóa</span>
                            </div>
                        ) : (
                            <img src={qrUrl} alt="QR Payment" className="w-64 h-64 object-contain" />
                        )}
                    </div>

                    {!isExpired ? (
                        <>
                            <p className="mt-6 text-blue-100 text-center text-sm">
                                Sử dụng App Ngân hàng hoặc MoMo <br />để quét mã QR
                            </p>
                            <div className="mt-8 flex items-center gap-2">
                                <Loader2 className="animate-spin" size={20} />
                                <span>Đang chờ thanh toán...</span>
                            </div>
                        </>
                    ) : (
                        <div className="mt-6 text-gray-400 text-center text-sm">
                            Vui lòng đặt lại tour mới nếu bạn vẫn muốn đi.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PaymentPage;
