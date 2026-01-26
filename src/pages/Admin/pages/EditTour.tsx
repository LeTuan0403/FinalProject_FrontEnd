import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { tourService, diaDiemService } from '../../../services/tourService';
import type { Tour, DiaDiem } from '../../../types';
import { compareTimeStrings } from '../../../utils/dateUtils';
import { Plus, Trash2, X, Save } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import UploadImage from '../components/UploadImage';
import SearchableSelect from '../components/SearchableSelect.tsx';
import CreatableSelect from '../components/CreatableSelect.tsx';

// eslint-disable-next-line complexity
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
        discounts: [], // [NEW] Default for merged discount management
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    tourRes.data.forEach((t: any) => {
                        // Check various case formats for legacy data
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const d = t.diemKhoiHanh || (t as any).DiemKhoiHanh || (t as any).KhoiHanh || (t as any).khoiHanh;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const p = t.phuongTien || (t as any).PhuongTien;

                        if (d && typeof d === 'string' && d.trim() !== '') { deps.add(d.trim()); }
                        if (p && typeof p === 'string' && p.trim() !== '') { trans.add(p.trim()); }
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
        // eslint-disable-next-line complexity
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
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        hinhAnhBia: data.hinhAnhBia || (data as any).HinhAnhBia || '', // Explicit mapping
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        diemKhoiHanh: data.diemKhoiHanh || (data as any).DiemKhoiHanh || (data as any).KhoiHanh || (data as any).khoiHanh || 'Hà Nội',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        phuongTien: data.phuongTien || (data as any).PhuongTien || 'Xe du lịch',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        loaiTour: data.loaiTour || (data as any).LoaiTour || 'Trong Nước',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        khuVuc: data.khuVuc || (data as any).KhuVuc || 'Miền Bắc',
                        // Map new fields explicitly
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        anSang: data.anSang ?? (data as any).AnSang ?? 0,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        anTrua: data.anTrua ?? (data as any).AnTrua ?? 0,

                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        anToi: data.anToi ?? (data as any).AnToi ?? 0,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        soLuongCho: data.soLuongCho ?? (data as any).SoLuongCho ?? 0,
                        ngayKhoiHanh: Array.isArray(data.ngayKhoiHanh)
                            ? data.ngayKhoiHanh.map((d: string | Date) => new Date(d).toISOString().split('T')[0])
                            : (data.ngayKhoiHanh ? [new Date(data.ngayKhoiHanh).toISOString().split('T')[0]] : []), // Ensure array

                        discounts: Array.isArray(data.discounts) ? data.discounts : [], // Map discounts
                        // If counts are 0, try to calculate from tourDetails (logic for Custom Tours)
                        ...(() => {
                            const as = Number(data.anSang ?? 0);
                            const at = Number(data.anTrua ?? 0);
                            const ae = Number(data.anToi ?? 0);

                            if (as === 0 && at === 0 && ae === 0 && (data.tourChiTiets || []).length > 0) {
                                let cS = 0, cT = 0, cC = 0;
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (data.tourChiTiets || []).forEach((d: any) => {
                                    const note = d.ghiChu || d.GhiChu || '';
                                    if (note.includes('Ăn:')) {
                                        if (note.includes('Sáng')) { cS++; }
                                        if (note.includes('Trưa')) { cT++; }
                                        if (note.includes('Tối')) { cC++; }
                                    }
                                });
                                return { anSang: cS, anTrua: cT, anToi: cC };
                            }
                            return {};
                        })(),
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        dichVuBaoGom: data.dichVuBaoGom || (data as any).DichVuBaoGom || '',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        dichVuKhongBaoGom: data.dichVuKhongBaoGom || (data as any).DichVuKhongBaoGom || '',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        chinhSachTour: data.chinhSachTour || (data as any).ChinhSachTour || (data as any).chinhSach || '',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        diemNhan: data.diemNhan || (data as any).DiemNhan || '',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any, complexity
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
                if (isEditMode) { toast.error("Không thể tải thông tin tour"); }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEditMode]);

    // eslint-disable-next-line complexity
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
                discounts: formData.discounts || [], // Send discounts array
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
                    } catch (err: unknown) {
                        const approveError = err as AxiosError<{ message?: string }>;
                        console.error("Auto-approve failed:", approveError);
                        toast.success("Cập nhật thành công!");
                        toast.error("Nhưng không thể duyệt tour. Lỗi: " + (approveError.response?.data?.message || approveError.message));
                        return;
                    }
                }
                toast.success("Cập nhật thành công!");
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
                // Auto-approve new tour if selected
                const responseData = response.data as { tourId?: number; id?: number };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newId: any = responseData.tourId || responseData.id;

                if (formData.daDuyet && newId) {
                    try {
                        await tourService.approveTour(newId);
                    } catch (approveError: unknown) {
                        const err = approveError as AxiosError<{ message?: string }>;
                        console.error("Auto-approve new tour failed", err);
                    }
                }

                if (newId) {
                    toast.success(`Tạo tour mới thành công! Tour ID: ${newId}`);
                    // Navigate to edit mode for the new tour so user can continue editing
                    navigate(`/admin/tour-edit/${newId}`);
                } else {
                    toast.success("Tạo tour mới thành công!");
                    navigate('/admin/tours'); // Fallback if no ID returned
                }
            }
            // navigate('/admin/tours'); // REMOVED: Stay on page after update/create
        } catch (err: unknown) {
            const error = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
            console.error(error);
            if (error.response && error.response.status === 401) {
                toast.error("Phiên đăng nhập đã hết hạn hoặc bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.");
            } else if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat().join('\n');
                toast.error("Lỗi dữ liệu:\n" + errorMessages);
            } else {
                toast.error("Có lỗi xảy ra: " + (error.response?.data?.message || (error as Error).message || "Lỗi không xác định"));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDetailChange = (index: number, field: string, value: string | number) => {
        setFormData(prev => {
            const newDetails = [...(prev.tourChiTiets || [])];
            newDetails[index] = { ...newDetails[index], [field]: value };
            return { ...prev, tourChiTiets: newDetails };
        });
    };

    const addDetail = (referenceDetail?: { diaDiemId?: number; thuTu?: number; ngayThu?: number; thoiGian?: string; tieuDe?: string; hinhAnh?: string; ghiChu?: string; originalIndex?: number }) => {
        // Find first UNUSED location if possible, else default to first available
        const usedIds = formData.tourChiTiets?.map(d => d.diaDiemId) || [];
        const availableLoc = locations.find(l => !usedIds.includes(l.diaDiemId)) || locations[0];

        // Determine Day: if reference exists, use that day. Else increment max day.
        const maxCurrentDay = formData.tourChiTiets?.reduce((max, item) => Math.max(max, item.ngayThu), 0) || 0;
        const newDay = (referenceDetail ? (referenceDetail.ngayThu || 1) : (maxCurrentDay + 1)) as number;

        // Smart Default Time: Inherit from reference or default to 08:00
        const defaultTime = referenceDetail ? (referenceDetail.thoiGian || '08:00') : '08:00';

        const newItem = {
            diaDiemId: availableLoc?.diaDiemId || 0,
            thuTu: (formData.tourChiTiets?.length || 0) + 1,
            ngayThu: newDay,
            tieuDe: '',
            hinhAnh: '',
            ghiChu: '',
            thoiGian: defaultTime
        };

        if (referenceDetail) {
            // Find index of referenceDetail in the ORIGINAL array if possible
            // Note: referenceDetail passed from UI comes from sortedDetails, which has originalIndex
            const insertIndex = typeof referenceDetail.originalIndex === 'number'
                ? referenceDetail.originalIndex + 1
                : (formData.tourChiTiets?.length || 0);

            const newDetails = [...(formData.tourChiTiets || [])];
            newDetails.splice(insertIndex, 0, newItem);
            setFormData({ ...formData, tourChiTiets: newDetails });
        } else {
            // Append to end if no reference (e.g. big add button)
            setFormData({
                ...formData,
                tourChiTiets: [...(formData.tourChiTiets || []), newItem]
            });
        }
    };

    const removeDetail = (index: number) => {
        const newDetails = [...(formData.tourChiTiets || [])];
        newDetails.splice(index, 1);
        setFormData({ ...formData, tourChiTiets: newDetails });
    };

    // Insert Auto-Sorting Logic for Rendering
    const sortedDetails = (formData.tourChiTiets || []).map((detail, index) => ({
        ...detail,
        originalIndex: index
    })).sort((a, b) => {
        if (a.ngayThu !== b.ngayThu) {
            return a.ngayThu - b.ngayThu;
        }
        // Primary Sort: Time
        const timeComparison = compareTimeStrings(a.thoiGian, b.thoiGian);
        if (timeComparison !== 0) { return timeComparison; }

        // Secondary Sort: Original Insertion Order (Stable Sort)
        // This ensures items with SAME time stay in the order they were added
        return a.originalIndex - b.originalIndex;
    });

    if (loading && !formData.maTour) { return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>; }

    return (
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
                        <label className="block text-sm font-bold text-gray-700 mb-2">Ngày khởi hành & Giảm giá</label>
                        <div className="space-y-3 border p-4 rounded-lg bg-gray-50">
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="date"
                                    className="flex-1 p-2 border rounded-lg"
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
                                                toast.error("Ngày này đã được chọn!");
                                            }
                                        }
                                    }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold"
                                >
                                    <Plus size={20} /> Thêm Ngày
                                </button>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {(formData.ngayKhoiHanh || []).map((date, idx) => {
                                    // Find discount for this date
                                    const discountObj = formData.discounts?.find(d => {
                                        const d1 = new Date(d.date).setHours(0, 0, 0, 0);
                                        const d2 = new Date(date).setHours(0, 0, 0, 0);
                                        return d1 === d2;
                                    });
                                    const percentage = discountObj ? discountObj.percentage : 0;
                                    const isLastMinute = (() => {
                                        const d = new Date(date);
                                        d.setHours(0, 0, 0, 0);
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const diffTime = d.getTime() - today.getTime();
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        return diffDays >= 0 && diffDays <= 3;
                                    })();

                                    return (
                                        <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${isLastMinute ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-gray-700">{new Date(date).toLocaleDateString('vi-VN')}</span>
                                                {isLastMinute && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">Giờ chót</span>}
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm font-semibold text-gray-500">Giảm (%):</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        className="w-20 p-1 border rounded text-center font-bold text-red-600 focus:ring-2 focus:ring-red-200 outline-none"
                                                        placeholder="0"
                                                        value={percentage > 0 ? percentage : ''}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            setFormData(prev => {
                                                                const newDiscounts = prev.discounts ? [...prev.discounts] : [];
                                                                const targetDateStr = date;
                                                                // Remove existing entry for this date if any
                                                                const cleanDiscounts = newDiscounts.filter(d => {
                                                                    return new Date(d.date).setHours(0, 0, 0, 0) !== new Date(targetDateStr).setHours(0, 0, 0, 0);
                                                                });

                                                                if (val > 0) {
                                                                    // Add new if > 0
                                                                    cleanDiscounts.push({ date: targetDateStr, percentage: val });
                                                                }
                                                                return { ...prev, discounts: cleanDiscounts };
                                                            });
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newDates = [...(formData.ngayKhoiHanh || [])];
                                                        newDates.splice(idx, 1);
                                                        // Also remove discount
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            ngayKhoiHanh: newDates,
                                                            discounts: (prev.discounts || []).filter(d => new Date(d.date).getTime() !== new Date(date).getTime())
                                                        }));
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition"
                                                    title="Xóa ngày này"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
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
                                    onChange={e => setFormData({ ...formData, anSang: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Trưa</label>
                                <input
                                    type="text"
                                    className="p-2 border rounded-md text-center font-bold"
                                    value={formData.anTrua || 0}
                                    onFocus={(e) => e.target.select()}
                                    onChange={e => setFormData({ ...formData, anTrua: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Tối</label>
                                <input
                                    type="text"
                                    className="p-2 border rounded-md text-center font-bold"
                                    value={formData.anToi || 0}
                                    onFocus={(e) => e.target.select()}
                                    onChange={e => setFormData({ ...formData, anToi: Number(e.target.value) })}
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
                        {(!formData.tourChiTiets || formData.tourChiTiets.length === 0) && (
                            <button type="button" onClick={() => addDetail()} className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-3 py-2 rounded">
                                <Plus size={18} /> Thêm hoạt động
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {sortedDetails.map((detail) => {
                            const idx = detail.originalIndex; // Use original index for updates
                            const handleLocChange = (newId: number) => {
                                handleDetailChange(idx, 'diaDiemId', newId);
                            };

                            // Helper to calculate end time string
                            const calculateEndTimeString = (h: string, m: string, currentThoiGian: string) => {
                                const currentStart = currentThoiGian ? currentThoiGian.split('-')[0].trim() : '08:00';
                                const [sh, sm] = currentStart.split(':').map(Number);

                                if (currentThoiGian?.includes('-')) {
                                    const [eh, em] = currentThoiGian.split('-')[1].trim().split(':').map(Number);
                                    let durationMins = (eh * 60 + em) - (sh * 60 + sm);
                                    if (durationMins < 0) { durationMins += 24 * 60; }

                                    const d = new Date();
                                    d.setHours(Number(h), Number(m) + durationMins, 0);
                                    const endStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} `;
                                    return `${h}:${m} - ${endStr} `;
                                } else {
                                    return `${h}:${m}`;
                                }
                            };

                            return (
                                <div key={idx}>
                                    <div className="relative p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow group mb-0">
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
                                                            const timeString = calculateEndTimeString(h, m, detail.thoiGian || '');
                                                            handleDetailChange(idx, 'thoiGian', timeString);
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
                                                            const timeString = calculateEndTimeString(h, m, detail.thoiGian || '');
                                                            handleDetailChange(idx, 'thoiGian', timeString);
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
                                                                if (diff < 0) { diff += 24 * 60; }
                                                                return diff;
                                                            }
                                                            return 0; // If no range, duration is 0
                                                        })()}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const newDuration = val === '' ? 0 : Number(val);

                                                            const currentStart = detail.thoiGian ? detail.thoiGian.split('-')[0].trim() : '08:00';
                                                            const [sh, sm] = currentStart.split(':').map(Number);

                                                            if (newDuration > 0) {
                                                                const d = new Date();
                                                                d.setHours(sh, sm + newDuration, 0);
                                                                const endStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} `;
                                                                handleDetailChange(idx, 'thoiGian', `${currentStart} - ${endStr} `);
                                                            } else {
                                                                // If 0, remove end time
                                                                handleDetailChange(idx, 'thoiGian', currentStart);
                                                            }
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

                                    {/* Inline Add Button */}
                                    <div className="flex justify-center my-4 group/add relative">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-gray-200 group-hover/add:border-blue-200 transition-colors"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => addDetail(detail)}
                                                className="bg-white border-2 border-dashed border-gray-300 rounded-full p-1.5 text-gray-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm group-hover/add:scale-110"
                                                title={`Thêm hoạt động tiếp theo vào Ngày ${detail.ngayThu}`}
                                            >
                                                <Plus size={20} />
                                            </button>
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
    );
};

export default AdminEditTour;
