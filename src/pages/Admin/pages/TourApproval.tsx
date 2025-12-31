import { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { tourService } from '../../../services/tourService';
import { Tour } from '../../../types';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const TourApproval = () => {
    const [pendingTours, setPendingTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPendingTours();
    }, []);

    const fetchPendingTours = async () => {
        try {
            setLoading(true);
            const res = await tourService.getAll({ mode: 'admin' });

            // Sort: Pending (!daDuyet) FIRST, Approved (daDuyet) LAST
            // Within group: FIFO (Date)
            const sorted = res.data.sort((a: Tour, b: Tour) => {
                const aPending = !a.daDuyet;
                const bPending = !b.daDuyet;

                if (aPending && !bPending) return -1;
                if (!aPending && bPending) return 1;

                return new Date(a.ngayTao || 0).getTime() - new Date(b.ngayTao || 0).getTime();
            });

            setPendingTours(sorted);
        } catch (error) {
            console.error("Failed to fetch pending tours", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (window.confirm('Xác nhận duyệt tour này?')) {
            try {
                await tourService.approveTour(id);
                fetchPendingTours(); // Refresh list to move it to bottom
                alert('Đã duyệt tour!');
            } catch (error) {
                alert('Duyệt thất bại');
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn từ chối (xóa) tour này?')) {
            try {
                await tourService.deleteTour(id);
                setPendingTours(prev => prev.filter(t => t.tourId !== id));
            } catch (error) {
                alert('Xóa thất bại');
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center py-20 text-gray-500 gap-2"><Loader className="animate-spin" /> Đang tải tour chờ duyệt...</div>;

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 ml-64 overflow-auto p-8">
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold text-gray-800">Duyệt Tour ({pendingTours.length})</h1>
                    {pendingTours.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl text-center text-gray-500 border border-dashed border-gray-200">
                            Hiện tại không có tour nào chờ duyệt.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {pendingTours.map(tour => (
                                <div key={tour.tourId} className={`bg-white p-6 rounded-xl border-l-4 shadow-sm flex items-center justify-between ${tour.daDuyet ? 'border-green-500 opacity-75' : 'border-yellow-400'}`}>
                                    <div className="flex items-center gap-4">
                                        <img src={tour.hinhAnhBia || "https://images.unsplash.com/photo-1544945582-2a4baf72eb02?w=150"} className="w-20 h-20 rounded-lg object-cover shadow-sm bg-gray-100" />
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800 mb-1">{tour.tenTour}</h3>
                                            <div className="text-sm text-gray-500">Người tạo ID: {tour.nguoiTaoId || 'Unknown'}</div>
                                            <div className="font-bold text-blue-600 mt-1">{tour.tongGiaDuKien.toLocaleString()} ₫</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/admin/tours/edit/${tour.tourId}`)}
                                            className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition"
                                        >
                                            Xem chi tiết
                                        </button>

                                        {!tour.daDuyet ? (
                                            <>
                                                <button
                                                    onClick={() => handleDelete(tour.tourId)}
                                                    className="px-4 py-2 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200 transition"
                                                >
                                                    Từ chối
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(tour.tourId)}
                                                    className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-200"
                                                >
                                                    Duyệt ngay
                                                </button>
                                            </>
                                        ) : (
                                            <span className="px-4 py-2 bg-green-100 text-green-700 font-bold rounded-lg cursor-default border border-green-200">
                                                Đã duyệt
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TourApproval;
