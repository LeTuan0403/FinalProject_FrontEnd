import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { AxiosError } from 'axios';
import { authService } from '../../services/authService';
import InputField from '../../components/common/InputField';

const ForgotPassword = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');

    const onSubmit = async (data: { email: string }) => {
        try {
            setError('');
            setMessage('');
            setToken('');

            const res = await authService.forgotPassword(data.email);
            const responseData = res.data as { message: string };
            setMessage(responseData.message);
            setToken("CHECK_EMAIL"); // Dummy value to trigger success view

        } catch (err: unknown) {
            const error = err as AxiosError<{ message: string }>;
            const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng kiểm tra lại email.';
            setError(typeof errorMessage === 'string' ? errorMessage : 'Có lỗi xảy ra.');
        }
    };



    return (
        <div className="relative flex justify-center items-center py-8 font-sans min-h-[calc(100vh-80px)]"
            style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2621&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>

            <div className="relative bg-white rounded-[20px] shadow-2xl overflow-hidden w-full max-w-md p-8 animate-fade-in-up">

                <div className="flex items-center mb-6">
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center text-teal-600 hover:text-teal-800 transition-colors font-medium text-sm"
                    >
                        <ArrowLeft size={16} className="mr-1" /> Quay lại đăng nhập
                    </button>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-teal-800 mb-2">Quên Mật Khẩu?</h2>
                    <p className="text-gray-500 text-sm">Đừng lo lắng! Nhập email của bạn và chúng tôi sẽ gửi mã khôi phục mật khẩu.</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 text-red-500 border border-red-100 p-3 rounded-lg text-xs flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {token ? (
                    <div className="mb-6 bg-green-50 border border-green-100 p-4 rounded-xl text-center">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle size={24} />
                        </div>
                        <p className="text-green-700 font-medium mb-2">{message}</p>
                        <p className="text-xs text-gray-500 mb-4">Vui lòng kiểm tra hộp thư đến (và mục spam) để lấy mã xác nhận.</p>
                        <button
                            onClick={() => navigate('/reset-password')}
                            className="w-full rounded-lg bg-teal-600 text-white text-sm font-bold py-2.5 hover:bg-teal-700 transition shadow-md shadow-teal-200"
                        >
                            Đặt lại mật khẩu
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        <div className="space-y-1">
                            <InputField
                                icon={Mail}
                                register={register}
                                name="email"
                                rules={{
                                    required: 'Vui lòng nhập Email',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Email không hợp lệ"
                                    }
                                }}
                                placeholder="Nhập địa chỉ email của bạn"
                                error={errors.email}
                            />
                            {errors.email && <span className="text-xs text-red-500 pl-2">{errors.email.message}</span>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-lg bg-teal-600 text-white text-sm font-bold py-3 hover:bg-teal-700 transition shadow-md shadow-teal-200 flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? 'Đang gửi...' : <><Send size={16} /> Gửi yêu cầu</>}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
