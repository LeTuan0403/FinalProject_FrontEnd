import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tourService, bookingService } from '../../services/tourService';
import type { Tour } from '../../types';
import { X, Loader } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Booking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tour, setTour] = useState<Tour | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form Stats
    const [formData, setFormData] = useState({
        fullName: user?.hoTen || '',
        email: '',
        phone: '',
        address: '',
        departureDate: '',
        adults: 1 as number | '',
        children: 0,
        note: ''
    });

    const [isConfirming, setIsConfirming] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'online'>('online');

    useEffect(() => {
        const fetchTour = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await tourService.getById(Number(id));
                setTour(res.data);
                setFormData(prev => ({
                    ...prev,
                    departureDate: new Date().toISOString().split('T')[0],
                    // Pre-fill user data if available
                    fullName: user?.hoTen || prev.fullName
                }));
            } catch (err) {
                setError('Không thể tải thông tin tour');
            } finally {
                setLoading(false);
            }
        };

        fetchTour();
    }, [id]);

    if (loading) return <div className="min-h-screen flex text-center justify-center items-center text-gray-500 gap-2"><Loader className="animate-spin" /> Loading tour info...</div>;
    if (error || !tour) return <div className="min-h-screen flex text-center justify-center items-center text-red-500">{error || 'Tour not found'}</div>;

    const priceAdult = tour.tongGiaDuKien;
    const priceChild = tour.tongGiaDuKien * 0.75; // 75% for children
    const totalPrice = ((typeof formData.adults === 'number' ? formData.adults : 0) * priceAdult) + (formData.children * priceChild);

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!formData.fullName) errors.fullName = "Vui lòng nhập họ tên";
        if (!formData.email) errors.email = "Vui lòng nhập email";
        if (!formData.phone) errors.phone = "Vui lòng nhập số điện thoại";
        if (!formData.address) errors.address = "Vui lòng nhập địa chỉ";
        if (!formData.adults || Number(formData.adults) <= 0) errors.adults = "Số lượng người lớn phải lớn hơn 0";
        return errors;
    };

    const errors = validate();
    // const isValid = Object.keys(errors).length === 0; // Removed unused variable

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
            alert("Vui lòng kiểm tra lại thông tin!");
        }
    };

    const handleConfirm = async () => {
        try {
            if (!id || !tour) {
                alert("Không tìm thấy thông tin tour!");
                return;
            }

            if (!user) {
                alert("Vui lòng đăng nhập để đặt tour!");
                navigate('/login');
                return;
            }

            // Mock Payment Process
            if (paymentMethod === 'online') {
                const confirmed = window.confirm("Đang chuyển hướng đến cổng thanh toán VNPAY (Mô phỏng). Nhấn OK để thanh toán thành công, Cancel để hủy.");
                if (!confirmed) return;
            }

            // Ensure adults is a valid number
            const adultsCount = typeof formData.adults === 'number' && formData.adults > 0
                ? formData.adults
                : 1;

            const bookingPayload = {
                tourId: Number(id),
                // userId: user.userId, // Backend extracts from token
                ngayKhoiHanh: formData.departureDate,
                soLuongNguoi: adultsCount + formData.children,
                soLuongNguoiLon: adultsCount,
                soLuongTreEm: formData.children,
                tongTienThanhToan: totalPrice,

                // Contact Info
                nguoiLienHe: formData.fullName,
                emailLienHe: formData.email,
                sdtLienHe: formData.phone,

                // Note
                ghiChu: `Địa chỉ: ${formData.address}. ${formData.note ? `Ghi chú: ${formData.note}.` : ''} Thanh toán: ${paymentMethod}`
            };

            console.log("📤 Sending booking:", bookingPayload);
            if (paymentMethod === 'online') {
                // For Online payment, we might usually redirect to VNPAY url returned from backend
                // But for now, we redirect to our Payment Instruction page as well, or a specific success page
                // navigate(`/payment/${res.data.id}`); // Assuming backend returns the booking object
                // Since we don't have the real ID from created booking in the previous snippets (bookingService.create returns response), we need to capture it.
                // Let's assume response.data is the booking.
                const newBookingFn = await bookingService.create(bookingPayload);
                // Check structure of response
                const newBookingId = newBookingFn.data?.donDatId || newBookingFn.data?.id;
                navigate(`/payment/${newBookingId}`);
            } else {
                const newBookingFn = await bookingService.create(bookingPayload);
                const newBookingId = newBookingFn.data?.donDatId || newBookingFn.data?.id;
                navigate(`/payment/${newBookingId}`);
            }
        } catch (error: any) {
            console.error("❌ Booking failed:", error);
            console.error("Error details:", error.response?.data);

            let errorMsg = "Đặt tour thất bại. Vui lòng thử lại.";
            if (error.response?.status === 401) {
                errorMsg = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
                navigate('/login');
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.response?.data?.title) {
                errorMsg = error.response.data.title;
            } else if (typeof error.response?.data === 'string') {
                errorMsg = error.response.data;
            }

            alert(errorMsg);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

                    {/* Left: Tour Summary - Hidden on mobile or sticky? Let's make it top on mobile */}
                    <div className="md:w-1/3 bg-blue-900 text-white p-8 md:p-10 flex flex-col">
                        <h2 className="text-xl opacity-80 mb-6 uppercase tracking-widest font-bold">Thông tin Tour</h2>
                        <img src={tour.hinhAnhBia || "https://via.placeholder.com/400"} alt={tour.tenTour} className="w-full h-40 object-cover rounded-xl mb-6 border-2 border-blue-700" />

                        <h3 className="text-2xl font-bold mb-4 leading-tight">{tour.tenTour}</h3>

                        <div className="space-y-4 text-sm opacity-90 flex-grow">
                            <div className="flex justify-between border-b border-blue-800 pb-2">
                                <span>Mã tour:</span>
                                <span className="font-bold">TB-{tour.tourId}</span>
                            </div>
                            <div className="flex justify-between border-b border-blue-800 pb-2">
                                <span>Thời gian:</span>
                                <span className="font-bold">{tour.tourChiTiets?.length || 3} ngày</span>
                            </div>
                            <div className="flex justify-between border-b border-blue-800 pb-2">
                                <span>Phương tiện:</span>
                                <span className="font-bold">{tour.phuongTien}</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-blue-800">
                            <div className="text-sm opacity-75 mb-1">Tổng tiền tạm tính</div>
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
                                    <input
                                        type="date"
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                                        value={formData.departureDate}
                                        onChange={e => setFormData({ ...formData, departureDate: e.target.value })}
                                    />
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
                                        onChange={e => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, adults: val === '' ? '' : Math.max(1, parseInt(val)) });
                                        }}
                                        onBlur={() => {
                                            setTouched({ ...touched, adults: true });
                                            if (formData.adults === '') setFormData({ ...formData, adults: 1 });
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
                                        onChange={e => {
                                            const val = e.target.value;
                                            // Allow empty string temporarily by handling in UI render, but here we strictly set number or 0
                                            setFormData({ ...formData, children: val === '' ? 0 : Math.max(0, parseInt(val)) });
                                        }}
                                        onBlur={() => {
                                            if (formData.children === undefined) {
                                                setFormData({ ...formData, children: 0 });
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

                            {/* Payment Method Selection */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-4">Phương thức thanh toán</h3>
                                <div className="space-y-3">
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
                                            <div className="font-bold text-gray-800">Chuyển khoản ngân hàng</div>
                                            <div className="text-sm text-gray-500">Thanh toán qua tài khoản ngân hàng</div>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
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
                                    </label>

                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'online' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="online"
                                            checked={paymentMethod === 'online'}
                                            onChange={() => setPaymentMethod('online')}
                                            className="w-5 h-5 text-blue-600"
                                        />
                                        <div>
                                            <div className="font-bold text-gray-800 flex items-center gap-2">
                                                Thanh toán trực tuyến (VNPAY/Momo)
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Khuyên dùng</span>
                                            </div>
                                            <div className="text-sm text-gray-500">Thanh toán ngay để giữ chỗ (Mô phỏng)</div>
                                        </div>
                                    </label>
                                </div>
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
            </div>

            {/* Confirmation Modal */}
            {isConfirming && (
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
            )}
        </div>
    );
};

export default Booking;
