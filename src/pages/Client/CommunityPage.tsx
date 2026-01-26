import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PostCard from '../../components/community/PostCard';
import CreatePostModal from '../../components/community/CreatePostModal';
import PostDetailModal from '../../components/community/PostDetailModal';
import { postService, Post } from '../../services/postService';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Users, Globe, User as UserIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CommunityPage = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'public' | 'my'>('public');
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [sharingPost, setSharingPost] = useState<Post | null>(null);

    const viewingPostId = searchParams.get('post');

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = activeTab === 'public'
                ? await postService.getPublicPosts()
                : await postService.getMyPosts();
            setPosts(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải bài viết');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

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
                                            onDelete={(id: string) => setPosts(posts.filter(p => p._id !== id))}
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

                    {/* Sidebar */}
                    <div className="hidden lg:block space-y-6">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                                Tour đang hot
                            </h4>
                            <div className="space-y-4">
                                <div className="text-sm text-gray-500 italic">Tính năng đang cập nhật...</div>
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
            </div>
        </div>
    );
};

export default CommunityPage;
