import React from 'react';

interface StatusBadgeProps {
    status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const isPending = ['Pending', 'Chờ thanh toán'].includes(status);
    const isConfirmed = ['Confirmed', 'Đã thanh toán'].includes(status);
    const isCompleted = ['Completed', 'Hoàn tất'].includes(status);
    const isCancelled = ['Cancelled', 'Hủy', 'Đã hủy'].includes(status);

    let colorClass = 'bg-red-100 text-red-700';
    let label = status;

    if (isPending) {
        colorClass = 'bg-yellow-100 text-yellow-700';
        label = 'Chờ thanh toán';
    } else if (isConfirmed) {
        colorClass = 'bg-green-100 text-green-700';
        label = 'Đã thanh toán';
    } else if (isCompleted) {
        colorClass = 'bg-blue-100 text-blue-700';
        label = 'Hoàn tất';
    } else if (isCancelled) {
        colorClass = 'bg-gray-100 text-gray-700';
        label = 'Đã hủy';
    }

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorClass}`}>
            {label}
        </span>
    );
};

export default StatusBadge;
