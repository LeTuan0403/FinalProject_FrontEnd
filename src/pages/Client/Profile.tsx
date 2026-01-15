import { useState, useEffect } from 'react';
import { userService } from '../../services/authService';
import { User, Mail, Phone, MapPin, Calendar, Save, Loader } from 'lucide-react';

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        hoTen: '',
        email: '',
        soDienThoai: '',
        diaChi: '',
        ngaySinh: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await userService.getMe();
            const data = res.data;
            setFormData({
                hoTen: data.hoTen || '',
                email: data.email || '',
                soDienThoai: data.soDienThoai || '',
                diaChi: data.diaChi || '',
                ngaySinh: data.ngaySinh ? data.ngaySinh.split('T')[0] : ''
            });
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await userService.updateProfile({
                hoTen: formData.hoTen,
                soDienThoai: formData.soDienThoai,
                diaChi: formData.diaChi,
                ngaySinh: formData.ngaySinh || undefined
            });
            alert("Cập nhật hồ sơ thành công!");
            // Optionally refresh user context if AuthProvider supports it
        } catch (error) {
            console.error("Update failed", error);
            alert("Cập nhật thất bại.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {return <div className="min-h-screen pt-24 flex justify-center"><Loader className="animate-spin" /></div>;}

    return (
        <div className="min-h-screen pt-24 pb-12 bg-gray-50">
            <div className="max-w-3xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-blue-600 p-8 text-center">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <User size={48} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">{formData.hoTen || 'Người dùng'}</h1>
                        <p className="text-blue-100">{formData.email}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <User size={16} /> Họ và tên
                                </label>
                                <input
                                    type="text"
                                    name="hoTen"
                                    value={formData.hoTen}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Mail size={16} /> Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                    disabled
                                    title="Không thể đổi email"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Phone size={16} /> Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    name="soDienThoai"
                                    value={formData.soDienThoai}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Calendar size={16} /> Ngày sinh
                                </label>
                                <input
                                    type="date"
                                    name="ngaySinh"
                                    value={formData.ngaySinh}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <MapPin size={16} /> Địa chỉ
                                </label>
                                <input
                                    type="text"
                                    name="diaChi"
                                    value={formData.diaChi}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-70"
                            >
                                {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                                Lưu thay đổi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
