import React, { useState, useEffect } from 'react';
import type { Tour } from '../../types';
import { Ticket, CheckCircle, Loader } from 'lucide-react';
import { couponService } from '../../services/couponService';
import { toast } from 'react-hot-toast';
import CouponSelectionModal from './CouponSelectionModal';

export interface BookingFormProps {
    formData: {
        nguoiLienHe: string;
        sdtLienHe: string;
        emailLienHe?: string;
        soLuongNguoiLon: number;
        soLuongTreEm: number;
        ngayKhoiHanh: string;
        ghiChu?: string;
        couponCode?: string | null;
        discountAmount?: number;
        _id?: string;
        [key: string]: string | number | boolean | undefined | null; // Allow other fields
    };
    onChange: (data: BookingFormProps['formData']) => void;
    tour?: Tour | null;
}

const ContactSection: React.FC<{
    formData: BookingFormProps['formData'],
    onChange: (field: keyof BookingFormProps['formData'], value: string) => void
}> = ({ formData, onChange }) => (
    <>
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Người liên hệ *</label>
            <input
                type="text"
                required
                className="w-full p-3 border rounded-lg"
                value={formData.nguoiLienHe || ''}
                onChange={e => onChange('nguoiLienHe', e.target.value)}
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
                onChange={e => onChange('sdtLienHe', e.target.value)}
                placeholder="09xxx..."
            />
        </div>
        <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
                type="email"
                className="w-full p-3 border rounded-lg"
                value={formData.emailLienHe || ''}
                onChange={e => onChange('emailLienHe', e.target.value)}
                placeholder="khachhang@example.com (tùy chọn)"
            />
        </div>
    </>
);

const GuestsSection: React.FC<{
    formData: BookingFormProps['formData'],
    onChange: (field: keyof BookingFormProps['formData'], value: number) => void,
    isCustomTour?: boolean
}> = ({ formData, onChange, isCustomTour }) => (
    <>
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Số người lớn {isCustomTour && <span className="text-red-500 text-xs">(Tối thiểu 5)</span>}</label>
            <input
                type="number"
                min={isCustomTour ? 5 : 1}
                className="w-full p-3 border rounded-lg"
                value={formData.soLuongNguoiLon || 0}
                onChange={e => {
                    const val = Number(e.target.value);
                    onChange('soLuongNguoiLon', val);
                    // Optional: Immediate feedback or Toast here if violation? 
                    // Better to just enforce via min/validation on submit or simple toast if onChange tries to go below
                    if (isCustomTour && val < 5 && val !== 0) { // allow 0 temporarily if clearing? No.
                        // Actually standard input behavior lets users type. We will validate on blur or submit usually, 
                        // but setting min attribute helps UI.
                    }
                }}
                onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (isCustomTour && val < 5) {
                        toast.error("Tour thiết kế yêu cầu tối thiểu 5 người lớn");
                        onChange('soLuongNguoiLon', 5);
                    } else if (val < 1) {
                        onChange('soLuongNguoiLon', 1);
                    }
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
                onChange={e => onChange('soLuongTreEm', e.target.value === '' ? 0 : Number(e.target.value))}
            />
        </div>
    </>
);

