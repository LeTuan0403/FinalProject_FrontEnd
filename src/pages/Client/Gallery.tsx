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

    // Northern Vietnam
    if (text.includes('hà nội')) { return 'Hà Nội'; }
    if (text.includes('hạ long') || text.includes('quảng ninh') || text.includes('bãi cháy')) { return 'Hạ Long'; }
    if (text.includes('sapa') || text.includes('lào cai') || text.includes('fansipan')) { return 'Sapa'; }
    if (text.includes('ninh bình') || text.includes('tràng an') || text.includes('tam cốc')) { return 'Ninh Bình'; }
    if (text.includes('hà giang') || text.includes('đồng văn') || text.includes('mã pí lèng')) { return 'Hà Giang'; }
    if (text.includes('cao bằng') || text.includes('bản giốc')) { return 'Cao Bằng'; }
    if (text.includes('mộc châu') || text.includes('sơn la')) { return 'Mộc Châu'; }
    if (text.includes('mai châu') || text.includes('hòa bình')) { return 'Hòa Bình'; }
    if (text.includes('hải phòng') || text.includes('cát bà') || text.includes('đồ sơn')) { return 'Hải Phòng'; }
    if (text.includes('bắc kạn') || text.includes('ba bể')) { return 'Bắc Kạn'; }

    // Central Vietnam
    if (text.includes('huế') || text.includes('thừa thiên')) { return 'Huế'; }
    if (text.includes('đà nẵng') || text.includes('bà nà')) { return 'Đà Nẵng'; }
    if (text.includes('hội an') || text.includes('quảng nam') || text.includes('mỹ sơn')) { return 'Hội An'; }
    if (text.includes('phong nha') || text.includes('quảng bình') || text.includes('thiên đường')) { return 'Quảng Bình'; }
    if (text.includes('nha trang') || text.includes('khánh hòa') || text.includes('cam ranh')) { return 'Nha Trang'; }
    if (text.includes('quy nhơn') || text.includes('bình định')) { return 'Quy Nhơn'; }
    if (text.includes('phú yên') || text.includes('tuy hòa')) { return 'Phú Yên'; }
    if (text.includes('đà lạt') || text.includes('lâm đồng')) { return 'Đà Lạt'; }
    if (text.includes('phan thiết') || text.includes('mũi né') || text.includes('bình thuận')) { return 'Phan Thiết'; }
    if (text.includes('buôn ma thuột') || text.includes('đắk lắk')) { return 'Buôn Ma Thuột'; }
    if (text.includes('kon tum') || text.includes('măng đen')) { return 'Kon Tum'; }

    // Southern Vietnam
    if (text.includes('hồ chí minh') || text.includes('sài gòn')) { return 'TP. Hồ Chí Minh'; }
    if (text.includes('vũng tàu') || text.includes('bà rịa')) { return 'Vũng Tàu'; }
    if (text.includes('phú quốc') || text.includes('kiên giang')) { return 'Phú Quốc'; }
    if (text.includes('cần thơ') || text.includes('ninh kiều')) { return 'Cần Thơ'; }
    if (text.includes('côn đảo')) { return 'Côn Đảo'; }
    if (text.includes('bến tre')) { return 'Bến Tre'; }
    if (text.includes('tiền giang') || text.includes('mỹ tho')) { return 'Tiền Giang'; }
    if (text.includes('cà mau')) { return 'Cà Mau'; }
    if (text.includes('tây ninh') || text.includes('bà đen')) { return 'Tây Ninh'; }

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