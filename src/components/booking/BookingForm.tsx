import React from 'react';
import type { Tour } from '../../types';

interface BookingFormProps {
    formData: {
        nguoiLienHe: string;
        sdtLienHe: string;
        emailLienHe?: string;
        soLuongNguoiLon: number;
        soLuongTreEm: number;
        ngayKhoiHanh: string;
        ghiChu?: string;
    };
    onChange: (data: any) => void;
    tour?: Tour | null;
}

const BookingForm: React.FC<BookingFormProps> = ({ formData, onChange, tour }) => {

    const handleChange = (field: string, value: any) => {
        onChange({ ...formData, [field]: value });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Người liên hệ *</label>
                <input
                    type="text"
                    required
                    className="w-full p-3 border rounded-lg"
                    value={formData.nguoiLienHe || ''}
                    onChange={e => handleChange('nguoiLienHe', e.target.value)}
                    placeholder="Tên khách hàng"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại *</label>
                <input
                    type="text"
                    required
                    className="w-full p-3 border rounded-lg"
                    value={formData.sdtLienHe || ''}
                    onChange={e => handleChange('sdtLienHe', e.target.value)}
                    placeholder="09xxx..."
                />
            </div>
            <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input
                    type="email"
                    className="w-full p-3 border rounded-lg"
                    value={formData.emailLienHe || ''}
                    onChange={e => handleChange('emailLienHe', e.target.value)}
                    placeholder="khachhang@example.com (tùy chọn)"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Số người lớn</label>
                <input
                    type="number"
                    min="1"
                    className="w-full p-3 border rounded-lg"
                    value={formData.soLuongNguoiLon || 0}
                    onChange={e => {
                        const val = e.target.value;
                        handleChange('soLuongNguoiLon', val === '' ? 0 : Number(val));
                    }}
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Số trẻ em</label>
                <input
                    type="number"
                    min="0"
                    className="w-full p-3 border rounded-lg"
                    value={formData.soLuongTreEm || 0}
                    onChange={e => {
                        const val = e.target.value;
                        handleChange('soLuongTreEm', val === '' ? 0 : Number(val));
                    }}
                />
            </div>

            <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Ngày khởi hành *</label>
                {tour && Array.isArray(tour.ngayKhoiHanh) && tour.ngayKhoiHanh.length > 0 ? (
                    <select
                        className="w-full p-3 border rounded-lg"
                        value={formData.ngayKhoiHanh ? (formData.ngayKhoiHanh.includes('T') ? formData.ngayKhoiHanh.split('T')[0] : formData.ngayKhoiHanh) : ''}
                        onChange={e => handleChange('ngayKhoiHanh', e.target.value)}
                    >
                        <option value="">-- Chọn ngày --</option>
                        {tour.ngayKhoiHanh
                            .map((d: string | Date) => new Date(d))
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
                        value={formData.ngayKhoiHanh ? (formData.ngayKhoiHanh.includes('T') ? formData.ngayKhoiHanh.split('T')[0] : formData.ngayKhoiHanh) : ''}
                        onChange={e => handleChange('ngayKhoiHanh', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                    />
                )}
            </div>

            <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú</label>
                <textarea
                    className="w-full p-3 border rounded-lg h-24"
                    value={formData.ghiChu || ''}
                    onChange={e => handleChange('ghiChu', e.target.value)}
                    placeholder="Ghi chú thêm..."
                />
            </div>
        </div>
    );
};

export default BookingForm;
