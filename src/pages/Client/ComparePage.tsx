import React, { useEffect, useState } from 'react';
import { useComparison } from '../../context/ComparisonContext';
import { tourService } from '../../services/tourService';
import { Tour } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Plane, Bus, Clock, Check, Plus, Search } from 'lucide-react';

const ComparePage: React.FC = () => {
    const { selectedTourIds, removeFromCompare, addToCompare } = useComparison();
    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(false);

    // Add Tour Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allTours, setAllTours] = useState<Tour[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            if (selectedTourIds.length === 0) {
                setTours([]);
                return;
            }
            setLoading(true);
            try {
                const idsParam = selectedTourIds.join(',');
                const res = await tourService.getAll({ ids: idsParam });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = (res && (res as any).data) ? (res as any).data : res;
                setTours(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [selectedTourIds]);

    const handleOpenAddModal = async () => {
        setIsModalOpen(true);
        if (allTours.length === 0) {
            try {
                const res = await tourService.getAll();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = (res && (res as any).data) ? (res as any).data : res;
                setAllTours(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch all tours", error);
            }
        }
    };

    const handleConfirmAdd = (tourId: number) => {
        addToCompare(tourId);
        setIsModalOpen(false);
    };

    // Filter available tours for the modal
    const availableTours = allTours.filter(t => !selectedTourIds.includes(t.tourId) && t.tenTour.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading && tours.length === 0) { return <div className="p-10 text-center">Đang tải dữ liệu so sánh...</div>; }
    // Removed "Empty state" return to allow adding tours if empty (though logic originally redirected). 
    // If selectedTourIds is empty, we still render so user can add.

    const showAddButton = tours.length < 3;

    // Helpers for highlighting
    const minPrice = tours.length > 0 ? Math.min(...tours.map(t => t.tongGiaDuKien || Infinity)) : 0;

    return (
        <div className="container mx-auto px-4 py-8 relative">
            <div className="mb-6 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition">
                    <ArrowLeft size={20} /> Quay lại
                </button>
                <h1 className="text-3xl font-bold text-gray-800">So sánh Tour</h1>
                <div className="w-24"></div>
            </div>

            {tours.length === 0 && !isModalOpen ? (
                <div className="text-center py-20">
                    <h2 className="text-xl text-gray-600 mb-4">Chưa có tour nào để so sánh</h2>
                    <button onClick={handleOpenAddModal} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition flex items-center gap-2 mx-auto">
                        <Plus size={20} /> Thêm tour ngay
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
                    <table className="w-full bg-white text-left border-collapse table-fixed">
                        <thead>
                            <tr>
                                <th className="p-4 border-b border-r bg-gray-50 w-64 font-bold text-gray-700">Tiêu chí</th>
                                {tours.map(tour => (
                                    <th key={tour.tourId} className="p-4 border-b border-r w-80 relative">
                                        <button
                                            onClick={() => removeFromCompare(tour.tourId)}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                        >
                                            <X size={18} />
                                        </button>
                                        <div className="font-bold text-xl text-teal-800 mb-2 line-clamp-2 h-14">
                                            {tour.tenTour}
                                        </div>
                                        <div className="h-40 w-full mb-3 overflow-hidden rounded-lg">
                                            <img src={tour.hinhAnhBia || 'https://via.placeholder.com/300'} alt={tour.tenTour} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <Link to={`/tours/${tour.tourId}`} className="block text-center bg-teal-50 text-teal-700 py-2 rounded font-semibold hover:bg-teal-100 transition">
                                            Xem chi tiết
                                        </Link>
                                    </th>
                                ))}
                                {showAddButton && (
                                    <th className="p-4 border-b border-r w-80 align-middle text-center bg-gray-50/50">
                                        <button
                                            onClick={handleOpenAddModal}
                                            className="w-full h-full min-h-[250px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50 transition-all group"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                                                <Plus size={32} />
                                            </div>
                                            <span className="font-semibold">Thêm tour</span>
                                        </button>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {/* PRICE */}
                            <tr>
                                <td className="p-4 border-b border-r font-semibold text-gray-700 bg-gray-50">Giá tiền</td>
                                {tours.map(tour => (
                                    <td key={tour.tourId} className={`p-4 border-b border-r text-lg font-bold ${tour.tongGiaDuKien === minPrice ? 'text-green-600' : 'text-gray-800'}`}>
                                        {tour.tongGiaDuKien?.toLocaleString('vi-VN')} đ
                                        {tour.tongGiaDuKien === minPrice && <span className="block text-xs font-normal text-green-500 mt-1">Rẻ nhất!</span>}
                                    </td>
                                ))}
                                {showAddButton && <td className="border-b border-r bg-gray-50/30"></td>}
                            </tr>

                            {/* DURATION */}
                            <tr>
                                <td className="p-4 border-b border-r font-semibold text-gray-700 bg-gray-50">Thời lượng</td>
                                {tours.map(tour => (
                                    <td key={tour.tourId} className="p-4 border-b border-r text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-gray-400" />
                                            {tour.thoiGian || 'Không có thông tin'}
                                        </div>
                                    </td>
                                ))}
                                {showAddButton && <td className="border-b border-r bg-gray-50/30"></td>}
                            </tr>

                            {/* TRANSPORT */}
                            <tr>
                                <td className="p-4 border-b border-r font-semibold text-gray-700 bg-gray-50">Phương tiện</td>
                                {tours.map(tour => (
                                    <td key={tour.tourId} className="p-4 border-b border-r text-gray-700">
                                        <div className="flex items-center gap-2">
                                            {tour.phuongTien?.toLowerCase().includes('bay') ? <Plane size={16} /> : <Bus size={16} />}
                                            {tour.phuongTien || 'Ô tô'}
                                        </div>
                                    </td>
                                ))}
                                {showAddButton && <td className="border-b border-r bg-gray-50/30"></td>}
                            </tr>

                            {/* UTILITIES / INCLUDES */}
                            <tr>
                                <td className="p-4 border-b border-r font-semibold text-gray-700 bg-gray-50">Dịch vụ bao gồm</td>
                                {tours.map(tour => (
                                    <td key={tour.tourId} className="p-4 border-b border-r text-sm text-gray-600 align-top">
                                        <ul className="space-y-2">
                                            {(tour.dichVuBaoGom ? tour.dichVuBaoGom.split('\n') : []).map((item, idx) => {
                                                const isSubItem = item.trim().startsWith('-') || item.trim().startsWith('+');
                                                return (
                                                    <li key={idx} className={`flex gap-2 items-start ${isSubItem ? 'pl-6 text-xs' : ''}`}>
                                                        {!isSubItem && <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />}
                                                        <span className={`${isSubItem ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>{item}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </td>
                                ))}
                                {showAddButton && <td className="border-b border-r bg-gray-50/30"></td>}
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* ADD TOUR MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">Thêm tour vào so sánh</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm tour..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto p-4 space-y-3 flex-1">
                            {availableTours.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    Không tìm thấy tour phù hợp hoặc tất cả đã được chọn.
                                </div>
                            ) : (
                                availableTours.map(tour => (
                                    <div key={tour.tourId} className="flex gap-4 p-3 rounded-lg border border-gray-100 hover:border-teal-500 hover:bg-teal-50 transition cursor-pointer group" onClick={() => handleConfirmAdd(tour.tourId)}>
                                        <div className="w-20 h-20 rounded-md overflow-hidden shrink-0">
                                            <img src={tour.hinhAnhBia || 'https://via.placeholder.com/150'} alt={tour.tenTour} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 line-clamp-1 group-hover:text-teal-700">{tour.tenTour}</h4>
                                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{tour.moTa || 'Chưa có mô tả'}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-red-600 font-bold text-sm">{tour.tongGiaDuKien?.toLocaleString()} đ</span>
                                                <span className="text-xs text-gray-400">{tour.thoiGian}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <button className="bg-white border border-teal-600 text-teal-600 p-2 rounded-full group-hover:bg-teal-600 group-hover:text-white transition">
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparePage;
