import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Post } from '../../services/postService';
import { Heart, MessageCircle, Share2, Edit, Trash2, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { postService } from '../../services/postService';
import { toast } from 'react-hot-toast';

interface PostCardProps {
    post: Post;
    onDelete?: (id: string) => void;
    onEdit?: (post: Post) => void;
    onShare?: (post: Post) => void;
    isQuoted?: boolean;
}

// eslint-disable-next-line complexity
export default function PostCard({ post, onDelete, onEdit, onShare, isQuoted = false }: PostCardProps) {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [likes, setLikes] = useState(post.likes || []);

    const isLiked = user && likes.includes(user.userId ? String(user.userId) : '');

    const handleCommentClick = () => {
        searchParams.set('post', post._id);
        setSearchParams(searchParams);
    };

    const handleLike = async () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để thích bài viết');
            return;
        }
        try {
            const res = await postService.likePost(post._id);
            setLikes(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/community?post=${post._id}`;
        navigator.clipboard.writeText(url);
        toast.success('Đã sao chép liên kết bài viết!');
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(post._id);
        }
    };

    const isOwner = user && post.userId && (
        String(user.userId) === String(post.userId.userId) ||
        String(user.userId) === String(post.userId._id)
    );

    const isAdmin = user && (user.role === 'Admin' || String(user.role) === '1');

    return (
        <>
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 hover:shadow-md transition-shadow ${isQuoted ? 'mb-0 border-none' : ''}`}>
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 text-left">
                        {post.userId?.avatar ? (
                            <img src={post.userId.avatar} alt={post.userId.hoTen} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                {post.userId?.hoTen?.charAt(0) || '?'}
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-gray-900 leading-tight">{post.userId?.hoTen || 'Người dùng ẩn'}</h3>
                            <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                        {post.isRewardClaimed && !isQuoted && (
                            <div className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200 animate-pulse">
                                BÀI VIẾT NỔI BẬT 🏆
                            </div>
                        )}

                        {/* Actions: Edit/Delete */}
                        {(isOwner || isAdmin) && !isQuoted && (
                            <div className="flex gap-1">
                                {isOwner && onEdit && (
                                    <button onClick={() => onEdit(post)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition" title="Chỉnh sửa">
                                        <Edit size={16} />
                                    </button>
                                )}
                                {(isOwner || isAdmin) && onDelete && (
                                    <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition" title="Xóa">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-gray-800 mb-3 whitespace-pre-wrap text-left">{post.content}</p>

                {/* Shared/Quoted Post Content */}
                {post.sharedPostId && !isQuoted && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            searchParams.set('post', post.sharedPostId!._id);
                            setSearchParams(searchParams);
                        }}
                        className="mb-4 ml-2 pl-4 border-l-4 border-blue-100 bg-gray-50/50 rounded-r-xl overflow-hidden cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-200 active:scale-[0.995]"
                    >
                        <PostCard post={post.sharedPostId} isQuoted={true} />
                    </div>
                )}

                {/* Media Grid */}
                {post.media && post.media.length > 0 && (
                    <div className={`grid gap-2 mb-4 rounded-xl overflow-hidden ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {post.media.map((url, idx) => (
                            <img
                                key={idx}
                                src={url.startsWith('http') ? url : `http://localhost:5000${url}`}
                                alt=""
                                className="w-full h-full object-cover max-h-[400px]"
                            />
                        ))}
                    </div>
                )}

                {/* Linked Tour */}
                {post.linkedTourId && (
                    <div className="border border-gray-200 rounded-xl p-3 mb-4 flex gap-3 bg-gray-50 text-left">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                            {post.linkedTourId.hinhAnhBia ? (
                                <img
                                    src={post.linkedTourId.hinhAnhBia.startsWith('http') ? post.linkedTourId.hinhAnhBia : `http://localhost:5000${post.linkedTourId.hinhAnhBia.startsWith('/') ? '' : '/'}${post.linkedTourId.hinhAnhBia}`}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                                    alt="Tour"
                                    className="w-full h-full object-cover opacity-60"
                                />
                            )}
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase">Tour liên quan</span>
                            <h4 className="font-bold text-gray-800 line-clamp-1">{post.linkedTourId.tenTour}</h4>
                        </div>
                    </div>
                )}

                {/* Interactions */}
                {!isQuoted && (
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-gray-500">
                        <div className="flex gap-4">
                            <button onClick={handleLike} className={`flex items-center gap-1 hover:text-red-500 transition ${isLiked ? 'text-red-500 font-bold' : ''}`}>
                                <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                                <span>{likes.length}</span>
                            </button>
                            <button onClick={handleCommentClick} className="flex items-center gap-1 hover:text-blue-500 transition">
                                <MessageCircle size={20} />
                                <span>{post.comments?.length || 0}</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleCopyLink}
                                className="flex items-center gap-1 hover:text-blue-600 transition"
                                title="Sao chép liên kết"
                            >
                                <LinkIcon size={18} />
                            </button>
                            <button
                                onClick={() => onShare && onShare(post)}
                                className="flex items-center gap-1 hover:text-green-600 transition"
                                title="Chia sẻ bài viết"
                            >
                                <Share2 size={20} />
                                <span className="text-sm font-medium">{post.shareCount || 0}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
