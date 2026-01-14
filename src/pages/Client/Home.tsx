import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLocalDateStr } from '../../utils/dateUtils';
import { ShieldCheck, HeartHandshake, Phone, BadgePercent, Search, MapPin, Calendar, Clock } from 'lucide-react';
import { useTours } from '../../hooks/useTours';
import TourCard from '../../components/common/TourCard';

const domesticDestinations = [
  "Hà Nội", "Hạ Long", "Sapa", "Ninh Bình", "Hà Giang", "Cao Bằng",
  "Đà Nẵng", "Hội An", "Nha Trang", "Quy Nhơn", "Đà Lạt", "Buôn Mê Thuột",
  "Phú Quốc", "Côn Đảo", "Cần Thơ", "Miền Tây", "Vũng Tàu", "Phan Thiết"
];

const internationalDestinations = [
  "Thái Lan", "Singapore", "Malaysia", "Indonesia", "Lào", "Campuchia",
  "Trung Quốc", "Hồng Kông", "Đài Loan", "Hàn Quốc", "Nhật Bản", "Ấn Độ",
  "Dubai", "Châu Âu", "Úc", "Mỹ", "Bắc Âu", "Nam Phi"
];

const supportItems = [
  { icon: <BadgePercent size={24} />, text: "GIÁ TỐT NHẤT", desc: "Cam kết giá rẻ nhất thị trường" },
  { icon: <ShieldCheck size={24} />, text: "DỊCH VỤ UY TÍN", desc: "Đảm bảo chất lượng dịch vụ" },
  { icon: <HeartHandshake size={24} />, text: "HỖ TRỢ TẬN TÂM", desc: "Tư vấn nhiệt tình 24/7" },
  { icon: <Phone size={24} />, text: "HOTLINE 1900 1234", desc: "Giải đáp mọi thắc mắc" },
];

