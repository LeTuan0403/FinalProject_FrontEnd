import React from 'react';
import { Loader2, Send, Heart, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Comment } from '../../services/postService';

interface User {
    _id?: string;
    userId?: number | string;
    hoTen?: string;
    avatar?: string;
    email?: string;
}

interface CommentProps {
    cmt: Comment;
    user: User | null;
    editingComment: { id: string; content: string; replyId?: string } | null;
    setEditingComment: (val: { id: string; content: string; replyId?: string } | null) => void;
    handleUpdateComment: (e: React.FormEvent) => void;
    activeMenu: string | null;
    setActiveMenu: (val: string | null) => void;
    handleDeleteComment: (commentId: string, replyId?: string) => void;
    handleLikeComment: (commentId: string, replyId?: string) => void;
    replyingTo: { id: string; name: string } | null;
    setReplyingTo: (val: { id: string; name: string } | null) => void;
    commentText: string;
    setCommentText: (val: string) => void;
    handleComment: (e: React.FormEvent) => void;
    submitting: boolean;
}

// Sub-component for rendering a single comment row (Parent or Reply)
interface CommentRowProps {
    data: Comment;
    user: User | null;
    isReply: boolean;
    isActiveMenu: boolean;
    onToggleMenu: () => void;
    isEditing: boolean;
    editContent: string;
    onEditChange: (val: string) => void;
    onEditCancel: () => void;
    onEditSubmit: (e: React.FormEvent) => void;
    onDelete: () => void;
    onLike: () => void;
    onReply: () => void;
    isReplying: boolean; // For highlighting "Trả lời"
    onStartEdit: () => void;
}

