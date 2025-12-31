import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Copy, Home, ArrowRight } from 'lucide-react';
import { bookingService } from '../../services/tourService'; // Assuming bookingService has getById or similar
import { MomoIcon, MBBankIcon, CashIcon } from '../../components/icons/PaymentIcons';
import { DonDatTour } from '../../types'; // You might need to adjust this import based on your types definition

const PaymentPage = () => {
    const { bookingId } = useParams();
    const [booking, setBooking] = useState<DonDatTour | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooking = async () => {
            if (!bookingId) return;
            try {
                // Assuming you have an API to get booking by ID
                // If not, we might need to rely on passing state or creating a new API endpoint
                // For now, let's mock it or try to fetch if the service exists
                const response = await bookingService.getById(Number(bookingId));
                setBooking(response.data);
            } catch (error) {
                console.error("Error fetching booking:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert(`Đã sao chép: ${text}`);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải thông tin đơn hàng...</div>;
    // Fallback if booking not found (or API not ready), show generic success based on ID
    // But ideally we show real data.

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Success Header */}
                <div className="bg-green-600 text-white p-8 rounded-3xl shadow-xl text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        {/* Background pattern or decoration */}
                    </div>
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                            <CheckCircle size={48} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black mb-2 uppercase">Đặt tour thành công!</h1>
                        <p className="text-blue-100 text-lg">Mã đơn hàng của bạn là <span className="font-bold text-white text-xl">#{bookingId}</span></p>
                    </div>
                </div>

                {/* Payment Instructions */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-blue-900 p-6 text-white flex justify-between items-center">
                        <h2 className="font-bold text-lg uppercase tracking-wide">Hướng dẫn thanh toán</h2>
                        <div className="text-sm opacity-80">Vui lòng thanh toán để hoàn tất</div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Amount */}
                        <div className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-gray-500 mb-1 text-sm font-medium uppercase">Tổng số tiền cần thanh toán</p>
                            <p className="text-4xl font-black text-blue-600">
                                {booking ? booking.tongTienThanhToan?.toLocaleString() : '...'} ₫
                            </p>
                        </div>

                        {/* Payment Methods Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Momo */}
                            <div className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition bg-white relative group">
                                <div className="absolute top-4 right-4"><MomoIcon className="w-8 h-8" /></div>
                                <h3 className="font-bold text-pink-600 mb-4 text-lg">Ví MoMo</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                        <span className="text-gray-500">Số điện thoại</span>
                                        <span className="font-bold font-mono">0967.087.527</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                        <span className="text-gray-500">Người nhận</span>
                                        <span className="font-bold">LÊ TUẤN</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-gray-500">Nội dung</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">THANHTOAN {bookingId}</span>
                                            <button onClick={() => handleCopy(`THANHTOAN ${bookingId}`)} className="text-gray-400 hover:text-blue-600"><Copy size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                                {/* QR Placeholder (Optional) */}
                                <div className="mt-4 flex justify-center">
                                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                                        <img src="/images/MOMO-Logo-App.png" className="w-full h-full object-contain p-2" alt="Momo QR" />
                                    </div>
                                </div>
                            </div>

                            {/* MB Bank with Dynamic VietQR */}
                            <div className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition bg-white relative group">
                                <div className="absolute top-4 right-4"><MBBankIcon className="w-12 h-8" /></div>
                                <h3 className="font-bold text-blue-800 mb-4 text-lg">Ngân hàng MBBank (QR Tự động)</h3>
                                <div className="space-y-3 text-sm">
                                    <p className="text-gray-500 mb-2">Quét mã QR bên dưới để thanh toán tự động:</p>

                                    <div className="flex justify-center bg-gray-50 p-4 rounded-xl">
                                        {/* Dynamic VietQR URL: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<CONTENT> */}
                                        <img
                                            src={`https://img.vietqr.io/image/MB-0352092466666-compact.png?amount=${booking?.tongTienThanhToan || 0}&addInfo=THANHTOAN ${bookingId}&accountName=LE TUAN`}
                                            alt="VietQR MBBank"
                                            className="w-full max-w-[250px] object-contain"
                                        />
                                    </div>

                                    <div className="text-center mt-4">
                                        <p className="text-xs text-gray-400 mb-2">Sau khi chuyển khoản thành công, vui lòng nhấn nút bên dưới</p>
                                        <button
                                            onClick={async () => {
                                                if (!bookingId) return;
                                                const confirm = window.confirm("Bạn xác nhận đã chuyển khoản thành công?");
                                                if (confirm) {
                                                    try {
                                                        await bookingService.update(Number(bookingId), { trangThai: "Đã thanh toán" });
                                                        alert("Xác nhận thanh toán thành công! Hệ thống đã cập nhật trạng thái đơn hàng.");
                                                        // Refresh booking or redirect
                                                        setBooking(prev => prev ? { ...prev, trangThai: "Đã thanh toán" } : null);
                                                    } catch (e) {
                                                        alert("Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng liên hệ admin.");
                                                    }
                                                }
                                            }}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-200 transition"
                                        >
                                            Đã Thanh Toán
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cash Option */}
                        <div className="bg-gray-50 p-6 rounded-2xl flex items-start gap-4">
                            <div className="bg-green-100 p-2 rounded-full"><CashIcon className="w-6 h-6" /></div>
                            <div>
                                <h4 className="font-bold text-gray-800">Thanh toán tiền mặt</h4>
                                <p className="text-sm text-gray-600 mt-1">Vui lòng đến văn phòng của chúng tôi tại <span className="font-medium text-gray-900">123 Nguyễn Hữu, Quận 1, TP.HCM</span> để thanh toán trực tiếp. Giờ làm việc: 8:00 - 17:30.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/" className="px-8 py-3 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2">
                        <Home size={18} />
                        Về trang chủ
                    </Link>
                    <Link to="/my-bookings" className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                        <span>Đơn hàng của tôi</span>
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
