import { Link } from 'react-router-dom';
import { Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import ZaloIcon from './icons/ZaloIcon';
import { MomoIcon, MBBankIcon, CashIcon } from './icons/PaymentIcons';

const Footer = () => {
  return (
    <footer className="bg-white text-gray-700 border-t border-gray-200 pt-12 pb-6">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-blue-900 font-bold mb-4 uppercase text-lg">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Trụ sở chính:</strong><br />
                  123 Nguyễn Hữu, Quận 1, TP. Hồ Chí Minh
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span><strong className="text-blue-900 text-lg">1900 1234</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span>info@travelbooking.vn</span>
              </li>
            </ul>

            <div className="mt-6">
              <h5 className="font-bold text-gray-800 mb-2">Chấp nhận thanh toán</h5>
              <div className="flex gap-2">
                <MomoIcon className="w-10 h-8" />
                <MBBankIcon className="w-10 h-8" />
                <CashIcon className="w-10 h-8" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-blue-900 font-bold mb-4 uppercase text-lg">Về chúng tôi</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-blue-600 transition">Giới thiệu</Link></li>
              <li><Link to="/tours" className="hover:text-blue-600 transition">Chính sách bảo mật</Link></li>
              <li><Link to="/custom-tour" className="hover:text-blue-600 transition">Điều khoản chung</Link></li>
              <li><Link to="/gallery" className="hover:text-blue-600 transition">Chính sách thanh toán</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600 transition">Liên hệ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-blue-900 font-bold mb-4 uppercase text-lg">Góc khách hàng</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-600 transition">Chính sách đặt tour</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Chính sách hoàn hủy</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Ý kiến khách hàng</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Phiếu góp ý</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-blue-900 font-bold mb-4 uppercase text-lg">Kết nối với chúng tôi</h4>
            <div className="flex gap-3 mb-6">
              <a href="https://www.facebook.com/le.tuan.10681/" target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition text-white">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@letuan0403" target="_blank" rel="noopener noreferrer" className="bg-red-600 hover:bg-red-700 p-2 rounded-full transition text-white">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="https://zalo.me/0967087527" target="_blank" rel="noopener noreferrer" className="bg-blue-500 hover:bg-blue-600 p-2 rounded-full transition text-white">
                <ZaloIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-500">
            Copyright © 2024 TravelBooking. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
