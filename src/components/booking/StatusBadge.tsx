import React from 'react';

interface StatusBadgeProps {
    status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const isPending = status === 'Chờ thanh toán';
    const isConfirmed = status === 'Đã thanh toán';
    const isCompleted = status === 'Hoàn thành';
    const isCancelled = status === 'Đã hủy';
    const isRefundPending = status === 'Chờ hoàn tiền';
    const isRefunded = status === 'Đã hoàn tiền';

    let colorClass = 'bg-gray-100 text-gray-700';
    const label = status;

    if (isPending) {
        colorClass = 'bg-yellow-100 text-yellow-700';
    } else if (isConfirmed) {
        colorClass = 'bg-indigo-100 text-indigo-700';
    } else if (isCompleted) {
        colorClass = 'bg-green-100 text-green-700';
    } else if (isCancelled) {
        colorClass = 'bg-red-100 text-red-700';
    } else if (isRefundPending) {
        colorClass = 'bg-purple-100 text-purple-700';
    } else if (isRefunded) {
        colorClass = 'bg-gray-100 text-gray-700';
    }

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${colorClass}`}>
            {label}
        </span>
    );
};

export default StatusBadge;
