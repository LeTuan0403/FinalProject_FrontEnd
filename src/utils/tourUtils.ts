import type { Tour } from '../types';

export const calculateDuration = (tour: Tour): string => {
    const calculatedDuration = tour.tourChiTiets?.length
        ? Math.max(...tour.tourChiTiets.map(t => t.ngayThu))
        : 1;
    return tour.thoiGian || `${calculatedDuration} ngày${calculatedDuration - 1 > 0 ? ` ${calculatedDuration - 1} đêm` : ''}`;
};

export const getNextDeparture = (tour: Tour): string => {
    if (!tour.ngayKhoiHanh || !Array.isArray(tour.ngayKhoiHanh) || tour.ngayKhoiHanh.length === 0) {
        return "Liên hệ";
    }

    // Filter future dates and sort
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const futureDates = tour.ngayKhoiHanh
        .map(d => new Date(d))
        .filter(d => d.getTime() >= tomorrow.getTime())
        .sort((a, b) => a.getTime() - b.getTime());

    if (futureDates.length === 0) {
        return "Đã hết lịch";
    }

    // Check availability if provided
    const filteredDates = futureDates.filter(d => {
        if (tour.availability) {
            const dateStr = d.toISOString().split('T')[0];
            const avail = tour.availability.find(a => new Date(a.date).toISOString().split('T')[0] === dateStr);
            if (avail) {
                return avail.remainingSeats > 0;
            }
        }
        return true;
    });

    if (filteredDates.length === 0) {
        return "Đã hết chỗ";
    }

    const nextDate = filteredDates[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return filteredDates.length > 1 ? `${nextDate} (+${filteredDates.length - 1})` : nextDate;
};

export const getRemainingSeats = (tour: Tour): number => {
    let nextRem = tour.soLuongCho ?? 0;
    if (tour.availability) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const avail = tour.availability
            .filter(a => new Date(a.date).getTime() >= tomorrow.getTime() && a.remainingSeats > 0)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

        if (avail) {
            nextRem = avail.remainingSeats;
        }
    }
    return nextRem;
};

export const getTourCode = (tour: Tour): string => {
    return tour.maTour || `T - ${tour.tourId} `;
};
