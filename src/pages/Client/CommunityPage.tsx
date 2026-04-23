import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PostCard from '../../components/community/PostCard';
import CreatePostModal from '../../components/community/CreatePostModal';
import PostDetailModal from '../../components/community/PostDetailModal';
import { postService, Post } from '../../services/postService';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Users, Globe, User as UserIcon, Flame, Clock, Search, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLastMinuteTours } from '../../hooks/useLastMinuteTours';
import TourCard from '../../components/common/TourCard';

const CommunityPage = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'public' | 'my'>('public');
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [sharingPost, setSharingPost] = useState<Post | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const viewingPostId = searchParams.get('post');
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { lastMinuteTours } = useLastMinuteTours();

    // Auto-slide effect
    useEffect(() => {
        if (lastMinuteTours.length <= 1) { return; }
        const interval = setInterval(() => {
            setCurrentSlideIndex(prev => (prev + 1) % lastMinuteTours.length);
        }, 5000); // 5 seconds per slide

        return () => clearInterval(interval);
    }, [lastMinuteTours.length]);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = activeTab === 'public'
                ? await postService.getPublicPosts(searchTerm)
                : await postService.getMyPosts();
            setPosts(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải bài viết');
        } finally {
            setLoading(false);
        }

    }, [activeTab, searchTerm]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleDeletePost = (id: string) => {
        setPostToDelete(id);
    };

    const confirmDeletePost = async () => {
        if (!postToDelete) {return;}
        setIsDeleting(true);
        try {
            await postService.deletePost(postToDelete);
            setPosts(posts.filter(p => p._id !== postToDelete));
            toast.success('Xóa bài viết thành công');
        } catch (error) {
            console.error(error);
            toast.error('Không thể xóa bài viết');
        } finally {
            setIsDeleting(false);
            setPostToDelete(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-6">
            <div className="container mx-auto px-4 max-w-4xl">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3 text-left">
                            <span className="bg-blue-600 text-white p-2 rounded-xl"><Users size={24} /></span>
                            Cộng Đồng Du Lịch
                        </h1>
                        <p className="text-gray-500 mt-2 font-medium text-left">Chia sẻ khoảnh khắc - Kết nối đam mê</p>
                    </div>

                    <button
                        onClick={() => {
                            if (!user) {
                                toast.error('Vui lòng đăng nhập để đăng bài');
                                return;
                            }
                            setEditingPost(null);
                            setSharingPost(null);
                            setIsCreateModalOpen(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-1 transition flex items-center gap-2"
                    >
                        <Plus size={20} className="stroke-[3]" />
                        Viết bài mới
                    </button>
                </div>

                {/* Tabs */}
                {user && (
                    <div className="flex gap-4 mb-6 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('public')}
                            className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 transition ${activeTab === 'public' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Globe size={16} /> Dạo quanh
                        </button>
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 transition ${activeTab === 'my' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <UserIcon size={16} /> Bài viết của tôi
                        </button>
                    </div>
                )}

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài viết, tác giả, tour..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                        />
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                </div>

                {/* Feed and Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Feed */}
                    <div className="lg:col-span-2">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm h-64 animate-pulse">
                                        <div className="flex gap-3 mb-4">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                            <div className="space-y-2">
                                                <div className="w-32 h-4 bg-gray-200 rounded"></div>
                                                <div className="w-20 h-3 bg-gray-200 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="w-full h-32 bg-gray-200 rounded-xl"></div>
                                    </div>
                                ))}
                            </div>
                        ) : posts.length > 0 ? (
                            <div className="space-y-4">
                                {posts.map(post => (
                                    <div key={post._id} className="transition-all duration-500 rounded-xl">
                                        <PostCard
                                            post={post}
                                            onDelete={handleDeletePost}
                                            onEdit={(p: Post) => {
                                                setEditingPost(p);
                                                setSharingPost(null);
                                                setIsCreateModalOpen(true);
                                            }}
                                            onShare={(p: Post) => {
                                                if (!user) {
                                                    toast.error('Vui lòng đăng nhập để chia sẻ');
                                                    return;
                                                }
                                                setSharingPost(p);
                                                setEditingPost(null);
                                                setIsCreateModalOpen(true);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                                <h3 className="font-bold text-gray-800 text-lg">Chưa có bài viết nào</h3>
                                <p className="text-gray-500 text-sm">Hãy là người đầu tiên chia sẻ câu chuyện của bạn!</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar (Order first on mobile, last on desktop) */}
                    <div className="space-y-6 order-first lg:order-last lg:col-span-1">
                        <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-gray-100 sticky top-4 z-30 max-w-sm mx-auto lg:max-w-none lg:mx-0 w-full">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-3 md:mb-6 flex items-center gap-2">
                                <Flame className="text-orange-500 animate-pulse" />
                                Tour giờ chót
                            </h2>
                            <div className="relative overflow-hidden pb-8">
                                {lastMinuteTours.length > 0 ? (
                                    <>
                                        <div
                                            className="flex transition-transform duration-500 ease-in-out"
                                            style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
                                        >
                                            {lastMinuteTours.map((tour) => (
                                                <div key={tour.tourId} className="w-full flex-shrink-0 px-1">
                                                    <TourCard tour={tour} variant="vertical" />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Dots Navigation */}
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                            {lastMinuteTours.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentSlideIndex(idx)}
                                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentSlideIndex ? 'bg-blue-600 w-4' : 'bg-gray-300 hover:bg-gray-400'}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                                        <Clock className="mx-auto text-gray-300 mb-2" />
                                        <div className="text-sm text-gray-500 italic">Chưa có tour giờ chót nào</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <CreatePostModal
                    isOpen={isCreateModalOpen}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setEditingPost(null);
                        setSharingPost(null);
                    }}
                    onSuccess={fetchPosts}
                    post={editingPost}
                    sharedPost={sharingPost}
                />

                <PostDetailModal
                    postId={viewingPostId}
                    onClose={() => {
                        searchParams.delete('post');
                        setSearchParams(searchParams);
                    }}
                    onCommentUpdate={(postId, newComments) => {
                        setPosts(posts.map(p => p._id === postId ? { ...p, comments: newComments } : p));
                    }}
                />

                {/* Delete Confirmation Modal */}
                {postToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle size={32} className="text-red-500" />
                                </div>
                                <h3 className="text-xl font-black text-gray-800 mb-2">Xóa bài viết?</h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setPostToDelete(null)}
                                        disabled={isDeleting}
                                        className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={confirmDeletePost}
                                        disabled={isDeleting}
                                        className="flex-1 py-2.5 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Trash2 size={18} />
                                                Xóa ngay
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityPage;
