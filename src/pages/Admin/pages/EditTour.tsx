import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tourService, diaDiemService } from '../../../services/tourService';
import type { Tour, DiaDiem } from '../../../types';
import { X, Plus, Save, Trash2, ChevronDown } from 'lucide-react'; // Added ChevronDown
import Sidebar from '../components/Sidebar';
import { useAuth } from '../../../hooks/useAuth';
import UploadImage from '../components/UploadImage';

const AdminEditTour = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<DiaDiem[]>([]);

    // Initialize with correct fields matching Tour interface
    const [formData, setFormData] = useState<Partial<Tour>>({
        maTour: '',
        tenTour: '',
        moTa: '',
        hinhAnhBia: '',
        tongGiaDuKien: 0,
        isTuChon: false,
        phuongTien: 'Xe du lịch',
        diemKhoiHanh: 'Hà Nội',
        tourChiTiets: [],
        daDuyet: true,
        khuVuc: 'Miền Bắc',
        loaiTour: 'Trong Nước',
        // New fields defaults
        anSang: 0,
        anTrua: 0,
        anToi: 0,
        soLuongCho: 0, // [NEW] Default
        ngayKhoiHanh: [], // [NEW] Default - Array
        dichVuBaoGom: '',
        dichVuKhongBaoGom: '',
        chinhSachTour: '',
        diemNhan: '',
        thoiGian: ''
    });

    const [suggestions, setSuggestions] = useState({
        departures: [] as string[],
        transports: [] as string[]
    });

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const tourRes = await tourService.getAll({ mode: 'admin' });
                if (tourRes.data && Array.isArray(tourRes.data)) {
                    const deps = new Set<string>();
                    const trans = new Set<string>();
                    tourRes.data.forEach((t: any) => {
                        // Check various case formats for legacy data
                        const d = t.diemKhoiHanh || t.DiemKhoiHanh || t.KhoiHanh || t.khoiHanh;
                        const p = t.phuongTien || t.PhuongTien;

                        if (d && typeof d === 'string' && d.trim() !== '') deps.add(d.trim());
                        if (p && typeof p === 'string' && p.trim() !== '') trans.add(p.trim());
                    });

                    setSuggestions({
                        departures: Array.from(deps).sort(),
                        transports: Array.from(trans).sort()
                    });
                }
            } catch (e) {
                // Silent error in production
            }
        };
        fetchSuggestions();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const locRes = await diaDiemService.getAll();
                setLocations(locRes.data);

                if (isEditMode) {
                    const tourRes = await tourService.getById(Number(id));
                    // Ensure fields are mapped correctly if backend returns slightly different names
                    const data = tourRes.data;

                    setFormData({
                        ...data,
                        hinhAnhBia: data.hinhAnhBia || (data as any).HinhAnhBia || '', // Explicit mapping
                        diemKhoiHanh: data.diemKhoiHanh || (data as any).DiemKhoiHanh || (data as any).KhoiHanh || (data as any).khoiHanh || 'Hà Nội',
                        phuongTien: data.phuongTien || (data as any).PhuongTien || 'Xe du lịch',
                        loaiTour: data.loaiTour || (data as any).LoaiTour || 'Trong Nước',
                        khuVuc: data.khuVuc || (data as any).KhuVuc || 'Miền Bắc',
                        // Map new fields explicitly
                        anSang: data.anSang ?? (data as any).AnSang ?? 0,
                        anTrua: data.anTrua ?? (data as any).AnTrua ?? 0,

                        anToi: data.anToi ?? (data as any).AnToi ?? 0,
                        soLuongCho: data.soLuongCho ?? (data as any).SoLuongCho ?? 0,
                        ngayKhoiHanh: Array.isArray(data.ngayKhoiHanh)
                            ? data.ngayKhoiHanh.map((d: any) => new Date(d).toISOString().split('T')[0])
                            : (data.ngayKhoiHanh ? [new Date(data.ngayKhoiHanh).toISOString().split('T')[0]] : []), // Ensure array
                        // If counts are 0, try to calculate from tourDetails (logic for Custom Tours)
                        ...(() => {
                            const as = Number(data.anSang ?? 0);
                            const at = Number(data.anTrua ?? 0);
                            const ae = Number(data.anToi ?? 0);

                            if (as === 0 && at === 0 && ae === 0 && (data.tourChiTiets || []).length > 0) {
                                let cS = 0, cT = 0, cC = 0;
                                (data.tourChiTiets || []).forEach((d: any) => {
                                    const note = d.ghiChu || d.GhiChu || '';
                                    if (note.includes('Ăn:')) {
                                        if (note.includes('Sáng')) cS++;
                                        if (note.includes('Trưa')) cT++;
                                        if (note.includes('Tối')) cC++;
                                    }
                                });
                                return { anSang: cS, anTrua: cT, anToi: cC };
                            }
                            return {};
                        })(),
                        dichVuBaoGom: data.dichVuBaoGom || (data as any).DichVuBaoGom || '',
                        dichVuKhongBaoGom: data.dichVuKhongBaoGom || (data as any).DichVuKhongBaoGom || '',
                        chinhSachTour: data.chinhSachTour || (data as any).ChinhSachTour || (data as any).chinhSach || '',
                        diemNhan: data.diemNhan || (data as any).DiemNhan || '',
                        tourChiTiets: (data.tourChiTiets || (data as any).TourChiTiets || (data as any).lichTrinh || []).map((d: any) => {
                            // Handle populated diaDiemId (Object) vs Legacy (Number/String)
                            const rawLoc = d.diaDiemId || d.DiaDiemId;
                            const locId = (rawLoc && typeof rawLoc === 'object') ? rawLoc.diaDiemId : rawLoc;

                            // Image Fallback: Detail Image -> Location Image (from populated data) -> Empty
                            const detailImg = d.hinhAnh || d.HinhAnh;

                            return {
                                ...d,
                                id: d.id || d.tourChiTietId || d.TourChiTietId || d._id, // Add _id fallback
                                tourChiTietId: d.tourChiTietId || d.TourChiTietId || d.id || d._id,
                                diaDiemId: locId, // Ensure we get the numeric ID
                                tieuDe: d.tieuDe || d.TieuDe || '',
                                hinhAnh: detailImg || '', // Only use detail image if exists
                                ghiChu: d.ghiChu || d.GhiChu || '',
                                thoiGian: d.thoiGian || d.ThoiGian || '',
                                ngayThu: d.ngayThu || d.NgayThu || 1,
                                thuTu: d.thuTu || d.ThuTu || 1
                            };
                        })
                    });
                }
            } catch (error) {
                console.error("Failed to load data", error);
                if (isEditMode) alert("Không thể tải thông tin tour");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEditMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            // Calculate duration
            const maxDay = formData.tourChiTiets?.reduce((max, item) => Math.max(max, item.ngayThu), 0) || 0;
            const calculatedDuration = maxDay > 0 ? `${maxDay} ngày` : (formData.thoiGian || "1 ngày"); // Fixed syntax
            // Base payload construction (common for both Create and Edit)
            const commonPayload = {
                nguoiTaoId: user?.userId || 1, // Fallback safe ID
                userId: user?.userId || 1,     // Ensure compatibility
                maTour: formData.maTour,
                tenTour: formData.tenTour,
                moTa: formData.moTa,
                hinhAnhBia: formData.hinhAnhBia,
                tongGiaDuKien: formData.tongGiaDuKien,
                isTuChon: formData.isTuChon,
                phuongTien: formData.phuongTien,
                diemKhoiHanh: formData.diemKhoiHanh,
                tenDiaDiem: formData.khuVuc, // Map generic location
                daDuyet: formData.daDuyet,
                khuVuc: formData.khuVuc || "Miền Bắc",
                loaiTour: formData.loaiTour || "Trong Nước",
                thoiGian: formData.thoiGian || calculatedDuration,
                // String conversions for consistency
                anSang: String(formData.anSang || 0),
                anTrua: String(formData.anTrua || 0),

                anToi: String(formData.anToi || 0),
                soLuongCho: Number(formData.soLuongCho || 0), // Ensure Number
                ngayKhoiHanh: formData.ngayKhoiHanh || [], // Send array
                dichVuBaoGom: formData.dichVuBaoGom || "Đang cập nhật",
                dichVuKhongBaoGom: formData.dichVuKhongBaoGom || "Đang cập nhật",
                chinhSachTour: formData.chinhSachTour || "Đang cập nhật",
                diemNhan: formData.diemNhan || ""
            };

            if (isEditMode) {
                // UPDATE: Include IDs
                const updatePayload = {
                    ...commonPayload,
                    tourId: Number(id),
                    tourChiTiets: formData.tourChiTiets?.map(detail => ({
                        id: detail.id || detail.tourChiTietId || 0,
                        tourChiTietId: detail.id || detail.tourChiTietId || 0,
                        tourId: Number(id),
                        diaDiemId: detail.diaDiemId,
                        thuTu: detail.thuTu,
                        ngayThu: detail.ngayThu,
                        thoiGian: detail.thoiGian,
                        tieuDe: detail.tieuDe,
                        hinhAnh: detail.hinhAnh,
                        ghiChu: detail.ghiChu
                    }))
                };
                await tourService.updateTour(Number(id), updatePayload);

                // Explicitly approve if status is 'Public/Approved'
                if (formData.daDuyet) {
                    try {
                        await tourService.approveTour(Number(id));
                    } catch (approveError: any) {
                        console.error("Auto-approve failed:", approveError);
                        alert("Cập nhật thành công, nhưng không thể duyệt tour. Lỗi: " + (approveError.response?.data?.message || approveError.message));
                        return;
                    }
                }
                alert("Cập nhật thành công!");
            } else {
                // CREATE: Clean Payload (No IDs)
                const createPayload = {
                    ...commonPayload,
                    // Re-map tourChiTiets to be strictly clean
                    tourChiTiets: formData.tourChiTiets?.map(detail => ({
                        diaDiemId: detail.diaDiemId,
                        thuTu: detail.thuTu,
                        ngayThu: detail.ngayThu,
                        thoiGian: detail.thoiGian,
                        tieuDe: detail.tieuDe,
                        hinhAnh: detail.hinhAnh,
                        ghiChu: detail.ghiChu
                    }))
                };

                const response = await tourService.createTour(createPayload);

                // Auto-approve new tour if selected
                if (formData.daDuyet && response.data && (response.data as any).tourId) {
                    try {
                        await tourService.approveTour((response.data as any).tourId);
                    } catch (approveError) {
                        console.error("Auto-approve new tour failed", approveError);
                    }
                }

                if (response.data && (response.data as any).tourId) {
                    const newId = (response.data as any).tourId;
                    alert(`Tạo tour mới thành công! Tour ID: ${newId}`);
                    // Navigate to edit mode for the new tour so user can continue editing
                    navigate(`/admin/tour-edit/${newId}`);
                } else {
                    alert("Tạo tour mới thành công!");
                    navigate('/admin/tours'); // Fallback if no ID returned
                }
            }
            // navigate('/admin/tours'); // REMOVED: Stay on page after update/create
        } catch (error: any) {
            console.error(error);
            if (error.response && error.response.status === 401) {
                alert("Phiên đăng nhập đã hết hạn hoặc bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.");
            } else if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat().join('\n');
                alert("Lỗi dữ liệu:\n" + errorMessages);
            } else {
                alert("Có lỗi xảy ra: " + (error.response?.data?.message || error.message || "Lỗi không xác định"));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDetailChange = (index: number, field: string, value: any) => {
        setFormData(prev => {
            const newDetails = [...(prev.tourChiTiets || [])];
            newDetails[index] = { ...newDetails[index], [field]: value };
            return { ...prev, tourChiTiets: newDetails };
        });
    };

    const addDetail = () => {
        // Find first UNUSED location if possible, else default to first available
        const usedIds = formData.tourChiTiets?.map(d => d.diaDiemId) || [];
        const availableLoc = locations.find(l => !usedIds.includes(l.diaDiemId)) || locations[0];

        setFormData({
            ...formData,
            tourChiTiets: [...(formData.tourChiTiets || []), {
                diaDiemId: availableLoc?.diaDiemId || 0,
                thuTu: (formData.tourChiTiets?.length || 0) + 1,
                ngayThu: (formData.tourChiTiets?.length || 0) + 1,
                tieuDe: '',
                hinhAnh: '',
                ghiChu: '',
                thoiGian: '08:00'
            }]
        });
    };

    const removeDetail = (index: number) => {
        const newDetails = [...(formData.tourChiTiets || [])];
        newDetails.splice(index, 1);
        setFormData({ ...formData, tourChiTiets: newDetails });
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;

    return (
        <div className="flex bg-gray-100 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => navigate('/admin/tours')} className="p-2 hover:bg-gray-100 rounded-full transition">
                            <X size={24} />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800">{isEditMode ? 'Chỉnh Sửa Tour' : 'Thêm Tour Mới'}</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Info */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Mã Tour <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-lg"
                                    value={formData.maTour || ''}
                                    required
                                    placeholder="VD: TO-001"
                                    onChange={e => setFormData({ ...formData, maTour: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tên Tour <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-lg"
                                    value={formData.tenTour}
                                    required
                                    onChange={e => setFormData({ ...formData, tenTour: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Giá (VNĐ) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    className="w-full p-3 border rounded-lg"
                                    value={formData.tongGiaDuKien}
                                    required
                                    onKeyDown={(e) => ["-", "e", "E", "+"].includes(e.key) && e.preventDefault()}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, tongGiaDuKien: val === '' ? 0 : Math.max(0, Number(val)) })
                                    }}
                                    onBlur={() => {
                                        if (formData.tongGiaDuKien === undefined) {
                                            setFormData({ ...formData, tongGiaDuKien: 0 });
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Thời gian <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-lg"
                                    value={formData.thoiGian || ''}
                                    required
                                    placeholder="VD: 3 ngày 2 đêm"
                                    onChange={e => setFormData({ ...formData, thoiGian: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Số lượng chỗ</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full p-3 border rounded-lg"
                                    value={formData.soLuongCho || 0}
                                    onChange={e => setFormData({ ...formData, soLuongCho: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ngày khởi hành (Có thể chọn nhiều)</label>
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {(formData.ngayKhoiHanh || []).map((date, idx) => (
                                            <div key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2">
                                                <span>{new Date(date).toLocaleDateString('vi-VN')}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newDates = [...(formData.ngayKhoiHanh || [])];
                                                        newDates.splice(idx, 1);
                                                        setFormData({ ...formData, ngayKhoiHanh: newDates });
                                                    }}
                                                    className="hover:text-red-500"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            className="flex-1 p-3 border rounded-lg"
                                            id="date-picker-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const input = document.getElementById('date-picker-input') as HTMLInputElement;
                                                if (input && input.value) {
                                                    const newDates = [...(formData.ngayKhoiHanh || [])];
                                                    if (!newDates.includes(input.value)) {
                                                        newDates.push(input.value);
                                                        newDates.sort(); // Keep sorted
                                                        setFormData({ ...formData, ngayKhoiHanh: newDates });
                                                        input.value = ''; // Reset input
                                                    } else {
                                                        alert("Ngày này đã được chọn!");
                                                    }
                                                }
                                            }}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Số lượng bữa ăn phục vụ</label>
                                <div className="grid grid-cols-3 gap-4 p-3 border rounded-lg bg-gray-50 items-center">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Sáng</label>
                                        <input
                                            type="text"
                                            className="p-2 border rounded-md text-center font-bold"
                                            value={formData.anSang || 0}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => setFormData({ ...formData, anSang: e.target.value as any })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Trưa</label>
                                        <input
                                            type="text"
                                            className="p-2 border rounded-md text-center font-bold"
                                            value={formData.anTrua || 0}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => setFormData({ ...formData, anTrua: e.target.value as any })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Tối</label>
                                        <input
                                            type="text"
                                            className="p-2 border rounded-md text-center font-bold"
                                            value={formData.anToi || 0}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => setFormData({ ...formData, anToi: e.target.value as any })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Điểm khởi hành</label>
                                <CreatableSelect
                                    value={formData.diemKhoiHanh || ''}
                                    onChange={(val) => setFormData({ ...formData, diemKhoiHanh: val })}
                                    options={suggestions.departures}
                                    placeholder="Chọn hoặc nhập điểm khởi hành..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Trạng thái duyệt</label>
                                <select
                                    className={`w - full p - 3 border rounded - lg font - bold ${formData.daDuyet ? 'text-green-600 bg-green-50 border-green-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200'} `}
                                    value={formData.daDuyet ? 'true' : 'false'}
                                    onChange={e => setFormData({ ...formData, daDuyet: e.target.value === 'true' })}
                                >
                                    <option value="true">Đã duyệt (Hiển thị công khai)</option>
                                    <option value="false">Chờ duyệt (Chỉ Admin thấy)</option>
                                </select>
                            </div>

                            {/* Classification */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Loại Tour</label>
                                <select
                                    className="w-full p-3 border rounded-lg"
                                    value={formData.loaiTour}
                                    onChange={e => {
                                        const type = e.target.value;
                                        setFormData({
                                            ...formData,
                                            loaiTour: type,
                                            khuVuc: type === 'Trong Nước' ? 'Miền Bắc' : 'Châu Á'
                                        });
                                    }}
                                >
                                    <option value="Trong Nước">Trong Nước</option>
                                    <option value="Nước Ngoài">Nước Ngoài</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Khu vực / Châu lục</label>
                                {formData.loaiTour === 'Trong Nước' ? (
                                    <select
                                        className="w-full p-3 border rounded-lg"
                                        value={formData.khuVuc}
                                        onChange={e => setFormData({ ...formData, khuVuc: e.target.value })}
                                    >
                                        <option value="Miền Bắc">Miền Bắc</option>
                                        <option value="Miền Trung">Miền Trung</option>
                                        <option value="Miền Nam">Miền Nam</option>
                                    </select>
                                ) : (
                                    <select
                                        className="w-full p-3 border rounded-lg"
                                        value={formData.khuVuc}
                                        onChange={e => setFormData({ ...formData, khuVuc: e.target.value })}
                                    >
                                        <option value="Châu Á">Châu Á</option>
                                        <option value="Châu Âu">Châu Âu</option>
                                        <option value="Châu Mỹ">Châu Mỹ</option>
                                        <option value="Châu Úc">Châu Úc</option>
                                        <option value="Châu Phi">Châu Phi</option>
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phương tiện <span className="text-red-500">*</span></label>
                                <CreatableSelect
                                    value={formData.phuongTien || ''}
                                    onChange={(val) => setFormData({ ...formData, phuongTien: val })}
                                    options={suggestions.transports}
                                    required
                                    placeholder="Chọn hoặc nhập phương tiện..."
                                />
                            </div>
                            <div>
                                <UploadImage
                                    label="Ảnh bìa tour"
                                    currentImage={formData.hinhAnhBia}
                                    onUpload={(url) => setFormData({ ...formData, hinhAnhBia: url })}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả <span className="text-red-500">*</span></label>
                                <textarea
                                    className="w-full p-3 border rounded-lg h-32"
                                    value={formData.moTa}
                                    required
                                    onChange={e => setFormData({ ...formData, moTa: e.target.value })}
                                />
                            </div>

                            {/* Extended Info */}
                            <div className="col-span-1 md:col-span-2 space-y-6 border-t pt-6 mt-2">
                                <h3 className="font-bold text-xl text-gray-800">Thông tin chi tiết tour</h3>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Điểm nhấn hành trình</label>
                                    <textarea className="w-full p-3 border rounded-lg h-24 resize-y" value={formData.diemNhan || ''} onChange={e => setFormData({ ...formData, diemNhan: e.target.value })} placeholder="Liệt kê các điểm nổi bật của tour..." />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-green-700 mb-2">Dịch vụ bao gồm</label>
                                        <textarea className="w-full p-3 border rounded-lg h-32 resize-y bg-green-50/30 border-green-200" value={formData.dichVuBaoGom || ''} onChange={e => setFormData({ ...formData, dichVuBaoGom: e.target.value })} placeholder="- Xe đưa đón&#10;- Vé tham quan&#10;- Nước uống..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-red-700 mb-2">Dịch vụ không bao gồm</label>
                                        <textarea className="w-full p-3 border rounded-lg h-32 resize-y bg-red-50/30 border-red-200" value={formData.dichVuKhongBaoGom || ''} onChange={e => setFormData({ ...formData, dichVuKhongBaoGom: e.target.value })} placeholder="- Thuế VAT&#10;- Chi phí cá nhân..." />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Chính sách tour</label>
                                    <textarea className="w-full p-3 border rounded-lg h-24 resize-y" value={formData.chinhSachTour || ''} onChange={e => setFormData({ ...formData, chinhSachTour: e.target.value })} placeholder="Chính sách hủy tour, hoàn tiền, vé trẻ em..." />
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Lịch trình chi tiết <span className="text-red-500">*</span></h3>
                                <button type="button" onClick={addDetail} className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-3 py-2 rounded">
                                    <Plus size={18} /> Thêm hoạt động
                                </button>
                            </div>

                            <div className="space-y-6">
                                {(formData.tourChiTiets || []).map((detail, idx) => {
                                    const handleLocChange = (newId: number) => {
                                        handleDetailChange(idx, 'diaDiemId', newId);
                                    };

                                    return (
                                        <div key={idx} className="relative p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow group mb-0">
                                            {/* Delete Button - Absolute Top Right */}
                                            <button
                                                type="button"
                                                onClick={() => removeDetail(idx)}
                                                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition p-1"
                                                title="Xóa hoạt động này"
                                            >
                                                <Trash2 size={20} />
                                            </button>

                                            <div className="grid grid-cols-12 gap-4">
                                                {/* Header Row: Day & Time */}
                                                <div className="col-span-12 md:col-span-1">
                                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Ngày</label>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-full p-2 border rounded font-bold text-center text-blue-600"
                                                            value={detail.ngayThu}
                                                            onChange={e => handleDetailChange(idx, 'ngayThu', Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-span-6 md:col-span-3">
                                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Bắt đầu</label>
                                                    <div className="flex gap-1">
                                                        <select
                                                            className="w-1/2 p-2 border rounded bg-gray-50 cursor-pointer"
                                                            value={detail.thoiGian ? detail.thoiGian.split(':')[0] : '08'}
                                                            onChange={e => {
                                                                const h = e.target.value;
                                                                const m = detail.thoiGian ? detail.thoiGian.split(':')[1]?.split(' ')[0] || '00' : '00';

                                                                // Correct logic: maintain duration
                                                                const currentStart = detail.thoiGian ? detail.thoiGian.split('-')[0].trim() : '08:00';
                                                                const [sh, sm] = currentStart.split(':').map(Number);
                                                                const [eh, em] = detail.thoiGian?.includes('-') ? detail.thoiGian.split('-')[1].trim().split(':').map(Number) : [sh + 2, sm]; // default 2h
                                                                let durationMins = (eh * 60 + em) - (sh * 60 + sm);
                                                                if (durationMins < 0) durationMins += 24 * 60; // Handle midnight crossing

                                                                const d = new Date();
                                                                d.setHours(Number(h), Number(m) + durationMins, 0);
                                                                const endStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} `;
                                                                handleDetailChange(idx, 'thoiGian', `${h}:${m} - ${endStr} `);
                                                            }}
                                                        >
                                                            {Array.from({ length: 24 }).map((_, i) => {
                                                                const h = String(i).padStart(2, '0');
                                                                return <option key={i} value={h}>{h} h</option>
                                                            })}
                                                        </select>
                                                        <select
                                                            className="w-1/2 p-2 border rounded bg-gray-50 cursor-pointer"
                                                            value={detail.thoiGian ? detail.thoiGian.split(':')[1]?.split(' ')[0] : '00'}
                                                            onChange={e => {
                                                                const m = e.target.value;
                                                                const h = detail.thoiGian ? detail.thoiGian.split(':')[0] : '08';

                                                                // Recalculate with new minute
                                                                const currentStart = detail.thoiGian ? detail.thoiGian.split('-')[0].trim() : '08:00';
                                                                const [sh, sm] = currentStart.split(':').map(Number);
                                                                const [eh, em] = detail.thoiGian?.includes('-') ? detail.thoiGian.split('-')[1].trim().split(':').map(Number) : [sh + 2, sm];
                                                                let durationMins = (eh * 60 + em) - (sh * 60 + sm);
                                                                if (durationMins < 0) durationMins += 24 * 60;

                                                                const d = new Date();
                                                                d.setHours(Number(h), Number(m) + durationMins, 0);
                                                                const endStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} `;
                                                                handleDetailChange(idx, 'thoiGian', `${h}:${m} - ${endStr} `);
                                                            }}
                                                        >
                                                            {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m} p</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="col-span-6 md:col-span-2">
                                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Thời lượng</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            className="w-full p-2 border rounded pr-8"
                                                            value={(() => {
                                                                if (detail.thoiGian?.includes('-')) {
                                                                    const [s, e] = detail.thoiGian.split('-').map(t => t.trim());
                                                                    const [sh, sm] = s.split(':').map(Number);
                                                                    const [eh, em] = e.split(':').map(Number);
                                                                    let diff = (eh * 60 + em) - (sh * 60 + sm);
                                                                    if (diff < 0) diff += 24 * 60;
                                                                    return diff;
                                                                }
                                                                return (locations.find(l => l.diaDiemId === detail.diaDiemId)?.thoiGianThamQuanDuKien || 2) * 60;
                                                            })()}
                                                            onChange={(e) => {
                                                                const newDuration = Number(e.target.value);
                                                                const currentStart = detail.thoiGian ? detail.thoiGian.split('-')[0].trim() : '08:00';
                                                                const [sh, sm] = currentStart.split(':').map(Number);
                                                                const d = new Date();
                                                                d.setHours(sh, sm + newDuration, 0);
                                                                const endStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} `;
                                                                handleDetailChange(idx, 'thoiGian', `${currentStart} - ${endStr} `);
                                                            }}
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">phút</span>
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1 text-right">
                                                        Kết thúc: <span className="font-bold text-blue-600">{detail.thoiGian?.includes('-') ? detail.thoiGian.split('-')[1].trim() : '--:--'}</span>
                                                    </div>
                                                </div>

                                                {/* Location - Takes remaining space */}
                                                <div className="col-span-12 md:col-span-6">
                                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Địa điểm / Hoạt động</label>
                                                    <SearchableSelect
                                                        value={detail.diaDiemId}
                                                        options={locations.map(loc => ({
                                                            value: loc.diaDiemId,
                                                            label: loc.tenDiaDiem,
                                                            subLabel: `${loc.thoiGianThamQuanDuKien || 2} h`,
                                                            disabled: false
                                                        }))}
                                                        onChange={(newId) => {
                                                            const idNum = Number(newId);
                                                            handleLocChange(idNum);
                                                            const loc = locations.find(l => l.diaDiemId === idNum);
                                                            if (loc) {
                                                                // Auto-fill Image (or clear if empty)
                                                                handleDetailChange(idx, 'hinhAnh', loc.hinhAnh || '');

                                                                // Auto-update Duration (End Time)
                                                                const currentStart = detail.thoiGian ? detail.thoiGian.split('-')[0].trim() : '08:00';
                                                                const [sh, sm] = currentStart.split(':').map(Number); // e.g. 08, 00

                                                                const durationMins = (loc.thoiGianThamQuanDuKien || 2) * 60; // Default 2h if missing

                                                                const d = new Date();
                                                                d.setHours(sh, sm + durationMins, 0); // Add duration to start time

                                                                const endStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} `;
                                                                handleDetailChange(idx, 'thoiGian', `${currentStart} - ${endStr} `);
                                                            } else {
                                                                // If location cleared, clear image
                                                                handleDetailChange(idx, 'hinhAnh', '');
                                                            }
                                                        }}
                                                        placeholder="Chọn địa điểm hoặc để trống..."
                                                    />
                                                </div>

                                                {/* Second Row: Additional Details */}
                                                {/* Second Row: Title & Note */}
                                                <div className="col-span-12 md:col-span-8">
                                                    <div className="mb-3">
                                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tiêu đề (Tùy chọn)</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 border rounded text-sm placeholder-gray-400"
                                                            value={detail.tieuDe || ''}
                                                            placeholder="VD: Ăn trưa, Nghỉ ngơi..."
                                                            onChange={e => handleDetailChange(idx, 'tieuDe', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Chi tiết / Hướng dẫn <span className="text-red-500">*</span></label>
                                                        <textarea
                                                            className="w-full p-2 border rounded h-24 resize-none text-sm"
                                                            value={detail.ghiChu || ''}
                                                            required
                                                            placeholder="Mô tả chi tiết hoạt động..."
                                                            onChange={e => handleDetailChange(idx, 'ghiChu', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Image Section - Right Column */}
                                                <div className="col-span-12 md:col-span-4 flex flex-col">
                                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Hình ảnh</label>
                                                    <div className="flex-1 border border-dashed border-gray-300 rounded-lg bg-gray-50 relative hover:border-blue-400 transition min-h-[140px]">
                                                        <UploadImage
                                                            label=""
                                                            currentImage={detail.hinhAnh === 'HIDDEN' ? '' : detail.hinhAnh}
                                                            onUpload={(url) => handleDetailChange(idx, 'hinhAnh', url)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2"
                            >
                                <Save size={20} />
                                {loading ? 'Đang lưu...' : (isEditMode ? 'Cập Nhật Tour' : 'Tạo Tour Mới')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

function CreatableSelect({
    value,
    onChange,
    options,
    placeholder = "",
    required = false
}: {
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder?: string;
    required?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [forceShowAll, setForceShowAll] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setForceShowAll(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const optionsToShow = (forceShowAll || (value || "").trim() === "")
        ? options
        : options.filter(opt => opt.toLowerCase().includes((value || "").toLowerCase()));

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={placeholder}
                value={value}
                required={required}
                onChange={e => {
                    onChange(e.target.value);
                    setIsOpen(true);
                    setForceShowAll(false); // Enable filtering when typing
                }}
                onFocus={() => setIsOpen(true)}
            />

            <div
                className="absolute right-0 top-0 h-full px-3 flex items-center cursor-pointer text-gray-400 hover:text-blue-600"
                onClick={(e) => {
                    e.preventDefault(); // Prevent focus loss issues
                    setForceShowAll(!isOpen); // If opening, show all.
                    setIsOpen(!isOpen);
                }}
            >
                <ChevronDown size={16} />
            </div>

            {isOpen && optionsToShow.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1 custom-scrollbar">
                    {optionsToShow.map((opt, idx) => (
                        <div
                            key={idx}
                            className="p-3 hover:bg-blue-50 cursor-pointer text-gray-700"
                            onClick={() => {
                                onChange(opt);
                                setIsOpen(false);
                                setForceShowAll(false);
                            }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper Component for Searchable Select
function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = "Chọn địa điểm...",
    required = false
}: {
    value: string | number;
    onChange: (val: string | number) => void;
    options: { value: string | number; label: string; subLabel?: string; disabled?: boolean }[];
    placeholder?: string;
    required?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showAll, setShowAll] = useState(false); // New state to toggle full list
    const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const prevValueRef = useRef(value);

    // Sync search text with selected value ONLY when value changes or initial load
    useEffect(() => {
        if (!isTyping) {
            // Only update if value actually changed or search is empty (initial)
            // This prevents "reverting" when options change but value is still pending update
            if (value !== prevValueRef.current || search === "") {
                const selected = options.find(o => o.value == value);
                if (selected) {
                    setSearch(selected.label);
                } else if (!value || value === 0) {
                    setSearch("");
                }
                prevValueRef.current = value;
            }
        }
    }, [value, options, isTyping, search]);

    const filtered = showAll ? options : options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleCommit = (val: string) => {
        // Find exact or allow partial if strictly matches an option label or value
        const found = options.find(o => o.label.toLowerCase() === val.toLowerCase() || String(o.value) === val);
        if (found && !found.disabled) {
            onChange(found.value);
            setSearch(found.label);
        } else {
            // Check for numeric input (minutes, etc.)
            const numeric = parseInt(val);
            if (!isNaN(numeric)) {
                const formatted = String(numeric).padStart(2, '0');
                const foundNumeric = options.find(o => String(o.value) === formatted);
                if (foundNumeric && !foundNumeric.disabled) {
                    onChange(foundNumeric.value);
                    setSearch(foundNumeric.label);
                    return;
                }
            }

            // Allow clearing input if not required
            if (val === "" && !required) {
                onChange("");
                setSearch("");
                return;
            }

            // Revert if invalid
            const selected = options.find(o => o.value == value);
            setSearch(selected ? selected.label : "");
        }
    };

    return (
        <div className="relative">
            <input
                type="text"
                className="w-full p-2 pr-10 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={placeholder}
                value={search}
                required={required && !value}
                onChange={e => {
                    setSearch(e.target.value);
                    setIsTyping(true);
                    setIsOpen(true);
                    setShowAll(false); // Standard filtering when typing
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission
                        handleCommit(search);
                        setIsOpen(false);
                        setIsTyping(false);
                    }
                }}
                onFocus={() => {
                    setIsOpen(true);
                    setIsTyping(true);
                }}
                onBlur={() => {
                    blurTimeoutRef.current = setTimeout(() => {
                        handleCommit(search);
                        setIsOpen(false);
                        setIsTyping(false);
                    }, 200);
                }}
            />

            {/* Clickable Triangle Button - Added bg-white to mask backend elements */}
            <div
                className="absolute right-1 top-1 bottom-1 w-8 bg-white flex items-center justify-center cursor-pointer text-gray-400 hover:text-blue-600 rounded"
                onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur
                    // Toggle dropdown and forcing "Show All" check
                    setIsOpen(!isOpen);
                    setShowAll(!isOpen);
                }}
            >
                <ChevronDown size={16} />
            </div>

            {isOpen && (
                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1 custom-scrollbar">
                    {filtered.length > 0 ? (
                        filtered.map((opt) => (
                            <div
                                key={opt.value}
                                className={`p-3 cursor-pointer transition flex justify-between items-center ${opt.disabled ? 'opacity-50 bg-gray-50 cursor-not-allowed' : 'hover:bg-blue-50'} `}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    // Clear pending blur check
                                    if (blurTimeoutRef.current) {
                                        clearTimeout(blurTimeoutRef.current);
                                        blurTimeoutRef.current = null;
                                    }

                                    if (!opt.disabled) {
                                        onChange(opt.value);
                                        setSearch(opt.label);
                                        setIsOpen(false);
                                        setIsTyping(false);
                                    }
                                }}
                            >
                                <span className="font-medium text-gray-800">{opt.label}</span>
                                {opt.subLabel && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{opt.subLabel}</span>}
                            </div>
                        ))
                    ) : (
                        <div className="p-3 text-gray-500 text-center italic text-sm">Không tìm thấy</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default AdminEditTour;
