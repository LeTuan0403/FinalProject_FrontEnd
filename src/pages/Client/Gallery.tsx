import { useEffect, useState } from 'react';
import { diaDiemService } from '../../services/tourService';
import type { DiaDiem } from '../../types';
import { MapPin } from 'lucide-react';

const Gallery = () => {
  const [locations, setLocations] = useState<DiaDiem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    diaDiemService.getAll()
      .then(res => {
        // Filter out locations without images
        const validLocations = res.data.filter((loc: DiaDiem) => loc.hinhAnh && loc.hinhAnh.trim() !== '');
        setLocations(validLocations);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getCityFromLocation = (loc: DiaDiem): string => {
    const text = `${loc.tenDiaDiem} ${loc.diaChiCuThe || ''}`.toLowerCase();

    const cityMappings = [
      { keywords: ['hà nội'], city: 'Hà Nội' },
      { keywords: ['hạ long', 'quảng ninh', 'bãi cháy'], city: 'Hạ Long' },
      { keywords: ['sapa', 'lào cai', 'fansipan'], city: 'Sapa' },
      { keywords: ['ninh bình', 'tràng an', 'tam cốc'], city: 'Ninh Bình' },
      { keywords: ['hà giang', 'đồng văn', 'mã pí lèng'], city: 'Hà Giang' },
      { keywords: ['cao bằng', 'bản giốc'], city: 'Cao Bằng' },
      { keywords: ['mộc châu', 'sơn la'], city: 'Mộc Châu' },
      { keywords: ['mai châu', 'hòa bình'], city: 'Hòa Bình' },
      { keywords: ['hải phòng', 'cát bà', 'đồ sơn'], city: 'Hải Phòng' },
      { keywords: ['bắc kạn', 'ba bể'], city: 'Bắc Kạn' },
      { keywords: ['huế', 'thừa thiên'], city: 'Huế' },
      { keywords: ['đà nẵng', 'bà nà'], city: 'Đà Nẵng' },
      { keywords: ['hội an', 'quảng nam', 'mỹ sơn'], city: 'Hội An' },
      { keywords: ['phong nha', 'quảng bình', 'thiên đường'], city: 'Quảng Bình' },
      { keywords: ['nha trang', 'khánh hòa', 'cam ranh'], city: 'Nha Trang' },
      { keywords: ['quy nhơn', 'bình định'], city: 'Quy Nhơn' },
      { keywords: ['phú yên', 'tuy hòa'], city: 'Phú Yên' },
      { keywords: ['đà lạt', 'lâm đồng'], city: 'Đà Lạt' },
      { keywords: ['phan thiết', 'mũi né', 'bình thuận'], city: 'Phan Thiết' },
      { keywords: ['buôn ma thuột', 'đắk lắk'], city: 'Buôn Ma Thuột' },
      { keywords: ['kon tum', 'măng đen'], city: 'Kon Tum' },
      { keywords: ['hồ chí minh', 'sài gòn'], city: 'TP. Hồ Chí Minh' },
      { keywords: ['vũng tàu', 'bà rịa'], city: 'Vũng Tàu' },
      { keywords: ['phú quốc', 'kiên giang'], city: 'Phú Quốc' },
      { keywords: ['cần thơ', 'ninh kiều'], city: 'Cần Thơ' },
      { keywords: ['côn đảo'], city: 'Côn Đảo' },
      { keywords: ['bến tre'], city: 'Bến Tre' },
      { keywords: ['tiền giang', 'mỹ tho'], city: 'Tiền Giang' },
      { keywords: ['cà mau'], city: 'Cà Mau' },
      { keywords: ['tây ninh', 'bà đen'], city: 'Tây Ninh' }
    ];

    for (const mapping of cityMappings) {
      if (mapping.keywords.some(k => text.includes(k))) {
        return mapping.city;
      }
    }

    return 'Địa điểm khác';
  };

  // Group locations
  const groupedLocations = locations.reduce((acc, loc) => {
    const city = getCityFromLocation(loc);
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(loc);
    return acc;
  }, {} as Record<string, DiaDiem[]>);

  // Sort cities (prioritize big cities)
  const priorityCities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hạ Long', 'Sapa', 'Đà Lạt', 'Nha Trang', 'Phú Quốc', 'Hội An', 'Huế'];
  const sortedCities = Object.keys(groupedLocations).sort((a, b) => {
    const idxA = priorityCities.indexOf(a);
    const idxB = priorityCities.indexOf(b);
    if (idxA !== -1 && idxB !== -1) { return idxA - idxB; }
    if (idxA !== -1) { return -1; }
    if (idxB !== -1) { return 1; }
    return a.localeCompare(b);
  });

  if (loading) { return <div className="text-center py-20 text-gray-500">Đang tải hình ảnh...</div>; }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-blue-900 mb-2">Thư Viện Hình Ảnh</h1>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Khám phá vẻ đẹp Việt Nam qua những điểm đến hấp dẫn được chúng tôi tuyển chọn.
      </p>

      <div className="space-y-16">
        {sortedCities.map(city => (
          <div key={city} className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-2">
              <MapPin className="text-blue-600" size={28} />
              <h2 className="text-2xl font-bold text-gray-800">{city}</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {groupedLocations[city].length} địa điểm
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {groupedLocations[city].map(loc => (
                <div key={loc.diaDiemId} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-xl shadow-md aspect-[4/3] mb-3">
                    <img
                      src={loc.hinhAnh || "https://placehold.co/400x300"}
                      alt={loc.tenDiaDiem}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      {loc.giaVe > 0 && (
                        <span className="text-white text-sm font-medium">
                          Vé: {loc.giaVe.toLocaleString()}đ
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1" title={loc.tenDiaDiem}>
                    {loc.tenDiaDiem}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-1" title={loc.diaChiCuThe}>
                    {loc.diaChiCuThe || city}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="text-center text-gray-500 py-10">Chưa có dữ liệu địa điểm.</div>
        )}
      </div>
    </div>
  );
};

export default Gallery;