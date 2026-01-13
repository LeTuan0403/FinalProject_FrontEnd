import React, { createContext, useContext, useEffect, useState } from 'react';

interface ComparisonContextType {
    selectedTourIds: number[];
    addToCompare: (tourId: number) => void;
    removeFromCompare: (tourId: number) => void;
    clearCompare: () => void;
    isInCompare: (tourId: number) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedTourIds, setSelectedTourIds] = useState<number[]>(() => {
        try {
            const saved = localStorage.getItem('compareTourIds');
            if (!saved || saved === 'undefined' || saved === 'null') return [];
            return JSON.parse(saved);
        } catch (e) {
            console.error("Error parsing comparison ids from local storage", e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('compareTourIds', JSON.stringify(selectedTourIds));
    }, [selectedTourIds]);

    const addToCompare = (tourId: number) => {
        if (selectedTourIds.length >= 3) {
            alert("Bạn chỉ có thể so sánh tối đa 3 tour!");
            return;
        }
        if (!selectedTourIds.includes(tourId)) {
            setSelectedTourIds([...selectedTourIds, tourId]);
        }
    };

    const removeFromCompare = (tourId: number) => {
        setSelectedTourIds(selectedTourIds.filter(id => id !== tourId));
    };

    const clearCompare = () => {
        setSelectedTourIds([]);
    };

    const isInCompare = (tourId: number) => {
        return selectedTourIds.includes(tourId);
    };

    return (
        <ComparisonContext.Provider value={{ selectedTourIds, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
            {children}
        </ComparisonContext.Provider>
    );
};

export const useComparison = () => {
    const context = useContext(ComparisonContext);
    if (!context) {
        throw new Error('useComparison must be used within a ComparisonProvider');
    }
    return context;
};
