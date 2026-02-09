import React, { useState, useEffect, useRef, useCallback } from 'react';

interface DualRangeSliderProps {
    min: number;
    max: number;
    step?: number;
    onChange: (values: [number, number]) => void;
    formatLabel?: (value: number) => string;
    className?: string;
    initialValues?: [number, number];
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
    min,
    max,
    step = 1,
    onChange,
    formatLabel = (val) => val.toString(),
    className = '',
    initialValues,
}) => {
    const [minVal, setMinVal] = useState(initialValues ? initialValues[0] : min);
    const [maxVal, setMaxVal] = useState(initialValues ? initialValues[1] : max);
    const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

    const sliderRef = useRef<HTMLDivElement>(null);

    // Sync with initialValues if they change externally
    useEffect(() => {
        if (initialValues) {
            setMinVal(initialValues[0]);
            setMaxVal(initialValues[1]);
        }
    }, [initialValues]);

    const getPercent = useCallback(
        (value: number) => Math.round(((value - min) / (max - min)) * 100),
        [min, max]
    );

    const getValue = (percent: number) => {
        const rawValue = (percent / 100) * (max - min) + min;
        // Snap to step
        const steppedValue = Math.round(rawValue / step) * step;
        return Math.max(min, Math.min(max, steppedValue));
    };

    const handleMouseDown = (type: 'min' | 'max') => (event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault();
        setIsDragging(type);
    };

    useEffect(() => {
        const handleMove = (event: MouseEvent | TouchEvent) => {
            if (!isDragging || !sliderRef.current) {
                return;
            }

            const rect = sliderRef.current.getBoundingClientRect();
            const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;

            const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
            const newValue = getValue(percent);

            if (isDragging === 'min') {
                const limitedValue = Math.min(newValue, maxVal - step);
                setMinVal(limitedValue);
            } else {
                const limitedValue = Math.max(newValue, minVal + step);
                setMaxVal(limitedValue);
            }
        };

        const handleUp = () => {
            if (isDragging) {
                setIsDragging(null);
                onChange([minVal, maxVal]);
            }
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);
            document.addEventListener('touchmove', handleMove);
            document.addEventListener('touchend', handleUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleUp);
        };
    }, [isDragging, maxVal, minVal, step, min, max, onChange, getValue]);

    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxVal);

    return (
        <div className={`w-full flex flex-col items-center ${className} select-none`}>
            <div className="relative w-full h-8 flex items-center mb-1">

                {/* Track Background */}
                <div
                    ref={sliderRef}
                    className="absolute w-full h-1.5 bg-gray-200 rounded-full cursor-pointer"
                >
                    {/* Active Range Track */}
                    <div
                        className="absolute h-full bg-blue-600 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                        style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                    />
                </div>

                {/* Min Thumb */}
                <div
                    className={`absolute w-5 h-5 bg-white border-2 border-blue-600 rounded-full shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center hover:scale-110 transition-transform z-10 ${isDragging === 'min' ? 'scale-110 ring-2 ring-blue-200' : ''}`}
                    style={{ left: `calc(${minPercent}% - 10px)` }}
                    onMouseDown={handleMouseDown('min')}
                    onTouchStart={handleMouseDown('min')}
                >
                    {/* Decor dot */}
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                </div>

                {/* Max Thumb */}
                <div
                    className={`absolute w-5 h-5 bg-white border-2 border-blue-600 rounded-full shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center hover:scale-110 transition-transform z-20 ${isDragging === 'max' ? 'scale-110 ring-2 ring-blue-200' : ''}`}
                    style={{ left: `calc(${maxPercent}% - 10px)` }}
                    onMouseDown={handleMouseDown('max')}
                    onTouchStart={handleMouseDown('max')}
                >
                    {/* Decor dot */}
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                </div>
            </div>

            {/* Labels */}
            <div className="flex justify-between w-full items-center">
                <div className="px-2 py-1 rounded bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-700 min-w-[3rem] text-center shadow-sm">
                    {formatLabel(minVal)}
                </div>
                <div className="h-px w-4 bg-gray-300 mx-2"></div>
                <div className="px-2 py-1 rounded bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-700 min-w-[3rem] text-center shadow-sm">
                    {formatLabel(maxVal)}
                </div>
            </div>
        </div>
    );
};

export default DualRangeSlider;
