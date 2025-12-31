import { useEffect, useState } from 'react';
import { diaDiemService } from '../../services/tourService';
import type { DiaDiem } from '../../types';

const Gallery = () => {
  const [locations, setLocations] = useState<DiaDiem[]>([]);

  useEffect(() => {
    diaDiemService.getAll().then(res => setLocations(res.data));
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Thư viện hình ảnh</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {locations.map(loc => (
          <div key={loc.diaDiemId} className="relative group overflow-hidden rounded-lg shadow-lg">
            <img 
              src={loc.hinhAnh || "https://via.placeholder.com/400x300"} 
              alt={loc.tenDiaDiem} 
              className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
              <h3 className="font-bold">{loc.tenDiaDiem}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;