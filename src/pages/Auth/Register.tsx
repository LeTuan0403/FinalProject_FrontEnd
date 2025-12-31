
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { User, Mail, Phone, Lock, MapPin, Calendar, AlertCircle, ArrowLeft } from 'lucide-react';

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // Multi-step improvement for complex form in small space

  // Theo dõi giá trị mật khẩu để so sánh với xác nhận mật khẩu
  const password = watch("matKhau");

  const onSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    setServerError('');

    // Xử lý dữ liệu trước khi gửi (nếu cần)
    // Loại bỏ confirmMatKhau vì API không cần
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmMatKhau, ...registerData } = data;

    try {
      await authService.register(registerData as Record<string, string | number>);
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate('/login');
    } catch (err) {
      const error = err as { response?: { data?: unknown } };
      let message: string;
      if (error?.response?.data) {
        message = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
      } else {
        message = "Đăng ký thất bại. Vui lòng thử lại.";
      }
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center font-sans py-10">
      <div
        className="relative w-full max-w-6xl h-[700px] bg-cover bg-center rounded-3xl shadow-2xl overflow-hidden"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1515266591878-5a14080dd8d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2600&q=80')" }}
      >
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-center p-6 gap-8">

          {/* LEFT: Nav to Login */}
          <div className="hidden md:flex flex-col items-center justify-center w-1/3 text-white space-y-6">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 text-center shadow-xl">
              <h2 className="text-3xl font-bold mb-4">Đã có tài khoản?</h2>
              <p className="text-gray-200 mb-8 font-light">
                Đăng nhập để tiếp tục quản lý các chuyến đi của bạn.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3 rounded-full border-2 border-white text-white font-semibold hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              >
                Đăng Nhập
              </button>
            </div>
          </div>

          {/* RIGHT: Register Form */}
          <div className="w-full md:w-2/3 h-full flex items-center">
            <div className="w-full h-[90%] backdrop-blur-xl bg-black/60 rounded-3xl border border-white/10 shadow-2xl overflow-y-auto custom-scrollbar p-6 md:p-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white tracking-wide">Tạo Tài Khoản</h2>
                <span className="text-white/50 text-sm italic">Cùng khám phá thế giới</span>
              </div>

              {serverError && (
                <div className="mb-6 bg-red-500/20 border border-red-500/50 p-3 rounded-xl flex items-center gap-3">
                  <AlertCircle className="text-red-400 shrink-0" size={18} />
                  <p className="text-red-200 text-sm">{serverError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {/* Grid Layout for Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Họ và tên</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                      <input
                        {...register("hoTen", { required: "Họ tên là bắt buộc" })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all placeholder-gray-500"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    {errors.hoTen && <p className="text-red-400 text-xs ml-1">{errors.hoTen.message as string}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Số điện thoại</label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                      <input
                        {...register("soDienThoai", {
                          required: "Bắt buộc",
                          pattern: { value: /(84|0[3|5|7|8|9])+([0-9]{8})\b/, message: "SĐT không hợp lệ" }
                        })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all placeholder-gray-500"
                        placeholder="0912..."
                      />
                    </div>
                    {errors.soDienThoai && <p className="text-red-400 text-xs ml-1">{errors.soDienThoai.message as string}</p>}
                  </div>

                  {/* Email - Full Width */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                      <input
                        type="email"
                        {...register("email", { required: "Email là bắt buộc" })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all placeholder-gray-500"
                        placeholder="email@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message as string}</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Mật khẩu</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                      <input
                        type="password"
                        {...register("matKhau", {
                          required: "Bắt buộc",
                          minLength: { value: 8, message: "Min 8 ký tự" },
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                            message: "Cần Hoa, thường, số, ký tự đặc biệt"
                          }
                        })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all placeholder-gray-500"
                        placeholder="********"
                      />
                    </div>
                    {errors.matKhau && <p className="text-red-400 text-xs ml-1">{errors.matKhau.message as string}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Xác nhận MK</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                      <input
                        type="password"
                        {...register("confirmMatKhau", {
                          required: "Bắt buộc",
                          validate: (val) => val === password || "Không khớp"
                        })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all placeholder-gray-500"
                        placeholder="********"
                      />
                    </div>
                    {errors.confirmMatKhau && <p className="text-red-400 text-xs ml-1">{errors.confirmMatKhau.message as string}</p>}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Ngày sinh</label>
                    <div className="relative group">
                      <Calendar className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                      <input
                        type="date"
                        {...register("ngaySinh")}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all placeholder-gray-500 [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Tỉnh / Thành phố</label>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                      <input
                        {...register("tinhThanh")}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all placeholder-gray-500"
                        placeholder="Hà Nội"
                      />
                    </div>
                  </div>

                  {/* District */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Quận / Huyện</label>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                      <input
                        {...register("quanHuyen")}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all placeholder-gray-500"
                        placeholder="Cầu Giấy"
                      />
                    </div>
                  </div>

                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Đang tạo tài khoản...' : 'ĐĂNG KÝ NGAY'}
                  </button>
                </div>

                <div className="md:hidden mt-4 text-center">
                  <p className="text-gray-400 text-sm">
                    Đã có tài khoản? <Link to="/login" className="text-blue-400 font-bold hover:underline">Đăng nhập</Link>
                  </p>
                </div>

              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;
