import { useState, useEffect, useMemo } from 'react';
import { MapPin, Navigation, Loader, Plus, Info, X, Calendar, Clock, Users, AlertTriangle, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tourService, diaDiemService } from '../../services/tourService';
import { useAuth } from '../../hooks/useAuth';
import type { DiaDiem, Tour, Tour_ChiTiet } from '../../types';

// Restricted start points
const START_POINTS = ["Hà Nội", "Thành phố Hồ Chí Minh"];

// Strict Destination List (Provinces/Cities only)
// Region Mapping
const CITY_REGION_MAP: Record<string, string> = {
  "Hà Nội": "Miền Bắc", "Quảng Ninh": "Miền Bắc", "Ninh Bình": "Miền Bắc", "Lào Cai": "Miền Bắc", "Hà Giang": "Miền Bắc",
  "Sơn La": "Miền Bắc", "Cao Bằng": "Miền Bắc", "Bắc Kạn": "Miền Bắc",
  "Đà Nẵng": "Miền Trung", "Quảng Nam": "Miền Trung", "Thừa Thiên Huế": "Miền Trung", "Khánh Hòa": "Miền Trung",
  "Bình Định": "Miền Trung", "Phú Yên": "Miền Trung", "Quảng Bình": "Miền Trung", "Bình Thuận": "Miền Trung", "Lâm Đồng": "Miền Trung",
  "Thành phố Hồ Chí Minh": "Miền Nam", "Bà Rịa - Vũng Tàu": "Miền Nam", "Kiên Giang": "Miền Nam", "Tiền Giang": "Miền Nam",
  "Cần Thơ": "Miền Nam", "Bến Tre": "Miền Nam", "Cà Mau": "Miền Nam"
};

const DESTINATION_OPTIONS = Object.keys(CITY_REGION_MAP).sort();

interface SelectedLocation extends DiaDiem {
  visitTime?: string;
}

interface DayConfig {
  meals: string[];
  note: string;
  isFree?: boolean;
}

