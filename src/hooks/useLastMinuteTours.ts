import { useMemo } from 'react';
import { useTours } from './useTours';
import { getLocalDateStr } from '../utils/dateUtils';

export const useLastMinuteTours = () => {
    const { tours, loading, error } = useTours();

    const lastMinuteTours = useMemo(() => {
        if (!tours || tours.length === 0) { return []; }

        // Tomorrow String
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = getLocalDateStr(tomorrow);

        // End Date (Tomorrow + 3 days)
        const endDate = new Date(tomorrow);
        endDate.setDate(endDate.getDate() + 3);
        const endDateStr = getLocalDateStr(endDate);

        return tours.filter(t => {
            if (!t.daDuyet || t.isTuChon) { return false; }
            if (!t.ngayKhoiHanh || !Array.isArray(t.ngayKhoiHanh)) { return false; }

            // Check if ANY departure date is within [tomorrow, tomorrow+3]
            return t.ngayKhoiHanh.some(d => {
                const dStr = new Date(d).toISOString().split('T')[0];
                return dStr >= tomorrowStr && dStr <= endDateStr;
            });
        });
    }, [tours]);

    return { lastMinuteTours, loading, error };
};