// eslint-disable-next-line complexity
const CommentRow: React.FC<CommentRowProps> = ({
    data, user, isReply,
    isActiveMenu, onToggleMenu,
    isEditing, editContent, onEditChange, onEditCancel, onEditSubmit, onStartEdit,
    onDelete, onLike, onReply, isReplying
}) => {
    // Helper to determine ownership
    const isOwner = String(user?.userId) === String(data.userId?.userId) || String(user?.userId) === String(data.userId?._id);

    return (
        <div className={`flex gap-3 ${isReply ? '' : ''}`}>
            {/* Avatar */}
            <div className={`${isReply ? 'w-8 h-8 text-xs' : 'w-10 h-10'} rounded-full bg-gray-200 flex-shrink-0 overflow-hidden shadow-sm ring-1 ring-gray-100`}>
                {data.userId?.avatar ? (
                    <img src={data.userId.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold bg-gray-200">
                        {data.userId?.hoTen?.charAt(0) || '?'}
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="flex-1">
                <div className="flex gap-2 items-center group/content relative">
                    <div className={`rounded-2xl px-4 py-2 w-fit ${isReply ? 'bg-[#F9F9F9] border-l-4 border-gray-200 rounded-r-xl rounded-l-none max-w-full' : 'bg-gray-100 border border-gray-200 max-w-[90%]'}`}>
                        <p className={`font-bold text-gray-900 ${isReply ? 'text-xs' : 'text-sm'}`}>{data.userId?.hoTen || 'Người dùng'}</p>

                        {isEditing ? (
                            <form onSubmit={onEditSubmit} className="mt-1">
                                <input
                                    autoFocus
                                    className={`bg-white text-gray-900 rounded px-2 py-1 w-full outline-none border border-blue-500 ${isReply ? 'text-xs' : 'text-sm'}`}
                                    value={editContent}
                                    onChange={(e) => onEditChange(e.target.value)}
                                    // onBlur={onEditCancel} // Optional: Auto-cancel on blur can be annoying if user clicks outside accidentally
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') { onEditCancel(); }
                                    }}
                                />
                            </form>
                        ) : (
                            <p className={`text-gray-800 whitespace-pre-wrap leading-relaxed ${isReply ? 'text-sm' : 'text-sm'}`}>{data.content}</p>
                        )}
                    </div>

                    {/* Menu Trigger */}
                    {!isEditing && isOwner && (
                        <div className="relative opacity-0 group-hover/content:opacity-100 transition-opacity">
                            <button
                                onClick={onToggleMenu}
                                className="comment-menu-trigger p-1 hover:bg-gray-700 rounded-full transition text-gray-400 hover:text-white"
                            >
                                <MoreHorizontal size={isReply ? 14 : 16} />
                            </button>

                            {/* Dropdown Menu */}
                            {isActiveMenu && (
                                <div className="absolute top-0 left-full ml-2 w-32 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={onStartEdit}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2"
                                    >
                                        <Pencil size={14} /> Sửa
                                    </button>
                                    <button
                                        onClick={onDelete}
                                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> Xóa
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className={`flex items-center gap-4 mt-1 ml-2 text-gray-400 font-medium ${isReply ? 'text-[10px]' : 'text-xs'}`}>
                    <span>{new Date(data.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <button
                        onClick={onLike}
                        className={`hover:text-red-500 transition flex items-center gap-1 ${(data.likes || []).includes(user?.userId ? String(user.userId) : '') ? 'text-red-500' : ''}`}
                    >
                        <Heart size={isReply ? 12 : 14} className={(data.likes || []).includes(user?.userId ? String(user.userId) : '') ? 'fill-current' : ''} />
                        {data.likes?.length || 0}
                    </button>
                    {/* Only show Reply button on parent comments or if we want nested replies to reference parent */}
                    <button
                        onClick={onReply}
                        className={`hover:text-blue-600 transition flex items-center gap-1 ${isReplying ? 'text-blue-600 font-bold' : ''}`}
                    >
                        Trả lời
                    </button>
                </div>
            </div>
        </div>
    );
};

const CommentItem: React.FC<CommentProps> = ({
    cmt, user,
    editingComment, setEditingComment, handleUpdateComment,
    activeMenu, setActiveMenu,
    handleDeleteComment, handleLikeComment,
    replyingTo, setReplyingTo,
    commentText, setCommentText, handleComment, submitting
}) => {
    return (
        <div className="text-left group mb-6">
            {/* Parent Comment */}
            <CommentRow
                data={cmt}
                user={user}
                isReply={false}
                isActiveMenu={activeMenu === cmt._id}
                onToggleMenu={() => setActiveMenu(activeMenu === cmt._id ? null : cmt._id)}
                isEditing={editingComment?.id === cmt._id}
                editContent={editingComment?.id === cmt._id ? editingComment.content : ''}
                onEditChange={(val) => setEditingComment({ ...editingComment!, content: val })}
                onEditCancel={() => setEditingComment(null)}
                onEditSubmit={handleUpdateComment}
                onStartEdit={() => {
                    setEditingComment({ id: cmt._id, content: cmt.content });
                    setActiveMenu(null);
                }}
                onDelete={() => {
                    handleDeleteComment(cmt._id);
                    setActiveMenu(null);
                }}
                onLike={() => handleLikeComment(cmt._id)}
                onReply={() => setReplyingTo(replyingTo?.id === cmt._id ? null : { id: cmt._id, name: cmt.userId?.hoTen || 'Người dùng' })}
                isReplying={replyingTo?.id === cmt._id}
            />

            {/* Nested Replies */}
            {cmt.replies && cmt.replies.length > 0 && (
                <div className="ml-10 mt-2 space-y-3">
                    {cmt.replies.map((reply) => (
                        <CommentRow
                            key={reply._id}
                            data={reply}
                            user={user}
                            isReply={true}
                            isActiveMenu={activeMenu === reply._id}
                            onToggleMenu={() => setActiveMenu(activeMenu === reply._id ? null : reply._id)}
                            isEditing={editingComment?.id === reply._id}
                            editContent={editingComment?.id === reply._id ? editingComment.content : ''}
                            onEditChange={(val) => setEditingComment({ ...editingComment!, content: val })}
                            onEditCancel={() => setEditingComment(null)}
                            onEditSubmit={handleUpdateComment}
                            onStartEdit={() => {
                                setEditingComment({ id: reply._id, content: reply.content, replyId: cmt._id });
                                setActiveMenu(null);
                            }}
                            onDelete={() => {
                                handleDeleteComment(cmt._id, reply._id);
                                setActiveMenu(null);
                            }}
                            onLike={() => handleLikeComment(cmt._id, reply._id)}
                            // Reply to a reply -> Actually replying to the parent (cmt), but tagging the replier name
                            onReply={() => setReplyingTo(replyingTo?.id === cmt._id ? null : { id: cmt._id, name: reply.userId?.hoTen || 'Người dùng' })}
                            isReplying={replyingTo?.id === cmt._id} // Check logic: replyingTo is {id: cmt._id, name: ...}
                        />
                    ))}
                </div>
            )}

            {/* Inline Reply Form */}
            {replyingTo?.id === cmt._id && (
                <div className="ml-12 mt-3 animate-in fade-in slide-in-from-top-2">
                    <form
                        onSubmit={handleComment}
                        className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-blue-100"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-blue-100">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-blue-600 font-black text-xs">{user?.hoTen?.charAt(0) || 'U'}</div>
                            )}
                        </div>
                        <input
                            autoFocus
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={`Trả lời ${replyingTo.name}...`}
                            className="flex-1 bg-transparent border-none text-gray-800 text-sm outline-none placeholder:text-gray-400 py-1"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !commentText.trim()}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:grayscale shadow-md active:scale-95 flex items-center justify-center"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CommentItem;
