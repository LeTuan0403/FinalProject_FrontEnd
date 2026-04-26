import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, MapPin, Clock, DollarSign, X } from 'lucide-react';
import { diaDiemService } from '../../../services/tourService';
import type { DiaDiem } from '../../../types';
import UploadImage from '../components/UploadImage';

const LocationManagement = () => {
    const [locations, setLocations] = useState<DiaDiem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLoc, setEditingLoc] = useState<DiaDiem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPrice, setFilterPrice] = useState('all'); // all, free, paid

    // Form State
    const [formData, setFormData] = useState<Partial<DiaDiem>>({
        tenDiaDiem: '',
        moTa: '',
        hinhAnh: '',
        diaChiCuThe: '',
        giaVe: 0,
        thoiGianThamQuanDuKien: 2
    });

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const res = await diaDiemService.getAll();
            setLocations(res.data);
        } catch (error) {
            console.error("Failed to fetch locations", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingLoc) {
                // Optimistic Update
                await diaDiemService.update(editingLoc.diaDiemId, formData);
                setLocations(prev => prev.map(l => l.diaDiemId === editingLoc.diaDiemId ? { ...l, ...formData } as DiaDiem : l));
                toast.success("Cập nhật địa điểm thành công!");
            } else {
                const res = await diaDiemService.create(formData);
                if (res.data) {
                    setLocations(prev => [res.data, ...prev]);
                    toast.success("Thêm địa điểm thành công!");
                }
            }
            setShowModal(false);
            setEditingLoc(null);
            setFormData({
                tenDiaDiem: '',
                moTa: '',
                hinhAnh: '',
                diaChiCuThe: '',
                giaVe: 0,
                thoiGianThamQuanDuKien: 2
            });
            // DO NOT fetchLocations() to enable silent update
        } catch (error) {
            console.error("Submit failed", error);
            toast.error("Có lỗi xảy ra!");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa địa điểm này?")) { return; }
        try {
            await diaDiemService.delete(id);
            setLocations(prev => prev.filter(l => l.diaDiemId !== id));
        } catch (error) {
            console.error("Delete failed", error);
            toast.error("Không thể xóa địa điểm (có thể đang được sử dụng trong Tour).");
        }
    };

    const openEdit = (loc: DiaDiem) => {
        setEditingLoc(loc);
        setFormData({ ...loc });
        setShowModal(true);
    };

    const openAdd = () => {
        setEditingLoc(null);
        setFormData({
            tenDiaDiem: '',
            moTa: '',
            hinhAnh: '',
            diaChiCuThe: '',
            giaVe: 0,
            thoiGianThamQuanDuKien: 2
        });
        setShowModal(true);
    };

    const filtered = locations.filter(l => {
        const matchesSearch = l.tenDiaDiem.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              l.diaChiCuThe?.toLowerCase().includes(searchTerm.toLowerCase());
                              
        const price = l.giaVe || 0;
        const matchesPrice = filterPrice === 'all' ? true :
                             filterPrice === 'free' ? price === 0 :
                             price > 0;
                             
        return matchesSearch && matchesPrice;
    });

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản Lý Địa Điểm</h1>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} /> Thêm Địa Điểm
                </button>
            </div>

            {/* Search & Filter */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm địa điểm..."
                        className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={filterPrice}
                    onChange={(e) => setFilterPrice(e.target.value)}
                    className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700 font-medium"
                >
                    <option value="all">Tất cả giá vé</option>
                    <option value="free">Miễn phí</option>
                    <option value="paid">Có phí</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4">Hình ảnh</th>
                            <th className="p-4">Tên địa điểm</th>
                            <th className="p-4">Chi tiết</th>
                            <th className="p-4 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Đang tải...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Không tìm thấy địa điểm nào.</td></tr>
                        ) : filtered.map(loc => (
                            <tr key={loc.diaDiemId} className="hover:bg-gray-50 transition">
                                <td className="p-4">
                                    <img
                                        src={loc.hinhAnh || 'https://placehold.co/100'}
                                        alt={loc.tenDiaDiem}
                                        className="w-16 h-16 object-cover rounded-lg shadow-sm"
                                    />
                                </td>
                                <td className="p-4 font-medium text-gray-800">
                                    <div className="text-lg">{loc.tenDiaDiem}</div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <MapPin size={14} /> {loc.diaChiCuThe || 'Chưa cập nhật'}
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={14} className="text-green-500" />
                                        Giá vé: <span className="font-bold text-green-700">{loc.giaVe?.toLocaleString()} đ</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-orange-500" />
                                        Tham quan: {loc.thoiGianThamQuanDuKien}h
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => openEdit(loc)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                                            title="Sửa"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(loc.diaDiemId)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                                            title="Xóa"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md z-10">
                            <div>
                                <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {editingLoc ? 'Cập nhật Địa Điểm' : 'Thêm Địa Điểm Mới'}
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">Điền thông tin chi tiết về địa điểm du lịch</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Column: Inputs */}
                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tên địa điểm <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-semibold text-gray-800"
                                                value={formData.tenDiaDiem}
                                                onChange={e => setFormData({ ...formData, tenDiaDiem: e.target.value })}
                                                required
                                                placeholder="Ví dụ: Vịnh Hạ Long"
                                            />
                                            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Địa chỉ cụ thể <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-gray-800"
                                                value={formData.diaChiCuThe || ''}
                                                onChange={e => setFormData({ ...formData, diaChiCuThe: e.target.value })}
                                                required
                                                placeholder="Số nhà, đường, quận/huyện..."
                                            />
                                            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Giá vé (VNĐ)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full pl-9 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none font-bold text-gray-800"
                                                    value={formData.giaVe ?? 0}
                                                    onKeyDown={(e) => ["-", "e", "E", "+"].includes(e.key) && e.preventDefault()}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setFormData({ ...formData, giaVe: val === '' ? 0 : Math.max(0, Number(val)) })
                                                    }}
                                                    onBlur={() => {
                                                        if (formData.giaVe === undefined) {
                                                            setFormData({ ...formData, giaVe: 0 });
                                                        }
                                                    }}
                                                />
                                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Thời gian (Giờ)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    className="w-full pl-9 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none font-bold text-gray-800"
                                                    value={formData.thoiGianThamQuanDuKien ?? 0}
                                                    onKeyDown={(e) => ["-", "e", "E", "+"].includes(e.key) && e.preventDefault()}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setFormData({ ...formData, thoiGianThamQuanDuKien: val === '' ? 0 : Math.max(0, Number(val)) })
                                                    }}
                                                    onBlur={() => {
                                                        if (formData.thoiGianThamQuanDuKien === undefined) {
                                                            setFormData({ ...formData, thoiGianThamQuanDuKien: 0 });
                                                        }
                                                    }}
                                                />
                                                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Image Upload */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hình ảnh đại diện</label>
                                    <div className="h-full">
                                        <UploadImage
                                            label="Tải lên hình ảnh"
                                            currentImage={formData.hinhAnh}
                                            onUpload={(url) => setFormData({ ...formData, hinhAnh: url })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mô tả chi tiết</label>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl h-32 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-700 leading-relaxed resize-none"
                                    value={formData.moTa || ''}
                                    onChange={e => setFormData({ ...formData, moTa: e.target.value })}
                                    placeholder="Mô tả về địa điểm này..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-all duration-200 hover:scale-[1.02]"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02]"
                                >
                                    {editingLoc ? 'Lưu Thay Đổi' : 'Tạo Địa Điểm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationManagement;
