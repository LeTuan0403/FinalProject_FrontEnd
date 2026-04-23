import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Loader2, Upload } from 'lucide-react';
import { postService, Post } from '../../services/postService';
import { tourService } from '../../services/tourService';
import { toast } from 'react-hot-toast';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    post?: Post | null;
    sharedPost?: Post | null;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSuccess, post, sharedPost }) => {
    const [content, setContent] = useState('');
    const [existingMedia, setExistingMedia] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const [selectedTourId, setSelectedTourId] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tours, setTours] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTourSelect, setShowTourSelect] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Load tours
            if (tours.length === 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tourService.getAll().then((res: any) => setTours(res.data)).catch(console.error);
            }

            // Populate fields
            if (post) {
                setContent(post.content);
                setExistingMedia(post.media || []);
                setSelectedTourId(post.linkedTourId?._id || '');
                if (post.linkedTourId) { setShowTourSelect(true); }
            } else {
                setContent('');
                setExistingMedia([]);
                setSelectedTourId('');
                setShowTourSelect(false);
            }
            setNewFiles([]);
            setPreviews([]);
        } else {
            // Cleanup previews
            previews.forEach(p => URL.revokeObjectURL(p));
            setPreviews([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, post]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const validFiles = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));

            if (validFiles.length + existingMedia.length + newFiles.length > 5) {
                toast.error('Tối đa 5 ảnh/video');
                return;
            }

            setNewFiles(prev => [...prev, ...validFiles]);

            // Create previews
            const newPreviews = validFiles.map(f => URL.createObjectURL(f));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeExisting = (idx: number) => {
        setExistingMedia(prev => prev.filter((_, i) => i !== idx));
    };

    const removeNew = (idx: number) => {
        URL.revokeObjectURL(previews[idx]);
        setNewFiles(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) { return; }

        setIsSubmitting(true);
        try {
            let uploadedUrls: string[] = [];

            // Upload new files if any
            if (newFiles.length > 0) {
                const formData = new FormData();
                newFiles.forEach(f => formData.append('media', f));
                const res = await postService.uploadMedia(formData);
                uploadedUrls = res.data;
            }

            // Combine existing (kept) + new uploaded
            const finalMedia = [...existingMedia, ...uploadedUrls];

            const data = {
                content,
                media: finalMedia,
                linkedTourId: selectedTourId || undefined
            };

            if (post) {
                const res = await postService.updatePost(post._id, data);
                if (res.data.status === 'Approved') {
                    toast.success('Đã cập nhật bài viết thành công!');
                } else if (res.data.status === 'Rejected') {
                    toast.error('Bài viết đã bị từ chối do vi phạm tiêu chuẩn cộng đồng.');
                } else {
                    toast.success('Đã cập nhật bài viết! Vui lòng chờ quản trị viên duyệt lại.');
                }
            } else if (sharedPost) {
                await postService.sharePost({ content, sharedPostId: sharedPost._id });
                toast.success('Đã chia sẻ bài viết!');
            } else {
                const res = await postService.createPost(data);
                if (res.data.status === 'Approved') {
                    toast.success('Bài viết của bạn đã được AI duyệt và đăng thành công!');
                } else if (res.data.status === 'Rejected') {
                    toast.error('Bài viết đã bị từ chối do vi phạm tiêu chuẩn cộng đồng.');
                } else {
                    toast.success('Bài viết đã được gửi và đang chờ quản trị viên duyệt!');
                }
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(post ? 'Cập nhật thất bại' : 'Đăng bài thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) { return null; }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden scale-100 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                    <h3 className="font-bold text-gray-800 text-lg">
                        {post ? 'Chỉnh sửa bài viết' : sharedPost ? 'Chia sẻ bài viết' : 'Tạo bài viết mới'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1">
                    <textarea
                        placeholder={sharedPost ? "Thêm suy nghĩ của bạn về bài viết này..." : "Bạn đang nghĩ gì?..."}
                        className="w-full h-24 resize-none text-base p-2 focus:outline-none placeholder:text-gray-400 mb-4"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        required
                    ></textarea>

                    {/* Shared Post Preview */}
                    {sharedPost && (
                        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl pointer-events-none opacity-80 scale-95 origin-top">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                                    {sharedPost.userId?.hoTen?.charAt(0)}
                                </div>
                                <span className="text-xs font-bold">{sharedPost.userId?.hoTen}</span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{sharedPost.content}</p>
                        </div>
                    )}

                    {/* Media Section */}
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Hình ảnh / Video (Tối đa 5)</label>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {/* Existing Media */}
                            {existingMedia.map((url, idx) => (
                                <div key={`exist-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                    {url.match(/\.(mp4|webm)$/i) ? (
                                        <video src={url} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeExisting(idx)}
                                        className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}

                            {/* New Previews */}
                            {previews.map((url, idx) => (
                                <div key={`new-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeNew(idx)}
                                        className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}

                            {/* Upload Button */}
                            {existingMedia.length + newFiles.length < 5 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition"
                                >
                                    <Upload size={24} />
                                    <span className="text-xs font-semibold mt-1">Tải lên</span>
                                </button>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFileSelect}
                        />
                    </div>

                    {/* Tour Select Toggle */}
                    <div className="mb-4">
                        {!showTourSelect ? (
                            <button
                                type="button"
                                onClick={() => setShowTourSelect(true)}
                                className="text-sm font-medium text-blue-600 flex items-center gap-1.5 hover:bg-blue-50 px-3 py-2 rounded-lg transition"
                            >
                                <MapPin size={16} /> {post?.linkedTourId ? 'Thay đổi Tour liên quan' : 'Gắn thẻ Tour liên quan'}
                            </button>
                        ) : (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Chọn Tour</label>
                                <select
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedTourId}
                                    onChange={e => setSelectedTourId(e.target.value)}
                                >
                                    <option value="">-- Chọn Tour --</option>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {tours.map((t: any) => (
                                        <option key={t._id} value={t._id}>{t.tenTour}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition mr-2"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (!content.trim() && !sharedPost)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        {post ? 'Cập nhật' : sharedPost ? 'Chia sẻ' : 'Đăng bài'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;
