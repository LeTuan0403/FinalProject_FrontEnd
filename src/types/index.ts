// src/types/index.ts

export interface NguoiDung {
  userId: number;
  hoTen: string;
  email: string;
  soDienThoai?: string;
  diaChi?: string;
  isAdmin: boolean;
  hanCheThanhToan?: boolean;
}

export interface DiaDiem {
  diaDiemId: number;
  tenDiaDiem: string;
  moTa?: string;
  hinhAnh?: string; // URL hình ảnh
  giaVe: number;
  diaChiCuThe?: string;
  thoiGianThamQuanDuKien?: number; // Backend: double?
}

export interface Tour_ChiTiet {
  id?: number;
  tourChiTietId?: number; // Likely backend PK
  tourId?: number;
  diaDiemId: number;
  thuTu: number;
  ngayThu: number;
  thoiGian?: string; // Giờ cụ thể trong ngày (vd: "08:00")
  ghiChu?: string;
  tieuDe?: string; // [NEW] Matching backend
  hinhAnh?: string; // [NEW] Matching backend
  diaDiem?: DiaDiem;
}

export interface Tour {
  tourId: number;
  maTour?: string; // Code from DB
  tenTour: string;
  moTa?: string;
  hinhAnhBia?: string;
  tongGiaDuKien: number;
  thoiGian?: string; // Duration string (e.g. "3 ngày")
  isTuChon: boolean;
  phuongTien?: string;
  diemKhoiHanh?: string; // Tên backend: DiemKhoiHanh
  tenDiaDiem?: string; // Main destination for Custom Tours
  tourChiTiets: Tour_ChiTiet[];
  lichTrinh?: any[]; // [NEW] Matching MongoDB
  daDuyet: boolean;
  khuVuc?: string; // Backend: string containing region
  loaiTour?: string; // Backend: string containing type
  nguoiTaoId?: number;

  // New fields for comprehensive editing
  anSang?: number;
  anTrua?: number;
  anToi?: number;
  soLuongCho?: number; // [NEW]
  ngayKhoiHanh?: string[]; // [UPDATED] - Array of ISO Date strings
  dichVuBaoGom?: string;
  dichVuKhongBaoGom?: string;
  chinhSachTour?: string; // DB: ChinhSachTour
  diemNhan?: string;

  // Additional DB fields
  ngayTao?: string;
  diemDanhGia?: number;

  // Dynamic Seat Availability
  availability?: {
    date: string;
    bookedSeats: number;
    remainingSeats: number;
  }[];
}

export interface DonDatTour {
  donDatId: number;
  tourId: number;
  userId: number;
  ngayKhoiHanh: string;
  soLuongNguoi: number;
  soLuongNguoiLon?: number;
  soLuongTreEm?: number;
  ghiChu?: string;
  nguoiLienHe?: string;
  emailLienHe?: string;
  sdtLienHe?: string;
  tongTienThanhToan: number;
  trangThai: string;
  ngayDat?: string;
  tour?: Tour;
  user?: NguoiDung; // Navigation property if included
}

// ... existing code ...
export interface LoginResponse {
  token: string;
  hoTen: string;
  role: string;
  userId: number;
  email?: string;
  soDienThoai?: string;
  diaChi?: string;
  hanCheThanhToan?: boolean; // Added
}

export interface Review {
  danhGiaId?: number;
  tourId: number;
  userId: number;
  soSao: number;
  binhLuan: string;
  ngayDanhGia?: string;
  traLoi?: string;
  ngayTraLoi?: string;
  nguoiDung?: NguoiDung;
  tour?: Tour;
  isAnonymous?: boolean;
  media?: { type: 'image' | 'video'; url: string; }[];
  likes?: string[]; // Array of User IDs
  replies?: {
    _id?: string; // Mongoose Subdoc ID
    userId: NguoiDung | string;
    content: string;
    createdAt: string;
    isAnonymous?: boolean;
    media?: { type: 'image' | 'video'; url: string; }[];
    likes?: string[];
  }[];
}