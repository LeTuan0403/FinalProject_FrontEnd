import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import { AlertCircle, User, Mail, Lock, Phone, MapPin, ChevronRight, Calendar, Eye, EyeOff } from 'lucide-react';

const AuthPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();

    // Login Form
    const {
        register: loginRegister,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors, isSubmitting: isLoginSubmitting }
    } = useForm();
    const [loginError, setLoginError] = useState('');

    // Register Form
    const {
        register: registerForm,
        handleSubmit: handleRegisterSubmit,
        watch: registerWatch,
        formState: { errors: registerErrors }
    } = useForm();
    const [registerError, setRegisterError] = useState('');
    const [isRegisterLoading, setIsRegisterLoading] = useState(false);
    const password = registerWatch("matKhau");

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (credentialResponse.credential) {
            try {
                const res = await authService.loginGoogle(credentialResponse.credential);
                login(res.data);
                if (res.data.role === 'Admin') navigate('/admin');
                else navigate('/');
            } catch (err: any) {
                console.error("Google Login Backend Error:", err);
                // Backend trả về 'msg', nhưng cũng check 'message' để an toàn
                const msg = err?.response?.data?.msg || err?.response?.data?.message || "Đăng nhập Google thất bại.";
                setLoginError(typeof msg === 'string' ? msg : JSON.stringify(msg));
            }
        }
    };

    const handleGoogleError = () => {
        setLoginError("Đăng nhập Google thất bại (Client-side).");
    };

    useEffect(() => {
        setIsSignUp(location.pathname === '/register');
    }, [location.pathname]);

    const toggleMode = async (mode: 'login' | 'register') => {
        if ((mode === 'register' && isSignUp) || (mode === 'login' && !isSignUp)) return;

        setIsAnimating(true);

        // 1. Text Exits & Overlay Expands
        // Wait for text to fully exit (fast exit)
        setTimeout(() => {
            if (mode === 'register') {
                navigate('/register');
                setIsSignUp(true);
            } else {
                navigate('/login');
                setIsSignUp(false);
            }

            // 2. Wait a bit then Shrink Overlay & Show New Text
            setTimeout(() => {
                setIsAnimating(false);
            }, 50);
        }, 500); // reduced from 800
    };

    const onLogin = async (data: any) => {
        try {
            setLoginError('');
            const res = await authService.login(data);
            login(res.data);
            if (res.data.role === 'Admin') navigate('/admin');
            else navigate('/');
        } catch (err: any) {
            // Backend trả về 'msg'
            setLoginError(err?.response?.data?.msg || err?.response?.data?.message || 'Đăng nhập thất bại.');
        }
    };

    const onRegister = async (data: any) => {
        setIsRegisterLoading(true);
        setRegisterError('');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirmMatKhau, tinhThanh, quanHuyen, ngaySinh, ...baseData } = data;

        const payload = {
            ...baseData,
            diaChi: [quanHuyen, tinhThanh].filter(Boolean).join(', '),
            ngaySinh: ngaySinh || undefined
        };

        try {
            await authService.register(payload);
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            toggleMode('login');
        } catch (err: any) {
            console.error(err);
            const msg = err?.response?.data?.msg || err?.response?.data?.message || err?.response?.data || "Đăng ký thất bại.";
            setRegisterError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setIsRegisterLoading(false);
        }
    };

    const InputField = ({ icon: Icon, register, name, rules, placeholder, type = "text", error }: any) => (
        <div className="relative w-full">
            <div className={`absolute left-3 top-2.5 transition-colors ${error ? 'text-red-400' : 'text-gray-400'}`}>
                <Icon size={18} />
            </div>
            <input
                {...register(name, rules)}
                type={type}
                placeholder={placeholder}
                className={`w-full bg-gray-50 border ${error ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-teal-500 focus:ring-teal-100'} 
                   rounded-lg px-10 py-2.5 text-sm outline-none transition-all focus:ring-2 placeholder:text-gray-400 text-gray-700`}
            />
        </div>
    );

    const PasswordInput = ({ icon: Icon, register, name, rules, placeholder, error }: any) => {
        const [showPassword, setShowPassword] = useState(false);
        return (
            <div className="relative w-full">
                <div className={`absolute left-3 top-2.5 transition-colors ${error ? 'text-red-400' : 'text-gray-400'}`}>
                    <Icon size={18} />
                </div>
                <input
                    {...register(name, rules)}
                    type={showPassword ? "text" : "password"}
                    placeholder={placeholder}
                    className={`w-full bg-gray-50 border ${error ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-teal-500 focus:ring-teal-100'} 
                       rounded-lg px-10 py-2.5 text-sm outline-none transition-all focus:ring-2 placeholder:text-gray-400 text-gray-700`}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-teal-600 transition-colors"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        );
    };

    return (
        <div className="relative flex justify-center items-center py-8 font-sans min-h-[calc(100vh-80px)]"
            style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2621&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>

            <div className="relative bg-white rounded-[20px] shadow-2xl overflow-hidden w-full max-w-[850px] min-h-[500px]" id="container">

                {/* LOGIN FORM - FIXED LEFT */}
                <div className={`absolute top-0 left-0 w-1/2 h-full transition-all duration-300 ${!isAnimating && !isSignUp ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <form onSubmit={handleLoginSubmit(onLogin)} className="h-full flex flex-col items-center justify-center px-8 text-center">
                        <h1 className="font-bold text-2xl mb-1 text-teal-800">Chào mừng trở lại!</h1>
                        <p className="text-gray-500 text-xs mb-6">Tiếp tục hành trình khám phá của bạn</p>

                        {loginError && (
                            <div className="w-full bg-red-50 text-red-500 text-xs p-2 rounded-lg mb-4 flex items-center justify-center gap-2 border border-red-100">
                                <AlertCircle size={14} /> {loginError}
                            </div>
                        )}

                        {/* Replace custom button with GoogleLogin component */}
                        <div className="w-full flex justify-center mb-4">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                type="standard"
                                theme="outline"
                                size="large"
                                text="signin_with"
                                shape="pill"
                                width="300" // Adjust to fit container
                            />
                        </div>

                        <div className="relative w-full mb-4">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-gray-400">Hoặc Email</span></div>
                        </div>

                        <div className="w-full space-y-3">
                            <InputField icon={Mail} register={loginRegister} name="email" rules={{ required: true }} type="email" placeholder="Email của bạn" error={loginErrors.email} />
                            <PasswordInput icon={Lock} register={loginRegister} name="matKhau" rules={{ required: true }} placeholder="Mật khẩu" error={loginErrors.matKhau} />
                        </div>

                        <div className="w-full flex justify-between items-center mt-3 text-xs">
                            <label className="flex items-center text-gray-500 hover:text-teal-700 cursor-pointer select-none">
                                <input type="checkbox" className="mr-2 accent-teal-600 rounded" {...loginRegister("rememberMe")} />
                                Lưu mật khẩu
                            </label>
                            <Link to="/forgot-password" className="text-teal-600 font-medium hover:text-teal-700 hover:underline z-20 relative">Quên mật khẩu?</Link>
                        </div>

                        <button type="submit" disabled={isLoginSubmitting} className="w-full rounded-lg bg-teal-600 text-white text-sm font-bold py-2.5 hover:bg-teal-700 transition shadow-md shadow-teal-200 group flex items-center justify-center gap-2">
                            {isLoginSubmitting ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                            {!isLoginSubmitting && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                </div>

                {/* REGISTER FORM - FIXED RIGHT */}
                <div className={`absolute top-0 right-0 w-1/2 h-full transition-all duration-300 ${!isAnimating && isSignUp ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <form onSubmit={handleRegisterSubmit(onRegister)} className="h-full flex flex-col items-center justify-center px-8 text-center bg-white overflow-y-auto custom-scrollbar py-6">
                        <h1 className="font-bold text-2xl mb-1 text-teal-800">Tạo Tài Khoản</h1>
                        <p className="text-gray-500 text-xs mb-4">Tham gia cộng đồng du lịch ngay</p>

                        <button type="button" className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition mb-3">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                            <span className="text-xs font-medium text-gray-600">Đăng ký với Google</span>
                        </button>

                        <div className="relative w-full mb-3">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-gray-400">Hoặc</span></div>
                        </div>

                        {registerError && <div className="w-full text-red-500 text-xs mb-3 bg-red-50 p-2 rounded border border-red-100">{registerError}</div>}

                        <div className="w-full grid grid-cols-2 gap-2.5 pb-2">
                            <div className="col-span-2"><InputField icon={User} register={registerForm} name="hoTen" rules={{ required: true }} placeholder="Họ và tên" error={registerErrors.hoTen} /></div>
                            <div className="col-span-2"><InputField icon={Mail} register={registerForm} name="email" rules={{ required: true }} type="email" placeholder="Email" error={registerErrors.email} /></div>
                            <div className="col-span-1"><InputField icon={Phone} register={registerForm} name="soDienThoai" rules={{ required: true }} placeholder="SĐT" error={registerErrors.soDienThoai} /></div>
                            <div className="col-span-1">
                                <div className="relative w-full">
                                    <div className="absolute left-3 top-2.5 text-gray-400"><Calendar size={18} /></div>
                                    <input {...registerForm("ngaySinh")} type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-gray-500" />
                                </div>
                            </div>
                            <div className="col-span-1"><InputField icon={MapPin} register={registerForm} name="tinhThanh" placeholder="Tỉnh/Thành" /></div>
                            <div className="col-span-1"><InputField icon={MapPin} register={registerForm} name="quanHuyen" placeholder="Quận/Huyện" /></div>
                            <div className="col-span-1"><PasswordInput icon={Lock} register={registerForm} name="matKhau" rules={{ required: true, minLength: 8 }} placeholder="Mật khẩu" error={registerErrors.matKhau} /></div>
                            <div className="col-span-1"><PasswordInput icon={Lock} register={registerForm} name="confirmMatKhau" rules={{ validate: (v: string) => v === password }} placeholder="Xác nhận" error={registerErrors.confirmMatKhau} /></div>
                        </div>

                        <button type="submit" disabled={isRegisterLoading} className="w-full rounded-lg bg-teal-600 text-white text-sm font-bold py-2.5 hover:bg-teal-700 transition shadow-md shadow-teal-200 mt-2">
                            {isRegisterLoading ? 'Đang xử lý...' : 'Đăng Ký Ngay'}
                        </button>
                    </form>
                </div>

                {/* ANIMATING OVERLAY */}
                <div
                    className="absolute top-0 h-full overflow-hidden transition-all duration-700 ease-in-out z-50 bg-teal-900"
                    style={{
                        left: isAnimating ? '0%' : (isSignUp ? '0%' : '50%'),
                        width: isAnimating ? '100%' : '50%',
                    }}
                >
                    <div className="absolute inset-0 w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2673&q=80")' }}>
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-900/95 to-blue-900/80 mix-blend-multiply"></div>
                    </div>

                    {/* OVERLAY CONTENT FOR LOGIN (Shown when toggling to Register) */}
                    <div
                        className={`absolute top-0 right-0 w-[425px] max-w-[50vw] h-full flex flex-col items-center justify-center p-10 text-center text-white transition-all duration-500 ease-in-out
                            ${(!isSignUp && !isAnimating) ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-[200px] pointer-events-none'}`}
                    >
                        <h1 className="font-bold text-3xl mb-4">Người dùng mới?</h1>
                        <p className="text-sm font-light mb-6 opacity-90">Đăng ký ngay để bắt đầu những chuyến đi tuyệt vời.</p>
                        <button className="rounded-full border-2 border-white/80 bg-transparent text-white text-xs font-bold py-2.5 px-10 uppercase tracking-widest hover:bg-white hover:text-teal-900 transition" onClick={() => toggleMode('register')}>Đăng Ký</button>
                    </div>

                    {/* OVERLAY CONTENT FOR REGISTER (Shown when toggling to Login) */}
                    <div
                        className={`absolute top-0 left-0 w-[425px] max-w-[50vw] h-full flex flex-col items-center justify-center p-10 text-center text-white transition-all duration-500 ease-in-out
                            ${(isSignUp && !isAnimating) ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-[200px] pointer-events-none'}`}
                    >
                        <h1 className="font-bold text-3xl mb-4">Đã có tài khoản?</h1>
                        <p className="text-sm font-light mb-6 opacity-90">Đăng nhập để đặt tour và quản lý chuyến đi của bạn.</p>
                        <button className="rounded-full border-2 border-white/80 bg-transparent text-white text-xs font-bold py-2.5 px-10 uppercase tracking-widest hover:bg-white hover:text-teal-900 transition" onClick={() => toggleMode('login')}>Đăng Nhập</button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AuthPage;
