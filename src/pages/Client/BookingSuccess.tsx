import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Home, FileText, Loader2, MapPin, Calendar, DollarSign, User } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { Booking } from '../../types';

const BookingSuccess = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooking = async () => {
            if (!bookingId) { return; }
            try {
                const res = await bookingService.getById(Number(bookingId));
                setBooking(res.data);
            } catch (error) {
                console.error("Failed to load booking success details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [bookingId]);

    if (loading) { return <div className="min-h-screen flex justify-center items-center bg-gray-50"><Loader2 className="animate-spin text-green-600" size={48} /></div>; }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-600 w-12 h-12" />
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Thanh Toán Thành Công!</h1>
                    <p className="text-gray-500 text-sm">
                        Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi.<br />
                        Vé điện tử đã được gửi đến email của bạn.
                    </p>
                </div>

                {booking && (
                    <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Thông tin đơn hàng #{booking.donDatId}</h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 flex items-center gap-2"><User size={16} /> Khách hàng</span>
                                <span className="font-bold text-gray-900">{booking.nguoiLienHe}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 flex items-center gap-2"><DollarSign size={16} /> Tổng thanh toán</span>
                                <span className="font-black text-green-600 text-lg">{Number(booking.tongTienThanhToan).toLocaleString()} ₫</span>
                            </div>
                            {booking.tour && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="font-bold text-gray-800 mb-1">{booking.tour.tenTour}</div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {booking.tour.diemKhoiHanh}</span>
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(booking.ngayKhoiHanh).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {booking && booking.tourId && (
                        <Link to={`/tours/${booking.tourId}`} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                            <MapPin size={20} />
                            Xem Tour Đã Đặt
                        </Link>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <Link to="/my-bookings" className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2">
                            <FileText size={20} />
                            Đơn Hàng
                        </Link>
                        <Link to="/" className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2">
                            <Home size={20} />
                            Trang Chủ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingSuccess;
