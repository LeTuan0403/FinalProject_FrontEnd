import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

const VerifyAccount = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const emailParam = searchParams.get('email');
        const codeParam = searchParams.get('code');

        if (emailParam) {
            setEmail(emailParam);
        }

        if (emailParam && codeParam) {
            setOtp(codeParam);
            verify(emailParam, codeParam);
        }
    }, [searchParams]);

    const verify = async (emailToVerify: string, codeToVerify: string) => {
        setStatus('verifying');
        setIsLoading(true);
        try {
            const res = await authService.verifyAccount(emailToVerify, codeToVerify);
            setStatus('success');

            // Auto login
            login(res.data);

            setTimeout(() => {
                if (res.data.role === 'Admin') navigate('/');
                else navigate('/');
            }, 1500);
        } catch (err) {
            setStatus('error');
            const error = err as { response?: { data?: unknown } };
            let msg: string;
            if (error?.response?.data) {
                // @ts-ignore
                msg = error.response.data.msg || "Xác thực thất bại.";
            } else {
                msg = "Xác thực thất bại. Vui lòng thử lại.";
            }
            setMessage(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        verify(email, otp);
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] font-sans">
            <div className="w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl border border-gray-100">

                {status === 'success' ? (
                    <div className="text-center py-8">
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4 animate-bounce" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác thực thành công!</h2>
                        <p className="text-gray-600">Đang đăng nhập vào hệ thống...</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">Xác Thực Tài Khoản</h2>
                            <p className="text-gray-500">
                                {status === 'verifying'
                                    ? 'Đang kiểm tra mã xác thực...'
                                    : `Vui lòng nhập mã OTP đã được gửi đến ${email}`
                                }
                            </p>
                        </div>

                        {status === 'error' && (
                            <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
                                <AlertCircle className="text-red-500 shrink-0" size={20} />
                                <p className="text-red-600 text-sm font-medium">{message}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Hidden Email Input if manually typing */}
                            {!searchParams.get('email') && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600 uppercase tracking-wide">Email của bạn</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                                        placeholder="email@example.com"
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 uppercase tracking-wide">Mã OTP</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full text-center tracking-[1em] text-2xl font-bold py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder-gray-300"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || otp.length !== 6 || !email}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    'XÁC NHẬN NGAY'
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyAccount;
