import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Calendar, Loader, Search } from 'lucide-react';
import { tourService } from '../../../services/tourService';
import { Tour } from '../../../types';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const TourManagement = () => {
    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();



    const fetchTours = async (curSearch = '') => {
        try {
            setLoading(true);
            const res = await tourService.getAll({ keyword: curSearch, mode: 'admin' });
            setTours(res.data);
        } catch (error) {
            console.error("Failed to fetch tours", error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTours(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tour này?')) {
            try {
                await tourService.deleteTour(id);
                setTours(prev => prev.filter(t => t.tourId !== id));
            } catch (error) {
                alert('Xóa thất bại');
            }
        }
    };



    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 ml-64 overflow-auto p-8">
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-800">Quản lý Tour</h1>

                        <div className="flex-1 max-w-md mx-8 relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên tour..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                        </div>

                        <button
                            onClick={() => navigate('/admin/tours/create')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                            <Plus size={20} /> Thêm Tour Mới
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="flex justify-center items-center py-20 text-gray-500 gap-2"><Loader className="animate-spin" /> Đang tải...</div>
                        ) : (
                            tours.map(tour => (
                                <div key={tour.tourId} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition">
                                    <div className="flex items-center gap-4">
                                        <img src={tour.hinhAnhBia || "https://via.placeholder.com/150"} className="w-20 h-20 rounded-lg object-cover shadow-sm bg-gray-100" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-gray-800 mb-1">{tour.tenTour}</h3>
                                                {tour.isTuChon && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">Tự thiết kế</span>}
                                                {!tour.daDuyet && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">Chờ duyệt</span>}
                                            </div>
                                            <div className="flex gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1"><MapPin size={14} /> {tour.diemKhoiHanh}</span>
                                                <span className="flex items-center gap-1"><Calendar size={14} /> {tour.thoiGian || ((tour.tourChiTiets?.length || 0) + ' ngày')}</span>
                                                <span className="font-medium text-blue-600">{tour.tongGiaDuKien.toLocaleString()} ₫</span>
                                            </div>
                                            <p className="text-gray-500 text-xs mt-1">
                                                {(tour.lichTrinh || tour.tourChiTiets) ? (tour.lichTrinh || tour.tourChiTiets).length : 0} hoạt động
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => navigate(`/admin/tours/edit/${tour.tourId}`)}
                                            className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tour.tourId)}
                                            className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                                            title="Xóa"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourManagement;
