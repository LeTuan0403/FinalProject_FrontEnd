import { Link } from 'react-router-dom';
import { MapPin, Clock, Truck, Ticket, Heart, Calendar, User } from 'lucide-react';
import type { Tour } from '../../types';
import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';

interface TourCardProps {
    tour: Tour;
    variant?: 'vertical' | 'horizontal';
    isFavorite?: boolean;
    onToggleFavorite?: (id: number, status: boolean) => void;
}

const TourCard = ({ tour, variant = 'vertical', isFavorite = false, onToggleFavorite }: TourCardProps) => {
    const { user } = useAuth();
    const [favorited, setFavorited] = useState(isFavorite);

    useEffect(() => {
        setFavorited(isFavorite);
    }, [isFavorite]);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            alert("Vui lòng đăng nhập để lưu tour yêu thích!");
            return;
        }

        try {
            await userService.toggleFavorite(tour.tourId);
            const newState = !favorited;
            setFavorited(newState);
            if (onToggleFavorite) onToggleFavorite(tour.tourId, newState);
        } catch (error) {
            console.error("Failed to toggle favorite", error);
        }
    };

    // Helper to calculate duration
    const calculatedDuration = tour.tourChiTiets?.length
        ? Math.max(...tour.tourChiTiets.map(t => t.ngayThu))
        : 1;
    const durationText = tour.thoiGian || `${calculatedDuration} ngày ${calculatedDuration - 1 > 0 ? (calculatedDuration - 1) + ' đêm' : ''}`;

    // Helper for Next Departure
    const getNextDeparture = () => {
        if (!tour.ngayKhoiHanh || !Array.isArray(tour.ngayKhoiHanh) || tour.ngayKhoiHanh.length === 0) return "Liên hệ";

        // Filter future dates and sort
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const futureDates = tour.ngayKhoiHanh
            .map(d => new Date(d))
            .filter(d => d.getTime() >= tomorrow.getTime())
            .sort((a, b) => a.getTime() - b.getTime());

        if (futureDates.length === 0) return "Đã hết lịch";

        // Check availability if provided, otherwise assume available
        const filteredDates = futureDates.filter(d => {
            if (tour.availability) {
                const dateStr = d.toISOString().split('T')[0];
                const avail = tour.availability.find(a => new Date(a.date).toISOString().split('T')[0] === dateStr);
                // If availability info exists, check remainingSeats > 0.
                if (avail) {
                    return avail.remainingSeats > 0;
                }
            }
            // Fallback: If no availability info, we show it (or should we hide? Safe to show).
            // Actually, if backend sends availability, it should be comprehensive.

            // Legacy/Fallback check: (Ideally we trust availability array)
            return true;
        });

        if (filteredDates.length === 0) return "Đã hết chỗ";

        const nextDate = filteredDates[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return filteredDates.length > 1 ? `${nextDate} (+${filteredDates.length - 1})` : nextDate;
    };
    const nextDepartureText = getNextDeparture();

    // Helper for Tour Code
    const tourCode = tour.maTour || `T-${tour.tourId}`;

    if (variant === 'vertical') {
        return (
            <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all overflow-hidden flex flex-col border border-gray-100 group relative">
                {/* Favorite Button */}
                <button
                    onClick={handleToggleFavorite}
                    className={`absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md transition-all ${favorited ? 'bg-red-50 text-red-500' : 'bg-black/20 text-white hover:bg-black/40'}`}
                >
                    <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
                </button>

                <div className="relative overflow-hidden h-60">
                    <img
                        src={tour.hinhAnhBia || "https://placehold.co/400x300?text=Tour"}
                        alt={tour.tenTour}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded text-xs font-bold backdrop-blur-sm">
                        {tourCode}
                    </div>
                </div>

                <div className="p-5 flex-grow flex flex-col">
                    <h3 className="text-lg font-bold mb-3 text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                        <Link to={`/tours/${tour.tourId}`}>{tour.tenTour}</Link>
                    </h3>

                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{durationText}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 -mt-2">
                        <Calendar className="w-4 h-4" />
                        <span>K.Hành: <span className="font-semibold text-blue-600">{nextDepartureText}</span></span>
                    </div>

                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 -mt-2">
                        <User className="w-4 h-4" />
                        {(() => {
                            let nextRem = tour.soLuongCho ?? 0;
                            if (tour.availability) {
                                // Availability for future
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                tomorrow.setHours(0, 0, 0, 0);

                                const avail = tour.availability
                                    .filter(a => new Date(a.date).getTime() >= tomorrow.getTime() && a.remainingSeats > 0)
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

                                if (avail) nextRem = avail.remainingSeats;
                            }
                            return <span>Còn: <span className="font-semibold text-red-500">{nextRem} chỗ</span></span>;
                        })()}
                    </div>

                    <div className="mt-auto flex justify-between items-center border-t border-gray-100 pt-4">
                        <div>
                            <p className="text-xs text-gray-400">Giá từ</p>
                            <p className="text-xl font-black text-red-600">{tour.tongGiaDuKien.toLocaleString()} ₫</p>
                        </div>
                        <Link
                            to={`/tours/${tour.tourId}`}
                            className="text-blue-600 font-bold text-sm hover:underline"
                        >
                            XEM CHI TIẾT
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Horizontal Variant
    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col md:flex-row border border-gray-100 group relative">
            {/* Favorite Button (Horizontal) */}
            <button
                onClick={handleToggleFavorite}
                className={`absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md transition-all md:hidden ${favorited ? 'bg-red-50 text-red-500' : 'bg-black/20 text-white hover:bg-black/40'}`}
            >
                <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
            </button>

            {/* Horizontal Image */}
            <div className="md:w-1/3 relative overflow-hidden h-64 md:h-auto">
                <img
                    src={tour.hinhAnhBia || "https://placehold.co/400x300?text=Tour"}
                    alt={tour.tenTour}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
            </div>

            {/* Horizontal Content */}
            <div className="p-6 md:w-2/3 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold mb-3 text-blue-900 group-hover:text-blue-600 transition-colors pr-8">
                            <Link to={`/tours/${tour.tourId}`}>{tour.tenTour}</Link>
                        </h3>
                        {/* Desktop Favorite Button */}
                        <button
                            onClick={handleToggleFavorite}
                            className={`hidden md:block p-2 rounded-full transition-all ${favorited ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        >
                            <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-blue-500" />
                            <span>Mã: <span className="font-semibold text-gray-800">{tourCode}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span>Thời gian: <span className="font-semibold text-gray-800">{durationText}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>Ngày đi: <span className="font-semibold text-gray-800">{nextDepartureText}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span>Khởi hành: <span className="font-semibold text-gray-800">{tour.diemKhoiHanh || "Chưa cập nhật"}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blue-500" />
                            <span>Phương tiện: <span className="font-semibold text-gray-800">{tour.phuongTien || "Xe du lịch"}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-500" />
                            {(() => {
                                let nextRem = tour.soLuongCho ?? 0;
                                if (tour.availability) {
                                    // Availability for future
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    tomorrow.setHours(0, 0, 0, 0);

                                    const avail = tour.availability
                                        .filter(a => new Date(a.date).getTime() >= tomorrow.getTime() && a.remainingSeats > 0)
                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

                                    if (avail) nextRem = avail.remainingSeats;
                                }
                                return <span>Còn: <span className="font-semibold text-red-500">{nextRem} chỗ</span></span>;
                            })()}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Giá tham khảo</p>
                        <p className="text-2xl font-black text-red-600">{tour.tongGiaDuKien.toLocaleString()} <span className="text-sm font-normal text-red-600">đ</span></p>
                    </div>
                    <Link
                        to={`/tours/${tour.tourId}`}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all uppercase shadow-blue-200 shadow-md transform hover:-translate-y-0.5"
                    >
                        Xem chi tiết
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TourCard;
