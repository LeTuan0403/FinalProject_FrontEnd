import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface PaymentTimerProps {
    createdAt: string; // ISO String
    onExpire?: () => void;
    className?: string;
}

const PaymentTimer: React.FC<PaymentTimerProps> = ({ createdAt, onExpire, className = '' }) => {
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const created = new Date(createdAt).getTime();
            const now = new Date().getTime();
            const expires = created + 24 * 60 * 60 * 1000; // + 24 hours
            const difference = expires - now;

            if (difference > 0) {
                return {
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
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
                if (onExpire) onExpire();
            }
        }, 1000);

        // Initial check
        const initial = calculateTimeLeft();
        if (initial) {
            setTimeLeft(initial);
        } else {
            setIsExpired(true);
            if (onExpire) onExpire();
        }

        return () => clearInterval(timer);
    }, [createdAt]);

    if (isExpired) {
        return (
            <div className={`flex items-center gap-2 text-red-600 font-bold ${className}`}>
                <AlertCircle size={18} />
                <span>Đã hết hạn thanh toán</span>
            </div>
        );
    }

    if (!timeLeft) return null;

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
