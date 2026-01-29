import { useState, useEffect } from 'react';
import type { LoginResponse } from '../types';
import { AuthContext } from './authContext';
import { toast } from 'react-hot-toast';

export interface AuthContextType {
  user: LoginResponse | null;
  login: (data: LoginResponse) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial auth state from localStorage on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const hoTen = localStorage.getItem('hoTen');
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    const soDienThoai = localStorage.getItem('soDienThoai');
    const diaChi = localStorage.getItem('diaChi');
    const avatar = localStorage.getItem('avatar');
    const hanCheThanhToan = localStorage.getItem('hanCheThanhToan') === 'true';

    if (token && hoTen && role) {
      setUser({
        token,
        hoTen,
        role,
        userId: (userId && !isNaN(Number(userId)) && userId.length < 10) ? Number(userId) : userId || 0, // Preserve string ID if ObjectId
        email: email || undefined,
        soDienThoai: soDienThoai || undefined,
        diaChi: diaChi || undefined,
        avatar: avatar || undefined,
        hanCheThanhToan
      });
    }

    setIsLoading(false);
  }, []);

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return {};
    }
  };

  // eslint-disable-next-line complexity, @typescript-eslint/no-explicit-any
  const login = (data: LoginResponse | Record<string, unknown> | any) => {
    // Handle potential attribute name mismatches from backend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = data.token || data.Token || (data.result as any)?.token;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hoTen = data.hoTen || data.HoTen || data.fullName || data.FullName || (data.result as any)?.hoTen;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = data.role || data.Role || (data.result as any)?.role;
    const email = data.email || data.user?.email || data.result?.email;
    const soDienThoai = data.soDienThoai || data.user?.soDienThoai || data.result?.soDienThoai;
    const diaChi = data.diaChi || data.user?.diaChi || data.result?.diaChi;
    const avatar = data.avatar || data.user?.avatar || data.result?.avatar;
    const hanCheThanhToan = data.hanCheThanhToan || data.user?.hanCheThanhToan || false;

    // 1. Try to get ID from response body
    let rawId = data.userId || data.UserId || data.userID || data.id || data.Id ||
      data.user?.id || data.user?.userId ||
      data.User?.Id || data.User?.UserId || data.User?.id || data.User?.userId ||
      data.result?.userId || data.result?.id ||
      data.data?.userId || data.data?.id || 0;

    // 2. If not found in body, try to extract from Token
    if (!rawId && token) {
      const decoded = parseJwt(token);
      // Common claims for User ID: nameid, sub, or custom fields
      rawId = decoded.nameid || decoded.sub || decoded.UserId || decoded.userId || decoded.id || decoded.UserID || 0;
    }

    const userId = rawId; // Keep as string or number

    if (!userId || userId === 0 || userId === '0') {
      toast.error("Cảnh báo: Không tìm thấy ID người dùng. Vui lòng liên hệ hỗ trợ hoặc thử lại.");
    }

    localStorage.setItem('token', token);
    localStorage.setItem('hoTen', hoTen);
    localStorage.setItem('role', role);
    localStorage.setItem('userId', String(userId));
    if (email) { localStorage.setItem('email', email); }
    if (soDienThoai) { localStorage.setItem('soDienThoai', soDienThoai); }
    if (diaChi) { localStorage.setItem('diaChi', diaChi); }
    if (avatar) { localStorage.setItem('avatar', avatar); }
    if (hanCheThanhToan) { localStorage.setItem('hanCheThanhToan', 'true'); }
    else { localStorage.removeItem('hanCheThanhToan'); }

    // Update state
    setUser({
      token,
      hoTen,
      role,
      userId,
      email,
      soDienThoai,
      diaChi,
      avatar,
      hanCheThanhToan
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('hoTen');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('soDienThoai');
    localStorage.removeItem('diaChi');
    localStorage.removeItem('avatar');
    localStorage.removeItem('hanCheThanhToan');

    // Clear Chat Session
    localStorage.removeItem('chat_conversation_id');
    localStorage.removeItem('chat_guest_id');

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
