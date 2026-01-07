import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface CreatableSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder?: string;
    required?: boolean;
}

const CreatableSelect = ({
    value,
    onChange,
    options,
    placeholder = "",
    required = false
}: CreatableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [forceShowAll, setForceShowAll] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setForceShowAll(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const optionsToShow = (forceShowAll || (value || "").trim() === "")
        ? options
        : options.filter(opt => opt.toLowerCase().includes((value || "").toLowerCase()));

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={placeholder}
                value={value}
                required={required}
                onChange={e => {
                    onChange(e.target.value);
                    setIsOpen(true);
                    setForceShowAll(false); // Enable filtering when typing
                }}
                onFocus={() => setIsOpen(true)}
            />

            <div
                className="absolute right-0 top-0 h-full px-3 flex items-center cursor-pointer text-gray-400 hover:text-blue-600"
                onClick={(e) => {
                    e.preventDefault(); // Prevent focus loss issues
                    setForceShowAll(!isOpen); // If opening, show all.
                    setIsOpen(!isOpen);
                }}
            >
                <ChevronDown size={16} />
            </div>

            {isOpen && optionsToShow.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1 custom-scrollbar">
                    {optionsToShow.map((opt, idx) => (
                        <div
                            key={idx}
                            className="p-3 hover:bg-blue-50 cursor-pointer text-gray-700"
                            onClick={() => {
                                onChange(opt);
                                setIsOpen(false);
                                setForceShowAll(false);
                            }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CreatableSelect;
