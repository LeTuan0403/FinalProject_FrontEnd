import { useState, useEffect } from 'react';
import { Loader, Trash2, Search, ChevronLeft, ChevronRight, MapPin, ShoppingBag } from 'lucide-react';
import { userService } from '../../../services/authService';
import { bookingService } from '../../../services/bookingService';
import Sidebar from '../components/Sidebar';

const UserManagement = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [bookingCounts, setBookingCounts] = useState<Record<number, number>>({});

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    const pageSize = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
            fetchBookingStats();
        }, 500); // Debounce search
        return () => clearTimeout(timer);
    }, [page, searchTerm]);

    const fetchBookingStats = async () => {
        try {
            // Note: This is not efficient for large datasets but works given current API limitations
            const res = await bookingService.getAll();

            let bookings: any[] = [];
            const rawData = res.data as any; // Fix TS error
            if (Array.isArray(rawData)) {
                bookings = rawData;
            } else if (rawData && Array.isArray(rawData.data)) {
                bookings = rawData.data;
            }

            const counts: Record<number, number> = {};
            bookings.forEach((booking: any) => {
                if (booking.userId) {
                    counts[booking.userId] = (counts[booking.userId] || 0) + 1;
                }
            });

            setBookingCounts(counts);
        } catch (err) {
            console.error("Failed to fetch booking stats", err);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await userService.getAll({
                keyword: searchTerm,
                page: page,
                pageSize: pageSize
            });

            // Handle Paginated Response: { data, total, totalPages, ... }
            if (res.data && Array.isArray(res.data.data)) {
                setUsers(res.data.data);
                setTotalPages(res.data.totalPages || 1);
                setTotalUsers(res.data.total || 0);
            } else {
                // Fallback for flat array if backend changes back
                setUsers(Array.isArray(res.data) ? res.data : []);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
            alert("Không thể tải danh sách người dùng. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            try {
                await userService.delete(id);
                setUsers(prev => prev.filter(u => u.userId !== id));
                alert('Đã xóa người dùng!');
                fetchUsers(); // Refresh to update count/pagination
            } catch (error) {
                alert('Xóa thất bại (Có thể do ràng buộc dữ liệu)');
            }
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 ml-64 overflow-auto p-8">
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <h1 className="text-3xl font-bold text-gray-800">Quản lý Người dùng ({totalUsers})</h1>

                        <div className="relative w-full md:w-96">
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên, email, sđt..."
                                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1); // Reset to page 1 on search
                                }}
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center items-center py-20 text-gray-500 gap-2"><Loader className="animate-spin" /> Đang tải danh sách...</div>
                        ) : (
                            <>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="p-4 font-bold text-gray-600">ID / Tên</th>
                                            <th className="p-4 font-bold text-gray-600">Liên hệ</th>
                                            <th className="p-4 font-bold text-gray-600">Địa chỉ</th>
                                            <th className="p-4 font-bold text-gray-600 text-center">Số Tour</th>
                                            <th className="p-4 font-bold text-gray-600">Vai trò</th>
                                            <th className="p-4 font-bold text-gray-600">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map((u) => (
                                            <tr key={u.userId} className="hover:bg-gray-50">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <div className="font-bold text-gray-800">{u.hoTen}</div>
                                                            <div className="text-xs text-gray-500 font-mono" title={`ID đầy đủ: ${u.userId}`}>
                                                                ID: {u.userId.toString().length > 10 ? u.userId.toString().slice(0, 8) + '...' : u.userId}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                                ĐK: {new Date(u.ngayTao || Date.now()).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm">
                                                        <div className="text-gray-800">{u.email}</div>
                                                        <div className="text-gray-500">{u.soDienThoai || 'N/A'}</div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-600 text-sm max-w-xs truncate" title={u.diaChi}>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={14} className="text-gray-400" />
                                                        {u.diaChi || 'Chưa cập nhật'}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                                        <ShoppingBag size={14} />
                                                        {bookingCounts[u.userId] || 0}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                                        {u.isAdmin ? 'Admin' : 'Customer'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => handleDelete(u.userId)}
                                                        className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                                                        title="Xóa người dùng"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {users.length === 0 && <div className="p-8 text-center text-gray-500">Không tìm thấy người dùng nào.</div>}

                                {/* Pagination Controls */}
                                <div className="p-4 border-t flex justify-end items-center gap-2">
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-sm font-medium text-gray-600">Trang {page} / {totalPages}</span>
                                    <button
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
