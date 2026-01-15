import { useState, useEffect } from 'react';
import { tourService } from '../../services/tourService';
import { useAuth } from '../../hooks/useAuth';
import type { Tour } from '../../types';
import { Loader, MapPin, Calendar, Edit, CheckCircle, AlertCircle, Users, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyTours = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyTours = async () => {
            if (!user) { return; }
            try {
                // Fetch direct list of tours created by the current user
                const res = await tourService.getToursByUser();
                setTours(res.data);
            } catch (error) {
                console.error("Failed to fetch user tours", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyTours();
    }, [user]);

    const handleEdit = (tour: Tour) => {
        if (tour.daDuyet) {
            alert("Tour đã được duyệt/xác nhận, không thể chỉnh sửa.");
            return;
        }
        navigate('/custom-tour', { state: { tourData: tour } });
    };

    if (loading) { return <div className="min-h-screen flex justify-center items-center"><Loader className="animate-spin text-blue-600" /></div>; }

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <h1 className="text-3xl font-black text-blue-900 mb-8 uppercase flex items-center gap-2">
                    <MapPin /> Tour Của Tôi
                </h1>

                {tours.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
                        <p className="text-gray-500 text-lg mb-4">Bạn chưa thiết kế tour nào.</p>
                        <button
                            onClick={() => navigate('/custom-tour')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                        >
                            Tạo Tour Ngay
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {tours.map(tour => (
                            <div key={tour.tourId} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center hover:shadow-md transition">
                                <div className="flex items-center gap-6 mb-4 md:mb-0 flex-1 min-w-0">
                                    <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl flex-shrink-0">
                                        {tour.tenTour.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg text-gray-800 truncate" title={tour.tenTour}>{tour.tenTour}</h3>
                                        </div>
                                        <div className="flex gap-4 text-sm text-gray-500 overflow-x-auto no-scrollbar whitespace-nowrap">
                                            <span className="flex items-center gap-1"><MapPin size={14} /> {tour.diemKhoiHanh}</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {tour.tourChiTiets?.length > 0
                                                    ? `${Math.max(...tour.tourChiTiets.map(t => t.ngayThu))} ngày`
                                                    : (tour.thoiGian && tour.thoiGian !== "Tự chọn" ? tour.thoiGian : "3 ngày")}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users size={14} />
                                                {(() => {
                                                    const adults = tour.moTa?.match(/(\d+)\s*người/)?.[1] ? parseInt(tour.moTa.match(/(\d+)\s*người/)![1]) : 1;
                                                    return `${adults} khách`;
                                                })()}
                                            </span>
                                            <span className="font-bold text-blue-600">
                                                {(() => {
                                                    // Dynamic Price Calculation
                                                    const adults = tour.moTa?.match(/(\d+)\s*người/)?.[1] ? parseInt(tour.moTa.match(/(\d+)\s*người/)![1]) : 1;
                                                    const basePrice = tour.tourChiTiets?.reduce((sum, item) => sum + (item.diaDiem?.giaVe || 0), 0) || 0;
                                                    const totalPrice = basePrice * adults;
                                                    return totalPrice > 0 ? totalPrice.toLocaleString() : tour.tongGiaDuKien.toLocaleString();
                                                })()} ₫
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 flex-nowrap flex-shrink-0 ml-4">
                                    {tour.daDuyet ? (
                                        <span className="flex items-center gap-1 text-sm font-bold bg-green-50 text-green-700 px-3 py-1.5 rounded-full whitespace-nowrap border border-green-200">
                                            <CheckCircle size={16} /> Đã duyệt
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-sm font-bold bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full whitespace-nowrap border border-yellow-200">
                                            <AlertCircle size={16} /> Chờ duyệt
                                        </span>
                                    )}
                                    {!tour.daDuyet && (
                                        <>
                                            <button
                                                onClick={() => handleEdit(tour)}
                                                className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition whitespace-nowrap"
                                            >
                                                <Edit size={16} /> Chỉnh sửa
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm("Bạn có chắc chắn muốn hủy yêu cầu thiết kế tour này không? Hành động này không thể hoàn tác.")) {
                                                        try {
                                                            await tourService.deleteCustom(tour.tourId);
                                                            setTours(prev => prev.filter(t => t.tourId !== tour.tourId));
                                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                        } catch (error: any) {
                                                            console.error("Delete tour failed:", error);
                                                            const errMsg = error.response?.data?.message || error.message || "Lỗi không xác định";
                                                            alert(`Không thể hủy tour. Chi tiết: ${errMsg}`);
                                                        }
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 font-bold rounded-lg hover:bg-red-50 transition whitespace-nowrap"
                                            >
                                                <AlertCircle size={16} /> Hủy yêu cầu
                                            </button>
                                        </>
                                    )}
                                    {tour.daDuyet && (
                                        <>
                                            <button
                                                onClick={() => navigate(`/tours/${tour.tourId}`)}
                                                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-600 font-bold rounded-lg hover:bg-blue-50 transition"
                                            >
                                                <Eye size={16} /> Xem lại
                                            </button>
                                            <button
                                                onClick={() => navigate(`/booking/${tour.tourId}`)}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-md shadow-green-200"
                                            >
                                                <CheckCircle size={16} /> Đặt Tour Ngay
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTours;
