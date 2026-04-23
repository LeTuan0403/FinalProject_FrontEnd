import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, Check } from 'lucide-react';
import { useTours } from '../../hooks/useTours';
import TourCard from '../../components/common/TourCard';
import type { Tour } from '../../types';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import DualRangeSlider from '../../components/common/DualRangeSlider';
import CollapsibleFilter from '../../components/common/CollapsibleFilter';

const Tours = () => {
  const { tours, loading, error } = useTours();
  const [searchParams] = useSearchParams();
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);

  // AI Assistant States
  const [aiRequirement, setAiRequirement] = useState('');
  const [aiFilteredIds, setAiFilteredIds] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  // Filter States
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  // NEW: Price Range (Min, Max) - Default 0 to 100M
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]);

  // NEW: Multi-select for Type
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const [durationRange, setDurationRange] = useState<string>('all');

  // NEW: Multi-select for Transport
  const [selectedTransports, setSelectedTransports] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState<string>('default');
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [startDate, setStartDate] = useState<string>('');
  const [isDiscountedOnly, setIsDiscountedOnly] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const region = searchParams.get('region');
    const date = searchParams.get('date');

    if (search) {
      setSearchTerm(search);
    }
    if (type) {
      setSelectedTypes([type]);
    }
    if (region) {
      setSelectedRegion(region);
    }
    if (date) {
      setStartDate(date);
    }
  }, [searchParams]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleTransport = (transport: string) => {
    setSelectedTransports(prev => {
      return prev.includes(transport) ? prev.filter(t => t !== transport) : [...prev, transport];
    });
  };
   
  useEffect(() => {
     
    // Filter: Approved AND Not Custom (Standard Tours only) AND Has Future Departures
    let result = tours.filter(t => {
      if (!t.daDuyet || t.isTuChon) {
        return false;
      }

      // Check for future dates
      if (!t.ngayKhoiHanh || !Array.isArray(t.ngayKhoiHanh) || t.ngayKhoiHanh.length === 0) {
        return false;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
      const hasFutureDate = t.ngayKhoiHanh.some(date => new Date(date) >= today);
      return hasFutureDate;
    });

    // Filter by Type (Domestic/International/Multi-select)
    if (selectedTypes.length > 0) {
      result = result.filter(t => {
        if (!t.loaiTour) {
          return false;
        }
        // Check if ANY selected type matches the tour's type
        return selectedTypes.some(type => t.loaiTour?.includes(type));
      });
    }

    // Filter by Region / Continent
    if (selectedRegion !== 'all') {
      result = result.filter(t => {
        if (!t.khuVuc) {
          return false;
        }
        const kv = t.khuVuc.toLowerCase();
        const selected = selectedRegion.toLowerCase();
        return kv.includes(selected);
      });
    }

    // Filter by Date
    if (startDate) {
      result = result.filter(t => {
        if (!t.ngayKhoiHanh || !Array.isArray(t.ngayKhoiHanh)) {
          return false;
        }
        return t.ngayKhoiHanh.some(d => {
          const tourDate = new Date(d).toISOString().split('T')[0];
          return tourDate === startDate;
        });
      });
    }

    // Filter by Duration
    if (durationRange !== 'all') {
      result = result.filter(t => {
        const days = t.tourChiTiets?.length
          ? Math.max(...t.tourChiTiets.map(d => d.ngayThu))
          : 1;
        if (durationRange === '1-3') {
          return days <= 3;
        }
        if (durationRange === '4-7') {
          return days >= 4 && days <= 7;
        }
        if (durationRange === 'over7') {
          return days > 7;
        }
        return true;
      });
    }

    // Filter by Price (Range Slider)
    result = result.filter(t => {
      const price = t.tongGiaDuKien || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Filter by Transport (Multi-select)
    if (selectedTransports.length > 0) {
      result = result.filter(t => {
        const vehicle = t.phuongTien?.toLowerCase() || '';
        return selectedTransports.some(st => {
          if (st === 'oto') {
            return vehicle.includes('ô tô') || vehicle.includes('oto') || vehicle.includes('limousine') || vehicle.includes('xe giường nằm') || vehicle.includes('xe du lịch');
          }
          return vehicle.includes(st.toLowerCase());
        });
      });
    }

    // Filter by Search Term
    if (searchTerm) {
      result = result.filter(t => t.tenTour.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filter by Discount
    if (isDiscountedOnly) {
      result = result.filter(t => t.discounts && t.discounts.length > 0);
    }

    // Sorting
    if (sortBy !== 'default') {
      result = [...result].sort((a, b) => {
        const getDuration = (t: Tour) => {
          const schedule = t.lichTrinh || t.tourChiTiets;
          if (schedule && schedule.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const maxDay = Math.max(...schedule.map((d: any) => d.ngayThu || 0));
            if (maxDay > 1) {
              return maxDay;
            }
          }
          if (t.thoiGian) {
            const match = t.thoiGian.match(/(\d+)\s*(ngày|ngay|n)/i);
            if (match) {
              return parseInt(match[1]);
            }
          }
          return 1;
        };

        const getMaxDiscount = (t: Tour) => {
          if (!t.discounts || t.discounts.length === 0) {
            return 0;
          }
          return Math.max(...t.discounts.map(d => d.percentage));
        };

        const durationA = getDuration(a);
        const durationB = getDuration(b);
        const discountA = getMaxDiscount(a);
        const discountB = getMaxDiscount(b);

        switch (sortBy) {
          case 'price-asc': return a.tongGiaDuKien - b.tongGiaDuKien;
          case 'price-desc': return b.tongGiaDuKien - a.tongGiaDuKien;
          case 'duration-asc': return durationA - durationB;
          case 'duration-desc': return durationB - durationA;
          case 'discount-desc': return discountB - discountA;
          default: return 0;
        }
      });
    }

    // Filter by AI Recommendations
    if (aiFilteredIds && aiFilteredIds.length > 0) {
      result = result.filter(t => aiFilteredIds.includes(String(t._id)) || aiFilteredIds.includes(String(t.tourId)));
    }

    setFilteredTours([...result]);
  }, [selectedRegion, priceRange, searchTerm, selectedTypes, durationRange, selectedTransports, sortBy, startDate, tours, isDiscountedOnly, aiFilteredIds]);

  const handleAIRecommend = async () => {
    if (!aiRequirement.trim()) {
      return;
    }

    setAiLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/tours/ai-recommend', { requirement: aiRequirement });

      const { tourIds, message } = res.data;
      if (tourIds && tourIds.length > 0) {
        setAiFilteredIds(tourIds);
        setAiMessage(message);
        toast.success("Đã tìm thấy các tour phù hợp!");
      } else {
        setAiFilteredIds(null);
        toast(message || "Không tìm thấy tour nào phù hợp với yêu cầu của bạn.", { icon: 'ℹ️' });
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi gọi trợ lý AI");
    } finally {
      setAiLoading(false);
    }
  };

  const clearAIFilter = () => {
    setAiFilteredIds(null);
    setAiMessage('');
    setAiRequirement('');
  };

  const formatCurrency = (val: number) => {
    return (val / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tr';
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Đang tải danh sách tour...</div>;
  }
  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/4 shrink-0">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-24 max-h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Filter className="text-blue-600" />
              <h3 className="font-bold text-xl text-gray-800">Bộ Lọc Tìm Kiếm</h3>
            </div>

            {/* Keyword Search */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Từ khóa</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm tên tour..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Date Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày khởi hành</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* FILTER GROUP: TYPE (Checkbox) */}
            <CollapsibleFilter title="Loại Tour">
              <div className="space-y-2">
                {['Trong Nước', 'Nước Ngoài'].map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${selectedTypes.includes(type) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white group-hover:border-blue-400'}`}>
                      {selectedTypes.includes(type) && <Check size={14} className="text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
                    />
                    <span className="text-sm text-gray-600 group-hover:text-blue-600 transition">{type}</span>
                  </label>
                ))}
              </div>
            </CollapsibleFilter>

            {/* FILTER GROUP: REGION / CONTINENT */}
            {selectedTypes.length > 0 && (
              <div className="mb-6 pl-2 border-l-2 border-gray-100">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                  Khu vực chi tiết
                </label>
                <div className="space-y-2">
                  {(selectedTypes.includes('Trong Nước') ? [
                    { value: 'Miền Bắc', label: 'Miền Bắc' },
                    { value: 'Miền Trung', label: 'Miền Trung' },
                    { value: 'Miền Nam', label: 'Miền Nam' }
                  ] : []).concat(selectedTypes.includes('Nước Ngoài') ? [
                    { value: 'Châu Á', label: 'Châu Á' },
                    { value: 'Châu Âu', label: 'Châu Âu' },
                    { value: 'Châu Mỹ', label: 'Châu Mỹ' },
                    { value: 'Châu Úc', label: 'Châu Úc' },
                    { value: 'Châu Phi', label: 'Châu Phi' }
                  ] : []).map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedRegion === opt.value ? 'border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                        {selectedRegion === opt.value && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      </div>
                      <input
                        type="radio"
                        name="region"
                        value={opt.value}
                        checked={selectedRegion === opt.value}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="hidden"
                      />
                      <span className={`text-sm ${selectedRegion === opt.value ? 'font-medium text-blue-700' : 'text-gray-600'}`}>{opt.label}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer group mt-2 pt-2 border-t border-gray-100">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedRegion === 'all' ? 'border-blue-600' : 'border-gray-300'}`}>
                      {selectedRegion === 'all' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                    <input type="radio" value="all" checked={selectedRegion === 'all'} onChange={() => setSelectedRegion('all')} className="hidden" />
                    <span className="text-sm text-gray-500">Tất cả khu vực</span>
                  </label>
                </div>
              </div>
            )}

            {/* FILTER GROUP: DURATION */}
            <CollapsibleFilter title="Thời gian">
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Tất cả' },
                  { value: '1-3', label: '1 - 3 ngày' },
                  { value: '4-7', label: '4 - 7 ngày' },
                  { value: 'over7', label: 'Trên 7 ngày' }
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="duration"
                      value={opt.value}
                      checked={durationRange === opt.value}
                      onChange={(e) => setDurationRange(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-600 text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </CollapsibleFilter>

            {/* FILTER GROUP: TRANSPORT (Multi-select) */}
            <CollapsibleFilter title="Phương tiện">
              <div className="space-y-2">
                {[
                  { value: 'oto', label: 'Ô tô' },
                  { value: 'Máy bay', label: 'Máy bay' },
                  { value: 'Tàu hỏa', label: 'Tàu hỏa' }
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${selectedTransports.includes(opt.value) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white group-hover:border-blue-400'}`}>
                      {selectedTransports.includes(opt.value) && <Check size={14} className="text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedTransports.includes(opt.value)}
                      onChange={() => toggleTransport(opt.value)}
                    />
                    <span className="text-sm text-gray-600 group-hover:text-blue-600 transition">{opt.label}</span>
                  </label>
                ))}
              </div>
            </CollapsibleFilter>

            {/* Price Filter (Slider) */}
            <CollapsibleFilter title="Khoảng giá">
              <div className="px-4 pb-2">
                <DualRangeSlider
                  min={0}
                  max={100000000}
                  step={500000}
                  initialValues={priceRange}
                  onChange={(vals) => setPriceRange(vals)}
                  formatLabel={formatCurrency}
                />
              </div>
            </CollapsibleFilter>

            {/* Discount Filter */}
            <div className="p-4 bg-red-50 rounded-lg border border-red-100 mb-6">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={isDiscountedOnly}
                    onChange={(e) => setIsDiscountedOnly(e.target.checked)}
                    className="peer w-5 h-5 cursor-pointer appearance-none rounded border border-red-300 shadow-sm checked:bg-red-500 checked:border-red-500 transition-all"
                  />
                  <Check size={14} className="absolute text-white hidden peer-checked:block pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <span className="font-bold text-red-600 text-sm">Chỉ hiện tour giảm giá</span>
              </label>
            </div>

          </div>
        </div>

        {/* TOUR LIST */}
        <div className="w-full lg:w-3/4">

          {/* AI ASSISTANT */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
              <svg width="300" height="300" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="currentColor" /></svg>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="grow">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  ✨ Trợ lý AI Gợi Ý Tour
                </h2>
                <p className="text-blue-100 mb-4">Nhập mong muốn của bạn (ví dụ: "Đi biển giá rẻ dưới 5 triệu", "Tour trăng mật Đà Lạt"...), AI sẽ tìm giúp bạn.</p>

                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Bạn muốn đi đâu? Ngân sách thế nào?..."
                    className="w-full pl-5 pr-14 py-3 rounded-xl text-gray-800 focus:ring-4 focus:ring-blue-400/50 outline-none shadow-lg"
                    value={aiRequirement}
                    onChange={(e) => setAiRequirement(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAIRecommend()}
                  />
                  <button
                    onClick={handleAIRecommend}
                    disabled={aiLoading}
                    className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-70"
                  >
                    {aiLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Search size={20} />}
                  </button>
                </div>

                {/* AI Feedback Message */}
                {aiMessage && (
                  <div className="mt-4 bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 inline-flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm">🤖 {aiMessage}</span>
                    <button onClick={clearAIFilter} className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs transition">
                      Xem lại tất cả
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Kết quả tìm kiếm ({filteredTours.length})</h2>

            {/* SORTING DROPDOWN */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600 font-medium">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="duration-asc">Thời gian: Ngắn đến Dài</option>
                <option value="duration-desc">Thời gian: Dài đến Ngắn</option>
                <option value="discount-desc">Giảm giá: Nhiều đến Ít</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {filteredTours.map(tour => (
              <TourCard key={tour.tourId} tour={tour} variant="horizontal" />
            ))}

            {!loading && filteredTours.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl text-gray-600 font-medium">Không tìm thấy tour phù hợp</p>
                <button
                  onClick={() => {
                    setSelectedRegion('all');
                    setPriceRange([0, 100000000]);
                    setSearchTerm('');
                    setSelectedTypes([]);
                    setSelectedTransports([]);
                    setSortBy('default');
                    setStartDate('');
                    setIsDiscountedOnly(false);
                  }}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tours;