import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, User, Mail, Phone, FileText, X, Edit, Trash2, Plus, AlertOctagon } from 'lucide-react';
import { bookingService } from '../../../services/bookingService';
import { useNotification } from '../../../context/NotificationContext';
import StatusBadge from '../../../components/booking/StatusBadge';
import BookingEditModal from '../../../components/booking/BookingEditModal';
import AdminBookingCreateModal from '../../../components/booking/AdminBookingCreateModal';
import BookingRefundDetailModal from '../../../components/booking/BookingRefundDetailModal';
import PaymentTimer from '../../../components/common/PaymentTimer';
import { useChat } from '../../../context/ChatContext';
import type { Booking } from '../../../types';

const BookingManagement = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [editBooking, setEditBooking] = useState<Booking | null>(null);
    const [refundDetailBooking, setRefundDetailBooking] = useState<Booking | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { refreshCounts } = useNotification();

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await bookingService.getAll();

            // Sort: Pending/Chờ thanh toán FIRST (FIFO), Processed (Approved/Cancelled) LAST (FIFO)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sorted = res.data.sort((a: any, b: any) => {
                const pendingStatuses = ['Pending', 'Chờ thanh toán'];
                const aIsPending = pendingStatuses.includes(a.trangThai);
                const bIsPending = pendingStatuses.includes(b.trangThai);

                // Pending comes first
                if (aIsPending && !bIsPending) { return -1; }
                if (!aIsPending && bIsPending) { return 1; }

                // Then sort by Date (Oldest first)
                return new Date(a.ngayDat || 0).getTime() - new Date(b.ngayDat || 0).getTime();
            });

            setBookings(sorted);
        } catch (e) {
            console.error("Failed to fetch bookings", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // Socket Listener
    const { socket } = useChat();
    useEffect(() => {
        if (!socket) { return; }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleNotification = (data: any) => {
            if (data.type === 'booking') {
                fetchBookings();
            }
        };
        socket.on("admin_notification", handleNotification);
        return () => {
            socket.off("admin_notification", handleNotification);
        };
    }, [socket]);

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            await bookingService.updateStatus(id, status);
            fetchBookings();
            refreshCounts(); // Update notification
        } catch (e) {
            toast.error("Lỗi cập nhật trạng thái!");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa đơn đặt tour này? Hành động này không thể hoàn tác.")) { return; }
        try {
            await bookingService.delete(id);
            toast.success("Đã xóa thành công!");
            fetchBookings();
            refreshCounts();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            const msg = e.response?.data?.message || "Lỗi khi xóa!";
            toast.error(msg);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUpdate = async (e: React.FormEvent, data: any) => {
        e.preventDefault();
        try {
            // Calculate new total pax (basic logic, backend might recalc total price)
            const payload = {
                ...data,
                soLuongNguoi: Number(data.soLuongNguoiLon || 0) + Number(data.soLuongTreEm || 0)
            };
            await bookingService.update(payload.donDatId, payload);
            toast.success("Cập nhật thành công!");
            setEditBooking(null);
            fetchBookings();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Lỗi cập nhật!");
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCreate = async (data: any) => {
        try {
            await bookingService.create(data);
            toast.success("Tạo đơn đặt thành công!");
            setIsCreateModalOpen(false);
            fetchBookings();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            toast.error(e.response?.data?.msg || e.response?.data?.message || "Lỗi khi tạo đơn!");
        }
    };

    // Helper to get booking contact info
    // Prioritize contact info in the booking record (book on behalf)
    // Fallback to user account info if missing (backward compatibility)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getContactInfo = (b: any) => {
        return {
            name: b.nguoiLienHe || b.hoTen || b.user?.hoTen || 'N/A',
            phone: b.sdtLienHe || b.soDienThoai || b.user?.soDienThoai || 'N/A',
            email: b.emailLienHe || b.email || b.user?.email || 'N/A'
        };
    };

    if (loading) { return <div className="flex justify-center items-center py-20 text-gray-500 gap-2"><Loader className="animate-spin" /> Đang tải danh sách đơn đặt...</div>; }

    return (
        <div className="relative">
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-800">Quản lý Đơn đặt tour</h1>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-700">Tổng số đơn: {bookings.length}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 font-bold flex items-center gap-1 shadow-sm"
                            >
                                <Plus size={16} /> Tạo đơn
                            </button>
                            <button
                                onClick={fetchBookings}
                                className="text-sm bg-white border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-100 text-blue-600 font-bold"
                            >
                                Làm mới
                            </button>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-bold text-gray-600">ID</th>
                                <th className="p-4 font-bold text-gray-600">Khách hàng</th>
                                <th className="p-4 font-bold text-gray-600">Tour</th>
                                <th className="p-4 font-bold text-gray-600">Chi tiết</th>
                                <th className="p-4 font-bold text-gray-600">Tổng tiền</th>
                                <th className="p-4 font-bold text-gray-600">Trạng thái</th>
                                <th className="p-4 font-bold text-gray-600">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bookings.map((b) => {
                                const contact = getContactInfo(b);
                                return (
                                    <tr key={b.donDatId} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-500">#{b.donDatId}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800">{contact.name}</div>
                                            <button
                                                onClick={() => setSelectedBooking(b)}
                                                className="text-xs text-blue-600 hover:underline mt-1 font-medium"
                                            >
                                                Xem liên hệ
                                            </button>
                                        </td>
                                        <td className="p-4 bg-gray-50/50">
                                            <div className="text-sm font-medium text-gray-800">{b.tour?.tenTour || 'Tour #' + b.tourId}</div>
                                            <div className="text-xs text-gray-500">Ngày đi: {new Date(b.ngayKhoiHanh).toLocaleDateString('vi-VN')}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-700">
                                                    {b.soLuongNguoiLon ? (
                                                        <>
                                                            <span>{b.soLuongNguoiLon} Lớn</span>
                                                            {b.soLuongTreEm ? <span className="mx-1">• {b.soLuongTreEm} Trẻ em</span> : ''}
                                                        </>
                                                    ) : (
                                                        <span>{b.soLuongNguoi} Khách</span>
                                                    )}
                                                </div>
                                                <div className="text-gray-400 text-xs mt-1">
                                                    Ngày đặt: {b.ngayDat ? new Date(b.ngayDat).toLocaleDateString('vi-VN') : 'N/A'}
                                                </div>
                                                {['Pending', 'Chờ thanh toán'].includes(b.trangThai) && b.ngayDat && (
                                                    <div className="mt-2">
                                                        <PaymentTimer createdAt={b.ngayDat} className="text-xs" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-blue-600 text-nowrap">{Number(b.tongTienThanhToan).toLocaleString()} ₫</td>
                                        <td className="p-4">
                                            <StatusBadge status={b.trangThai} />
                                        </td>
                                        {/* Actions Column */}
                                        <td className="p-4">
                                            <div className="flex flex-col gap-2">
                                                {/* Primary Status Actions */}
                                                {['Pending', 'Chờ thanh toán'].includes(b.trangThai) && (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleStatusUpdate(b.donDatId, 'Đã thanh toán')} className="flex-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 font-bold whitespace-nowrap">
                                                            Duyệt
                                                        </button>
                                                        <button onClick={() => handleStatusUpdate(b.donDatId, 'Đã hủy')} className="flex-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 font-bold whitespace-nowrap">
                                                            Hủy
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Refund Action for Admin */}
                                                {b.trangThai === 'Chờ hoàn tiền' && (
                                                    <button
                                                        onClick={() => setRefundDetailBooking(b)}
                                                        className="w-full mt-2 text-xs bg-red-100 text-red-700 px-2 py-1.5 rounded hover:bg-red-200 font-bold whitespace-nowrap flex items-center justify-center gap-1 animate-pulse border border-red-300"
                                                    >
                                                        <AlertOctagon size={14} /> Xử lý hoàn tiền
                                                    </button>
                                                )}

                                                {/* Edit/Delete Tools */}
                                                <div className="flex gap-2 mt-1">
                                                    <button
                                                        onClick={() => setEditBooking(b)}
                                                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-white text-blue-600 px-2 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors font-medium shadow-sm"
                                                        title="Sửa đơn hàng"
                                                    >
                                                        <Edit size={12} /> Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(b.donDatId)}
                                                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-white text-red-600 px-2 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors font-medium shadow-sm"
                                                        title="Xóa đơn hàng"
                                                    >
                                                        <Trash2 size={12} /> Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {bookings.length === 0 && <div className="p-8 text-center text-gray-500">Chưa có đơn đặt tour nào.</div>}
                </div>
            </div>

            {/* Edit Modal Refactored */}
            <BookingEditModal
                isOpen={!!editBooking}
                onClose={() => setEditBooking(null)}
                onSubmit={handleUpdate}
                bookingData={editBooking}
            />

            {/* Refund Detail Modal */}
            <BookingRefundDetailModal
                isOpen={!!refundDetailBooking}
                onClose={() => setRefundDetailBooking(null)}
                booking={refundDetailBooking}
                onSuccess={() => {
                    fetchBookings();
                    refreshCounts();
                }}
            />

            <AdminBookingCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreate}
            />

            {/* Contact Details Modal */}
            {selectedBooking && (() => {
                const contact = getContactInfo(selectedBooking);
                return (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBooking(null)}>
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg text-gray-800">Thông tin liên hệ (Người đặt)</h3>
                                <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600 transition"><X size={24} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><User size={20} /></div>
                                    <div>
                                        <div className="text-sm text-gray-500">Người liên hệ</div>
                                        <div className="font-bold text-gray-800 text-lg">{contact.name}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="bg-green-50 p-2 rounded-lg text-green-600"><Mail size={20} /></div>
                                    <div>
                                        <div className="text-sm text-gray-500">Email</div>
                                        <div className="font-medium text-gray-800">{contact.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><Phone size={20} /></div>
                                    <div>
                                        <div className="text-sm text-gray-500">Số điện thoại</div>
                                        <div className="font-medium text-gray-800">{contact.phone}</div>
                                    </div>
                                </div>
                                {selectedBooking.ghiChu && (
                                    <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-800 text-sm flex gap-3">
                                        <div className="text-yellow-600"><FileText size={20} /></div>
                                        <div>
                                            <div className="font-bold mb-1">Ghi chú & Địa chỉ:</div>
                                            {selectedBooking.ghiChu}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })()}
        </div>
    );
};
export default BookingManagement;
