import { useState, useEffect } from 'react';
import { couponService } from '../../services/couponService';
import { Ticket, Copy, Clock, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const MyCoupons = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const res = await couponService.getAvailable();
                setCoupons(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCoupons();
    }, []);

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success(`Đã sao chép mã ${code}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white py-12 mb-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-12 -mb-12"></div>

                <div className="container mx-auto px-4 relative z-10 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center justify-center md:justify-start gap-3">
                        <Ticket className="text-yellow-400" size={36} />
                        Kho Voucher
                    </h1>
                    <p className="text-blue-100 max-w-xl mx-auto md:mx-0 text-lg">
                        Săn mã giảm giá, đặt tour thả ga. Đừng bỏ lỡ các ưu đãi độc quyền dành riêng cho bạn!
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-5xl">
                {coupons.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl shadow-sm text-center border border-gray-100 max-w-2xl mx-auto">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-300">
                            <Ticket size={48} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Chưa có mã giảm giá nào</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Hiện tại bạn chưa có mã giảm giá khả dụng. Hãy quay lại sau hoặc tham gia các sự kiện để nhận mã nhé!
                        </p>
                        <Link to="/tours" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                            <ShoppingBag size={20} /> Khám phá tour ngay
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {coupons.map((coupon) => (
                            <div key={coupon._id} className="group bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition duration-300 flex overflow-hidden relative">
                                {/* Decor Circle */}
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full z-10"></div>
                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full z-10"></div>
                                {/* Dashed Line */}
                                <div className="absolute left-[130px] top-2 bottom-2 border-r-2 border-dashed border-gray-200 z-0"></div>

                                {/* Left: Value */}
                                <div className={`w-[130px] flex flex-col items-center justify-center p-4 text-white shrink-0 relative overflow-hidden ${coupon.type === 'PERCENT' ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                    }`}>
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition"></div>
                                    <h2 className="text-3xl font-black tracking-tighter shadow-sm">
                                        {coupon.type === 'PERCENT' ? `${coupon.value}%` : `${(coupon.value / 1000)}k`}
                                    </h2>
                                    <span className="text-xs uppercase font-bold tracking-widest mt-1 opacity-90">GIẢM</span>
                                </div>

                                {/* Right: Info */}
                                <div className="flex-1 p-5 pl-8 flex flex-col justify-between relative bg-white z-1">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="bg-gray-100 text-gray-800 font-mono font-bold px-3 py-1 rounded text-sm group-hover:bg-blue-50 group-hover:text-blue-700 transition">
                                                {coupon.code}
                                            </div>
                                            {coupon.maxDiscount > 0 && coupon.type === 'PERCENT' && (
                                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                                                    Max -{coupon.maxDiscount.toLocaleString()}đ
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1 mb-4">
                                            <p className="text-gray-500 text-xs flex items-center gap-1.5">
                                                <AlertCircle size={12} className="text-blue-500" />
                                                Đơn tối thiểu: <span className="font-bold text-gray-700">{coupon.minOrder.toLocaleString()}đ</span>
                                            </p>
                                            <p className="text-gray-500 text-xs flex items-center gap-1.5">
                                                <Clock size={12} className="text-orange-500" />
                                                Hết hạn: <span className="font-bold text-gray-700">{new Date(coupon.expiry).toLocaleDateString('vi-VN')}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2 border-t border-gray-50">
                                        <button
                                            onClick={() => copyToClipboard(coupon.code)}
                                            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group/btn"
                                        >
                                            <Copy size={16} className="group-hover/btn:scale-110 transition" /> Sao chép mã
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Promo Banner / Info */}
                {coupons.length > 0 && (
                    <div className="mt-12 bg-indigo-50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-100">
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-bold text-indigo-900 mb-2">Bạn đã sẵn sàng cho chuyến đi tiếp theo?</h3>
                            <p className="text-indigo-700 text-sm">Sử dụng mã giảm giá ngay để tiết kiệm chi phí cho kỳ nghỉ mơ ước của bạn.</p>
                        </div>
                        <Link to="/tours" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2 whitespace-nowrap">
                            Đặt tour ngay <ArrowRight size={18} />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCoupons;
