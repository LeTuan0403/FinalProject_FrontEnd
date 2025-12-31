import { useEffect, useState } from 'react';
import { reviewService } from '../../../services/reviewService';
import { Review } from '../../../types';
import { Star, Trash2, MessageSquare, Reply, Clock, Phone, User, Mail, FileText, X, Search } from 'lucide-react';

import Sidebar from '../components/Sidebar';

const AdminReviews = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingId, setReplyingId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await reviewService.getAll();
            setReviews(res.data);
        } catch (error) {
            // Error handling usually shows UI feedback, keep basic log or remove
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) {
            try {
                await reviewService.delete(id);
                setReviews(reviews.filter(r => r.danhGiaId !== id));
                alert("Đã xóa thành công!");
            } catch (error) {
                alert("Xóa thất bại");
            }
        }
    };

    const startReply = (rv: Review) => {
        setReplyingId(rv.danhGiaId!);
        setReplyText(rv.traLoi || '');
    };

    const cancelReply = () => {
        setReplyingId(null);
        setReplyText('');
    };

    const submitReply = async (id: number) => {
        try {
            await reviewService.reply(id, replyText);
            setReviews(reviews.map(r =>
                r.danhGiaId === id ? { ...r, traLoi: replyText, ngayTraLoi: new Date().toISOString() } : r
            ));
            alert("Đã trả lời!");
            setReplyingId(null);
            setReplyText('');
        } catch (error) {
            alert("Gửi trả lời thất bại");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

    const filteredReviews = reviews.filter(rv =>
        (rv.tour?.tenTour || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rv.nguoiDung?.hoTen || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rv.binhLuan || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-gray-800">Quản Lý Đánh Giá</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm review, tour, user..."
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                            {filteredReviews.length} đánh giá
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-semibold">
                                <tr>
                                    <th className="p-4 border-b">Khách hàng</th>
                                    <th className="p-4 border-b">Tour</th>
                                    <th className="p-4 border-b">Đánh giá</th>
                                    <th className="p-4 border-b">Nội dung</th>
                                    <th className="p-4 border-b w-1/4">Phản hồi</th>
                                    <th className="p-4 border-b text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredReviews.map((rv) => (
                                    <tr key={rv.danhGiaId} className={replyingId === rv.danhGiaId ? "bg-blue-50" : "hover:bg-gray-50 transition"}>
                                        <td className="p-4 align-top">

                                            <div className="font-bold text-gray-800 flex items-center gap-2">
                                                {rv.nguoiDung?.hoTen || `User #${rv.userId}`}
                                                {rv.nguoiDung && (
                                                    <button
                                                        onClick={() => setSelectedReview(rv)}
                                                        className="text-gray-400 hover:text-blue-600 transition"
                                                        title="Xem liên hệ"
                                                    >
                                                        <Phone size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400">{rv.ngayDanhGia ? new Date(rv.ngayDanhGia).toLocaleDateString('vi-VN') : ''}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 max-w-[200px] truncate align-top" title={rv.tour?.tenTour || ''}>
                                            <span className="font-medium text-blue-600">{rv.tour?.tenTour || `Tour #${rv.tourId}`}</span>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex text-yellow-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} className={i < rv.soSao ? "fill-current" : "text-gray-300"} />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 italic border border-gray-100">
                                                "{rv.binhLuan}"
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            {replyingId === rv.danhGiaId ? (
                                                <textarea
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    rows={3}
                                                    placeholder="Nhập nội dung trả lời..."
                                                    autoFocus
                                                />
                                            ) : (
                                                rv.traLoi ? (
                                                    <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800 border border-green-100 max-w-[300px]">
                                                        <div className="font-bold text-xs mb-1 flex items-center gap-1"><Reply size={12} /> Admin trả lời:</div>
                                                        {rv.traLoi}
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200 shadow-sm animate-pulse">
                                                        <Clock size={12} /> Chưa xử lý
                                                    </span>
                                                )
                                            )}
                                        </td>
                                        <td className="p-4 text-center align-top">
                                            <div className="flex justify-center gap-2">
                                                {replyingId === rv.danhGiaId ? (
                                                    <>
                                                        <button
                                                            onClick={() => submitReply(rv.danhGiaId!)}
                                                            className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition shadow-sm"
                                                            title="Lưu"
                                                        >
                                                            Lưu
                                                        </button>
                                                        <button
                                                            onClick={cancelReply}
                                                            className="p-2 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg transition"
                                                            title="Hủy"
                                                        >
                                                            Hủy
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => startReply(rv)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Trả lời"
                                                        >
                                                            <MessageSquare size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(rv.danhGiaId!)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* Contact Details Modal */}
            {selectedReview && selectedReview.nguoiDung && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReview(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">Thông tin khách hàng</h3>
                            <button onClick={() => setSelectedReview(null)} className="text-gray-400 hover:text-gray-600 transition"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><User size={20} /></div>
                                <div className="flex-1">
                                    <div className="text-sm text-gray-500">Họ và tên</div>
                                    <div className="font-bold text-gray-800 text-lg">{selectedReview.nguoiDung.hoTen}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-green-50 p-2 rounded-lg text-green-600"><Mail size={20} /></div>
                                <div className="flex-1">
                                    <div className="text-sm text-gray-500">Email</div>
                                    <div className="font-medium text-gray-800 break-all">{selectedReview.nguoiDung.email}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><Phone size={20} /></div>
                                <div className="flex-1">
                                    <div className="text-sm text-gray-500">Số điện thoại</div>
                                    <div className="font-medium text-gray-800">{selectedReview.nguoiDung.soDienThoai || 'Chưa cập nhật'}</div>
                                </div>
                            </div>
                            {selectedReview.nguoiDung.diaChi && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-600 text-sm flex gap-3">
                                    <div className="text-gray-400"><FileText size={20} /></div>
                                    <div className="flex-1">
                                        <div className="font-bold mb-1 text-gray-700">Địa chỉ:</div>
                                        {selectedReview.nguoiDung.diaChi}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                            <button
                                onClick={() => setSelectedReview(null)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReviews;
