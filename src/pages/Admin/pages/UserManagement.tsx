import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Trash2, Search, ChevronLeft, ChevronRight, MapPin, ShoppingBag } from 'lucide-react';
import { userService } from '../../../services/authService';
import { bookingService } from '../../../services/bookingService';

const UserManagement = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, searchTerm, filterRole]);

    const fetchBookingStats = async () => {
        try {
            // Note: This is not efficient for large datasets but works given current API limitations
            const res = await bookingService.getAll();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let bookings: any[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rawData = res.data as any; // Fix TS error
            if (Array.isArray(rawData)) {
                bookings = rawData;
            } else if (rawData && Array.isArray(rawData.data)) {
                bookings = rawData.data;
            }

            const counts: Record<number, number> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                role: filterRole !== 'all' ? filterRole : undefined,
                page: page,
                pageSize: pageSize
            });

            // Handle Paginated Response: { data, total, totalPages, ... }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = res.data as any;
            if (data && Array.isArray(data.data)) {
                setUsers(data.data);
                setTotalPages(data.totalPages || 1);
                setTotalUsers(data.total || 0);
            } else {
                // Fallback for flat array if backend changes back
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setUsers(Array.isArray(res.data) ? res.data as any[] : []);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast.error("Không thể tải danh sách người dùng. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            try {
                await userService.delete(id);
                setUsers(prev => prev.filter(u => u.userId !== id));
                toast.success('Đã xóa người dùng!');
                fetchUsers(); // Refresh to update count/pagination
            } catch (error) {
                toast.error('Xóa thất bại (Có thể do ràng buộc dữ liệu)');
            }
        }
    };

    const handleRoleChange = async (userId: number, newRole: number) => {
        const roleName = newRole === 1 ? "QUẢN TRỊ VIÊN (Admin)" : "KHÁCH HÀNG (Customer)";
        const confirmMsg = `⚠️ CẢNH BÁO QUAN TRỌNG ⚠️\n\nBạn đang thực hiện thay đổi quyền hạn của tài khoản này thành: ${roleName}.\n\n- Nếu cấp quyền Admin: Người dùng này sẽ có toàn quyền quản lý hệ thống.\n- Nếu hủy quyền Admin: Người dùng sẽ mất quyền truy cập trang quản trị.\n\nBạn có chắc chắn muốn tiếp tục không?`;

        if (window.confirm(confirmMsg)) {
            try {
                await userService.updateRole(userId, newRole);
                setUsers(prev => prev.map(u =>
                    u.userId === userId ? { ...u, isAdmin: newRole } : u
                ));
                toast.success("Đã cập nhật vai trò thành công!");
            } catch (error) {
                console.error("Failed to update role", error);
                toast.error("Cập nhật thất bại. Vui lòng thử lại.");
                // Revert visual change if needed by forcing re-render or just fetching again, 
                // but since we only update state on success, the UI might be out of sync if we used a controlled input without internal state management for the specific row?
                // Actually, the Select value relies on `users` state. If this fails, `users` isn't updated, so it should snap back on re-render?
                // Getting pure controlled component behavior requires the `value` prop to reflect `u.isAdmin`.
                // If the user changed the select, standard React generic error handling usually requires a force update or keeping track of 'optimistic' UI.
                // For simplicity: fetchUsers();
                fetchUsers();
            }
        } else {
            // If cancelled, we might need to force the select back to original value if it was a controlled input that already changed? 
            // In React, if the state didn't change, the value prop didn't change, so the UI should remain/revert.
            // But with native select onChange, sometimes it visually switches. 
            // We can ensure it stays correct by explicit value binding, which we have.
            // However, to be safe, we can just trigger a re-render or do nothing since state didn't change.
            // A key trick is often adding a 'key' to the row or forcing update, but let's see.
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Quản lý Người dùng ({totalUsers})</h1>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
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
                    <select
                        value={filterRole}
                        onChange={(e) => {
                            setFilterRole(e.target.value);
                            setPage(1);
                        }}
                        className="w-full md:w-auto px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white text-gray-700 font-medium"
                    >
                        <option value="all">Tất cả vai trò</option>
                        <option value="1">Quản trị viên (Admin)</option>
                        <option value="0">Khách hàng</option>
                    </select>
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
                                {users.filter(u => filterRole === 'all' || u.isAdmin === Number(filterRole)).map((u) => (
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
                                            <div className="relative w-32">
                                                <select
                                                    value={u.isAdmin ? "1" : "0"}
                                                    onChange={(e) => handleRoleChange(u.userId, Number(e.target.value))}
                                                    className={`appearance-none w-full pl-3 pr-8 py-2 rounded-lg text-xs font-bold border cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-opacity-50 ${u.isAdmin
                                                        ? 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-400'
                                                        : 'bg-green-50 text-green-700 border-green-200 focus:ring-green-400'
                                                        }`}
                                                >
                                                    <option value="0">Khách hàng</option>
                                                    <option value="1">Admin</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                                </div>
                                            </div>
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
    );
};

export default UserManagement;
