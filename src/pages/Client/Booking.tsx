import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AxiosError } from 'axios';
import { isFutureDate, getLocalDateStr } from '../../utils/dateUtils';
import { tourService } from '../../services/tourService';
import { bookingService } from '../../services/bookingService';
import type { Tour } from '../../types';
import { couponService } from '../../services/couponService';
import { X, Loader, AlertTriangle, CheckCircle, Ticket, List } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// eslint-disable-next-line complexity
const Booking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [tour, setTour] = useState<Tour | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
    const [successModal, setSuccessModal] = useState<{ isOpen: boolean; bookingId: string }>({ isOpen: false, bookingId: '' });

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [isCouponApplied, setIsCouponApplied] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [appliedCouponData, setAppliedCouponData] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
    const [showCouponModal, setShowCouponModal] = useState(false);

    // Form Stats
    const [formData, setFormData] = useState({
        fullName: user?.hoTen || '',
        email: '',
        phone: '',
        address: '',
        departureDate: '',
        adults: 1 as number | string,
        children: 0 as number | string,
        note: ''
    });

    const [isConfirming, setIsConfirming] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('transfer');

    const handleQuantityChange = (field: 'adults' | 'children', value: string) => {
        if (value === '') {
            setFormData(prev => ({ ...prev, [field]: '' }));
            return;
        }
        const num = parseInt(value);
        setFormData(prev => ({ ...prev, [field]: isNaN(num) ? '' : num }));
    };

    useEffect(() => {
        const fetchTour = async () => {
            if (!id) { return; }
            try {
                setLoading(true);
                const res = await tourService.getById(id as string);
                setTour(res.data);

                // Smart Date Selection: Pick the first available future date if array exists
                // Note: res.data might differ if we populated availability in tourController.
                // Assuming tourController sends { ...tour, availability: [{ date, bookedSeats, remainingSeats }] }

                const rawDates = res.data.ngayKhoiHanh;
                const availabilityMap: Record<string, number> = {};

                // Map availability if provided by backend
                // If not provided (old backend), we fallback to global 'soLuongCho' which is now static Max Capacity
                if (res.data.availability && Array.isArray(res.data.availability)) {
                    res.data.availability.forEach((item: { date: string; remainingSeats: number }) => {
                        // Normalize date key to YYYY-MM-DD
                        const dateKey = new Date(item.date).toISOString().split('T')[0];
                        availabilityMap[dateKey] = item.remainingSeats;
                    });
                }

                let initialDate = "";
                if (rawDates && Array.isArray(rawDates) && rawDates.length > 0) {
                    const validDates = rawDates
                        .map((d: string) => {
                            const dateObj = new Date(d);
                            const dateStr = dateObj.toISOString().split('T')[0];
                            // Check if we have specific remaining seats, otherwise use global max (less reliable now) or assume available
                            // If backend sends availability, use it. If not, assume tour.soLuongCho (legacy behavior, but we stopped mutating it).
                            // Ideally, if availability is missing, we treat it as max capacity.
                            const remaining = availabilityMap[dateStr] !== undefined ? availabilityMap[dateStr] : res.data.soLuongCho;

                            return { date: dateObj, dateStr, remaining };
                        })
                        .filter((item: { dateStr: string }) => {
                            return isFutureDate(item.dateStr);
                        })
                        .sort((a: { date: Date }, b: { date: Date }) => a.date.getTime() - b.date.getTime());

                    // Find first date with seats > 0
                    const firstAvailable = validDates.find((item: { remaining: number | undefined; dateStr: string }) => (item.remaining || 0) > 0);
                    if (firstAvailable) {
                        initialDate = firstAvailable.dateStr;
                    }

                    // We can also store this availability state to use in render
                    setTour({ ...res.data, availabilityMap } as Tour & { availabilityMap: Record<string, number> });

                    // Re-book Data Handling
                    const rebookData = location.state?.rebookData;

                    setFormData(prev => ({
                        ...prev,
                        departureDate: initialDate,
                        fullName: rebookData?.nguoiLienHe || user?.hoTen || prev.fullName,
                        email: rebookData?.emailLienHe || prev.email,
                        phone: rebookData?.sdtLienHe || prev.phone,
                        address: (rebookData?.ghiChu?.match(/Địa chỉ: (.*?)\./) || [])[1] || prev.address,
                        adults: rebookData ? rebookData.soLuongNguoiLon : (res.data.isTuChon ? (res.data.soLuongCho || 1) : 1),
                        children: rebookData ? rebookData.soLuongTreEm : 0,
                        note: rebookData ? (rebookData.ghiChu?.match(/Ghi chú: (.*?)\./) || [])[1] : ''
                    }));
                } else {
                    // Re-book Data Handling (No dates case)
                    const rebookData = location.state?.rebookData;
                    setFormData(prev => ({
                        ...prev,
                        fullName: rebookData?.nguoiLienHe || user?.hoTen || prev.fullName,
                        email: rebookData?.emailLienHe || prev.email,
                        phone: rebookData?.sdtLienHe || prev.phone,
                        address: (rebookData?.ghiChu?.match(/Địa chỉ: (.*?)\./) || [])[1] || prev.address,
                        adults: rebookData ? rebookData.soLuongNguoiLon : (res.data.isTuChon ? (res.data.soLuongCho || 1) : 1),
                        children: rebookData ? rebookData.soLuongTreEm : 0,
                        note: rebookData ? (rebookData.ghiChu?.match(/Ghi chú: (.*?)\./) || [])[1] : ''
                    }));
                }
            } catch (err) {
                setError('Không thể tải thông tin tour');
            } finally {
                setLoading(false);
            }
        };

        fetchTour();
    }, [id, user?.hoTen, location.state]);

    // For Custom Tour, tongGiaDuKien is TOTAL. Retrieve Unit Price by dividing by capacity.
    // For Standard Tour, tongGiaDuKien is Unit Price.
    let priceAdult = 0;
    if (tour) {
        priceAdult = tour.isTuChon ? Math.round(tour.tongGiaDuKien / (tour.soLuongCho || 1)) : tour.tongGiaDuKien;
    }

    // Check for Discount on selected date
    let appliedDiscount = 0;
    if (tour && tour.discounts && formData.departureDate) {
        const selectedDateStr = formData.departureDate; // Already YYYY-MM-DD from select/input
        const discount = tour.discounts.find(d => {
            const dDateStr = getLocalDateStr(new Date(d.date));
            return dDateStr === selectedDateStr;
        });

        if (discount) {
            appliedDiscount = discount.percentage;
            priceAdult = priceAdult * (1 - appliedDiscount / 100);
        }
    }

    const priceChild = priceAdult * 0.75; // 75% for children
    const baseTotalPrice = (Number(formData.adults || 0) * priceAdult) + (Number(formData.children || 0) * priceChild);
    const totalPrice = Math.max(0, baseTotalPrice - couponDiscount);

    interface Voucher {
        _id?: string;
        code: string;
        type: string;
        value: number;
        minOrder: number;
        maxDiscount: number;
        expiry?: string;
        potentialDiscount?: number;
    }

    // Helper to calc discount for sorting/validation
    const calcDiscount = useCallback((coupon: Voucher, price: number) => {
        if (price < coupon.minOrder) {
            return 0;
        }
        let discount = 0;
        if (coupon.type === 'PERCENT') {
            discount = (price * coupon.value) / 100;
            if (coupon.maxDiscount > 0) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        } else {
            discount = coupon.value;
        }
        return Math.min(discount, price);
    }, []);

    // Auto-fetch and organize coupons
    useEffect(() => {
        const fetchAndOptimize = async () => {
            if (!baseTotalPrice || !tour) {
                return;
            }
            try {
                const res = await couponService.getAvailable();
                const rawCoupons: Voucher[] = res.data;

                // Process Coupons
                const processed = rawCoupons.map((c: Voucher) => ({
                    ...c,
                    potentialDiscount: calcDiscount(c, baseTotalPrice)
                }))
                    .filter((c: Voucher) => (c.potentialDiscount || 0) > 0)
                    .sort((a: Voucher, b: Voucher) => (b.potentialDiscount || 0) - (a.potentialDiscount || 0));

                setAvailableCoupons(processed);

                // Auto Apply Best Coupon (ONLY if not applied yet, AND available)
                if (!isCouponApplied && processed.length > 0) {
                    const best = processed[0];
                    setCouponCode(best.code);
                    setCouponDiscount(best.potentialDiscount);
                    setAppliedCouponData(best);
                    setIsCouponApplied(true);
                }
            } catch (error) {
                // Ignore coupon fetch error
            }
        };

        if (user && formData.adults && !loading) { // Logic triggers when price relevant params exist
            fetchAndOptimize();
        }
    }, [baseTotalPrice, user, formData.adults, formData.children, loading, isCouponApplied, tour, calcDiscount]);

    // REAL-TIME RECALCULATION: Keep discount synced with guest count
    useEffect(() => {
        if (isCouponApplied && appliedCouponData) {
            const newDiscount = calcDiscount(appliedCouponData, baseTotalPrice);
            if (newDiscount !== couponDiscount) {
                setCouponDiscount(newDiscount);
                if (newDiscount === 0 && baseTotalPrice < (appliedCouponData.minOrder || 0)) {
                    toast.error(`Đơn hàng hiện thấp hơn mức tối thiểu (${appliedCouponData.minOrder.toLocaleString()}đ) để dùng mã này.`);
                }
            }
        }
    }, [baseTotalPrice, isCouponApplied, appliedCouponData, couponDiscount, calcDiscount]);

    if (loading) {
        return <div className="min-h-screen flex text-center justify-center items-center text-gray-500 gap-2"><Loader className="animate-spin" /> Loading tour info...</div>;
    }
    if (error || !tour) {
        return <div className="min-h-screen flex text-center justify-center items-center text-red-500">{error || 'Tour not found'}</div>;
    }

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error("Vui lòng nhập mã giảm giá");
            return;
        }
        try {
            const res = await couponService.validate(couponCode, baseTotalPrice);
            setAppliedCouponData(res.data.coupon);
            setCouponDiscount(res.data.discountAmount);
            setIsCouponApplied(true);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { msg?: string } } };
            setCouponDiscount(0);
            setIsCouponApplied(false);
            toast.error(error.response?.data?.msg || "Mã giảm giá không hợp lệ");
        }
    };

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!formData.fullName) { errors.fullName = "Vui lòng nhập họ tên"; }
        if (!formData.email) { errors.email = "Vui lòng nhập email"; }
        if (!formData.phone) { errors.phone = "Vui lòng nhập số điện thoại"; }
        if (!formData.address) { errors.address = "Vui lòng nhập địa chỉ"; }
        if (!formData.adults || Number(formData.adults) <= 0) { errors.adults = "Số lượng người lớn phải lớn hơn 0"; }
        return errors;
    };

    const errors = validate();

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ fullName: true, email: true, phone: true, address: true, adults: true });
        // Re-validate freshly
        const currentErrors = validate();
        if (Object.keys(currentErrors).length === 0) {
            setIsConfirming(true);
        } else {
            toast.error("Vui lòng kiểm tra lại thông tin!");
        }
    };

    const handleConfirm = async () => {
        try {
            if (!id || !tour) {
                toast.error("Không tìm thấy thông tin tour!");
                return;
            }

            if (!user) {
                toast.error("Vui lòng đăng nhập để đặt tour!");
                navigate('/login');
                return;
            }

            // Payment Process Logic
            // Transfer -> Redirect to QR (formerly 'online')
            // Cash -> Show Success Modal

            // Ensure adults is a valid number
            // Ensure adults is a valid number
            const valAdults = Number(formData.adults);
            const adultsCount = (!isNaN(valAdults) && valAdults > 0)
                ? valAdults
                : 1;

            const bookingPayload = {
                tourId: tour?.tourId || id,
                ngayKhoiHanh: formData.departureDate,
                soLuongNguoi: adultsCount + Number(formData.children || 0),
                soLuongNguoiLon: adultsCount,
                soLuongTreEm: Number(formData.children || 0),
                tongTienThanhToan: totalPrice,

                // Contact Info
                nguoiLienHe: formData.fullName,
                emailLienHe: formData.email,
                sdtLienHe: formData.phone,

                // Note
                ghiChu: `Địa chỉ: ${formData.address}. ${formData.note ? `Ghi chú: ${formData.note}.` : ''} Thanh toán: ${paymentMethod}`,
                couponCode: isCouponApplied ? couponCode : undefined,
            };

            if (paymentMethod === 'transfer') {
                // Previously 'online' logic - Redirect to QR Page
                const newBookingFn = await bookingService.create(bookingPayload);
                const newBookingId = newBookingFn.data?.donDatId || newBookingFn.data?.id;
                navigate(`/payment/${newBookingId}`);
            } else {
                // Cash Payment - Show Instructions
                const newBookingFn = await bookingService.create(bookingPayload);
                const newBookingId = newBookingFn.data?.donDatId || newBookingFn.data?.id;

                // Show local success modal
                setSuccessModal({ isOpen: true, bookingId: newBookingId });
            }
        } catch (err: unknown) {
            const error = err as AxiosError<{ msg?: string; message?: string; title?: string }>;
            console.error("❌ Booking failed:", error);
            console.error("Error details:", error.response?.data);

            let errorMsg = "Đặt tour thất bại. Vui lòng thử lại.";
            if (error.response?.status === 401) {
                errorMsg = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
                navigate('/login');
            } else if (error.response?.data?.msg) {
                // Backend often uses 'msg'
                errorMsg = error.response.data.msg;
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.response?.data?.title) {
                errorMsg = error.response.data.title;
            } else if (typeof error.response?.data === 'string') {
                errorMsg = error.response.data;
            }

            setErrorModal({ isOpen: true, message: errorMsg });
        }
    };

    const closeErrorModal = () => {
        setErrorModal({ isOpen: false, message: '' });
        if (errorModal.message.includes("đăng nhập")) {
            navigate('/login');
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

                    {/* Left: Tour Summary - Hidden on mobile or sticky? Let's make it top on mobile */}
                    <div className="md:w-1/3 bg-blue-900 text-white p-8 md:p-10 flex flex-col">
                        <h2 className="text-xl opacity-80 mb-6 uppercase tracking-widest font-bold">Thông tin Tour</h2>
                        <img src={tour.hinhAnhBia || "https://placehold.co/400"} alt={tour.tenTour} className="w-full h-40 object-cover rounded-xl mb-6 border-2 border-blue-700" />

                        <h3 className="text-2xl font-bold mb-4 leading-tight">{tour.tenTour}</h3>

                        <div className="space-y-4 text-sm opacity-90 flex-grow">
                            <div className="flex justify-between border-b border-blue-800 pb-2">
                                <span>Mã tour:</span>
                                <span className="font-bold">{tour.maTour || `T-${tour.tourId}`}</span>
                            </div>
                            <div className="flex justify-between border-b border-blue-800 pb-2">
                                <span>Thời gian:</span>
                                <span className="font-bold">{tour.thoiGian || `${tour.tourChiTiets?.length || 1} ngày`}</span>
                            </div>
                            <div className="flex justify-between border-b border-blue-800 pb-2">
                                <span>Phương tiện:</span>
                                <span className="font-bold">{tour.phuongTien}</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-blue-800">
                            <div className="text-sm opacity-75 mb-1">Tổng tiền tạm tính</div>
                            {appliedDiscount > 0 && (
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm line-through text-gray-300">
                                        {((Number(formData.adults || 0) * (tour.isTuChon ? Math.round(tour.tongGiaDuKien / (tour.soLuongCho || 1)) : tour.tongGiaDuKien) + Number(formData.children || 0) * (tour.isTuChon ? Math.round(tour.tongGiaDuKien / (tour.soLuongCho || 1)) : tour.tongGiaDuKien) * 0.75)).toLocaleString()} ₫
                                    </span>
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                        Giảm {appliedDiscount}%
                                    </span>
                                </div>
                            )}
                            <div className="text-3xl font-black text-orange-400">{totalPrice.toLocaleString()} ₫</div>
                        </div>
                    </div>

                    {/* Right: Booking Form */}
                    <div className="md:w-2/3 p-8 md:p-12">
                        <h1 className="text-3xl font-black text-gray-800 mb-8 uppercase">Đặt Tour</h1>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên *</label>
                                    <input
                                        type="text"
                                        className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 outline-none transition ${touched.fullName && errors.fullName ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'}`}
                                        placeholder="Nguyễn Văn A"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        onBlur={() => handleBlur('fullName')}
                                    />
                                    {touched.fullName && errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 outline-none transition ${touched.email && errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'}`}
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        onBlur={() => handleBlur('email')}
                                    />
                                    {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại *</label>
                                    <input
                                        type="tel"
                                        className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 outline-none transition ${touched.phone && errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'}`}
                                        placeholder="0912..."
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        onBlur={() => handleBlur('phone')}
                                    />
                                    {touched.phone && errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Ngày khởi hành</label>
                                    {tour.ngayKhoiHanh && Array.isArray(tour.ngayKhoiHanh) && tour.ngayKhoiHanh.length > 0 ? (
                                        <select
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                            value={formData.departureDate}
                                            onChange={e => setFormData({ ...formData, departureDate: e.target.value })}
                                        >
                                            <option value="">-- Chọn ngày khởi hành --</option>
                                            {tour.ngayKhoiHanh
                                                .map(d => new Date(d))
                                                .filter(d => {
                                                    const dStr = d.toISOString().split('T')[0];
                                                    return isFutureDate(dStr);
                                                })
                                                .sort((a, b) => a.getTime() - b.getTime())
                                                .map((date, idx) => {
                                                    const dateStr = date.toISOString().split('T')[0];
                                                    const displayStr = date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' });

                                                    // Check availability
                                                    // Check availability
                                                    const tourWithAvailability = tour as Tour & { availabilityMap?: Record<string, number> };
                                                    const remaining = tourWithAvailability.availabilityMap ? tourWithAvailability.availabilityMap[dateStr] : tour.soLuongCho;
                                                    const isFull = remaining !== undefined && remaining <= 0;

                                                    return (
                                                        <option key={idx} value={dateStr} disabled={isFull}>
                                                            {displayStr} {isFull ? '(Hết chỗ)' : `(Còn ${remaining} chỗ)`}
                                                        </option>
                                                    );
                                                })
                                            }
                                            <option value="other" disabled>Liên hệ để đặt các lịch khác</option>
                                        </select>
                                    ) : (
                                        <input
                                            type="date"
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                            value={formData.departureDate}
                                            onChange={e => setFormData({ ...formData, departureDate: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]} // Cannot pick past dates
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ *</label>
                                <input
                                    type="text"
                                    className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 outline-none transition ${touched.address && errors.address ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'}`}
                                    placeholder="Số 1, đường ABC..."
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    onBlur={() => handleBlur('address')}
                                />
                                {touched.address && errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                            </div>

                            <div className="flex gap-6 p-6 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Người lớn ({priceAdult.toLocaleString()} ₫)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className={`w-full p-3 border rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 ${touched.adults && errors.adults ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                                        value={formData.adults}
                                        onKeyDown={(e) => ["-", "e", "E", "+"].includes(e.key) && e.preventDefault()}
                                        onChange={e => handleQuantityChange('adults', e.target.value)}
                                        onBlur={() => {
                                            setTouched({ ...touched, adults: true });
                                            // Enforce minimum 1 on blur
                                            if (formData.adults === '' || Number(formData.adults) < 1) {
                                                setFormData(prev => ({ ...prev, adults: 1 }));
                                            }
                                        }}
                                    />
                                    {touched.adults && errors.adults && <p className="text-red-500 text-xs mt-1">{errors.adults}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-600 mb-1 block">Trẻ em ({priceChild.toLocaleString()} ₫)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full p-3 border border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                        value={formData.children}
                                        onKeyDown={(e) => ["-", "e", "E", "+"].includes(e.key) && e.preventDefault()}
                                        onChange={e => handleQuantityChange('children', e.target.value)}
                                        onBlur={() => {
                                            if (formData.children === '' || typeof formData.children !== 'number') {
                                                setFormData(prev => ({ ...prev, children: 0 }));
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú thêm</label>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl h-32 resize-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                    placeholder="Yêu cầu đặc biệt..."
                                    value={formData.note}
                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                ></textarea>
                            </div>
                            {/* Coupon Section */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <Ticket size={16} className="text-blue-600" /> Mã giảm giá
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 p-3 border border-gray-200 rounded-lg uppercase font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                                        value={couponCode}
                                        onChange={e => {
                                            setCouponCode(e.target.value.toUpperCase());
                                            if (isCouponApplied) {
                                                setIsCouponApplied(false);
                                                setCouponDiscount(0);
                                            }
                                        }}
                                        disabled={isCouponApplied}
                                    />
                                    {isCouponApplied ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCouponApplied(false);
                                                setCouponCode('');
                                                setCouponDiscount(0);
                                            }}
                                            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-200"
                                        >
                                            Hủy
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                                                disabled={!couponCode}
                                            >
                                                Áp dụng
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowCouponModal(true)}
                                                className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg font-bold hover:bg-orange-200 flex items-center gap-1"
                                            >
                                                <List size={18} /> Chọn mã
                                            </button>
                                        </>
                                    )}
                                </div>
                                {isCouponApplied && (
                                    <div className="mt-2 text-sm text-green-600 font-medium flex items-center gap-1">
                                        <CheckCircle size={14} /> Đã giảm {couponDiscount.toLocaleString()}đ
                                    </div>
                                )}
                            </div>

                            {/* Payment Method Selection */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-4">Phương thức thanh toán</h3>

                                {(() => {
                                    // Security Logic
                                    const departure = new Date(formData.departureDate);
                                    const now = new Date();
                                    const diffTime = Math.abs(departure.getTime() - now.getTime());
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    const isLastMinute = diffDays <= 3 && isFutureDate(formData.departureDate);

                                    const isRestricted = user?.hanCheThanhToan;
                                    const forceTransfer = isLastMinute || isRestricted;

                                    if (forceTransfer && paymentMethod !== 'transfer') {
                                        setPaymentMethod('transfer');
                                    }

                                    return (
                                        <div className="space-y-3">
                                            {forceTransfer && (
                                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-yellow-800 text-sm mb-4 flex gap-3 items-start">
                                                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                                                    <div>
                                                        <strong>Yêu cầu thanh toán chuyển khoản:</strong>
                                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                                            {isLastMinute && <li>Tour khởi hành gấp (dưới 3 ngày) cần thanh toán ngay để giữ chỗ.</li>}
                                                            {isRestricted && <li>Tài khoản của bạn bị hạn chế trả sau do có lịch sử hủy đơn tự động nhiều lần.</li>}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}

                                            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'transfer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="transfer"
                                                    checked={paymentMethod === 'transfer'}
                                                    onChange={() => setPaymentMethod('transfer')}
                                                    className="w-5 h-5 text-blue-600"
                                                />
                                                <div>
                                                    <div className="font-bold text-gray-800">Chuyển khoản ngân hàng (QR Code)</div>
                                                    <div className="text-sm text-gray-500">Quét mã QR để thanh toán nhanh chóng</div>
                                                </div>
                                            </label>

                                            {!forceTransfer && (
                                                <div
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
                                                    onClick={() => setPaymentMethod('cash')}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <input
                                                            type="radio"
                                                            name="paymentMethod"
                                                            value="cash"
                                                            checked={paymentMethod === 'cash'}
                                                            onChange={() => setPaymentMethod('cash')}
                                                            className="w-5 h-5 text-blue-600"
                                                        />
                                                        <div>
                                                            <div className="font-bold text-gray-800">Thanh toán tại văn phòng</div>
                                                            <div className="text-sm text-gray-500">Đến văn phòng để thanh toán trực tiếp</div>
                                                        </div>
                                                    </div>

                                                    {/* Show addresses if selected */}
                                                    {paymentMethod === 'cash' && (
                                                        <div className="mt-3 ml-9 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm animate-fadeIn">
                                                            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                                                <div className="font-bold text-blue-800 mb-1">Văn phòng Hà Nội</div>
                                                                <p className="text-gray-600 text-xs mb-2">123 Đường Trần Duy Hưng, Cầu Giấy, Hà Nội</p>
                                                                <a
                                                                    href="https://www.google.com/maps/search/?api=1&query=123+Trần+Duy+Hưng+Hà+Nội"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline text-xs flex items-center gap-1 font-medium"
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    Xem bản đồ &rarr;
                                                                </a>
                                                            </div>
                                                            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                                                <div className="font-bold text-blue-800 mb-1">Văn phòng TP.HCM</div>
                                                                <p className="text-gray-600 text-xs mb-2">456 Đường Nguyễn Huệ, Quận 1, TP.HCM</p>
                                                                <a
                                                                    href="https://www.google.com/maps/search/?api=1&query=Phố+đi+bộ+Nguyễn+Huệ"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline text-xs flex items-center gap-1 font-medium"
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    Xem bản đồ &rarr;
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-5 rounded-xl text-lg shadow-xl shadow-red-200 transition-transform transform hover:scale-[1.01]"
                            >
                                Đặt Đơn Ngay
                            </button>
                        </form>
                    </div>
                </div>
            </div >

            {/* Confirmation Modal */}
            {
                isConfirming && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl relative animate-fadeInUp">
                            <button
                                onClick={() => setIsConfirming(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>

                            <div className="p-8 border-b border-gray-100 text-center">
                                <h2 className="text-2xl font-black text-blue-900 mb-1">Xác Nhận Đặt Tour</h2>
                                <p className="text-gray-500">Vui lòng kiểm tra kỹ thông tin trước khi xác nhận</p>
                            </div>

                            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6">
                                <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                                    <h3 className="font-bold text-gray-800 border-b border-gray-200 pb-2">Thông tin khách hàng</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-gray-500 block">Họ tên:</span> <span className="font-medium">{formData.fullName}</span></div>
                                        <div><span className="text-gray-500 block">SĐT:</span> <span className="font-medium">{formData.phone}</span></div>
                                        <div className="col-span-2"><span className="text-gray-500 block">Email:</span> <span className="font-medium">{formData.email}</span></div>
                                        <div className="col-span-2"><span className="text-gray-500 block">Địa chỉ:</span> <span className="font-medium">{formData.address}</span></div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-6 rounded-xl space-y-4">
                                    <h3 className="font-bold text-blue-900 border-b border-blue-200 pb-2">Thông tin Booking</h3>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-blue-900">{tour.tenTour}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                                        <div>Ngày đi: <strong>{formData.departureDate}</strong></div>
                                        <div>Khách: <strong>{formData.adults} Lớn, {formData.children} Trẻ em</strong></div>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-blue-200">
                                        <span className="text-lg">Tổng cộng:</span>
                                        <span className="text-2xl font-black text-orange-600">{totalPrice.toLocaleString()} ₫</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 flex gap-4">
                                <button
                                    onClick={() => setIsConfirming(false)}
                                    className="flex-1 py-4 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition"
                                >
                                    Chỉnh sửa
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 transition"
                                >
                                    Xác Nhận & Đặt Tour
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Cancel/Confirm Modal */}
            {/* ... (existing modals) ... */}

            {/* Success Modal for Cash Payment */}
            {
                successModal.isOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative animate-fadeInUp overflow-hidden">
                            <div className="bg-green-50 p-6 flex flex-col items-center justify-center border-b border-green-100">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2 shadow-sm">
                                    <CheckCircle size={32} />
                                </div>
                                <h2 className="text-xl font-black text-green-800">Đặt Tour Thành Công!</h2>
                                <p className="text-green-700 font-medium">Mã đơn: #{successModal.bookingId}</p>
                            </div>

                            <div className="p-8 space-y-4">
                                <p className="text-gray-600 text-center leading-relaxed">
                                    Cảm ơn quý khách đã đặt tour. Vì quý khách chọn <strong>Thanh toán tại văn phòng</strong>, vui lòng ghé qua một trong các địa chỉ sau để hoàn tất thủ tục:
                                </p>

                                <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
                                    <div className="flex gap-3 items-start">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0"></div>
                                        <div>
                                            <div className="font-bold text-gray-800">Văn phòng Hà Nội</div>
                                            <div className="text-sm text-gray-600">123 Đường Trần Duy Hưng, Cầu Giấy, Hà Nội</div>
                                            <a href="https://www.google.com/maps/search/?api=1&query=123+Trần+Duy+Hưng+Hà+Nội" target="_blank" className="text-xs text-blue-600 hover:underline">Xem bản đồ</a>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-200"></div>
                                    <div className="flex gap-3 items-start">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0"></div>
                                        <div>
                                            <div className="font-bold text-gray-800">Văn phòng TP.HCM</div>
                                            <div className="text-sm text-gray-600">456 Đường Nguyễn Huệ, Quận 1, TP.HCM</div>
                                            <a href="https://www.google.com/maps/search/?api=1&query=Phố+đi+bộ+Nguyễn+Huệ" target="_blank" className="text-xs text-blue-600 hover:underline">Xem bản đồ</a>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-center text-gray-400 italic">
                                    * Quý khách vui lòng thanh toán trong vòng 24h để giữ chỗ.
                                </p>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100"
                                >
                                    Về trang chủ
                                </button>
                                <button
                                    onClick={() => navigate('/my-bookings')}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100"
                                >
                                    Xem đơn hàng
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Error/Notification Modal ... */}
            {
                errorModal.isOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative animate-fadeInUp overflow-hidden">
                            <div className="bg-red-50 p-6 flex items-center justify-center border-b border-red-100">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
                                    <AlertTriangle size={32} />
                                </div>
                            </div>

                            <div className="p-8 text-center">
                                <h3 className="text-xl font-black text-gray-800 mb-3">Thông báo</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {errorModal.message}
                                </p>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50">
                                <button
                                    onClick={closeErrorModal}
                                    className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold shadow-lg shadow-gray-200 transition transform hover:scale-[1.01]"
                                >
                                    Đã hiểu
                                </button>
                                <button
                                    onClick={() => navigate('/contact')}
                                    className="w-full mt-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-4 rounded-xl font-bold transition transform hover:scale-[1.01]"
                                >
                                    Liên hệ tư vấn
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Coupon Selection Modal */}
            {showCouponModal && (
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeInUp">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Ticket size={20} className="text-blue-600" /> Chọn voucher
                            </h3>
                            <button onClick={() => setShowCouponModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                            {availableCoupons.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Không có mã giảm giá nào phù hợp.
                                </div>
                            ) : (
                                availableCoupons.map((coupon, idx) => (
                                    <div
                                        key={coupon._id}
                                        className={`border rounded-xl p-4 flex gap-4 transition cursor-pointer hover:border-blue-300 ${coupon.code === couponCode ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200'}`}
                                        onClick={() => {
                                            setCouponCode(coupon.code);
                                            setAppliedCouponData(coupon);
                                            setCouponDiscount(coupon.potentialDiscount);
                                            setIsCouponApplied(true);
                                            setShowCouponModal(false);
                                            toast.success(`Đã áp dụng mã ${coupon.code}`);
                                        }}
                                    >
                                        <div className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center text-white font-bold shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-blue-600'}`}>
                                            <span className="text-lg">{coupon.type === 'PERCENT' ? `${coupon.value}%` : `${coupon.value / 1000}k`}</span>
                                            <span className="text-[10px] uppercase opacity-90">OFF</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-gray-800">{coupon.code}</h4>
                                                {idx === 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Tốt nhất</span>}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                Giảm {coupon.potentialDiscount.toLocaleString()}đ
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                HSD: {new Date(coupon.expiry).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                        {coupon.code === couponCode && (
                                            <div className="flex items-center text-blue-600">
                                                <CheckCircle size={20} />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Booking;