const DepartureSection: React.FC<{
    tour: Tour | null | undefined,
    formData: BookingFormProps['formData'],
    onChange: (field: keyof BookingFormProps['formData'], value: string) => void
}> = ({ tour, formData, onChange }) => {
    const value = formData.ngayKhoiHanh ? (formData.ngayKhoiHanh.includes('T') ? formData.ngayKhoiHanh.split('T')[0] : formData.ngayKhoiHanh) : '';

    return (
        <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Ngày khởi hành *</label>
            {tour && Array.isArray(tour.ngayKhoiHanh) && tour.ngayKhoiHanh.length > 0 ? (
                <select
                    className="w-full p-3 border rounded-lg"
                    value={value}
                    onChange={e => onChange('ngayKhoiHanh', e.target.value)}
                >
                    <option value="">-- Chọn ngày --</option>
                    {tour.ngayKhoiHanh
                        .map((d: string | Date) => new Date(d))
                        .filter((d: Date) => d.getTime() >= new Date().setHours(0, 0, 0, 0))
                        .sort((a: Date, b: Date) => a.getTime() - b.getTime())
                        .map((date: Date, idx: number) => (
                            <option key={idx} value={date.toISOString().split('T')[0]}>
                                {date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' })}
                            </option>
                        ))
                    }
                    <option value="other">Khác (Liên hệ)</option>
                </select>
            ) : (
                <input
                    type="date"
                    className="w-full p-3 border rounded-lg"
                    value={value}
                    onChange={e => onChange('ngayKhoiHanh', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                />
            )}
        </div>
    );
};

const VoucherSection: React.FC<{
    couponInput: string,
    setCouponInput: (val: string) => void,
    handleApplyCoupon: () => void,
    isValidating: boolean,
    setIsCouponModalOpen: (val: boolean) => void,
    formData: BookingFormProps['formData'],
    onChange: (data: BookingFormProps['formData']) => void
}> = ({ couponInput, setCouponInput, handleApplyCoupon, isValidating, setIsCouponModalOpen, formData, onChange }) => (
    <div className="col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
        <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <Ticket size={16} className="text-blue-600" /> Mã giảm giá
        </label>
        <div className="flex gap-2">
            <input
                type="text"
                className="flex-1 p-2 border rounded-lg uppercase font-bold text-sm"
                placeholder="NHẬP MÃ TẠI ĐÂY"
                value={couponInput}
                onChange={e => setCouponInput(e.target.value.toUpperCase())}
            />
            <button
                type="button"
                id="apply-coupon-btn"
                onClick={handleApplyCoupon}
                disabled={isValidating || !couponInput}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
            >
                {isValidating ? <Loader size={16} className="animate-spin" /> : "Áp dụng"}
            </button>
            <button
                type="button"
                onClick={() => setIsCouponModalOpen(true)}
                className="bg-white border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition whitespace-nowrap"
            >
                Chọn Voucher
            </button>
            {formData.couponCode && (
                <button
                    type="button"
                    onClick={() => onChange({ ...formData, couponCode: null, discountAmount: 0 })}
                    className="text-red-600 text-sm font-bold px-2"
                >
                    Gỡ bỏ
                </button>
            )}
        </div>
        {formData.couponCode && (
            <div className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1">
                <CheckCircle size={14} /> Đã áp dụng mã {formData.couponCode}: -{formData.discountAmount?.toLocaleString()}đ
            </div>
        )}
    </div>
);

const PriceSummary: React.FC<{
    formData: BookingFormProps['formData'],
    baseTotalPrice: number,
    finalTotal: number
}> = ({ formData, baseTotalPrice, finalTotal }) => (
    <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="flex justify-between items-center text-sm mb-1 text-gray-600">
            <span>Tạm tính ({formData.soLuongNguoiLon} lớn, {formData.soLuongTreEm} trẻ):</span>
            <span className="font-medium">{baseTotalPrice.toLocaleString()}đ</span>
        </div>
        {(formData.discountAmount || 0) > 0 && (
            <div className="flex justify-between items-center text-sm mb-1 text-green-600">
                <span>Giảm giá từ Voucher:</span>
                <span className="font-medium">-{(formData.discountAmount || 0).toLocaleString()}đ</span>
            </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
            <span className="font-bold text-gray-800">Tổng cộng ước tính:</span>
            <span className="text-xl font-black text-blue-600">{finalTotal.toLocaleString()}đ</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 italic text-center">* Giá cuối cùng sẽ được tính lại chính xác tại bước lưu đơn.</p>
    </div>
);

const BookingForm: React.FC<BookingFormProps> = ({ formData, onChange, tour }) => {
    const [couponInput, setCouponInput] = useState(formData.couponCode || '');
    const [isValidating, setIsValidating] = useState(false);
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

    const handleChange = (field: keyof BookingFormProps['formData'], value: string | number) => {
        onChange({ ...formData, [field]: value });
    };

    let priceAdult = tour?.isTuChon ? Math.round((tour.tongGiaDuKien || 0) / (tour.soLuongCho || 1)) : (tour?.tongGiaDuKien || 0);
    if (tour && tour.discounts && formData.ngayKhoiHanh) {
        const selectedDate = formData.ngayKhoiHanh.includes('T') ? formData.ngayKhoiHanh.split('T')[0] : formData.ngayKhoiHanh;
        const discount = tour.discounts.find(d => new Date(d.date).toISOString().split('T')[0] === selectedDate);
        if (discount) {
            priceAdult = priceAdult * (1 - discount.percentage / 100);
        }
    }

    const priceChild = priceAdult * 0.75;
    const baseTotalPrice = (Number(formData.soLuongNguoiLon || 0) * priceAdult) + (Number(formData.soLuongTreEm || 0) * priceChild);
    const finalTotal = Math.max(0, baseTotalPrice - (formData.discountAmount || 0));

    const handleApplyCoupon = async () => {
        if (!couponInput) {
            return;
        }
        setIsValidating(true);
        try {
            const res = await couponService.validate(couponInput, baseTotalPrice, formData._id);
            onChange({ ...formData, couponCode: couponInput.toUpperCase(), discountAmount: res.data.discountAmount });
            toast.success("Áp dụng mã giảm giá thành công!");
        } catch (err: unknown) {
            const error = err as { response?: { data?: { msg?: string } } };
            toast.error(error.response?.data?.msg || "Mã giảm giá không hợp lệ");
            onChange({ ...formData, couponCode: null, discountAmount: 0 });
        } finally {
            setIsValidating(false);
        }
    };

    const handleSelectFromModal = (code: string) => {
        setCouponInput(code);
        setIsCouponModalOpen(false);
        setTimeout(() => {
            document.getElementById('apply-coupon-btn')?.click();
        }, 100);
    };

    useEffect(() => {
        const revalidate = async () => {
            if (formData.couponCode && baseTotalPrice > 0 && !isValidating) {
                try {
                    const res = await couponService.validate(formData.couponCode, baseTotalPrice, formData._id);
                    if (res.data.discountAmount !== formData.discountAmount) {
                        onChange({ ...formData, discountAmount: res.data.discountAmount });
                    }
                } catch {
                    onChange({ ...formData, couponCode: null, discountAmount: 0 });
                }
            }
        };
        const timer = setTimeout(revalidate, 500);
        return () => clearTimeout(timer);
    }, [formData.soLuongNguoiLon, formData.soLuongTreEm, formData.ngayKhoiHanh, formData.couponCode, baseTotalPrice, isValidating, formData._id, onChange, formData]);

    useEffect(() => {
        setCouponInput(formData.couponCode || '');
    }, [formData.couponCode]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ContactSection formData={formData} onChange={handleChange} />
            <GuestsSection formData={formData} onChange={handleChange} isCustomTour={tour?.isTuChon} />
            <DepartureSection tour={tour} formData={formData} onChange={handleChange} />
            <VoucherSection
                couponInput={couponInput}
                setCouponInput={setCouponInput}
                handleApplyCoupon={handleApplyCoupon}
                isValidating={isValidating}
                setIsCouponModalOpen={setIsCouponModalOpen}
                formData={formData}
                onChange={onChange}
            />
            <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú</label>
                <textarea
                    className="w-full p-3 border rounded-lg h-24"
                    value={formData.ghiChu || ''}
                    onChange={e => handleChange('ghiChu', e.target.value)}
                    placeholder="Ghi chú thêm..."
                />
            </div>
            <PriceSummary formData={formData} baseTotalPrice={baseTotalPrice} finalTotal={finalTotal} />
            <CouponSelectionModal
                isOpen={isCouponModalOpen}
                onClose={() => setIsCouponModalOpen(false)}
                onSelect={handleSelectFromModal}
                orderValue={baseTotalPrice}
                bookingId={formData._id}
            />
        </div>
    );
};

export default BookingForm;
