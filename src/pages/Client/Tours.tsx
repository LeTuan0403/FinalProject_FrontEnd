import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { useTours } from '../../hooks/useTours';
import TourCard from '../../components/common/TourCard';
import type { Tour } from '../../types';

const Tours = () => {
  const { tours, loading, error } = useTours();
  const [searchParams] = useSearchParams();
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);

  // Filter States
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [durationRange, setDurationRange] = useState<string>('all');
  const [transport, setTransport] = useState<string>('all'); // New: Transport
  const [sortBy, setSortBy] = useState<string>('default'); // New: Sort
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [startDate, setStartDate] = useState<string>(''); // New: Start Date

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const region = searchParams.get('region');
    const date = searchParams.get('date');

    if (search) setSearchTerm(search);
    if (type) setSelectedType(type);
    if (region) setSelectedRegion(region);
    if (date) setStartDate(date);
  }, [searchParams]);

  useEffect(() => {
    // Filter: Approved AND Not Custom (Standard Tours only)
    let result = tours.filter(t => t.daDuyet && !t.isTuChon);

    // Filter by Type (Domestic/International)
    if (selectedType !== 'all') {
      if (selectedType === 'Trong Nước') {
        result = result.filter(t => t.loaiTour && t.loaiTour.includes('Trong Nước'));
      } else {
        result = result.filter(t => t.loaiTour && t.loaiTour.includes('Nước Ngoài'));
      }
    }

    // Filter by Region / Continent
    if (selectedRegion !== 'all') {
      result = result.filter(t => {
        if (!t.khuVuc) return false;
        // Strict match or substring match if DB data is slightly messy but contains the key
        const kv = t.khuVuc.toLowerCase();
        const selected = selectedRegion.toLowerCase();

        return kv.includes(selected);
      });
    }

    // Filter by Date
    if (startDate) {
      result = result.filter(t => {
        if (!t.ngayKhoiHanh || !Array.isArray(t.ngayKhoiHanh)) return false;
        // Check if any available date MATCHES the selected start date EXACTLY
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
        if (durationRange === '1-3') return days <= 3;
        if (durationRange === '4-7') return days >= 4 && days <= 7;
        if (durationRange === 'over7') return days > 7;
        return true;
      });
    }

    // Filter by Price
    if (priceRange !== 'all') {
      if (priceRange === 'under5') {
        result = result.filter(t => t.tongGiaDuKien < 5000000);
      } else if (priceRange === '5to10') {
        result = result.filter(t => t.tongGiaDuKien >= 5000000 && t.tongGiaDuKien <= 10000000);
      } else if (priceRange === 'over10') {
        result = result.filter(t => t.tongGiaDuKien > 10000000);
      }
    }

    // Filter by Transport
    if (transport !== 'all') {
      result = result.filter(t => t.phuongTien && t.phuongTien.toLowerCase().includes(transport.toLowerCase()));
    }

    // Filter by Search Term
    if (searchTerm) {
      result = result.filter(t => t.tenTour.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Sorting
    if (sortBy !== 'default') {
      // Create a copy to sort
      result = [...result].sort((a, b) => {
        const getDuration = (t: Tour) => {
          // 1. Try detailed schedule (lichTrinh or tourChiTiets)
          const schedule = t.lichTrinh || t.tourChiTiets;
          if (schedule && schedule.length > 0) {
            const maxDay = Math.max(...schedule.map((d: any) => d.ngayThu || 0));
            if (maxDay > 1) return maxDay;
          }
          // 2. Parse string (fallback)
          if (t.thoiGian) {
            const match = t.thoiGian.match(/(\d+)\s*(ngày|ngay|n)/i); // Matches "3 ngày", "3N", "3 Ngay"
            if (match) return parseInt(match[1]);
          }
          return 1;
        };

        const durationA = getDuration(a);
        const durationB = getDuration(b);

        switch (sortBy) {
          case 'price-asc': return a.tongGiaDuKien - b.tongGiaDuKien;
          case 'price-desc': return b.tongGiaDuKien - a.tongGiaDuKien;
          case 'duration-asc': return durationA - durationB;
          case 'duration-desc': return durationB - durationA;
          default: return 0;
        }
      });
    }

    setFilteredTours([...result]);
  }, [selectedRegion, priceRange, searchTerm, selectedType, durationRange, transport, sortBy, startDate, tours]);

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải danh sách tour...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

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

            {/* FILTER GROUP: TYPE (Domestic / International) */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Loại Tour</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedType('all'); setSelectedRegion('all'); }}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${selectedType === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => { setSelectedType('Trong Nước'); setSelectedRegion('all'); }}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${selectedType === 'Trong Nước' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Trong nước
                </button>
                <button
                  onClick={() => { setSelectedType('Nước Ngoài'); setSelectedRegion('all'); }}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${selectedType === 'Nước Ngoài' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Nước ngoài
                </button>
              </div>
            </div>

            {/* FILTER GROUP: REGION / CONTINENT */}
            {(selectedType !== 'all') && (
              <div className="mb-6 transition-all duration-300">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {selectedType === 'Trong Nước' ? 'Khu vực (Việt Nam)' : 'Châu Lục'}
                </label>
                <div className="space-y-2 pl-1">
                  {(selectedType === 'Trong Nước' ? [
                    { value: 'all', label: 'Tất cả' },
                    { value: 'Miền Bắc', label: 'Miền Bắc' },
                    { value: 'Miền Trung', label: 'Miền Trung' },
                    { value: 'Miền Nam', label: 'Miền Nam' }
                  ] : [
                    { value: 'all', label: 'Tất cả' },
                    { value: 'Châu Á', label: 'Châu Á' },
                    { value: 'Châu Âu', label: 'Châu Âu' },
                    { value: 'Châu Mỹ', label: 'Châu Mỹ' },
                    { value: 'Châu Úc', label: 'Châu Úc' },
                    { value: 'Châu Phi', label: 'Châu Phi' }
                  ]).map(opt => (
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
                </div>
              </div>
            )}

            {/* FILTER GROUP: DURATION */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Thời gian</label>
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
            </div>

            {/* FILTER GROUP: TRANSPORT (New) */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phương tiện</label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'Xe du lịch', label: 'Xe du lịch' },
                  { value: 'Máy bay', label: 'Máy bay' },
                  { value: 'Tàu hỏa', label: 'Tàu hỏa' }
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="transport"
                      value={opt.value}
                      checked={transport === opt.value}
                      onChange={(e) => setTransport(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-600 text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Khoảng giá</label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'under5', label: 'Dưới 5 triệu' },
                  { value: '5to10', label: 'Từ 5 - 10 triệu' },
                  { value: 'over10', label: 'Trên 10 triệu' }
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      value={opt.value}
                      checked={priceRange === opt.value}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-600 text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* TOUR LIST */}
        <div className="w-full lg:w-3/4">
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
                  onClick={() => { setSelectedRegion('all'); setPriceRange('all'); setSearchTerm(''); setTransport('all'); setSortBy('default'); setStartDate(''); }}
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