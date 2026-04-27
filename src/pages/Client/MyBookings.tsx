import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Calendar, MapPin, User, Clock } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../hooks/useAuth';
import type { DonDatTour } from '../../types';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/booking/StatusBadge';
import BookingEditModal from '../../components/booking/BookingEditModal';
import PaymentTimer from '../../components/common/PaymentTimer';
import RefundModal from '../../components/booking/RefundModal';

const MyBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<DonDatTour[]>([]);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editBooking, setEditBooking] = useState<any>(null); // State for editing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [refundBooking, setRefundBooking] = useState<any>(null); // State for refund modal

    useEffect(() => {
        if (user) {
            fetchMyBookings();
        }
    }, [user]);

    const fetchMyBookings = async () => {
        try {
            setLoading(true);
            const res = await bookingService.getMyBookings();

            // Sort: Pending/Chờ thanh toán FIRST, then Others. Within group: Oldest First (FIFO)
            const sorted = res.data.sort((a: DonDatTour, b: DonDatTour) => {
                const pendingStatuses = ['Pending', 'Chờ thanh toán'];
                const aIsPending = pendingStatuses.includes(a.trangThai || '');
                const bIsPending = pendingStatuses.includes(b.trangThai || '');

                if (aIsPending && !bIsPending) { return -1; }
                if (!aIsPending && bIsPending) { return 1; }

                return new Date(a.ngayDat || 0).getTime() - new Date(b.ngayDat || 0).getTime();
            });

            setBookings(sorted);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUpdate = async (e: React.FormEvent, data: any) => {
        e.preventDefault();
        try {
            const payload = {
                ...data,
                soLuongNguoi: Number(data.soLuongNguoiLon || 0) + Number(data.soLuongTreEm || 0)
            };
            await bookingService.update(payload.donDatId, payload);
            toast.success("Cập nhật đơn đặt tour thành công!");
            setEditBooking(null);
            fetchMyBookings();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            const backendMsg = error.response?.data?.msg || error.response?.data?.error || error.response?.data?.message || "Lỗi cập nhật! Vui lòng thử lại.";
            toast.error(backendMsg);
            throw error;
        }
    };

    const handleCancel = (id: number) => {
        toast((t) => (
            <div>
                <p className="font-bold text-gray-800">Xác nhận hủy đơn?</p>
                <p className="text-sm text-gray-600 mt-1 mb-3">Nếu hủy, bạn sẽ không thể đặt lại tour này trong 24 giờ.</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-200"
                    >
                        Đóng
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await bookingService.cancel(id, "Khách hàng tự hủy");
                                toast.success("Đã hủy đơn thành công!");
                                fetchMyBookings();
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            } catch (error: any) {
                                toast.error(error.response?.data?.message || "Lỗi hủy đơn!");
                            }
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                    >
                        Hủy đơn
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            style: {
                background: '#fff',
                color: '#333',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #f3f4f6',
            },
        });
    };

    if (loading) { return <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">Loading...</div>; }

    if (!bookings.length) {
        return (
            <div className="min-h-screen pt-24 pb-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Đơn đặt tour của tôi</h1>
                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100">
                        <p className="text-gray-500 mb-6">Bạn chưa đặt tour nào.</p>
                        <Link to="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                            Khám phá Tour ngay
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Đơn đặt tour của tôi</h1>
                <div className="grid grid-cols-1 gap-6">
                    {bookings.map((booking) => (
                        <div key={booking.donDatId} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col md:flex-row gap-6 relative">
                            <div className="w-full md:w-1/4">
                                <img
                                    src={booking.tour?.hinhAnhBia || "https://placehold.co/300x200"}
                                    alt={booking.tour?.tenTour}
                                    className="w-full h-48 object-cover rounded-xl"
                                />
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-gray-800">{booking.tour?.tenTour || `Tour #${booking.tourId}`}</h3>
                                        <StatusBadge status={booking.trangThai} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={18} className="text-blue-500" />
                                            <span>Ngày đi: {new Date(booking.ngayKhoiHanh).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User size={18} className="text-blue-500" />
                                            <span>{booking.soLuongNguoi} Khách ({booking.soLuongNguoiLon || 0} Lớn, {booking.soLuongTreEm || 0} Trẻ)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin size={18} className="text-blue-500" />
                                            <span>Khởi hành: {booking.tour?.diemKhoiHanh || 'Hà Nội'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={18} className="text-blue-500" />
                                            <span>Đặt ngày: {booking.ngayDat ? new Date(booking.ngayDat).toLocaleDateString('vi-VN') : 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Timer for Pending Bookings */}
                                    {['Pending', 'Chờ thanh toán'].includes(booking.trangThai) && booking.ngayDat && (
                                        <div className="mb-3 bg-orange-50 p-2 rounded-lg inline-flex">
                                            <PaymentTimer createdAt={booking.ngayDat} className="text-sm" />
                                        </div>
                                    )}

                                    {booking.ghiChu && <div className="text-sm bg-gray-50 p-2 rounded text-gray-600 italic mb-2">Ghi chú: {booking.ghiChu}</div>}
                                </div>
                                <div className="flex justify-between items-end border-t border-gray-100 pt-4 mt-2">
                                    <div>
                                        <span className="text-sm text-gray-500">Tổng thanh toán</span>
                                        <div className="text-2xl font-bold text-blue-600">{Number(booking.tongTienThanhToan).toLocaleString()} ₫</div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Link
                                            to={`/tours/${booking.tour?._id || booking.tourId}`}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition"
                                        >
                                            Xem Tour
                                        </Link>

                                        {/* Pending Actions */}
                                        {['Pending', 'Chờ thanh toán'].includes(booking.trangThai) && (
                                            <>
                                                <Link
                                                    to={`/payment/${booking.donDatId}`}
                                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition shadow-md shadow-orange-200"
                                                >
                                                    Thanh toán ngay
                                                </Link>
                                                <button
                                                    onClick={() => setEditBooking(booking)}
                                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition"
                                                >
                                                    Sửa đơn
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(booking.donDatId)}
                                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition"
                                                >
                                                    Hủy đơn
                                                </button>
                                            </>
                                        )}

                                        {/* Refund Action (Paid Bookings) */}
                                        {['PAID', 'CONFIRMED', 'Đã thanh toán', 'Đã duyệt'].includes(booking.trangThai) && (
                                            <button
                                                onClick={() => setRefundBooking(booking)}
                                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition"
                                            >
                                                Hủy / Hoàn tiền
                                            </button>
                                        )}

                                        {booking.trangThai === 'Hoàn tất' && (
                                            <Link
                                                to={`/booking/${booking.tourId}`}
                                                state={{ rebookData: booking }}
                                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition"
                                            >
                                                Đặt lại
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Edit Modal */}
                <BookingEditModal
                    isOpen={!!editBooking}
                    onClose={() => setEditBooking(null)}
                    onSubmit={handleUpdate}
                    bookingData={editBooking}
                />

                {/* Refund Modal */}
                <RefundModal
                    isOpen={!!refundBooking}
                    onClose={() => setRefundBooking(null)}
                    booking={refundBooking}
                    onSuccess={() => {
                        setRefundBooking(null);
                        fetchMyBookings();
                        toast.success("Đã gửi yêu cầu hoàn tiền thành công!");
                    }}
                />
            </div>
        </div>
    );
};

export default MyBookings;