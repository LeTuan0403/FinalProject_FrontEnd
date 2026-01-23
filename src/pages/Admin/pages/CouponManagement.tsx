import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Ticket, Check, X, Pencil, UserPlus, Search, User, Users } from 'lucide-react';
import { couponService } from '../../../services/couponService';
import { userService } from '../../../services/authService';

const CouponManagement = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create/Edit Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        type: 'PERCENT',
        value: 0,
        minOrder: 0,
        maxDiscount: 0,
        expiry: '',
        usageLimit: 0
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    // Assign Modal State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignCouponId, setAssignCouponId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userResults, setUserResults] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [assignLoading, setAssignLoading] = useState(false);

    useEffect(() => {
        fetchCoupons();
    }, []);

    // --- MAIN ACTIONS ---

    const fetchCoupons = async () => {
        try {
            const res = await couponService.getAll();
            setCoupons(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Lỗi tải danh sách mã giảm giá');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await couponService.update(editingId, formData);
                toast.success('Cập nhật mã giảm giá thành công');
            } else {
                await couponService.create(formData);
                toast.success('Tạo mã giảm giá thành công');
            }
            setShowModal(false);
            setEditingId(null);
            fetchCoupons();
            resetForm();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Lỗi xử lý');
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            type: 'PERCENT',
            value: 0,
            minOrder: 0,
            maxDiscount: 0,
            expiry: '',
            usageLimit: 0
        });
        setEditingId(null);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEdit = (coupon: any) => {
        setFormData({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minOrder: coupon.minOrder,
            maxDiscount: coupon.maxDiscount,
            expiry: new Date(coupon.expiry).toISOString().split('T')[0],
            usageLimit: coupon.usageLimit
        });
        setEditingId(coupon._id);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa mã này?')) return;
        try {
            await couponService.delete(id);
            toast.success('Xóa mã thành công');
            fetchCoupons();
        } catch (error) {
            console.error(error);
            toast.error('Lỗi xóa mã');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await couponService.toggle(id);
            fetchCoupons();
        } catch (error) {
            console.error(error);
            toast.error('Lỗi cập nhật trạng thái');
        }
    };

    // --- ASSIGNMENT ACTIONS ---

    useEffect(() => {
        if (showAssignModal) {
            handleAssignSearch(''); // Load initial list when modal opens
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAssignModal]);

    const handleAssignSearch = async (kw = searchTerm) => {
        setAssignLoading(true);
        try {
            const res = await userService.getAll({ keyword: kw });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = res.data as any;
            // Điều chỉnh tùy theo cấu trúc API trả về của bạn (data.data hoặc data)
            setUserResults(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
        } catch (error) {
            console.error(error);
            toast.error('Lỗi tìm kiếm người dùng');
        } finally {
            setAssignLoading(false);
        }
    };

    const handleAssignAll = async () => {
        if (!assignCouponId || !window.confirm('Bạn có chắc chắn muốn phát mã này cho TOÀN BỘ người dùng?')) return;
        try {
            await couponService.assignAll(assignCouponId);
            toast.success('Đã phát mã cho toàn bộ người dùng');
            setShowAssignModal(false);
            fetchCoupons();
        } catch (error) {
            console.error(error);
            toast.error('Lỗi phát mã');
        }
    };

    const handleAssignSubmit = async () => {
        if (!assignCouponId || selectedUsers.length === 0) return;
        try {
            await couponService.assign(assignCouponId, selectedUsers);
            toast.success(`Đã phát mã cho ${selectedUsers.length} người dùng`);
            setShowAssignModal(false);
            fetchCoupons();
            // Reset state
            setSelectedUsers([]);
            setSearchTerm('');
            setUserResults([]);
        } catch (error) {
            console.error(error);
            toast.error('Lỗi phát mã');
        }
    };

    const toggleUserSelect = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            {/* --- HEADER --- */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Ticket className="text-blue-600" /> Quản Lý Mã Giảm Giá
                </h1>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-bold shadow-md"
                >
                    <Plus size={20} /> Tạo Mã Mới
                </button>
            </div>

            {/* --- TABLE --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Mã Code</th>
                                <th className="p-4 font-semibold text-gray-600">Loại</th>
                                <th className="p-4 font-semibold text-gray-600">Giá Trị</th>
                                <th className="p-4 font-semibold text-gray-600">Đơn Tối Thiểu</th>
                                <th className="p-4 font-semibold text-gray-600">Hạn Dùng</th>
                                <th className="p-4 font-semibold text-gray-600">Đã Dùng</th>
                                <th className="p-4 font-semibold text-gray-600">Trạng Thái</th>
                                <th className="p-4 font-semibold text-gray-600">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {coupons.map((coupon) => (
                                <tr key={coupon._id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-bold text-blue-600">{coupon.code}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${coupon.type === 'PERCENT' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                            {coupon.type === 'PERCENT' ? '%' : 'VNĐ'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold">
                                        {coupon.type === 'PERCENT' ? `${coupon.value}%` : `${coupon.value.toLocaleString()}đ`}
                                    </td>
                                    <td className="p-4 text-gray-600">{coupon.minOrder.toLocaleString()}đ</td>
                                    <td className="p-4 text-gray-600">
                                        {new Date(coupon.expiry).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {coupon.usedCount} / {coupon.usageLimit === 0 ? '∞' : coupon.usageLimit}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggle(coupon._id)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                            >
                                                {coupon.isActive ? <Check size={12} /> : <X size={12} />}
                                                {coupon.isActive ? 'Hoạt động' : 'Đã khóa'}
                                            </button>

                                            {coupon.assignedTo && coupon.assignedTo.length > 0 && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <User size={12} /> Riêng tư ({coupon.assignedTo.length})
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setAssignCouponId(coupon._id);
                                                    setShowAssignModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition"
                                                title="Phát mã cho người dùng"
                                            >
                                                <UserPlus size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(coupon)}
                                                className="text-orange-500 hover:text-orange-700 p-2 hover:bg-orange-50 rounded-lg transition"
                                                title="Chỉnh sửa"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon._id)}
                                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                                                title="Xóa"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {coupons.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                        Chưa có mã giảm giá nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL CREATE/EDIT --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Cập Nhật Mã' : 'Tạo Mã Giảm Giá Mới'}</h3>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Mã Code (Ví dụ: SUMMER2024) <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 border rounded-lg font-bold uppercase"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="NHAPMAOODAY"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Loại giảm giá</label>
                                    <select
                                        className="w-full p-3 border rounded-lg"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="PERCENT">Theo Phần Trăm (%)</option>
                                        <option value="FIXED">Số Tiền (VNĐ)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Giá trị <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full p-3 border rounded-lg"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {formData.type === 'PERCENT' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Giảm tối đa (VNĐ)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full p-3 border rounded-lg"
                                        value={formData.maxDiscount}
                                        onChange={e => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                                        placeholder="Để 0 nếu không giới hạn"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">VD: Giảm 10% tối đa 200k. Nhập 200000.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Đơn tối thiểu (VNĐ)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full p-3 border rounded-lg"
                                    value={formData.minOrder}
                                    onChange={e => setFormData({ ...formData, minOrder: Number(e.target.value) })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Hạn sử dụng <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 border rounded-lg"
                                        value={formData.expiry}
                                        onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Giới hạn số lượt</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full p-3 border rounded-lg"
                                        value={formData.usageLimit}
                                        onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                                        placeholder="0 = Không giới hạn"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg"
                                >
                                    {editingId ? 'Cập Nhật' : 'Tạo Mã'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL ASSIGN USERS --- */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <UserPlus className="text-blue-600" /> Phát mã cho người dùng
                            </h3>
                            <button onClick={() => { setShowAssignModal(false); setSelectedUsers([]); setUserResults([]); setSearchTerm(''); }} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Tìm tên, email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAssignSearch()}
                                    />
                                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                </div>
                                <button
                                    onClick={() => handleAssignSearch()}
                                    disabled={assignLoading}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {assignLoading ? 'Tìm...' : 'Tìm kiếm'}
                                </button>
                            </div>

                            <div className="mb-6 flex justify-end">
                                <button
                                    onClick={handleAssignAll}
                                    className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-2"
                                >
                                    <Users size={16} /> + Phát cho TẤT CẢ người dùng
                                </button>
                            </div>

                            {userResults.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-gray-500 mb-2">Kết quả tìm kiếm:</p>
                                    {userResults.map(user => (
                                        <div
                                            key={user._id}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${selectedUsers.includes(user._id) ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                                            onClick={() => toggleUserSelect(user._id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedUsers.includes(user._id) ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                                                    {(user.hoTen || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800">{user.hoTen}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedUsers.includes(user._id) ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                                                {selectedUsers.includes(user._id) && <Check size={14} />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    {searchTerm ? 'Không tìm thấy người dùng nào' : 'Nhập từ khóa để tìm kiếm người dùng'}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">
                                Đã chọn: <strong className="text-blue-600">{selectedUsers.length}</strong> người dùng
                            </span>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="px-5 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleAssignSubmit}
                                    disabled={selectedUsers.length === 0}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg disabled:opacity-50 disabled:shadow-none"
                                >
                                    Phát mã ngay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponManagement;