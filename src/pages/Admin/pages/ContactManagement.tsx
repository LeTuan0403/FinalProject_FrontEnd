import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { contactService, Contact } from '../../../services/contactService';
import { useNotification } from '../../../context/NotificationContext';
import { useChat } from '../../../context/ChatContext';
import { Mail, Clock, CheckCircle2, MessageSquare, Send, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

const ContactManagement = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [sending, setSending] = useState(false);
    const { refreshCounts } = useNotification();

    // Filter & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    useEffect(() => {
        fetchContacts();
    }, []);

    const { socket } = useChat();
    useEffect(() => {
        if (!socket) { return; }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleNotification = (data: any) => {
            if (data.type === 'contact') {
                fetchContacts();
            }
        };
        socket.on("admin_notification", handleNotification);
        return () => {
            socket.off("admin_notification", handleNotification);
        };
    }, [socket]);

    // Filter Logic
    const filteredContacts = contacts.filter(c =>
        c.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.noiDung.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
    const currentContacts = filteredContacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const fetchContacts = async () => {
        try {
            const res = await contactService.getAllContacts();
            setContacts(res.data);
        } catch (error) {
            console.error("Failed to fetch contacts", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReply = (contact: Contact) => {
        setSelectedContact(contact);
        setReplyModalOpen(true);
        setReplyContent('');
    };

    const handleSendReply = async () => {
        if (!selectedContact || !replyContent.trim()) { return; }
        setSending(true);
        try {
            await contactService.replyContact(selectedContact.lienHeId, replyContent);
            toast.success("Đã gửi phản hồi thành công!");
            setReplyModalOpen(false);
            fetchContacts();
            refreshCounts(); // Update notification badge
        } catch (error) {
            console.error(error);
            toast.error("Gửi thất bại.");
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa liên hệ này không?")) {
            try {
                await contactService.deleteContact(id);
                // Refresh data
                fetchContacts();
                refreshCounts(); // Update notification badge
            } catch (error) {
                toast.error("Xóa thất bại!");
            }
        }
    };

    return (
        <div className="h-screen bg-gray-100">

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Mail /> Quản Lý Liên Hệ
                </h1>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Tìm kiếm liên hệ..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset page on search
                        }}
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase">
                                <th className="p-4 font-semibold">Khách Hàng</th>
                                <th className="p-4 font-semibold">Nội Dung</th>
                                <th className="p-4 font-semibold">Thời Gian</th>
                                <th className="p-4 font-semibold">Trạng Thái</th>
                                <th className="p-4 font-semibold text-right">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Đang tải...</td></tr>
                            ) : currentContacts.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Không tìm thấy liên hệ nào</td></tr>
                            ) : (
                                currentContacts.map((contact) => (
                                    <tr key={contact.lienHeId} className="hover:bg-teal-50/30 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-gray-800">{contact.hoTen}</p>
                                            <p className="text-sm text-gray-500">{contact.email}</p>
                                        </td>
                                        <td className="p-4 max-w-xs">
                                            <p className="line-clamp-2 text-gray-600 text-sm" title={contact.noiDung}>
                                                {contact.noiDung}
                                            </p>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {new Date(contact.ngayGui).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {contact.trangThai === 'Chờ xử lý' || contact.trangThai === 'Mới' ? (
                                                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                                    <MessageSquare size={12} /> Chờ xử lý
                                                </span>
                                            ) : (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                                    <CheckCircle2 size={12} /> Đã trả lời
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                {(contact.trangThai === 'Chờ xử lý' || contact.trangThai === 'Mới') && (
                                                    <button
                                                        onClick={() => handleOpenReply(contact)}
                                                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm hover:shadow-indigo-200 flex items-center gap-1"
                                                    >
                                                        <Send size={14} /> Trả lời
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(contact.lienHeId)}
                                                    className="bg-red-50 text-red-600 p-2 rounded-lg text-sm font-medium hover:bg-red-100 transition shadow-sm flex items-center gap-1"
                                                    title="Xóa liên hệ"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t flex justify-end items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-medium text-gray-600">Trang {currentPage} / {totalPages}</span>
                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Reply Modal */}
            {replyModalOpen && selectedContact && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Trả lời: {selectedContact.hoTen}</h3>
                            <button onClick={() => setReplyModalOpen(false)} className="text-gray-400 hover:text-red-500 transition">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Nội dung khách hỏi:</p>
                                <p className="text-sm text-gray-700 italic">"{selectedContact.noiDung}"</p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung phản hồi:</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-xl p-3 h-32 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    placeholder="Nhập nội dung email trả lời..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setReplyModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 font-medium text-sm hover:bg-gray-100 rounded-lg transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSendReply}
                                    disabled={sending}
                                    className="px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-70"
                                >
                                    {sending ? 'Đang gửi...' : <><Send size={16} /> Gửi Email</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactManagement;
