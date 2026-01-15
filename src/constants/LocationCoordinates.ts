// src/constants/LocationCoordinates.ts

export const LOCATION_COORDINATES: Record<string, [number, number]> = {
  // North
  "Hà Nội": [21.0285, 105.8542],
  "Hanoi": [21.0285, 105.8542],
  "Sapa": [22.3364, 103.8438],
  "Lào Cai": [22.48, 103.97],
  "Hạ Long": [20.9599, 107.0425],
  "Halong": [20.9599, 107.0425],
  "Ninh Bình": [20.2597, 105.9845],
  "Hà Giang": [22.8233, 104.9839],
  "Cao Bằng": [22.6667, 106.25],
  "Mộc Châu": [20.8431, 104.6569],
  
  // Central
  "Đà Nẵng": [16.0544, 108.2022],
  "Da Nang": [16.0544, 108.2022],
  "Huế": [16.4637, 107.5909],
  "Hue": [16.4637, 107.5909],
  "Hội An": [15.8801, 108.338],
  "Hoi An": [15.8801, 108.338],
  "Nha Trang": [12.2388, 109.1967],
  "Quy Nhơn": [13.7830, 109.2197],
  "Đà Lạt": [11.9404, 108.4583],
  "Dalat": [11.9404, 108.4583],
  "Phan Thiết": [10.9289, 108.1030],
  "Mũi Né": [10.9333, 108.2833],
  "Quảng Bình": [17.4833, 106.6],
  "Phong Nha": [17.5833, 106.2833],

  // South
  "TP. Hồ Chí Minh": [10.8231, 106.6297],
  "Hồ Chí Minh": [10.8231, 106.6297],
  "TPHCM": [10.8231, 106.6297],
  "Sài Gòn": [10.8231, 106.6297],
  "Vũng Tàu": [10.3460, 107.0843],
  "Cần Thơ": [10.0452, 105.7469],
  "Phú Quốc": [10.2899, 103.9840],
  "Tiền Giang": [10.4333, 106.2667],
  "Bến Tre": [10.2333, 106.3833],
  "Cà Mau": [9.1769, 105.1500],
  "Côn Đảo": [8.6833, 106.6000],

  // International (Major) - Optional
  "Bangkok": [13.7563, 100.5018],
  "Singapore": [1.3521, 103.8198],
  "Seoul": [37.5665, 126.9780],
  "Tokyo": [35.6762, 139.6503],
  "Paris": [48.8566, 2.3522],
  "London": [51.5074, -0.1278]
};

export const normalizeLocationName = (name: string): string => {
  if (!name) {return "";}
  const n = name.trim();
  // Simple mapping handling
  if (n.includes("Hà Nội")) {return "Hà Nội";}
  if (n.includes("HCM") || n.includes("Hồ Chí Minh") || n.includes("Sài Gòn")) {return "TP. Hồ Chí Minh";}
  if (n.includes("Đà Nẵng")) {return "Đà Nẵng";}
  if (n.includes("Đà Lạt")) {return "Đà Lạt";}
  if (n.includes("Nha Trang")) {return "Nha Trang";}
  if (n.includes("Phú Quốc")) {return "Phú Quốc";}
  if (n.includes("Sapa")) {return "Sapa";}
  if (n.includes("Hạ Long")) {return "Hạ Long";}
  return n;
};
