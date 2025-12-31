import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Lock, Key, CheckCircle, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';

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
               rounded-lg px-10 py-3 text-sm outline-none transition-all focus:ring-2 placeholder:text-gray-400 text-gray-700`}
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
                   rounded-lg px-10 py-3 text-sm outline-none transition-all focus:ring-2 placeholder:text-gray-400 text-gray-700`}
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

const ResetPassword = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<{ email: string; token: string; newPassword: string; confirmPassword: string }>();
    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const onSubmit = async (data: { email: string; token: string; newPassword: string }) => {
        try {
            setError('');
            await authService.resetPassword({
                email: data.email,
                token: data.token,
                newPassword: data.newPassword
            });
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            const errorMessage = err?.response?.data?.message || err?.response?.data || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại token hoặc email.';
            setError(typeof errorMessage === 'string' ? errorMessage : 'Đặt lại mật khẩu thất bại.');
        }
    };

    const passwordVal = watch("newPassword");

    if (success) {
        return (
            <div className="flex justify-center items-center font-sans py-10 min-h-[calc(100vh-80px)]"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2621&q=80")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                <div className="w-full max-w-md p-8 rounded-[20px] shadow-2xl bg-white text-center animate-fade-in-up">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-teal-800 mb-2">Thành công!</h2>
                    <p className="text-gray-500 mb-8 text-sm">Mật khẩu của bạn đã được cập nhật thành công.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-all shadow-md shadow-teal-200"
                    >
                        Đăng nhập ngay
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center font-sans py-10 min-h-[calc(100vh-80px)]"
            style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2621&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>

            <div className="relative bg-white rounded-[20px] shadow-2xl overflow-hidden w-full max-w-md p-8 animate-fade-in-up">

                <div className="flex items-center mb-6">
                    <button
                        onClick={() => navigate('/forgot-password')}
                        className="flex items-center text-teal-600 hover:text-teal-800 transition-colors font-medium text-sm"
                    >
                        <ArrowLeft size={16} className="mr-1" /> Quay lại
                    </button>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-teal-800 mb-2">Đặt Lại Mật Khẩu</h2>
                    <p className="text-gray-500 text-sm">Nhập token và mật khẩu mới của bạn.</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 text-red-500 border border-red-100 p-3 rounded-lg text-xs flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    {/* Email Field */}
                    <div className="space-y-1">
                        <label className="text-gray-500 text-xs ml-1 font-semibold uppercase">Email xác nhận</label>
                        <InputField
                            icon={Lock}
                            register={register}
                            name="email"
                            rules={{ required: 'Vui lòng nhập Email' }}
                            placeholder="Nhập lại email của bạn"
                            error={errors.email}
                        />
                        {errors.email && <span className="text-xs text-red-500 pl-2">{errors.email.message}</span>}
                    </div>

                    {/* Token Field */}
                    <div className="space-y-1">
                        <label className="text-gray-500 text-xs ml-1 font-semibold uppercase">Mã Token</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-3 text-gray-400"><Key size={18} /></div>
                            <textarea
                                {...register('token', { required: 'Vui lòng nhập Token' })}
                                className="w-full bg-gray-50 border border-gray-200 focus:border-teal-500 focus:ring-teal-100 text-gray-700 rounded-lg pl-10 pr-3 py-3 text-sm outline-none transition-all focus:ring-2 placeholder:text-gray-400 font-mono h-20 resize-none"
                                placeholder="Dán mã token vào đây..."
                            />
                        </div>
                        {errors.token && <span className="text-xs text-red-500 pl-2">{errors.token.message}</span>}
                    </div>

                    {/* New Password Field */}
                    <div className="space-y-1">
                        <label className="text-gray-500 text-xs ml-1 font-semibold uppercase">Mật khẩu mới</label>
                        <PasswordInput
                            icon={Lock}
                            register={register}
                            name="newPassword"
                            rules={{
                                required: 'Vui lòng nhập mật khẩu mới',
                                minLength: { value: 8, message: "Mật khẩu phải ít nhất 8 ký tự" }
                            }}
                            placeholder="Mật khẩu mới (>= 8 ký tự)"
                            error={errors.newPassword}
                        />
                        {errors.newPassword && <span className="text-xs text-red-500 pl-2">{errors.newPassword.message}</span>}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-1">
                        <label className="text-gray-500 text-xs ml-1 font-semibold uppercase">Xác nhận mật khẩu</label>
                        <PasswordInput
                            icon={Lock}
                            register={register}
                            name="confirmPassword"
                            rules={{
                                validate: (val: string) => {
                                    if (!val) return "Vui lòng nhập lại mật khẩu";
                                    if (val !== passwordVal) return "Mật khẩu không khớp";
                                    return true;
                                }
                            }}
                            placeholder="Nhập lại mật khẩu mới"
                            error={errors.confirmPassword}
                        />
                        {errors.confirmPassword && <span className="text-xs text-red-500 pl-2">{errors.confirmPassword.message}</span>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-teal-600 text-white text-sm font-bold py-3 hover:bg-teal-700 transition shadow-md shadow-teal-200 mt-2"
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'ĐỔI MẬT KHẨU'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
