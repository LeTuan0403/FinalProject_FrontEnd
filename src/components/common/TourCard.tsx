import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MapPin, Clock, Truck, Ticket, Heart, Calendar, User, Scale } from 'lucide-react';
import type { Tour } from '../../types';
import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { useComparison } from '../../context/ComparisonContext';

import { calculateDuration, getNextDeparture, getRemainingSeats, getTourCode } from '../../utils/tourUtils';
import { getLocalDateStr } from '../../utils/dateUtils';

interface TourCardProps {
    tour: Tour;
    variant?: 'vertical' | 'horizontal';
    isFavorite?: boolean;
    onToggleFavorite?: (id: number, status: boolean) => void;
}

interface ActionButtonProps {
    onClick: (e: React.MouseEvent) => void;
    title: string;
    active: boolean;
    activeClass: string;
    icon: React.ElementType;
    variant?: 'overlay' | 'standard';
    className?: string;
}

const TourActionButton = ({ onClick, title, active, activeClass, icon: Icon, variant = 'standard', className = '' }: ActionButtonProps) => {
    const baseClass = "p-2 rounded-full transition-all";
    const variantClass = variant === 'overlay'
        ? (active ? activeClass : 'bg-black/20 text-white hover:bg-black/40 backdrop-blur-md')
        : (active ? activeClass : 'bg-gray-100 text-gray-400 hover:bg-gray-200');

    return (
        <button onClick={onClick} title={title} className={`${className} ${baseClass} ${variantClass}`}>
            <Icon className={`w-5 h-5 ${active ? 'fill-current' : ''}`} />
        </button>
    );
};

