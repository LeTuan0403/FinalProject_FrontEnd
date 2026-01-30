import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
    subLabel?: string;
    address?: string; // New: Address for search and display
    disabled?: boolean;
}

interface SearchableSelectProps {
    value: string | number;
    options: Option[];
    onChange: (value: string | number) => void;
    placeholder?: string;
    className?: string;
}

const SearchableSelect = ({ value, options, onChange, placeholder = "Chọn...", className = "" }: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter options
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (opt.address && opt.address.toLowerCase().includes(searchTerm.toLowerCase())) // Search by address
    );

    const selectedOption = options.find(opt => opt.value === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {/* Trigger Button */}
            <div
                className={`w-full p-2 border rounded bg-white flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors ${isOpen ? 'ring-2 ring-blue-100 border-blue-400' : 'border-gray-200'}`}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) { setSearchTerm(''); }
                }}
            >
                <div>
                    {selectedOption ? (
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-800 text-sm">{selectedOption.label}</span>
                            {selectedOption.subLabel && <span className="text-xs text-gray-400">{selectedOption.subLabel}</span>}
                        </div>
                    ) : (
                        <span className="text-gray-400 text-sm">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {value && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(''); // Clear value
                            }}
                            className="p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-full transition-colors"
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100 sticky top-0 bg-white rounded-t-lg">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                                placeholder="Tìm kiếm tên, địa chỉ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto flex-1 p-1 scrollbar-thin scrollbar-thumb-gray-200">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`px-3 py-2 rounded-md cursor-pointer flex items-center justify-between text-sm transition-colors ${opt.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-blue-50'} ${opt.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                    onClick={() => {
                                        if (!opt.disabled) {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                        }
                                    }}
                                >
                                    <div className="flex-1 overflow-hidden">
                                        <div className="truncate">{opt.label}</div>
                                        <div className="flex items-center gap-2">
                                            {opt.subLabel && <span className="text-xs text-gray-400 shrink-0">{opt.subLabel}</span>}
                                            {/* Display Address if available */}
                                            {opt.address && (
                                                <span className="text-xs text-gray-400 italic truncate border-l pl-2 border-gray-300">
                                                    {opt.address}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {opt.value === value && <Check size={16} className="text-blue-600 shrink-0 ml-2" />}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-400 text-sm">
                                Không tìm thấy kết quả
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
