import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface PaymentTimerProps {
    createdAt: string;
    departureDate?: string;
    onExpire?: () => void;
    className?: string;
}

const PaymentTimer: React.FC<PaymentTimerProps> = ({ createdAt, departureDate, onExpire, className = '' }) => {
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const created = new Date(createdAt).getTime();
            const now = new Date().getTime();

            // Standard policy: 12 hours from creation
            const standardDeadline = created + 12 * 60 * 60 * 1000;

            let expires = standardDeadline;

            // Last Minute logic: If departure date is provided, timer cannot exceed departure time
            if (departureDate) {
                const departure = new Date(departureDate).getTime();
                // Ensure we don't set a deadline in the past if departure matches close logic
                // Rule: Deadline = Min(Standard, Departure)
                // This creates the "shrinking window" effect.
                expires = Math.min(standardDeadline, departure);
            }

            const difference = expires - now;

            if (difference > 0) {
                return {
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24), // Use %24 if < 1 day, but here difference might be > 24 if we changed logic? No, max 12h.
                    // Wait, if 12h, max hours is 12.
                    // If difference is large (bug?), % 24 handles days.
                    // But our max is 12h.
                    // safely: Math.floor(difference / (1000 * 60 * 60))
                    // Let's remove % 24 to support > 24h just in case logic changes, but UI format is HH mm.
                    // If hours > 99, it might break UI. But max 12h is fine.
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }
            return null;
        };

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            if (remaining) {
                setTimeLeft(remaining);
            } else {
                setIsExpired(true);
                clearInterval(timer);
                if (onExpire) { onExpire(); }
            }
        }, 1000);

        // Initial check
        const initial = calculateTimeLeft();
        if (initial) {
            setTimeLeft(initial);
        } else {
            setIsExpired(true);
            if (onExpire) { onExpire(); }
        }

        return () => clearInterval(timer);
    }, [createdAt, departureDate, onExpire]);

    if (isExpired) {
        return (
            <div className={`flex items-center gap-2 text-red-600 font-bold ${className}`}>
                <AlertCircle size={18} />
                <span>Đã hết hạn thanh toán</span>
            </div>
        );
    }

    if (!timeLeft) { return null; }

    return (
        <div className={`flex items-center gap-1 text-orange-600 font-medium ${className}`}>
            <Clock size={14} />
            <span className="text-[11px]">
                {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}p
            </span>
        </div>
    );
};

export default PaymentTimer;
