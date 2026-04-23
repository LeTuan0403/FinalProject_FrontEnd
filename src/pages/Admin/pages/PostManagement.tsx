import { useState, useEffect, useCallback } from 'react';
import { postService, Post } from '../../../services/postService';
import { Check, X, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PostCard from '../../../components/community/PostCard';
import { useNotification } from '../../../context/NotificationContext';

const PostManagement = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
    const { refreshCounts } = useNotification();

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const statusParam = filter === 'All' ? undefined : filter;
            const res = await postService.getAllPostsAdmin(statusParam);
            setPosts(res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách bài viết');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleApprove = async (id: string) => {
        if (!window.confirm('Duyệt bài viết này?')) { return; }
        try {
            await postService.approvePost(id);
            toast.success('Đã duyệt bài viết');
            // Remove from list if viewing Pending, or update status if viewing All
            if (filter === 'Pending') {
                setPosts(posts.filter(p => p._id !== id));
            } else {
                setPosts(posts.map(p => p._id === id ? { ...p, status: 'Approved' } : p));
            }
            refreshCounts();
        } catch (error) {
            toast.error('Lỗi khi duyệt');
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm('Từ chối bài viết này?')) { return; }
        try {
            await postService.rejectPost(id);
            toast.success('Đã từ chối bài viết');
            if (filter === 'Pending') {
                setPosts(posts.filter(p => p._id !== id));
            } else {
                setPosts(posts.map(p => p._id === id ? { ...p, status: 'Rejected' } : p));
            }
            refreshCounts();
        } catch (error) {
            toast.error('Lỗi khi từ chối');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xóa vĩnh viễn bài viết này?')) { return; }
        try {
            await postService.deletePost(id);
            toast.success('Đã xóa bài viết');
            setPosts(posts.filter(p => p._id !== id));
            refreshCounts();
        } catch (error) {
            toast.error('Lỗi khi xóa');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            'Pending': 'bg-yellow-100 text-yellow-700',
            'Approved': 'bg-green-100 text-green-700',
            'Rejected': 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100'}`}>
                {status === 'Pending' ? 'Chờ duyệt' : status === 'Approved' ? 'Đã duyệt' : 'Đã từ chối'}
            </span>
        );
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý bài viết cộng đồng</h1>
                <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                    {['Pending', 'Approved', 'Rejected', 'All'].map((s) => (
                        <button
                            key={s}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onClick={() => setFilter(s as any)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === s ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {s === 'Pending' ? 'Chờ duyệt' : s === 'Approved' ? 'Đã duyệt' : s === 'Rejected' ? 'Đã từ chối' : 'Tất cả'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Facebook-style Feed Layout: Single Column, Centered */}
            <div className="max-w-2xl mx-auto space-y-8">
                {loading ? (
                    <div className="py-20 text-center text-gray-500">Đang tải danh sách...</div>
                ) : posts.length === 0 ? (
                    <div className="py-20 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        Không có bài viết nào
                    </div>
                ) : (
                    posts.map((post) => (
                        <div key={post._id} className="flex flex-col gap-0 shadow-sm rounded-xl overflow-hidden border border-gray-200 bg-white">
                            {/* Card Wrapper - PostCard handles its own internal styling */}
                            <div className="relative">
                                {/* Pass clean UI props if needed, mostly re-using PostCard */}
                                <PostCard post={post} onDelete={handleDelete} hideStatus={true} hideActions={true} />

                                {/* Admin: AI Moderation Info */}
                                {post.moderationData && (
                                    <div className={`mx-4 mb-3 p-3 rounded-lg text-sm border ${post.moderationData.isSafe ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                                        }`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold flex items-center gap-2">
                                                    🤖 AI Phân tích: {post.moderationData.isSafe ? 'An toàn' : 'Vi phạm/Nghi vấn'}
                                                    <span className="text-xs font-normal opacity-70">
                                                        (Confidence: {Math.round(post.moderationData.confidence * 100)}%)
                                                    </span>
                                                </p>
                                                <p className="mt-1">{post.moderationData.reason}</p>
                                            </div>
                                            {post.moderationData.flaggedCategories && post.moderationData.flaggedCategories.length > 0 && (
                                                <div className="flex flex-col gap-1 items-end">
                                                    {post.moderationData.flaggedCategories.map((cat: string) => (
                                                        <span key={cat} className="bg-white/80 px-2 py-0.5 rounded text-xs border border-black/10 font-mono text-red-600 font-bold">
                                                            {cat}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Status Overlay - Floating top right */}
                                <div className="absolute top-4 right-4 z-10">
                                    <StatusBadge status={post.status} />
                                </div>
                            </div>

                            {/* Admin Actions Bar - Attached to bottom of card */}
                            <div className="bg-gray-50 p-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Quản trị viên
                                </span>
                                <div className="flex gap-2">
                                    {post.status === 'Pending' && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(post._id)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-bold shadow-sm"
                                                title="Duyệt bài này"
                                            >
                                                <Check size={16} /> Duyệt
                                            </button>
                                            <button
                                                onClick={() => handleReject(post._id)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition text-sm font-bold shadow-sm"
                                                title="Từ chối bài này"
                                            >
                                                <X size={16} /> Từ chối
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleDelete(post._id)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition text-sm font-bold"
                                        title="Xóa vĩnh viễn"
                                    >
                                        <Trash2 size={16} /> Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PostManagement;
