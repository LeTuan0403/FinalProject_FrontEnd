import React, { useState, useEffect } from 'react';
import { X, Loader, Plus } from 'lucide-react';
import { tourService } from '../../services/tourService';
import type { Tour } from '../../types';

interface AdminBookingCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

const AdminBookingCreateModal: React.FC<AdminBookingCreateModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [tours, setTours] = useState<Tour[]>([]);
    const [loadingTours, setLoadingTours] = useState(false);
    const [selectedTourId, setSelectedTourId] = useState<number | ''>('');
    const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

    const [formData, setFormData] = useState({
        nguoiLienHe: '',
        sdtLienHe: '',
        emailLienHe: '',
        soLuongNguoiLon: 1,
        soLuongTreEm: 0,
        ngayKhoiHanh: '',
        ghiChu: '',
        trangThai: 'Chờ thanh toán' // Default status
    });

    useEffect(() => {
        if (isOpen) {
            fetchTours();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedTourId) {
            const tour = tours.find(t => t.tourId === Number(selectedTourId));
            setSelectedTour(tour || null);
            // Reset date if tour changes
            setFormData(prev => ({ ...prev, ngayKhoiHanh: '' }));
        } else {
            setSelectedTour(null);
        }
    }, [selectedTourId, tours]);

    const fetchTours = async () => {
        try {
            setLoadingTours(true);
            const res = await tourService.getAll();
            setTours(res.data);
        } catch (error) {
            console.error("Failed to fetch tours", error);
        } finally {
            setLoadingTours(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTour) {
            alert("Vui lòng chọn tour!");
            return;
        }
        if (!formData.ngayKhoiHanh) {
            alert("Vui lòng chọn ngày khởi hành!");
            return;
        }

        // Calculate total price based on selected tour
        const priceAdult = selectedTour.tongGiaDuKien || 0;
        const priceChild = priceAdult * 0.75;
        const total = (formData.soLuongNguoiLon * priceAdult) + (formData.soLuongTreEm * priceChild);

        const payload = {
            ...formData,
            tourId: selectedTour.tourId,
            soLuongNguoi: Number(formData.soLuongNguoiLon) + Number(formData.soLuongTreEm),
            tongTienThanhToan: total
        };

        onSubmit(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Plus size={20} className="text-blue-600" />
                        Tạo Đơn Đặt Mới (Admin)
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Tour Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Chọn Tour *</label>
                        {loadingTours ? (
                            <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader size={16} className="animate-spin" /> Đang tải danh sách tour...</div>
                        ) : (
                            <select
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
                                value={selectedTourId}
                                onChange={e => setSelectedTourId(e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">-- Chọn Tour --</option>
                                {tours.map(tour => (
                                    <option key={tour.tourId} value={tour.tourId}>
                                        {tour.maTour || `TB-${tour.tourId}`} | {tour.tenTour}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Người liên hệ *</label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 border rounded-lg"
                                value={formData.nguoiLienHe}
                                onChange={e => setFormData({ ...formData, nguoiLienHe: e.target.value })}
                                placeholder="Tên khách hàng"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại *</label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 border rounded-lg"
                                value={formData.sdtLienHe}
                                onChange={e => setFormData({ ...formData, sdtLienHe: e.target.value })}
                                placeholder="09xxx..."
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full p-3 border rounded-lg"
                                value={formData.emailLienHe}
                                onChange={e => setFormData({ ...formData, emailLienHe: e.target.value })}
                                placeholder="khachhang@example.com (tùy chọn)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Số người lớn</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full p-3 border rounded-lg"
                                value={formData.soLuongNguoiLon}
                                onChange={e => {
                                    const val = e.target.value;
                                    setFormData({ ...formData, soLuongNguoiLon: val === '' ? '' : Number(val) } as any);
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Số trẻ em</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full p-3 border rounded-lg"
                                value={formData.soLuongTreEm}
                                onChange={e => {
                                    const val = e.target.value;
                                    setFormData({ ...formData, soLuongTreEm: val === '' ? '' : Number(val) } as any);
                                }}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Ngày khởi hành *</label>
                            {selectedTour?.ngayKhoiHanh && Array.isArray(selectedTour.ngayKhoiHanh) && selectedTour.ngayKhoiHanh.length > 0 ? (
                                <select
                                    className="w-full p-3 border rounded-lg"
                                    value={formData.ngayKhoiHanh}
                                    onChange={e => setFormData({ ...formData, ngayKhoiHanh: e.target.value })}
                                >
                                    <option value="">-- Chọn ngày --</option>
                                    {selectedTour.ngayKhoiHanh
                                        .map((d: any) => new Date(d))
                                        .filter((d: Date) => d.getTime() >= new Date().setHours(0, 0, 0, 0))
                                        .sort((a: Date, b: Date) => a.getTime() - b.getTime())
                                        .map((date: Date, idx: number) => {
                                            const dateStr = date.toISOString().split('T')[0];
                                            const displayStr = date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' });
                                            return <option key={idx} value={dateStr}>{displayStr}</option>;
                                        })
                                    }
                                    <option value="other">Khác (Liên hệ)</option>
                                </select>
                            ) : (
                                <input
                                    type="date"
                                    className="w-full p-3 border rounded-lg"
                                    value={formData.ngayKhoiHanh}
                                    onChange={e => setFormData({ ...formData, ngayKhoiHanh: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            )}
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái khởi tạo</label>
                            <select
                                className="w-full p-3 border rounded-lg"
                                value={formData.trangThai}
                                onChange={e => setFormData({ ...formData, trangThai: e.target.value })}
                            >
                                <option value="Chờ thanh toán">Chờ thanh toán</option>
                                <option value="Đã thanh toán">Đã thanh toán</option>
                                <option value="Hoàn tất">Hoàn tất</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">* Nếu chọn "Đã thanh toán" trở lên, hệ thống sẽ trừ số chỗ ngay lập tức.</p>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú</label>
                            <textarea
                                className="w-full p-3 border rounded-lg h-24"
                                value={formData.ghiChu}
                                onChange={e => setFormData({ ...formData, ghiChu: e.target.value })}
                                placeholder="Ghi chú thêm..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg text-gray-600 font-bold hover:bg-gray-100"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
                        >
                            Tạo Đơn
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminBookingCreateModal;
