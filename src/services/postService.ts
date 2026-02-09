import api from '../api/axiosClient';

export interface Comment {
    _id: string;
    userId: {
        _id: string;
        hoTen: string;
        avatar?: string;
        userId?: number;
    };
    content: string;
    createdAt: string;
    likes?: string[];
    replies?: Comment[];
}

export interface Post {
    _id: string;
    userId: {
        _id: string;
        hoTen: string;
        avatar?: string;
        userId?: number; // Legacy/Auth ID
    };
    title?: string;
    content: string;
    media: string[];
    linkedTourId?: {
        _id: string;
        tourId: number;
        tenTour: string;
        hinhAnhBia?: string;
    };
    likes: string[];
    comments: Comment[];
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
    sharedPostId?: Post | null;
    isRewardClaimed?: boolean;
    shareCount?: number;
    moderationData?: {
        isSafe: boolean;
        confidence: number;
        reason: string;
        flaggedCategories: string[];
    };
}

export const postService = {
    // Public/User
    getPublicPosts: (search?: string) => api.get<Post[]>('/posts', { params: { search } }),
    getMyPosts: () => api.get<Post[]>('/posts/my-posts'),
    getPostById: (id: string) => api.get<Post>(`/posts/${id}`),
    createPost: (data: { title?: string; content: string; media?: string[]; linkedTourId?: string }) => api.post<Post>('/posts', data),
    sharePost: (data: { content?: string; sharedPostId: string }) => api.post<Post>('/posts/share', data),
    updatePost: (id: string, data: { title?: string; content?: string; media?: string[]; linkedTourId?: string }) => api.put<Post>(`/posts/${id}`, data),
    deletePost: (id: string) => api.delete<{ msg: string }>(`/posts/${id}`),
    likePost: (id: string) => api.put<string[]>(`/posts/like/${id}`),
    commentPost: (id: string, content: string) => api.post<Comment[]>(`/posts/comment/${id}`, { content }),
    replyToComment: (id: string, commentId: string, content: string) => api.post<Comment[]>(`/posts/comment/reply/${id}/${commentId}`, { content }),
    likeComment: (id: string, commentId: string, replyId?: string) =>
        api.put<Comment[]>(`/posts/comment/like/${id}/${commentId}${replyId ? `?replyId=${replyId}` : ''}`),

    updateComment: (id: string, commentId: string, content: string, replyId?: string) =>
        api.put<Comment[]>(`/posts/comment/${id}/${commentId}${replyId ? `?replyId=${replyId}` : ''}`, { content }),

    deleteComment: (id: string, commentId: string, replyId?: string) =>
        api.delete<Comment[]>(`/posts/comment/${id}/${commentId}${replyId ? `?replyId=${replyId}` : ''}`),
    uploadMedia: (formData: FormData) => api.post<string[]>('/upload/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

    // Admin
    getAllPostsAdmin: (status?: string) => api.get<Post[]>('/posts/admin/all', { params: { status } }),
    approvePost: (id: string) => api.put<Post>(`/posts/admin/approve/${id}`),
    rejectPost: (id: string) => api.put<Post>(`/posts/admin/reject/${id}`)
};
