import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Send } from 'lucide-react';
import { postService, Post, Comment } from '../../services/postService';
import PostCard from './PostCard';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

interface PostDetailModalProps {
    postId: string | null;
    onClose: () => void;
    onCommentUpdate?: (postId: string, newComments: Comment[]) => void;
}

const PostDetailModal = ({ postId, onClose, onCommentUpdate }: PostDetailModalProps) => {
    const { user } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Lock body scroll when modal is open
        if (postId) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [postId]);

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) {
                setPost(null);
                return;
            }
            setLoading(true);
            try {
                const res = await postService.getPostById(postId);
                setPost(res.data);
                setError(null);
            } catch (err) {
                console.error(err);
                setError('Không tìm thấy bài viết hoặc có lỗi xảy ra');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Vui lòng đăng nhập để bình luận');
            return;
        }
        if (!commentText.trim() || !post) return;

        setSubmitting(true);
        try {
            const res = await postService.commentPost(post._id, commentText);
            const newComments = res.data;
            setPost({ ...post, comments: newComments });
            setCommentText('');
            if (onCommentUpdate) {
                onCommentUpdate(post._id, newComments);
            }
            toast.success('Đã gửi bình luận!');
        } catch (error) {
            toast.error('Lỗi khi gửi bình luận');
        } finally {
            setSubmitting(false);
        }
    };

    if (!postId) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col animate-in fade-in duration-300">
            {/* Backdrop - Removed blur as requested */}
            <div
                className="absolute inset-0 bg-gray-950/70"
                onClick={onClose}
            />

            {/* Top Bar / Header */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-gray-800/50 bg-gray-900 shadow-2xl">
                <div className="flex-1" />
                <h2 className="text-xl font-black text-white text-center">
                    {post ? `Bài viết của ${post.userId?.hoTen || 'Người dùng'}` : 'Đang tải bài viết...'}
                </h2>
                <div className="flex-1 flex justify-end">
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-full transition text-white shadow-lg border border-gray-700/50"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex-1 flex justify-center overflow-hidden py-4">
                <div className="w-full max-w-3xl flex flex-col bg-gray-900/40 rounded-3xl border border-gray-800/50 shadow-2xl relative">

                    {/* Scrollable Container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-2 sm:p-4">
                        {loading ? (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 gap-4">
                                <Loader2 size={48} className="animate-spin text-blue-500" />
                                <p className="font-bold animate-pulse text-lg">Đang nạp dữ liệu...</p>
                            </div>
                        ) : error ? (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-red-100 gap-6">
                                <div className="bg-red-500/20 p-6 rounded-3xl border border-red-500/30">
                                    <AlertCircle size={64} className="text-red-400" />
                                </div>
                                <p className="text-xl font-bold">{error}</p>
                            </div>
                        ) : post ? (
                            <div className="flex flex-col gap-4">
                                <PostCard post={post} />

                                {/* Comments Header */}
                                <div className="px-2 mt-2">
                                    <h3 className="text-white font-black text-lg flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                        Bình luận ({post.comments?.length || 0})
                                    </h3>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-4 px-2 pb-24">
                                    {post.comments && post.comments.length > 0 ? (
                                        post.comments.map((cmt) => (
                                            <div key={cmt._id} className="flex gap-3 text-left group">
                                                <div className="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0 overflow-hidden shadow-inner ring-1 ring-gray-700/50">
                                                    {cmt.userId?.avatar ? (
                                                        <img src={cmt.userId.avatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold bg-gray-800">
                                                            {cmt.userId?.hoTen?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-gray-800/60 rounded-2xl px-4 py-2 border border-gray-700/30 group-hover:border-gray-600/50 transition">
                                                        <p className="font-bold text-blue-400 text-sm">{cmt.userId?.hoTen || 'Người dùng'}</p>
                                                        <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{cmt.content}</p>
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 mt-1 ml-2 font-medium">
                                                        {new Date(cmt.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center">
                                            <div className="text-gray-600 mb-2">¯\_(ツ)_/¯</div>
                                            <p className="text-gray-500 font-medium italic">Chưa có bình luận nào. Hãy lên tiếng!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Fixed Bottom Input (Like requested in screenshot) */}
                    {post && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] bg-gray-800/90 backdrop-blur-xl border border-gray-700/40 rounded-full p-2 px-3 flex items-center gap-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition hover:ring-1 hover:ring-gray-600/50 z-20">
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center overflow-hidden border border-blue-500/20">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="" className="w-full h-full object-cover border-2 border-white" />
                                ) : (
                                    <div className="text-blue-400 font-black text-xs">{user?.hoTen?.charAt(0) || 'U'}</div>
                                )}
                            </div>

                            <form onSubmit={handleComment} className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Viết bình luận công khai..."
                                    className="flex-1 bg-transparent border-none text-white text-sm outline-none placeholder:text-gray-500 py-2"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting || !commentText.trim()}
                                    className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition disabled:opacity-50 disabled:grayscale shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar-dark::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar-dark::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar-dark::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            ` }} />
        </div>
    );
};

export default PostDetailModal;