const Home = () => {
  const { tours, loading, error } = useTours();
  const navigate = useNavigate();
  const [searchTab, setSearchTab] = useState<'Trong Nước' | 'Nước Ngoài'>('Trong Nước');
  const [destination, setDestination] = useState('');
  const [departurePoint, setDeparturePoint] = useState('');
  const [departureDate, setDepartureDate] = useState('');

  // Drag to scroll hook
  const useDraggableScroll = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const onMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      const slider = e.currentTarget as HTMLElement;
      setStartX(e.pageX - slider.offsetLeft);
      setScrollLeft(slider.scrollLeft);
      slider.style.cursor = 'grabbing';
      slider.style.userSelect = 'none'; // Prevent text selection
    };

    const stopDragging = (e: React.MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);
        const slider = e.currentTarget as HTMLElement;
        slider.style.cursor = 'grab';
        slider.style.removeProperty('user-select');
      }
    };

    const onMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const slider = e.currentTarget as HTMLElement;
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1; // Natural 1:1 scroll speed
      slider.scrollLeft = scrollLeft - walk;
    };

    return { events: { onMouseDown, onMouseLeave: stopDragging, onMouseUp: stopDragging, onMouseMove }, style: { cursor: 'grab' as const } };
  };

  const draggable = useDraggableScroll();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.append('search', destination.trim());
    params.append('type', searchTab);
    if (departurePoint) params.append('from', departurePoint);
    if (departureDate) params.append('date', departureDate);

    navigate(`/tours?${params.toString()}`);
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải tour...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  // Get all domestic tours
  const domesticTours = tours.filter(t =>
    t.daDuyet && !t.isTuChon && t.loaiTour && t.loaiTour.includes('Trong Nước')
  );

  // Get Asia tours
  // Pre-filter valid international tours to avoid repetition
  const validIntlTours = tours.filter(t => t.daDuyet && !t.isTuChon && t.loaiTour?.includes('Nước Ngoài'));

  // Get Asia tours
  const asiaTours = validIntlTours.filter(t => {
    const kv = (t.khuVuc || '').toLowerCase();
    return kv.includes('chau a') || kv.includes('châu á') || kv.includes('asia');
  });

  // Get other continent tours
  const otherTours = validIntlTours.filter(t => {
    const kv = (t.khuVuc || '').toLowerCase();
    return !(kv.includes('chau a') || kv.includes('châu á') || kv.includes('asia'));
  });

  // Get Last Minute Tours (within 3 days from Tomorrow)
  const lastMinuteTours = tours.filter(t => {
    if (!t.daDuyet || t.isTuChon) return false;
    if (!t.ngayKhoiHanh || !Array.isArray(t.ngayKhoiHanh)) return false;

    // Robust String Comparison

    // Tomorrow String
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getLocalDateStr(tomorrow);

    // End Date (Tomorrow + 3 days)
    const endDate = new Date(tomorrow);
    endDate.setDate(endDate.getDate() + 3);
    const endDateStr = getLocalDateStr(endDate);

    // Check if ANY departure date is within [tomorrow, tomorrow+3]
    return t.ngayKhoiHanh.some(d => {
      const dStr = new Date(d).toISOString().split('T')[0];
      return dStr >= tomorrowStr && dStr <= endDateStr;
    });
  });

  return (
    <div className="bg-gray-50 pb-20">
      {/* Hero Banner with Search */}
      <section className="relative h-[600px] mb-20 md:mb-0">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80"
            alt="Travel Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          {/* Search Widget Container */}
          <div className="w-full max-w-5xl">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => { setSearchTab('Trong Nước'); setDestination(''); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-lg transition-colors ${searchTab === 'Trong Nước' ? 'bg-white text-blue-900' : 'bg-black/50 text-white hover:bg-black/70'} `}
                type="button"
              >
                <div className="bg-blue-600 rounded-full p-1"><Search size={16} className="text-white" /></div>
                Tour TRONG NƯỚC
              </button>
              <button
                onClick={() => { setSearchTab('Nước Ngoài'); setDestination(''); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-lg transition-colors ${searchTab === 'Nước Ngoài' ? 'bg-white text-blue-900' : 'bg-black/50 text-white hover:bg-black/70'} `}
                type="button"
              >
                <div className="bg-blue-600 rounded-full p-1"><Search size={16} className="text-white" /></div>
                Tour NƯỚC NGOÀI
              </button>
            </div>

            {/* Search Form Panel */}
            <div className="bg-white rounded-b-lg rounded-tr-lg shadow-xl p-6">
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Destination */}
                <div className="space-y-2">
                  <label className="font-bold text-gray-800">Điểm đến</label>
                  <div className="relative border border-gray-300 rounded-md bg-white">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                    <select
                      className="w-full pl-10 pr-4 py-2.5 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-transparent"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    >
                      <option value="">Tất cả điểm đến</option>
                      {(searchTab === 'Trong Nước' ? domesticDestinations : internationalDestinations).map(dest => (
                        <option key={dest} value={dest}>{dest}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Departure Point */}
                <div className="space-y-2">
                  <label className="font-bold text-gray-800">Nơi khởi hành</label>
                  <div className="relative border border-gray-300 rounded-md bg-white">
                    <MapPin className="absolute right-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                    <select
                      className="w-full pl-4 pr-10 py-2.5 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-transparent"
                      value={departurePoint}
                      onChange={(e) => setDeparturePoint(e.target.value)}
                    >
                      <option value="">Tất cả nơi khởi hành</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="font-bold text-gray-800">Ngày khởi hành</label>
                  <div className="relative border border-gray-300 rounded-md bg-white">
                    <Calendar className="absolute right-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="date"
                      className="w-full pl-4 pr-10 py-2.5 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div>
                  <button type="submit" className="w-full bg-[#D42295] hover:bg-[#b01c7c] text-white font-bold py-2.5 rounded-md shadow-lg flex items-center justify-center gap-2 transition text-lg uppercase h-[46px]">
                    <Search className="w-5 h-5" />
                    <span>TÌM KIẾM</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Support Bar (Overlapping) */}
        <div className="container mx-auto px-4 absolute -bottom-16 left-0 right-0 z-10 hidden md:block">
          <div className="bg-white rounded-xl shadow-lg grid grid-cols-4 divide-x divide-gray-100 overflow-hidden">
            {supportItems.map((item, idx) => (
              <div key={idx} className="p-6 flex items-center gap-4 hover:bg-blue-50 transition cursor-pointer justify-center">
                <div className="text-blue-600 bg-blue-100 p-3 rounded-full shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm md:text-base">{item.text}</h4>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spacer for Support bar overlap */}
      <div className="hidden md:block h-24"></div>

      {/* Last Minute Tours Section */}
      {lastMinuteTours.length > 0 && (
        <section className="py-12 bg-red-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl font-black text-red-600 uppercase flex items-center gap-3 animate-pulse">
                <Clock size={32} /> TOUR GIỜ CHÓT
              </h2>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">Sắp khởi hành</span>
            </div>

            <div className="flex overflow-x-auto gap-6 pb-6 custom-scrollbar scroll-smooth snap-x snap-mandatory">
              {lastMinuteTours.map(tour => (
                <div key={tour.tourId} className="w-[280px] md:w-[320px] shrink-0 snap-start">
                  <TourCard tour={tour} variant="vertical" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Domestic Tours - Horizontal Scroll - APPLIED DRAGGABLE HERE */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-black text-blue-900 uppercase">
                DU LỊCH <span className="text-blue-600">TRONG NƯỚC</span>
              </h2>
            </div>
            <Link to="/tours?type=TrongNuoc" className="text-blue-600 hover:text-blue-800 font-bold text-sm md:text-base uppercase flex items-center gap-2 group">
              Xem tất cả
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {domesticTours.length > 0 ? (
            <div
              className="flex overflow-x-auto gap-6 pb-6 custom-scrollbar scroll-smooth snap-x snap-mandatory"
              {...draggable.events}
              style={draggable.style}
            >
              {domesticTours.map(tour => (
                <div key={tour.tourId} className="w-[280px] md:w-[320px] shrink-0 snap-start select-none">
                  <TourCard tour={tour} variant="vertical" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500 italic">Đang cập nhật các tour trong nước hấp dẫn...</p>
            </div>
          )}
        </div>
      </section>

      {/* Asia Tours */}
      <section className="py-12 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-black text-blue-900 uppercase">
                DU LỊCH <span className="text-orange-600">CHÂU Á</span>
              </h2>
              <div className="h-1 bg-gray-200 flex-1 hidden md:block"></div>
            </div>
            <Link to="/tours?type=Nước Ngoài&region=Châu Á" className="text-blue-600 hover:text-blue-800 font-bold text-sm md:text-base uppercase flex items-center gap-2 group whitespace-nowrap">
              Xem tất cả
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {asiaTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {asiaTours.map((tour) => (
                <TourCard key={tour.tourId} tour={tour} variant="vertical" />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 italic">Hiện tại chưa có tour Châu Á nào.</p>
            </div>
          )}
        </div>
      </section>

      {/* Other Continents */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-3xl font-black text-blue-900 uppercase">
                DU LỊCH <span className="text-purple-600">CHÂU ÂU - ÚC - MỸ - PHI</span>
              </h2>
              <div className="h-1 bg-gray-200 flex-1 hidden md:block"></div>
            </div>
            <Link to="/tours?type=Nước Ngoài&region=Châu Âu" className="text-blue-600 hover:text-blue-800 font-bold text-sm md:text-base uppercase flex items-center gap-2 group whitespace-nowrap ml-4">
              Xem tất cả
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {otherTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {otherTours.map((tour) => (
                <TourCard key={tour.tourId} tour={tour} variant="vertical" />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-gray-500 italic">Các tour Châu Âu, Úc, Mỹ, Phi đang được cập nhật. Vui lòng quay lại sau!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;