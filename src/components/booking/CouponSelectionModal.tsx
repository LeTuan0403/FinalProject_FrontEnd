import React, { useState, useEffect, useCallback } from 'react';
import { X, Ticket, Clock, Info } from 'lucide-react';
import { couponService } from '../../services/couponService';
import { toast } from 'react-hot-toast';

interface CouponSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (code: string) => void;
    orderValue: number;
    bookingId?: string;
}

interface Coupon {
    _id: string;
    code: string;
    type: string;
    value: number;
    minOrder: number;
    maxDiscount: number;
    expiry: string;
}

const CouponSelectionModal: React.FC<CouponSelectionModalProps> = ({ isOpen, onClose, onSelect, orderValue, bookingId }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const res = await couponService.getAvailable(bookingId);
            setCoupons(res.data);
        } catch (error) {
            toast.error("Không thể tải danh sách voucher");
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        if (isOpen) {
            fetchCoupons();
        }
    }, [isOpen, fetchCoupons]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div className="flex items-center gap-2">
                        <Ticket size={24} />
                        <h3 className="font-bold text-xl uppercase tracking-wider">Kho Voucher của bạn</h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-gray-50 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                            <p className="font-medium">Đang tìm voucher tốt nhất...</p>
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Ticket size={32} className="text-gray-400" />
                            </div>
                            <p className="text-gray-400 font-bold uppercase text-sm">Kho voucher hiện tại trống</p>
                        </div>
                    ) : (
                        coupons.map((coupon) => {
                            const isEligible = orderValue >= coupon.minOrder;
                            return (
                                <div
                                    key={coupon._id}
                                    className={`relative bg-white rounded-2xl border-2 p-1 transition-all group ${isEligible ? 'border-blue-100 hover:border-blue-400 cursor-pointer shadow-sm hover:shadow-lg' : 'opacity-60 border-gray-100 grayscale'}`}
                                    onClick={() => isEligible && onSelect(coupon.code)}
                                >
                                    <div className="flex">
                                        {/* Left Ticket Stub */}
                                        <div className={`w-24 p-2 flex flex-col items-center justify-center rounded-xl ${isEligible ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`}>
                                            <span className="text-xs uppercase font-bold opacity-80">Giảm</span>
                                            <span className="text-xl font-black">
                                                {coupon.type === 'PERCENT' ? `${coupon.value}%` : `${(coupon.value / 1000).toLocaleString()}k`}
                                            </span>
                                        </div>

                                        {/* Main content */}
                                        <div className="flex-1 p-4">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-extrabold text-gray-800 text-lg tracking-tight">{coupon.code}</h4>
                                                {isEligible && (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase">Khả dụng</span>
                                                )}
                                            </div>

                                            <p className="text-xs text-gray-600 line-clamp-1 mb-3">
                                                Áp dụng cho đơn từ {coupon.minOrder.toLocaleString()}đ
                                                {coupon.maxDiscount > 0 && ` (Tối đa ${coupon.maxDiscount.toLocaleString()}đ)`}
                                            </p>

                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                                                    <Clock size={12} />
                                                    HSD: {new Date(coupon.expiry).toLocaleDateString('vi-VN')}
                                                </div>

                                                {!isEligible && (
                                                    <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg">
                                                        <Info size={12} /> Còn thiếu {(coupon.minOrder - orderValue).toLocaleString()}đ
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Decoration Circles */}
                                    <div className="absolute top-1/2 left-[-6px] -translate-y-1/2 w-3 h-3 bg-gray-50 rounded-full border-r-2 border-gray-100"></div>
                                    <div className="absolute top-1/2 left-[90px] -translate-y-1/2 w-3 h-3 bg-gray-50 rounded-full border-2 border-gray-100"></div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-6 bg-white border-t border-gray-100">
                    <p className="text-[11px] text-gray-400 text-center italic mb-4">Mã giảm giá sẽ được áp dụng trực tiếp vào tổng tiền ước tính của đơn hàng.</p>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition uppercase tracking-widest text-sm"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CouponSelectionModal;
