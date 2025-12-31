
export const MomoIcon = ({ className }: { className?: string }) => (
    <img
        src="/images/MOMO-Logo-App.png"
        alt="Momo"
        className={`${className} object-contain`}
    />
);

export const MBBankIcon = ({ className }: { className?: string }) => (
    <img
        src="/images/thumbnail-logo-MBBank.jpg"
        alt="MBBank"
        className={`${className} object-contain rounded`}
    />
);

export const CashIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect width="48" height="48" rx="8" fill="#10B981" />
        <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">TIỀN MẶT</text>
    </svg>
);
