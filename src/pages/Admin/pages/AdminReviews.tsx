import { useEffect, useState } from 'react';
import { reviewService } from '../../../services/reviewService';
import { Review } from '../../../types';
import { Star, Trash2, MessageSquare, Reply, Phone, User, Mail, MapPin, Search, CheckCircle, Video, ChevronDown, ChevronUp } from 'lucide-react';
import Sidebar from '../components/Sidebar';

// Helper for Media URL
const getMediaUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `http://localhost:5000${url}`;
};

const AdminReviews = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    // Official Reply State
    const [replyingId, setReplyingId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');

    // Discussion Reply State
    const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
    const [discussionReplyText, setDiscussionReplyText] = useState<string>('');
    const [activeDiscussionId, setActiveDiscussionId] = useState<number | null>(null);

    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'replied'>('all');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await reviewService.getAll();
            // Sort by new first
            const sorted = res.data.sort((a, b) => new Date(b.ngayDanhGia || '').getTime() - new Date(a.ngayDanhGia || '').getTime());
            setReviews(sorted);
        } catch (error) {
            console.error("Fetch reviews failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Bạn có chắc chắn muốn xóa đánh giá này? hành động này không thể hoàn tác.")) {
            try {
                await reviewService.delete(id);
                setReviews(reviews.filter(r => r.danhGiaId !== id));
            } catch (error) {
                alert("Xóa thất bại");
            }
        }
    };

    // --- Official Admin Reply (Legacy/Single) ---
    const startReply = (rv: Review) => {
        setReplyingId(rv.danhGiaId!);
        setReplyText(rv.traLoi || '');
    };

    const submitReply = async (id: number) => {
        if (!replyText.trim()) return;
        try {
            await reviewService.reply(id, replyText);
            setReviews(reviews.map(r =>
                r.danhGiaId === id ? { ...r, traLoi: replyText, ngayTraLoi: new Date().toISOString() } : r
            ));
            alert("Đã gửi phản hồi thành công!");
            setReplyingId(null);
            setReplyText('');
        } catch (error) {
            alert("Gửi trả lời thất bại");
        }
    };

    // --- Discussion Logic ---
    const toggleApproveReplies = (reviewId: number) => {
        if (expandedReplies.includes(reviewId)) {
            setExpandedReplies(expandedReplies.filter(id => id !== reviewId));
        } else {
            setExpandedReplies([...expandedReplies, reviewId]);
        }
    };

    const submitDiscussionReply = async (reviewId: number) => {
        if (!discussionReplyText.trim()) return;
        try {
            // isAnonymous=false for Admin, no media for now in quick reply
            const res = await reviewService.comment(reviewId, discussionReplyText, false, []);

            // res.data returns the UPDATED replies array
            setReviews(reviews.map(r =>
                r.danhGiaId === reviewId ? { ...r, replies: res.data } : r
            ));

            setDiscussionReplyText('');
            // setActiveDiscussionId(null); // Optional: keep open to chat more
        } catch (error) {
            console.error(error);
            alert("Lỗi khi gửi bình luận");
        }
    };

    const filteredReviews = reviews.filter(rv => {
        // Text Search
        const matchesSearch =
            (rv.tour?.tenTour || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (rv.nguoiDung?.hoTen || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (rv.binhLuan || '').toLowerCase().includes(searchTerm.toLowerCase());

        // Status Filter
        if (filterMode === 'pending') return matchesSearch && !rv.traLoi;
        if (filterMode === 'replied') return matchesSearch && !!rv.traLoi;

        return matchesSearch;
    });

    const pendingCount = reviews.filter(r => !r.traLoi).length;

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Đang tải dữ liệu...</div>;

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                {/* Header Section */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 mb-2">Quản Lý Đánh Giá</h1>
                        <p className="text-gray-500 text-sm">Xem và phản hồi ý kiến từ khách hàng</p>
                    </div>
                </div>

                {/* Filters & Search Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-10 transition-all">
                    {/* Status Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setFilterMode('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filterMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Tất cả ({reviews.length})
                        </button>
                        <button
                            onClick={() => setFilterMode('pending')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filterMode === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Cần phản hồi ({pendingCount})
                        </button>
                        <button
                            onClick={() => setFilterMode('replied')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filterMode === 'replied' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Đã xử lý
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm khách hàng, tour..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Reviews Grid */}
                {filteredReviews.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">Không tìm thấy đánh giá nào phù hợp.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredReviews.map((rv) => {
                            const isAnonymous = rv.isAnonymous;
                            const userName = isAnonymous ? 'Người dùng ẩn danh' : (rv.nguoiDung?.hoTen || (typeof rv.userId === 'object' ? (rv.userId as any).hoTen : `User #${rv.userId}`));
                            const tourName = rv.tour?.tenTour || (typeof rv.tourId === 'object' ? (rv.tourId as any).tenTour : `Tour #${rv.tourId}`);

                            // Check reply status
                            const hasAdminReply = !!rv.traLoi;
                            const isEditingOfficial = replyingId === rv.danhGiaId;
                            const showDiscussion = expandedReplies.includes(rv.danhGiaId!);

                            return (
                                <div key={rv.danhGiaId} className={`bg-white rounded-2xl p-6 shadow-sm border transition-shadow hover:shadow-md ${isEditingOfficial ? 'border-blue-500 ring-1 ring-blue-100' : 'border-gray-100'}`}>
                                    <div className="flex flex-col lg:flex-row gap-6">

                                        {/* Left: User & Review Content */}
                                        <div className="flex-1">
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${isAnonymous ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                                                        {isAnonymous ? <User size={20} /> : userName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-gray-900">{userName}</h3>
                                                            {isAnonymous && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 uppercase tracking-wider font-bold">Ẩn danh</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                            <span>{new Date(rv.ngayDanhGia || '').toLocaleDateString('vi-VN')}</span>
                                                            <span></span>
                                                            <span className="text-blue-600 font-medium truncate max-w-[200px]" title={tourName}>{tourName}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star key={s} size={16} className={s <= rv.soSao ? "text-yellow-400 fill-current" : "text-gray-200"} />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="pl-0 lg:pl-[60px]">
                                                <p className="text-gray-700 leading-relaxed mb-4 text-sm lg:text-base">
                                                    {rv.binhLuan}
                                                </p>

                                                {/* Media Grid */}
                                                {rv.media && rv.media.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {rv.media.map((m, idx) => (
                                                            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 group cursor-pointer">
                                                                {m.type === 'image' ? (
                                                                    <img src={getMediaUrl(m.url)} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Review Media" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                                                        <Video size={20} className="text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Stats & Actions */}
                                                <div className="flex items-center gap-6 text-sm text-gray-500 pt-3 border-t border-gray-50">
                                                    {/* User Info Quick View */}
                                                    {!isAnonymous && rv.nguoiDung && (
                                                        <button
                                                            onClick={() => setSelectedReview(rv)}
                                                            className="flex items-center gap-1.5 hover:text-blue-600 transition"
                                                        >
                                                            <Phone size={14} />
                                                            <span>Xem liên hệ</span>
                                                        </button>
                                                    )}

                                                    {/* Discussion Toggle */}
                                                    <button
                                                        onClick={() => toggleApproveReplies(rv.danhGiaId!)}
                                                        className={`flex items-center gap-1.5 transition ${showDiscussion ? 'text-blue-600 font-bold' : 'hover:text-blue-600'}`}
                                                    >
                                                        <MessageSquare size={14} />
                                                        <span>{(rv.replies?.length || 0)} thảo luận</span>
                                                        {showDiscussion ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </button>

                                                    <div className="flex-1"></div>

                                                    <button
                                                        onClick={() => handleDelete(rv.danhGiaId!)}
                                                        className="text-red-400 hover:text-red-500 flex items-center gap-1.5 transition px-3 py-1.5 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 size={14} /> Xóa
                                                    </button>
                                                </div>

                                                {/* Discussion Thread Area */}
                                                {showDiscussion && (
                                                    <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100 animate-fade-in">
                                                        <h4 className="font-bold text-gray-700 text-sm mb-3">Thảo luận cộng đồng</h4>

                                                        {/* Replies List */}
                                                        <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-2">
                                                            {rv.replies && rv.replies.length > 0 ? (
                                                                rv.replies.map((reply, rIdx) => {
                                                                    const rUser = typeof reply.userId === 'object' ? reply.userId as any : null;
                                                                    // Show "Phản hồi Admin" if user is admin or role is 1
                                                                    const isAdminReply = rUser?.isAdmin || rUser?.role === 'admin' || rUser?.role === 1 || rUser?.email === 'admin@gmail.com';
                                                                    const rName = reply.isAnonymous ? 'Ẩn danh' : (isAdminReply ? 'Phản hồi Admin' : (rUser?.hoTen || 'User'));
                                                                    const isTagged = reply.content.trim().startsWith('@');

                                                                    return (
                                                                        <div key={rIdx} className={`flex gap-3 text-sm ${isTagged ? 'ml-8' : ''} group`}>
                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isAdminReply ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                                {isAdminReply ? <CheckCircle size={14} /> : rName.charAt(0)}
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <div className={`p-2.5 rounded-lg border relative ${isAdminReply ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
                                                                                    <div className="flex justify-between items-start mb-1">
                                                                                        <span className={`font-bold text-xs ${isAdminReply ? 'text-orange-700' : 'text-gray-800'}`}>{rName}</span>
                                                                                        <span className="text-[10px] text-gray-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                                                                    </div>
                                                                                    <p className="text-gray-600">{reply.content}</p>

                                                                                    {/* Reply Button (Hover) */}
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setActiveDiscussionId(rv.danhGiaId!);
                                                                                            setDiscussionReplyText(`@${rName} `);
                                                                                        }}
                                                                                        className="absolute -right-2 -bottom-2 bg-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-full shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-all"
                                                                                        title="Trả lời người này"
                                                                                    >
                                                                                        <Reply size={12} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                <p className="text-gray-400 text-sm py-2 text-center italic">Chưa có bình luận nào</p>
                                                            )}
                                                        </div>

                                                        {/* Quick Reply Input */}
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Tham gia thảo luận..."
                                                                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                value={activeDiscussionId === rv.danhGiaId ? discussionReplyText : ''}
                                                                onChange={(e) => {
                                                                    setActiveDiscussionId(rv.danhGiaId!);
                                                                    setDiscussionReplyText(e.target.value);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') submitDiscussionReply(rv.danhGiaId!);
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => submitDiscussionReply(rv.danhGiaId!)}
                                                                className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition"
                                                            >
                                                                <Reply size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Admin Official Reply Area */}
                                        <div className="w-full lg:w-1/3 bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col h-fit">
                                            <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-700 uppercase tracking-wide">
                                                <Reply size={16} className="text-blue-600" />
                                                Phản hồi chính thức
                                            </div>

                                            {isEditingOfficial ? (
                                                <div className="flex flex-col gap-3 flex-1">
                                                    <textarea
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none text-sm resize-none"
                                                        rows={4}
                                                        placeholder="Nhập nội dung trả lời khách hàng..."
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2 mt-auto">
                                                        <button
                                                            onClick={() => { setReplyingId(null); setReplyText(''); }}
                                                            className="px-3 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
                                                        >
                                                            Hủy
                                                        </button>
                                                        <button
                                                            onClick={() => submitReply(rv.danhGiaId!)}
                                                            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm"
                                                        >
                                                            Gửi
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col">
                                                    {hasAdminReply ? (
                                                        <>
                                                            <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-gray-700 italic mb-3 shadow-sm">
                                                                "{rv.traLoi}"
                                                            </div>
                                                            <div className="mt-auto flex justify-end">
                                                                <button
                                                                    onClick={() => startReply(rv)}
                                                                    className="text-blue-600 text-xs font-bold hover:underline"
                                                                >
                                                                    Chỉnh sửa
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-200 rounded-lg">
                                                            <p className="text-gray-400 text-sm mb-3">Chưa có phản hồi</p>
                                                            <button
                                                                onClick={() => startReply(rv)}
                                                                className="px-4 py-2 bg-white text-blue-600 border border-blue-100 font-bold text-sm rounded-lg hover:bg-blue-50 transition shadow-sm"
                                                            >
                                                                Trả lời ngay
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal for User Details */}
            {selectedReview && selectedReview.nguoiDung && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedReview(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        {/* Wrapper for safe access */}
                        <div className="bg-blue-600 p-6 text-white text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-3 text-3xl font-bold backdrop-blur-md">
                                {selectedReview.nguoiDung.hoTen.charAt(0)}
                            </div>
                            <h3 className="font-bold text-xl">{selectedReview.nguoiDung.hoTen}</h3>
                            <p className="text-blue-100 text-sm">Khách hàng</p>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition">
                                <div className="bg-white p-2 rounded-full shadow-sm text-blue-500"><Mail size={18} /></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Email</p>
                                    <p className="text-gray-900 font-medium break-all">{selectedReview.nguoiDung.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition">
                                <div className="bg-white p-2 rounded-full shadow-sm text-green-500"><Phone size={18} /></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Điện thoại</p>
                                    <p className="text-gray-900 font-medium">{selectedReview.nguoiDung.soDienThoai || 'Chưa cập nhật'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition">
                                <div className="bg-white p-2 rounded-full shadow-sm text-red-500"><MapPin size={18} /></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Địa chỉ</p>
                                    <p className="text-gray-900 font-medium">{selectedReview.nguoiDung.diaChi || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                            <button
                                onClick={() => setSelectedReview(null)}
                                className="px-8 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 hover:shadow-sm transition"
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
