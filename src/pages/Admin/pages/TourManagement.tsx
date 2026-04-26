import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, MapPin, Calendar, Loader, Search, CheckCircle } from 'lucide-react';
import { tourService } from '../../../services/tourService';
import { useNotification } from '../../../context/NotificationContext';
import { Tour } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../../context/ChatContext';

const TourManagement = () => {
    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
    const [filterLocation, setFilterLocation] = useState<'all' | 'domestic' | 'international'>('all');
    const navigate = useNavigate();
    const { refreshCounts } = useNotification();

    const fetchTours = async (curSearch = '') => {
        try {
            setLoading(true);
            const res = await tourService.getAll({ keyword: curSearch, mode: 'admin' });
            // Sort by Date (Newest first)
            const sorted = res.data.sort((a: Tour, b: Tour) => new Date(b.ngayTao || 0).getTime() - new Date(a.ngayTao || 0).getTime());
            setTours(sorted);
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

    // Socket Listener for Real-time Updates
    const { socket } = useChat();
    useEffect(() => {
        if (!socket) { return; }
        const handleNotification = (data: { type: string }) => {
            if (data.type === 'tour') {
                // Determine if we should refresh based on current tab? 
                // Or just always refresh. Refreshing is safest.
                fetchTours(searchTerm);
            }
        };
        socket.on("admin_notification", handleNotification);
        return () => {
            socket.off("admin_notification", handleNotification);
        };
    }, [socket, searchTerm]);

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tour này?')) {
            try {
                await tourService.deleteTour(id);
                setTours(prev => prev.filter(t => t.tourId !== id));
                refreshCounts();
            } catch (error) {
                toast.error('Xóa thất bại');
            }
        }
    };

    const handleApprove = async (id: number) => {
        if (window.confirm('Xác nhận duyệt tour này?')) {
            try {
                await tourService.approveTour(id);
                // Update local state to reflect approval
                setTours(prev => prev.map(t => t.tourId === id ? { ...t, daDuyet: true } : t));
                toast.success('Đã duyệt tour!');
                refreshCounts();
            } catch (error) {
                toast.error('Duyệt thất bại');
            }
        }
    };

    const filteredTours = tours.filter(tour => {
        // Status filter
        if (filterStatus === 'approved' && !tour.daDuyet) { return false; }
        if (filterStatus === 'pending' && tour.daDuyet) { return false; }
        // Location filter
        if (filterLocation === 'domestic' && !tour.loaiTour?.includes('Trong Nước')) { return false; }
        if (filterLocation === 'international' && !tour.loaiTour?.includes('Nước Ngoài')) { return false; }
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Quản lý Tour</h1>

                <div className="flex-1 max-w-md w-full relative">
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
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 whitespace-nowrap">
                    <Plus size={20} /> Thêm Tour Mới
                </button>
            </div>

            {/* Tabs + Location Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Status Tabs */}
                <div className="flex gap-2 border-b border-gray-200 pb-1 flex-1">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${filterStatus === 'all' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Tất cả ({tours.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('approved')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${filterStatus === 'approved' ? 'bg-white text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Đã duyệt ({tours.filter(t => t.daDuyet).length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('pending')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${filterStatus === 'pending' ? 'bg-white text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Chờ duyệt ({tours.filter(t => !t.daDuyet).length})
                    </button>
                </div>

                {/* Location Filter */}
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl shrink-0">
                    <button
                        onClick={() => setFilterLocation('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                            filterLocation === 'all'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        🌐 Tất cả
                    </button>
                    <button
                        onClick={() => setFilterLocation('domestic')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                            filterLocation === 'domestic'
                                ? 'bg-green-500 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        🇻🇳 Trong Nước
                    </button>
                    <button
                        onClick={() => setFilterLocation('international')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                            filterLocation === 'international'
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        ✈️ Nước Ngoài
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="flex justify-center items-center py-20 text-gray-500 gap-2"><Loader className="animate-spin" /> Đang tải...</div>
                ) : filteredTours.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed">
                        Không tìm thấy tour nào.
                    </div>
                ) : (
                    filteredTours.map(tour => (
                        <div key={tour.tourId} className={`bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between hover:shadow-md transition ${!tour.daDuyet ? 'border-l-4 border-l-yellow-400' : ''}`}>
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <img src={tour.hinhAnhBia || "https://placehold.co/150"} className="w-20 h-20 rounded-lg object-cover shadow-sm bg-gray-100 flex-shrink-0" />
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-lg text-gray-800 mb-1">{tour.tenTour}</h3>
                                        {tour.isTuChon && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">Tự thiết kế</span>}
                                        {!tour.daDuyet ? (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                <Loader size={10} className="animate-spin" /> Chờ duyệt
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                <CheckCircle size={10} /> Đã công khai
                                            </span>
                                        )}

                                        {/* Last Minute Badges */}
                                        {(() => {
                                            if (!tour.ngayKhoiHanh) {
                                                return null;
                                            }
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const threeDays = new Date(today);
                                            threeDays.setDate(today.getDate() + 3);
                                            threeDays.setHours(23, 59, 59, 999);

                                            const lastMinDates = tour.ngayKhoiHanh.filter(d => {
                                                const dt = new Date(d);
                                                return dt >= today && dt <= threeDays;
                                            });

                                            if (lastMinDates.length === 0) {
                                                return null;
                                            }

                                            const missingDiscount = lastMinDates.some(d =>
                                                !tour.discounts?.some(disc => new Date(disc.date).getTime() === new Date(d).getTime())
                                            );

                                            if (missingDiscount) {
                                                return (
                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black flex items-center gap-1 animate-pulse border border-red-200">
                                                        🔔 CẦN GIẢM GIÁ (GIỜ CHÓT)
                                                    </span>
                                                );
                                            }

                                            const maxDisc = Math.max(...(tour.discounts || [])
                                                .filter(disc => lastMinDates.some(lmd => new Date(lmd).getTime() === new Date(disc.date).getTime()))
                                                .map(d => d.percentage), 0);

                                            return (
                                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-black flex items-center gap-1 border border-orange-200">
                                                    🔥 GIỜ CHÓT: -{maxDisc}%
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {tour.diemKhoiHanh}</span>
                                        <span className="flex items-center gap-1"><Calendar size={14} /> {tour.thoiGian || ((tour.tourChiTiets?.length || 0) + ' ngày')}</span>
                                        <span className="font-medium text-blue-600">{tour.tongGiaDuKien?.toLocaleString()} ₫</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                        <p className="text-gray-500 text-xs">
                                            {(tour.lichTrinh || tour.tourChiTiets) ? (tour.lichTrinh || tour.tourChiTiets).length : 0} hoạt động • ID: {tour.tourId}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto justify-end">
                                {!tour.daDuyet && (
                                    <button
                                        onClick={() => handleApprove(tour.tourId)}
                                        className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-200 flex items-center gap-1"
                                        title="Duyệt Tour"
                                    >
                                        <CheckCircle size={16} /> Duyệt
                                    </button>
                                )}
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
                                    title={!tour.daDuyet ? "Từ chối / Xóa" : "Xóa tour"}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TourManagement;
