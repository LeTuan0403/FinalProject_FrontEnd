import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleFilterProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const CollapsibleFilter: React.FC<CollapsibleFilterProps> = ({
    title,
    children,
    defaultOpen = true
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-6 border-b border-gray-100 pb-4 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full text-left mb-2 group"
            >
                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
                    {title}
                </span>
                {isOpen ? (
                    <ChevronUp size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                ) : (
                    <ChevronDown size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                )}
            </button>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {children}
            </div>
        </div>
    );
};

export default CollapsibleFilter;