const TourCard = ({ tour, variant = 'vertical', isFavorite = false, onToggleFavorite }: TourCardProps) => {
    const { user } = useAuth();
    const { addToCompare, removeFromCompare, isInCompare } = useComparison();
    const [favorited, setFavorited] = useState(isFavorite);
    const inCompare = isInCompare(tour.tourId);

    useEffect(() => {
        setFavorited(isFavorite);
    }, [isFavorite]);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast.error("Vui lòng đăng nhập để lưu tour yêu thích!");
            return;
        }

        try {
            await userService.toggleFavorite(tour.tourId);
            const newState = !favorited;
            setFavorited(newState);
            if (onToggleFavorite) { onToggleFavorite(tour.tourId, newState); }
        } catch (error) {
            console.error("Failed to toggle favorite", error);
        }
    };

    const handleToggleCompare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (inCompare) {
            removeFromCompare(tour.tourId);
        } else {
            addToCompare(tour.tourId);
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("application/tour-data", JSON.stringify(tour));
        // Optional: Set a custom drag image if needed, but default ghost image is usually fine
    };

    const durationText = calculateDuration(tour);
    const nextDepartureText = getNextDeparture(tour);
    const tourCode = getTourCode(tour);
    const remainingSeats = getRemainingSeats(tour);
    // Handle case where tourId might be an object or missing (use _id fallback)
    const linkId = (tour.tourId && typeof tour.tourId !== 'object') ? tour.tourId : tour._id;

    // Last Minute Discount Logic
    const getDiscountInfo = () => {
        if (!tour.ngayKhoiHanh || !tour.discounts) { return null; }

        const todayStr = getLocalDateStr(new Date());

        // Find next valid date
        const sortedDates = tour.ngayKhoiHanh
            .map(d => new Date(d))
            .filter(d => getLocalDateStr(d) >= todayStr)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        if (sortedDates.length === 0) { return null; }

        const nextDate = sortedDates[0];
        const nextDateStr = getLocalDateStr(nextDate);

        // Find discount
        const discount = tour.discounts.find(d => {
            const dDateStr = getLocalDateStr(new Date(d.date));
            return dDateStr === nextDateStr;
        });

        if (!discount) { return null; }

        return {
            percent: discount.percentage,
            originalPrice: tour.tongGiaDuKien,
            finalPrice: tour.tongGiaDuKien * (1 - discount.percentage / 100)
        };
    };

    const discountInfo = getDiscountInfo();

    if (variant === 'vertical') {
        return (
            <div
                draggable="true"
                onDragStart={handleDragStart}
                className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all overflow-hidden flex flex-col border border-gray-100 group relative cursor-grab active:cursor-grabbing"
            >
                {/* Favorite Button */}
                <TourActionButton
                    onClick={handleToggleFavorite}
                    title="Yêu thích"
                    active={favorited}
                    activeClass="bg-red-50 text-red-500"
                    icon={Heart}
                    variant="overlay"
                    className="absolute top-4 right-4 z-10"
                />
                <TourActionButton
                    onClick={handleToggleCompare}
                    title="So sánh"
                    active={inCompare}
                    activeClass="bg-teal-50 text-teal-600"
                    icon={Scale}
                    variant="overlay"
                    className="absolute top-4 right-16 z-10"
                />

                <div className="relative overflow-hidden h-32 md:h-60">
                    <img
                        src={tour.hinhAnhBia || "https://placehold.co/400x300?text=Tour"}
                        alt={tour.tenTour}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-1 items-start">
                        <div className="bg-black/60 text-white px-3 py-1 rounded text-xs font-bold backdrop-blur-sm">
                            {tourCode}
                        </div>
                        {discountInfo && (
                            <div className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold shadow-md animate-pulse">
                                Giảm {discountInfo.percent}%
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-2 md:p-5 flex-grow flex flex-col">
                    <h3 className="text-sm md:text-lg font-bold mb-1 md:mb-2 text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem] md:min-h-[3.5rem]">
                        <Link to={`/tours/${linkId}`}>{tour.tenTour}</Link>
                    </h3>

                    {/* Compact Meta Info for Mobile */}
                    <div className="grid grid-cols-2 gap-1 md:flex md:flex-col md:gap-0 mb-1 md:mb-4">
                        <div className="flex items-center gap-1 text-[10px] md:text-sm text-gray-500">
                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                            <span>{durationText}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] md:text-sm text-gray-500">
                            <User className="w-3 h-3 md:w-4 md:h-4" />
                            <span>{remainingSeats} chỗ</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1 text-[10px] md:text-sm text-gray-500 md:mt-2">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="truncate">KH: <span className="font-semibold text-blue-600">{nextDepartureText}</span></span>
                        </div>
                    </div>
                    <div className="mt-auto border-t border-gray-100 pt-2 md:pt-4">
                        <div className="flex flex-col gap-1 md:gap-2">
                            <div className="flex justify-between items-center md:block">
                                <p className="text-[10px] md:text-xs text-gray-400">Giá từ</p>
                                {discountInfo ? (
                                    <div className="flex flex-col md:items-start items-end">
                                        <span className="text-[10px] md:text-xs text-gray-400 line-through">{discountInfo.originalPrice.toLocaleString()} ₫</span>
                                        <p className="text-base md:text-xl font-black text-red-600">{discountInfo.finalPrice.toLocaleString()} ₫</p>
                                    </div>
                                ) : (
                                    <p className="text-base md:text-xl font-black text-red-600 md:text-left text-right">{tour.tongGiaDuKien.toLocaleString()} ₫</p>
                                )}
                            </div>
                            <Link
                                to={`/tours/${linkId}`}
                                className="text-center w-full bg-blue-50 text-blue-600 py-1.5 md:py-2 rounded-lg font-bold text-xs md:text-sm hover:bg-blue-100 transition-colors"
                            >
                                XEM CHI TIẾT
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Horizontal Variant
    return (
        <div
            draggable="true"
            onDragStart={handleDragStart}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col md:flex-row border border-gray-100 group relative cursor-grab active:cursor-grabbing"
        >
            {/* Favorite Button (Horizontal Mobile) */}
            <TourActionButton
                onClick={handleToggleFavorite}
                title="Yêu thích"
                active={favorited}
                activeClass="bg-red-50 text-red-500"
                icon={Heart}
                variant="overlay"
                className="absolute top-4 right-4 z-10 md:hidden"
            />
            <TourActionButton
                onClick={handleToggleCompare}
                title="So sánh"
                active={inCompare}
                activeClass="bg-teal-50 text-teal-600"
                icon={Scale}
                variant="overlay"
                className="absolute top-16 right-4 z-10 md:hidden"
            />

            {/* Horizontal Image */}
            <div className="md:w-1/3 relative overflow-hidden h-64 md:h-auto">
                <img
                    src={tour.hinhAnhBia || "https://placehold.co/400x300?text=Tour"}
                    alt={tour.tenTour}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {discountInfo && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded text-xs font-bold shadow-md z-10">
                        Giảm {discountInfo.percent}%
                    </div>
                )}
            </div>

            {/* Horizontal Content */}
            <div className="p-6 md:w-2/3 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold mb-3 text-blue-900 group-hover:text-blue-600 transition-colors pr-8">
                            <Link to={`/tours/${linkId}`}>{tour.tenTour}</Link>
                        </h3>
                        <div className="hidden md:flex gap-2">
                            {/* Compare Button Desktop */}
                            <TourActionButton
                                onClick={handleToggleCompare}
                                title="So sánh"
                                active={inCompare}
                                activeClass="bg-teal-50 text-teal-600"
                                icon={Scale}
                                variant="standard"
                            />
                            <TourActionButton
                                onClick={handleToggleFavorite}
                                title="Yêu thích"
                                active={favorited}
                                activeClass="bg-red-50 text-red-500"
                                icon={Heart}
                                variant="standard"
                            />

                        </div>
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
                            <span>Còn: <span className="font-semibold text-red-500">{remainingSeats} chỗ</span></span>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Giá tham khảo</p>
                        {discountInfo ? (
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm text-gray-400 line-through font-medium">{discountInfo.originalPrice.toLocaleString()} đ</span>
                                <p className="text-2xl font-black text-red-600">{discountInfo.finalPrice.toLocaleString()} <span className="text-sm font-normal text-red-600">đ</span></p>
                            </div>
                        ) : (
                            <p className="text-2xl font-black text-red-600">{tour.tongGiaDuKien.toLocaleString()} <span className="text-sm font-normal text-red-600">đ</span></p>
                        )}
                    </div>
                    <Link
                        to={`/tours/${linkId}`}
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

