import { useState, useEffect } from 'react';
import { tourService } from '../services/tourService';
import type { Tour } from '../types';

export const useTours = () => {
    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTours = async () => {
            try {
                setLoading(true);
                const response = await tourService.getAll();
                setTours(response.data);
            } catch (err) {
                setError('Không thể tải danh sách tour');
                console.error("Fetch tours error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTours();
    }, []);

    return { tours, loading, error };
};
