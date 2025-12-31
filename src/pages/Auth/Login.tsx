import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Facebook, Github, AlertCircle } from 'lucide-react';

const Login = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string; matKhau: string }>();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const onSubmit = async (data: { email: string; matKhau: string }) => {
    try {
      setError('');
      const res = await authService.login(data);
      login(res.data);
      if (res.data.role === 'Admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Đăng nhập thất bại.');
    }
  };

  return (
    <div className="flex justify-center items-center font-sans py-10">
      {/* Background Container with Image */}
      <div
        className="relative w-full max-w-5xl h-[600px] bg-cover bg-center rounded-3xl shadow-2xl overflow-hidden"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')" }} // Cyberpunk/Tech background
      >
        {/* Overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Glass Card Container - Split Layout */}
        <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-center p-6 md:p-12 gap-8">

          {/* LEFT SIDE: Welcome & Register (Glass Effect Stronger) */}
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center text-center text-white space-y-6 md:pr-8">
            <div className="backdrop-blur-md bg-white/10 p-8 rounded-3xl border border-white/20 shadow-lg w-full max-w-sm transform hover:scale-105 transition-transform duration-500">
              <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">Chào mừng bạn!</h1>
              <p className="text-gray-200 mb-6 font-light">
                Khám phá những địa điểm tuyệt vời cùng chúng tôi.
                <br />Hãy bắt đầu hành trình ngay hôm nay.
              </p>
              <div className="w-16 h-1 bg-white/50 rounded-full mx-auto mb-6"></div>
              <p className="text-sm text-gray-300 mb-4">Chưa có tài khoản?</p>
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3 rounded-full border-2 border-white text-white font-semibold hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              >
                Đăng Ký Ngay
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: Login Form (Glass Effect Lighter) */}
          <div className="w-full md:w-1/2 max-w-md">
            <div className="backdrop-blur-xl bg-black/60 p-8 rounded-3xl border border-white/10 shadow-2xl">
              <h2 className="text-3xl font-bold text-white text-center mb-8 tracking-wide">Đăng Nhập</h2>

              {error && (
                <div className="mb-6 bg-red-500/20 border border-red-500/50 p-3 rounded-xl flex items-center gap-3">
                  <AlertCircle className="text-red-400 shrink-0" size={18} />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-white transition-colors" size={20} />
                  <input
                    {...register('email', { required: 'Vui lòng nhập Email' })}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all"
                    placeholder="Username / Email"
                  />
                </div>
                {errors.email && <span className="text-xs text-red-400 pl-2 block">{errors.email.message}</span>}

                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-white transition-colors" size={20} />
                  <input
                    type="password"
                    {...register('matKhau', { required: 'Vui lòng nhập mật khẩu' })}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all"
                    placeholder="Password"
                  />
                </div>
                {errors.matKhau && <span className="text-xs text-red-400 pl-2 block">{errors.matKhau.message}</span>}

                <div className="flex justify-between items-center text-xs text-gray-400 px-1">
                  <label className="flex items-center cursor-pointer hover:text-white transition">
                    <input type="checkbox" className="mr-2 rounded bg-white/10 border-white/20" /> Ghi nhớ
                  </label>
                  <Link to="/forgot-password" className="hover:text-blue-400 transition hover:underline cursor-pointer relative z-20">Quên mật khẩu?</Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 mt-2"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
                </button>
              </form>

              <div className="mt-8">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-xs text-gray-500 uppercase">Hoặc đăng nhập với</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <div className="flex justify-center gap-4 mt-4">
                  <button className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 hover:scale-110 transition-all text-white"><span className="font-bold text-red-500">G</span></button>
                  <button className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 hover:scale-110 transition-all text-white"><Facebook size={20} className="text-blue-500" /></button>
                  <button className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 hover:scale-110 transition-all text-white"><Github size={20} /></button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div >
    </div >
  );
};

export default Login;