const CustomTour = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const editData = location.state?.tourData as Tour;

  const [loading, setLoading] = useState(false);

  // Data State
  const [availableLocations, setAvailableLocations] = useState<DiaDiem[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<DiaDiem[]>([]);

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dest1Search, setDest1Search] = useState('');
  const [showDest1Dropdown, setShowDest1Dropdown] = useState(false);
  const [tempSelectedLocations, setTempSelectedLocations] = useState<DiaDiem[]>([]);
  const [targetDayForAdd, setTargetDayForAdd] = useState<number>(1);
  const [showTermsModal, setShowTermsModal] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    startPoint: 'Thành phố Hồ Chí Minh',
    destinations: [] as string[], // Changed from endPoint
    startDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    duration: 3,
    startTime: '08:00',
    adults: 1 as number | '',
    children: 0,
    transport: 'Oto',
    isSelfCatering: false,
    selectedLocations: {} as Record<number, SelectedLocation[]>,
    dayConfigs: {} as Record<number, DayConfig>
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await diaDiemService.getAll();
        // Filter out technical locations used for endpoints
        const allLocs = res.data || [];
        const hiddenLocs = ["Hà Nội", "Thành phố Hồ Chí Minh", "Hà Nội/TP Hồ Chí Minh"];
        const validLocs = allLocs.filter((loc: DiaDiem) => !hiddenLocs.includes(loc.tenDiaDiem));
        setAvailableLocations(validLocs);
      } catch (err) {
        console.error("Failed to fetch locations", err);
      }
    };
    fetchLocations();

    if (editData) {
      // Reconstruct state
      const locMap: Record<number, SelectedLocation[]> = {};
      const configMap: Record<number, DayConfig> = {};

      // 1. Determine Duration (Parse "X ngày" or fall back to details length)
      let parsedDuration = 3;
      if (editData.thoiGian) {
        const match = editData.thoiGian.match(/(\d+)\s*ngày/i);
        if (match) parsedDuration = parseInt(match[1]);
      } else if (editData.tourChiTiets) {
        // Fallback if thoiGian matches nothing (unlikely)
        parsedDuration = editData.tourChiTiets.length;
      }

      // 2. Parse Description
      const description = editData.moTa || "";

      // Parse Adults Count: "... 5 người..."
      let parsedAdults = 1;
      const adultsMatch = description.match(/(\d+)\s*người/i);
      if (adultsMatch) {
        parsedAdults = parseInt(adultsMatch[1]);
      }

      // Parse Free Day status
      // Format: "- Ngày X: Tự do hoạt động"
      const freeDayRegex = /Ngày\s+(\d+):\s*Tự do hoạt động/gi;
      let freeMatch;
      let maxFreeDay = 0;
      while ((freeMatch = freeDayRegex.exec(description)) !== null) {
        const d = parseInt(freeMatch[1]);
        if (d > maxFreeDay) maxFreeDay = d;

        // Try to extract note from free day line if present
        // Needed if we save "Tự do hoạt động. (Ghi chú: abc)"
        // But the regex might need adjustment to capture it.
        // For now, simple free status restoration:
        if (!configMap[d]) configMap[d] = { meals: [], note: '', isFree: true };
        else configMap[d].isFree = true;
      }

      // Also check for "Chưa chọn điểm đến" if we persist that
      // ...

      // 3. Process Tour Details (Support both 'tourChiTiets' and 'lichTrinh')
      let maxDetailDay = 0;
      const details = editData.tourChiTiets || (editData as any).lichTrinh || [];

      details.forEach((ct: any) => {
        if (ct.ngayThu > maxDetailDay) maxDetailDay = ct.ngayThu;

        if (!locMap[ct.ngayThu]) locMap[ct.ngayThu] = [];

        // Extract Visit Time from ghiChu if available
        let vTime = '2 tiếng';
        let mealsRaw = '';
        let noteRaw = '';

        if (ct.ghiChu) {
          const parts = ct.ghiChu.split('|');
          parts.forEach((p: string) => {
            const pTrim = p.trim();
            if (pTrim.startsWith("Thời gian:")) vTime = pTrim.replace("Thời gian:", "").trim();
            if (pTrim.startsWith("Ăn:")) mealsRaw = pTrim.replace("Ăn:", "").trim();
            if (pTrim.startsWith("Ghi chú:")) noteRaw = pTrim.replace("Ghi chú:", "").trim();
          });
        }

        // Backend returns populated object in 'diaDiemId', Frontend usage might expect 'diaDiem'
        // Check both cases
        const locationData = ct.diaDiem || ct.diaDiemId;

        // Ensure it's an object (populated), not just an ID number/string
        if (locationData && typeof locationData === 'object') {
          locMap[ct.ngayThu].push({
            ...locationData,
            visitTime: vTime
          });
        }

        // Initialize config if not exists
        if (!configMap[ct.ngayThu]) {
          const meals = mealsRaw && mealsRaw !== 'Tự túc' ? mealsRaw.split(',').map((m: string) => m.trim()) : [];
          configMap[ct.ngayThu] = { meals: meals, note: noteRaw };
        }
      });

      // Update duration to be at least the max day found in details or description
      const calculatedDuration = Math.max(parsedDuration, maxDetailDay, maxFreeDay);
      parsedDuration = calculatedDuration;

      const today = new Date();
      today.setDate(today.getDate() + 7);
      const minDateStr = today.toISOString().split('T')[0];

      // Fallback for endPoint if missing
      let restoredEndPoint = editData.tenDiaDiem || '';
      if (!restoredEndPoint && editData.tenTour && editData.tenTour.includes(" - ")) {
        const parts = editData.tenTour.split(" - ");
        if (parts.length > 1) restoredEndPoint = parts[1].trim(); // This might be "Hà Nội & Lào Cai"
      }

      // Robust splitting: Handle both " - " (saved in tenDiaDiem) and " & " (saved in tenTour)
      // Also strictly filter out empty strings
      const rawDestinations = restoredEndPoint ? restoredEndPoint.split(/[\-&]/) : [];
      const cleanDestinations = rawDestinations.map(s => s.trim()).filter(s => s.length > 0);

      setFormData({
        startPoint: editData.diemKhoiHanh || 'Thành phố Hồ Chí Minh',
        destinations: cleanDestinations,
        startDate: minDateStr, // Always reset date to valid future date on edit? Or keep original if valid? User typically wants to replicate the tour.
        duration: parsedDuration,
        startTime: '08:00',
        adults: parsedAdults,
        children: 0,
        transport: editData.phuongTien || 'Oto',
        isSelfCatering: description.includes('(Khách tự túc ăn uống)'),
        selectedLocations: locMap,
        dayConfigs: configMap
      });
    }
  }, [editData]);

  // Calculate total ticket price
  const totalTicketPrice = useMemo(() => {
    let total = 0;
    Object.values(formData.selectedLocations).forEach(dayLocs => {
      dayLocs?.forEach(loc => {
        total += loc.giaVe || 0;
      });
    });
    // Multiply by number of adults (default to 1 if empty/0 during input)
    const pax = (typeof formData.adults === 'number' && formData.adults > 0) ? formData.adults : 1;
    return total * pax;
  }, [formData.selectedLocations, formData.adults]);

  // Calculate min date for Date Picker
  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  };

  // Filter locations when destinations change
  useEffect(() => {
    if (formData.destinations.length > 0 && availableLocations.length > 0) {
      const relevant = availableLocations.filter(loc => {
        const address = (loc.diaChiCuThe || '').toLowerCase();
        return formData.destinations.some(d => address.includes(d.toLowerCase()));
      });
      setFilteredLocations(relevant);
    } else {
      setFilteredLocations([]);
    }
  }, [formData.destinations, availableLocations]);

  const openAddLocationModal = (day: number) => {
    setTargetDayForAdd(day);
    setTempSelectedLocations([]);
    setShowConfirmModal(true);
  };

  const toggleLocationSelection = (loc: DiaDiem) => {
    // Check for duplicates in OTHER days
    let duplicateDay = null;
    Object.entries(formData.selectedLocations).forEach(([dayStr, locs]) => {
      if (Number(dayStr) !== targetDayForAdd) {
        const found = locs?.find(l => l.diaDiemId === loc.diaDiemId);
        if (found) duplicateDay = dayStr;
      }
    });

    // Also check current day (targetDayForAdd) if it's already added (not in temp state, but in committed state? No, temp state replaces/adds to committed state?)
    // Actually formData.selectedLocations[targetDayForAdd] contains *existing* items.
    const existingInCurrentDay = formData.selectedLocations[targetDayForAdd]?.find(l => l.diaDiemId === loc.diaDiemId);

    if ((duplicateDay || existingInCurrentDay) && !tempSelectedLocations.find(t => t.diaDiemId === loc.diaDiemId)) {
      // If we are ADDING (not removing)
      const dayName = duplicateDay ? `Ngày ${duplicateDay}` : "ngày hiện tại";
      alert(`Lưu ý: Địa điểm "${loc.tenDiaDiem}" đã được chọn trong lịch trình (${dayName}).`);
    }

    setTempSelectedLocations(prev => {
      const exists = prev.find(p => p.diaDiemId === loc.diaDiemId);
      if (exists) {
        return prev.filter(p => p.diaDiemId !== loc.diaDiemId);
      } else {
        return [...prev, loc];
      }
    });
  };

  const confirmAddLocations = () => {
    if (tempSelectedLocations.length > 0) {
      const newItems = tempSelectedLocations.map(loc => ({
        ...loc,
        visitTime: loc.thoiGianThamQuanDuKien ? `${loc.thoiGianThamQuanDuKien} tiếng` : "2 tiếng"
      }));

      setFormData(prev => ({
        ...prev,
        selectedLocations: {
          ...prev.selectedLocations,
          [targetDayForAdd]: [
            ...(prev.selectedLocations[targetDayForAdd] || []),
            ...newItems
          ]
        }
      }));
      setShowConfirmModal(false);
      setTempSelectedLocations([]);
    }
  };

  const removeLocation = (day: number, id: number) => {
    setFormData(prev => ({
      ...prev,
      selectedLocations: {
        ...prev.selectedLocations,
        [day]: prev.selectedLocations[day]?.filter(l => l.diaDiemId !== id) || []
      }
    }));
  };

  const updateDayConfig = (day: number, field: keyof DayConfig, value: any) => {
    setFormData(prev => {
      // 1. Update dayConfigs
      const newDayConfigs = {
        ...prev.dayConfigs,
        [day]: {
          ...(prev.dayConfigs[day] || { meals: [], note: '' }),
          [field]: value
        }
      };

      // 2. If setting isFree = true, CLEAR locations for this day
      let newSelectedLocations = prev.selectedLocations;
      if (field === 'isFree' && value === true) {
        newSelectedLocations = {
          ...prev.selectedLocations,
          [day]: [] // Clear locations
        };
      }

      return {
        ...prev,
        dayConfigs: newDayConfigs,
        selectedLocations: newSelectedLocations
      };
    });
  };

  const toggleMeal = (day: number, meal: string) => {
    const currentMeals = formData.dayConfigs[day]?.meals || [];
    const newMeals = currentMeals.includes(meal)
      ? currentMeals.filter(m => m !== meal)
      : [...currentMeals, meal];
    updateDayConfig(day, 'meals', newMeals);
  };

  const handleDurationChange = (delta: number) => {
    const newDuration = Math.max(1, formData.duration + delta);
    setFormData(p => ({ ...p, duration: newDuration }));
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để tạo tour!");
      navigate('/login');
      return;
    }
    if (formData.destinations.length === 0) {
      alert("Vui lòng chọn ít nhất 1 điểm đến!");
      return;
    }
    if (!formData.adults || (typeof formData.adults === 'number' && formData.adults <= 0)) {
      alert("Số lượng khách phải lớn hơn 0!");
      return;
    }

    // Validation Loop
    for (let d = 1; d <= formData.duration; d++) {
      const locs = formData.selectedLocations[d] || [];
      const config = formData.dayConfigs[d] || { meals: [], note: '' };
      const isFree = config.isFree;
      const hasNote = config.note && config.note.trim().length > 0;

      if (locs.length === 0 && !hasNote && !isFree) {
        alert(`Ngày ${d} chưa có thông tin! Vui lòng chọn địa điểm, nhập ghi chú hoặc chọn 'Tự do hoạt động'.`);
        return;
      }
    }

    try {
      setLoading(true);

      const tourChiTiets: Tour_ChiTiet[] = [];
      let description = `Yêu cầu chi tiết: Khởi hành ${formData.startTime} ngày ${formData.startDate}. Hành trình ${formData.duration} ngày. ${formData.adults} người.${formData.isSelfCatering ? ' (Khách tự túc ăn uống)' : ''}`;

      for (let d = 1; d <= formData.duration; d++) {
        const locs = formData.selectedLocations[d] || [];
        const config = formData.dayConfigs[d] || { meals: [], note: '' };

        // We need to attach day Note/Meals info. 
        // Since Tour_ChiTiet is per location, we can attach general day info to the FIRST location of that day,
        // OR if the list is empty, we might lose that info if backend doesn't support 'Empty Day' entries.
        // For now, we attach to each location or create a dummy if needed? 
        // Let's attach to the first location's note if available, or just rely on the 'ghiChu' field of the Tour object if possible.
        // Better strategy: concatenate into the location's note "HD: Sáng, Trưa | Note: ..."

        const dayNoteString = `Ăn: ${config.meals.join(', ') || 'Tự túc'} | Ghi chú: ${config.note}`;

        if (config.isFree) {
          description += `\n- Ngày ${d}: Tự do hoạt động. ${config.note ? `(Ghi chú: ${config.note})` : ''}`;
        } else if (locs.length === 0) {
          description += `\n- Ngày ${d}: Chưa chọn điểm đến. ${config.note ? `(Ghi chú: ${config.note})` : ''}`;
        }

        // ONLY add locations if NOT free day
        if (!config.isFree) {
          locs.forEach((loc, idx) => {
            tourChiTiets.push({
              diaDiemId: loc.diaDiemId,
              thuTu: idx + 1,
              ngayThu: d,
              thoiGian: "08:00",
              ghiChu: `${idx === 0 ? dayNoteString : 'Khách chọn tự do'} | Thời gian: ${loc.visitTime}`
            });
          });
        }
      }

      // Calculate total meals
      let totalS = 0, totalT = 0, totalC = 0;
      for (let d = 1; d <= formData.duration; d++) {
        const meals = formData.dayConfigs[d]?.meals || [];
        if (meals.includes('Sáng')) totalS++;
        if (meals.includes('Trưa')) totalT++;
        if (meals.includes('Tối')) totalC++;
      }

      const payload = {
        userId: user.userId,
        tenTour: `Tour Tự Chọn: ${formData.startPoint}${formData.destinations.length > 0 ? ' - ' + formData.destinations.join(' & ') : ''}`,
        isTuChon: true,
        diemKhoiHanh: formData.startPoint,
        tenDiaDiem: formData.destinations.join(' - '), // Store all cities stringified
        phuongTien: formData.transport,
        tongGiaDuKien: isNaN(totalTicketPrice) ? 0 : totalTicketPrice,
        tourChiTiets: tourChiTiets,
        thoiGian: `${formData.duration} ngày`,
        moTa: description,
        // Send as STRINGS (backend requirement)
        anSang: String(totalS),
        anTrua: String(totalT),
        anToi: String(totalC),
        // Add capacity and date per user request
        soLuongCho: typeof formData.adults === 'number' ? formData.adults : 1,
        ngayKhoiHanh: [formData.startDate]
      };

      if (editData?.tourId) {
        // Update existing
        await tourService.updateCustom(editData.tourId, payload);
        alert("Cập nhật tour thành công!");
        navigate('/my-tours');
      } else {
        // Create NEW (Single Call)
        await tourService.createCustom(payload);

        alert("Yêu cầu thiết kế tour đã được gửi! Vui lòng kiểm tra 'Tour của tôi'.");
        navigate('/my-tours');
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center gap-2"><Loader className="animate-spin text-blue-600" /> <span className="text-blue-600 font-medium">Đang xử lý...</span></div>;

  return (
    <div className="bg-gray-100 min-h-screen py-8 font-sans">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-3xl font-black text-blue-900 mb-8 uppercase flex items-center gap-3">
          <Navigation className="text-orange-500" /> Thiết Kế Tour Theo Sở Thích
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Config & Summary (Merged) - Spans 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3">
                <FileText className="text-blue-500" /> Thông Tin Chuyến Đi
              </h2>

              <div className="space-y-5">
                {/* Points */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Điểm khởi hành</label>
                    <select
                      className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.startPoint}
                      onChange={e => setFormData({ ...formData, startPoint: e.target.value })}
                    >
                      {START_POINTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Điểm đến (Tối đa 2 - Cùng khu vực)</label>
                    <div className="relative mt-1 space-y-4">

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Dest 1 */}
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Điểm đến 1 <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="-- Nhập tìm kiếm điểm đến --"
                              value={dest1Search || (formData.destinations[0] || '')}
                              onFocus={() => {
                                setShowDest1Dropdown(true);
                                // If already selected, init search with current value? Or keep empty to show all?
                                // Let's keep it sync
                                if (formData.destinations[0] && !dest1Search) setDest1Search(formData.destinations[0]);
                              }}
                              onChange={e => {
                                setDest1Search(e.target.value);
                                setShowDest1Dropdown(true);
                              }}
                              onBlur={() => setTimeout(() => setShowDest1Dropdown(false), 200)}
                            />
                            {showDest1Dropdown && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                                {DESTINATION_OPTIONS.filter(d =>
                                  d.toLowerCase().includes((dest1Search || "").toLowerCase()) ||
                                  (dest1Search === formData.destinations[0]) // Show all if search matches current (simplification)
                                ).map(d => (
                                  <div
                                    key={d}
                                    className="p-3 hover:bg-blue-50 cursor-pointer font-medium text-gray-700 text-sm flex justify-between"
                                    onClick={() => {
                                      setDest1Search(d);
                                      // Update Form Data Logic (Copied from old onChange)
                                      let newDests = [d];
                                      if (formData.destinations[1]) {
                                        const reg1 = CITY_REGION_MAP[d];
                                        const reg2 = CITY_REGION_MAP[formData.destinations[1]];
                                        if (reg1 === reg2 && d !== formData.destinations[1]) {
                                          newDests.push(formData.destinations[1]);
                                        }
                                      }
                                      setFormData({ ...formData, destinations: newDests });
                                      setShowDest1Dropdown(false);
                                    }}
                                  >
                                    <span>{d}</span>
                                    <span className="text-xs text-gray-400 font-normal">({CITY_REGION_MAP[d]})</span>
                                  </div>
                                ))}
                                {DESTINATION_OPTIONS.filter(d => d.toLowerCase().includes((dest1Search || "").toLowerCase())).length === 0 && (
                                  <div className="p-3 text-center text-gray-400 text-sm">Không tìm thấy kết quả</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dest 2 */}
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Điểm đến 2 (Tùy chọn)</label>
                          <select
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            value={formData.destinations[1] || ''}
                            disabled={!formData.destinations[0]}
                            onChange={e => {
                              const val = e.target.value;
                              const newDests = [formData.destinations[0]];
                              if (val) newDests.push(val);
                              setFormData({ ...formData, destinations: newDests });
                            }}
                          >
                            <option value="">-- Chọn thêm --</option>
                            {(() => {
                              const firstDest = formData.destinations[0];
                              if (!firstDest) return null;
                              const region = CITY_REGION_MAP[firstDest];
                              return DESTINATION_OPTIONS
                                .filter(d => CITY_REGION_MAP[d] === region && d !== firstDest)
                                .map(d => (
                                  <option key={d} value={d}>{d}</option>
                                ));
                            })()}
                          </select>
                        </div>
                      </div>

                      {/* Warning: Empty Destinations */}
                      {(() => {
                        if (formData.destinations.length > 0 && availableLocations.length > 0) {
                          const emptyDests = formData.destinations.filter(dest => {
                            return !availableLocations.some(loc => {
                              const addr = (loc.diaChiCuThe || '').toLowerCase();
                              return addr.includes(dest.toLowerCase());
                            });
                          });

                          if (emptyDests.length > 0) {
                            return (
                              <div className="mt-2 bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={18} />
                                <div className="text-xs text-yellow-800">
                                  <span className="font-bold">Lưu ý:</span> Các điểm đến sau chưa có địa điểm tham quan nào trong hệ thống: <span className="font-bold">{emptyDests.join(', ')}</span>.
                                  <br />Quý khách vui lòng chọn điểm đến khác hoặc liên hệ nhân viên để được hỗ trợ.
                                </div>
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Ngày đi</label>
                    <div className="relative">
                      <input
                        type="date"
                        min={getMinDate()}
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full p-3 pl-9 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-sm outline-none"
                      />
                      <Calendar size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Giờ xuất phát</label>
                    <div className="relative">
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full p-3 pl-9 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-sm outline-none"
                      />
                      <Clock size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Duration & Pax */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Thời gian</label>
                    <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200">
                      <button onClick={() => handleDurationChange(-1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-gray-600 hover:text-blue-600">-</button>
                      <span className="flex-1 text-center font-bold text-sm">{formData.duration} Ngày</span>
                      <button onClick={() => handleDurationChange(1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-gray-600 hover:text-blue-600">+</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Số khách</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={formData.adults}
                        onKeyDown={(e) => ["-", "e", "E", "+"].includes(e.key) && e.preventDefault()}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData({ ...formData, adults: val === '' ? '' : Math.max(1, parseInt(val)) });
                        }}
                        onBlur={() => {
                          if (formData.adults === '') setFormData({ ...formData, adults: 1 });
                        }}
                        className="w-full p-3 pl-9 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                      />
                      <Users size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Transport */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Phương tiện di chuyển</label>
                  <div className="flex gap-2">
                    {['Oto', 'Máy bay', 'Tàu hỏa'].map(tech => (
                      <button
                        key={tech}
                        onClick={() => setFormData({ ...formData, transport: tech })}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${formData.transport === tech ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                  {(formData.transport === 'Máy bay' || formData.transport === 'Tàu hỏa') && (
                    <div className="mt-3 bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex gap-3 items-start">
                      <AlertTriangle className="text-orange-600 shrink-0" size={18} />
                      <p className="text-xs text-orange-800 leading-relaxed font-medium">
                        Lưu ý: Thời gian xuất phát và lịch trình có thể thay đổi phụ thuộc vào chuyến đi thực tế ({formData.transport}).
                      </p>
                    </div>
                  )}
                </div>

                {/* Self-Catering Option */}
                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isSelfCatering}
                        onChange={e => {
                          const isChecked = e.target.checked;
                          // If checked, clear all meals? Or just disable?
                          // Let's clear them to avoid confusion
                          setFormData(prev => {
                            const newConfigs = { ...prev.dayConfigs };
                            if (isChecked) {
                              Object.keys(newConfigs).forEach(key => {
                                if (newConfigs[Number(key)]) newConfigs[Number(key)].meals = [];
                              });
                            }
                            return { ...prev, isSelfCatering: isChecked, dayConfigs: isChecked ? newConfigs : prev.dayConfigs };
                          });
                        }}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 bg-white transition-all checked:border-green-600 checked:bg-green-600 hover:border-green-400"
                      />
                      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-green-700 transition">Tự túc ăn uống (Không cần đặt ăn)</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2 ml-8">
                    Quý khách sẽ tự lo chi phí ăn uống.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-dashed border-gray-200">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-600">Tổng chi phí vé tham quan</span>
                      <span className="text-xs text-gray-500 italic font-normal">(Chưa bao gồm ăn ở, đi lại)</span>
                    </div>
                    <span className="text-3xl font-black text-red-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalTicketPrice)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 text-right mb-4 italic">*Chi phí cuối cùng sẽ được nhân viên báo giá sau.</p>

                  <button
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition transform hover:-translate-y-0.5"
                  >
                    GỬI YÊU CẦU THIẾT KẾ
                  </button>
                  <p className="text-center text-xs text-blue-500 mt-3 hover:underline cursor-pointer" onClick={() => setShowTermsModal(true)}>Xem điều khoản & quy định</p>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Itinerary Grid - Spans 8 cols */}
          <div className="lg:col-span-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Chi tiết lịch trình ({formData.duration} ngày)</h2>
              <button onClick={() => handleDurationChange(1)} className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition flex items-center gap-2">
                <Plus size={16} /> Thêm ngày
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {Array.from({ length: formData.duration }).map((_, idx) => {
                const day = idx + 1;
                const dayConfig = formData.dayConfigs[day] || { meals: [], note: '' };
                const locations = formData.selectedLocations[day] || [];
                const isFree = dayConfig.isFree;

                return (
                  <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Day Header */}
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-lg text-sm">Ngày {day}</span>
                        {!isFree && <span className="text-sm text-gray-500 font-medium">{locations.length} điểm đến</span>}
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Free Day Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!isFree}
                            onChange={(e) => {
                              updateDayConfig(day, 'isFree', e.target.checked);
                            }}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                          />
                          <span className="text-sm font-bold text-purple-700">Tự do hoạt động</span>
                        </label>

                        {/* Meal Selection - Hide if Free or Self-Catering */}
                        {!isFree && (
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${formData.isSelfCatering ? 'bg-gray-100 border-transparent opacity-60 cursor-not-allowed' : 'bg-white border-gray-200'}`}>
                            <span className="text-xs font-bold text-gray-500 mr-1">Ăn:</span>
                            {formData.isSelfCatering ? (
                              <span className="text-xs font-bold text-gray-400 italic">Khách tự túc</span>
                            ) : (
                              ['Sáng', 'Trưa', 'Tối'].map(meal => (
                                <label key={meal} className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                  <input
                                    type="checkbox"
                                    checked={dayConfig.meals?.includes(meal)}
                                    onChange={() => toggleMeal(day, meal)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-xs font-medium text-gray-700">{meal}</span>
                                </label>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5">
                      {isFree ? (
                        <div className="py-8 text-center bg-purple-50 rounded-xl border border-dashed border-purple-200">
                          <h4 className="text-purple-800 font-bold text-lg mb-2">Ngày Tự Do</h4>
                          <p className="text-sm text-purple-600">
                            Quý khách vui lòng tự túc phương tiện di chuyển và tham quan trong ngày này.
                            <br />Vui lòng nhập ghi chú nếu cần hỗ trợ đặc biệt.
                          </p>
                        </div>
                      ) : (
                        /* Locations List */
                        <div className="mb-4 space-y-3">
                          {locations.length > 0 ? (
                            locations.map((loc, lIdx) => (
                              <div key={`${day}-${loc.diaDiemId}-${lIdx}`} className="flex items-center gap-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl group hover:border-blue-300 transition">
                                <img src={loc.hinhAnh} className="w-16 h-16 rounded-lg object-cover bg-gray-200 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-800 text-sm truncate">{loc.tenDiaDiem}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-blue-600 font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(loc.giaVe || 0)}</span>
                                    <span className="text-xs text-gray-500">•</span>
                                    <span className="text-xs text-gray-500">Dự kiến: <span className="font-bold text-gray-700">{loc.visitTime || '2 tiếng'}</span></span>
                                  </div>
                                </div>
                                <button onClick={() => removeLocation(day, loc.diaDiemId)} className="p-2 text-gray-400 hover:text-red-500 transition"><X size={18} /></button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                              <p className="text-gray-400 text-sm mb-2">Chưa có điểm đến cho ngày này</p>
                              <button onClick={() => { openAddLocationModal(day); }} className="text-blue-600 text-sm font-bold hover:underline">+ Thêm địa điểm</button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Bar for Day */}
                      <div className="flex gap-4 items-start mt-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Ghi chú cho ngày này (ví dụ: Mang theo áo ấm, Tập trung sảnh khách sạn...)"
                            value={dayConfig.note || ''}
                            onChange={(e) => updateDayConfig(day, 'note', e.target.value)}
                            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-300"
                          />
                        </div>
                        {/* Only show Add button if NOT free */}
                        {!isFree && locations.length > 0 && (
                          <button
                            onClick={() => { openAddLocationModal(day); }}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow shadow-blue-200 transition shrink-0"
                          >
                            + Thêm Điểm
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Add Location Modal */}
      {
        showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Chọn địa điểm cho <span className="text-blue-600">Ngày {targetDayForAdd}</span></h3>
                <button onClick={() => setShowConfirmModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {filteredLocations.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredLocations.map(loc => {
                      const isSelected = tempSelectedLocations.find(t => t.diaDiemId === loc.diaDiemId);

                      // Backtracking Logic Check
                      // 1. Identify which "Phase" (Destination) this location belongs to
                      // 1. Identify "Phase"
                      const getDestIndex = (l: DiaDiem) => {
                        const addr = (l.diaChiCuThe || '').toLowerCase();
                        return formData.destinations.findIndex(d => addr.includes(d.toLowerCase()));
                      };
                      const locDestIdx = getDestIndex(loc);

                      // 2. Uniqueness Check (Global)
                      const isUsedElsewhere = Object.values(formData.selectedLocations).flat().some(l => l.diaDiemId === loc.diaDiemId);

                      // 3. Logic Divider
                      let isDisabled = false;
                      let disabledReason = "";

                      if (isUsedElsewhere) {
                        isDisabled = true;
                        disabledReason = "Địa điểm này đã được chọn.";
                      } else {
                        // Max 3 Check
                        const currentDayTotal = (formData.selectedLocations[targetDayForAdd] || []).length + tempSelectedLocations.length;
                        const isLimit3Reached = currentDayTotal >= 3;
                        const isAlreadySelectedInTemp = tempSelectedLocations.some(t => t.diaDiemId === loc.diaDiemId);

                        if (isLimit3Reached && !isAlreadySelectedInTemp) {
                          isDisabled = true;
                          disabledReason = "Mỗi ngày chỉ được chọn tối đa 3 địa điểm.";
                        } else {
                          // Sequence Check
                          const currentDaySaved = formData.selectedLocations[targetDayForAdd] || [];
                          const currentDayAll = [...currentDaySaved, ...tempSelectedLocations];
                          const lastLoc = currentDayAll[currentDayAll.length - 1];
                          const lastLocIdx = lastLoc ? getDestIndex(lastLoc) : -1;

                          if (targetDayForAdd === 1) {
                            // --- DAY 1 RULES ---
                            // Rule A: Must pick Dest 1 before Dest 2
                            const hasDest1 = currentDayAll.some(l => getDestIndex(l) === 0);

                            if (locDestIdx === 1 && !hasDest1) {
                              isDisabled = true;
                              disabledReason = "Vui lòng chọn điểm tham quan ở Điểm đến 1 trước.";
                            }

                            // Rule B: If Last was Dest 2, Block Dest 1... UNLESS Dest 2 is Full
                            if (locDestIdx === 0 && lastLocIdx === 1) {
                              const allDest2 = availableLocations.filter(l => getDestIndex(l) === 1);
                              // Global used count of Dest 2
                              const uniqueUsedIds = new Set(Object.values(formData.selectedLocations).flat().map(l => l.diaDiemId));
                              tempSelectedLocations.forEach(l => uniqueUsedIds.add(l.diaDiemId));

                              const usedDest2Count = allDest2.filter(l => uniqueUsedIds.has(l.diaDiemId)).length;
                              const isDest2Full = usedDest2Count >= allDest2.length;

                              if (!isDest2Full) {
                                isDisabled = true;
                                disabledReason = "Không thể quay lại Điểm đến 1 khi chưa tham quan hết Điểm đến 2.";
                              }
                            }
                          } else {
                            // --- DAY 2+ RULES ---
                            // If Last is 1, Block 2 (Strict One Way 2->1 allowed, 1->2 blocked)
                            if (lastLocIdx === 0 && locDestIdx === 1) {
                              isDisabled = true;
                              disabledReason = "Không thể chọn Điểm đến 2 sau khi đã chọn Điểm đến 1.";
                            }
                            // Note: 2->1 is allowed.
                          }
                        }
                      }

                      return (
                        <div
                          key={loc.diaDiemId}
                          onClick={() => !isDisabled && toggleLocationSelection(loc)}
                          className={`cursor-pointer group bg-white border-2 rounded-xl overflow-hidden hover:shadow-lg transition relative ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : isDisabled ? 'opacity-50 grayscale cursor-not-allowed border-gray-100' : 'border-transparent'}`}
                          title={disabledReason}
                        >
                          <div className="h-32 bg-gray-200 relative">
                            <img src={loc.hinhAnh} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                            {isSelected && <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-md"><Plus size={14} className="rotate-45" /></div>}
                            {isDisabled && <div className="absolute inset-0 bg-gray-200/50 flex items-center justify-center"><span className="text-xs font-bold bg-white/90 px-2 py-1 rounded text-gray-600 text-center mx-2">{disabledReason}</span></div>}
                          </div>
                          <div className="p-3">
                            <div className="font-bold text-gray-800 text-sm line-clamp-1 mb-1">{loc.tenDiaDiem}</div>
                            <div className="text-xs text-gray-500 mb-2 line-clamp-1 flex items-center gap-1"><MapPin size={10} /> {loc.diaChiCuThe}</div>
                            <div className="flex justify-between items-end">
                              <div>
                                <div className="text-xs text-blue-600 font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(loc.giaVe || 0)}</div>
                                <div className="text-sm text-gray-600 font-bold mt-1">⏱ {loc.thoiGianThamQuanDuKien ? `${loc.thoiGianThamQuanDuKien} tiếng` : "2 tiếng"}</div>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <MapPin size={48} className="mb-2 opacity-20" />
                    <p>Không tìm thấy địa điểm nào phù hợp với các điểm đến "{formData.destinations.join(' - ')}".</p>
                    <p className="text-sm">Vui lòng thử chọn điểm đến khác hoặc liên hệ hỗ trợ.</p>
                  </div>
                )}
              </div>

              {/* Footer with Multi Selection */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700">Đã chọn:</span>
                      <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">{tempSelectedLocations.length} địa điểm</span>
                    </div>
                    {tempSelectedLocations.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {tempSelectedLocations.map(l => l.tenDiaDiem).join(", ")}
                      </div>
                    )}
                  </div>

                  <button
                    disabled={tempSelectedLocations.length === 0}
                    onClick={confirmAddLocations}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-200 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Thêm {tempSelectedLocations.length > 0 ? tempSelectedLocations.length : ''} Địa Điểm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Terms Modal - Shows on entry */}
      {
        showTermsModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden max-h-[85vh] flex flex-col">
              <div className="bg-blue-600 p-5 text-white text-center shrink-0">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                  <Info size={24} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-wide">Quy định thiết kế Tour</h3>
              </div>
              <div className="p-6 space-y-4 text-gray-600 text-sm leading-relaxed overflow-y-auto custom-scrollbar text-justify pr-2">
                <p><strong className="text-gray-900">1. Giá tiền tham khảo:</strong> Giá hiển thị trên hệ thống là tổng giá vé tham quan (dự kiến). Quý khách lưu ý: Báo giá này <strong>chưa bao gồm</strong> chi phí di chuyển, ăn uống và lưu trú (sẽ được nhân viên tư vấn tính toán và báo giá chi tiết sau).</p>
                <p><strong className="text-gray-900">2. Phương tiện di chuyển:</strong> Với các tour có di chuyển bằng <strong>máy bay hoặc tàu hỏa</strong>, giờ khởi hành và lịch trình có thể thay đổi tùy thuộc vào tình trạng chuyến đi thực tế của hãng vận chuyển.</p>
                <p><strong className="text-gray-900">3. Thời gian phản hồi:</strong> Yêu cầu của quý khách sẽ được xử lý trong vòng 24h làm việc. Vui lòng để ý điện thoại để nhân viên tư vấn liên hệ.</p>
                <p><strong className="text-gray-900">4. Thời gian đặt trước:</strong> Để đảm bảo chất lượng dịch vụ tốt nhất và có thời gian sắp xếp lịch trình phù hợp, quý khách vui lòng đặt tour trước ngày khởi hành ít nhất 7-10 ngày.</p>
                <p><strong className="text-gray-900">5. Thời gian tham quan:</strong> Thời gian tham quan mỗi địa điểm được hiển thị mặc định theo lịch trình tối ưu. Nếu quý khách muốn thay đổi (tham quan lâu hơn), vui lòng ghi rõ vào phần "Ghi chú" của ngày tương ứng.</p>
                <p><strong className="text-gray-900">6. Dịch vụ ăn uống:</strong> Các bữa ăn sẽ được sắp xếp tại các nhà hàng địa phương uy tín và được thông báo cụ thể khi nhân viên liên hệ tư vấn. Quý khách hoàn toàn có thể lựa chọn <strong>tự túc ăn uống</strong> nếu muốn tự do khám phá ẩm thực.</p>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button onClick={() => setShowTermsModal(false)} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition">
                  Đã hiểu & Tiếp tục
                </button>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
};

export default CustomTour;