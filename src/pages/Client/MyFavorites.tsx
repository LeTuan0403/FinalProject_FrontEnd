import { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import type { Tour } from '../../types';
import TourCard from '../../components/common/TourCard';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyFavorites = () => {
    const [favorites, setFavorites] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            // Assuming the API returns a list of tours directly
            // NOTE: TypeScript might complain if response structure is different. 
            // Based on Controller: return Ok(user.ToursYeuThich); which is List<Tour>
            const res = await userService.getMyFavorites();
            // Axios wraps in data, so res.data should be Tour[]
            setFavorites(res.data);
        } catch (error) {
            console.error("Failed to fetch favorites", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFavorite = (tourId: number, status: boolean) => {
        if (!status) {
            // If status is false (un-favorited), remove from list
            setFavorites(prev => prev.filter(t => t.tourId !== tourId));
        }
    };

    if (loading) {return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;}

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-red-100 rounded-full">
                    <Heart className="w-8 h-8 text-red-600 fill-current" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800">Danh sách yêu thích</h1>
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-200">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-600 mb-2">Chưa có tour yêu thích</h2>
                    <p className="text-gray-500 mb-6">Bạn chưa lưu tour nào cả. Hãy khám phá và thả tim ngay nhé!</p>
                    <Link to="/tours" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                        Khám phá Tour ngay
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {favorites.map(tour => (
                        <TourCard
                            key={tour.tourId}
                            tour={tour}
                            isFavorite={true}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyFavorites;
