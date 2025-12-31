
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { contactService } from '../../services/contactService';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';

const Contact = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<{ hoTen: string; email: string; noiDung: string }>();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: { hoTen: string; email: string; noiDung: string }) => {
    try {
      setError('');
      await contactService.createContact(data);
      setSuccess(true);
      reset();

      // Auto hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      setError('Gửi tin nhắn thất bại. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-[20px] shadow-lg animate-fade-in-up my-10 border border-gray-100">
      <h2 className="text-3xl font-bold mb-2 text-center text-teal-800">Liên Hệ Chúng Tôi</h2>
      <p className="text-center text-gray-500 mb-8">Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn.</p>

      {success && (
        <div className="mb-6 bg-green-50 text-green-700 border border-green-200 p-4 rounded-lg flex items-center gap-3">
          <CheckCircle size={24} />
          <div>
            <p className="font-bold">Gửi thành công!</p>
            <p className="text-sm">Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-gray-700 mb-2 font-medium">Họ tên <span className="text-red-500">*</span></label>
          <input
            {...register("hoTen", { required: "Vui lòng nhập họ tên" })}
            type="text"
            className={`w-full border ${errors.hoTen ? 'border-red-300 focus:ring-red-100' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-100'} rounded-lg p-3 outline-none transition-all focus:ring-2`}
            placeholder="Nhập họ tên của bạn..."
          />
          {errors.hoTen && <p className="text-red-500 text-xs mt-1">{errors.hoTen.message}</p>}
        </div>

        <div>
          <label className="block text-gray-700 mb-2 font-medium">Email <span className="text-red-500">*</span></label>
          <input
            {...register("email", {
              required: "Vui lòng nhập email",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Email không hợp lệ"
              }
            })}
            type="email"
            className={`w-full border ${errors.email ? 'border-red-300 focus:ring-red-100' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-100'} rounded-lg p-3 outline-none transition-all focus:ring-2`}
            placeholder="Nhập email..."
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-gray-700 mb-2 font-medium">Nội dung <span className="text-red-500">*</span></label>
          <textarea
            {...register("noiDung", { required: "Vui lòng nhập nội dung cần hỗ trợ" })}
            className={`w-full border ${errors.noiDung ? 'border-red-300 focus:ring-red-100' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-100'} rounded-lg p-3 outline-none transition-all focus:ring-2 h-32`}
            placeholder="Bạn cần hỗ trợ gì?"
          ></textarea>
          {errors.noiDung && <p className="text-red-500 text-xs mt-1">{errors.noiDung.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition shadow-md shadow-teal-200 flex justify-center items-center gap-2 disabled:opacity-70"
        >
          {isSubmitting ? 'Đang gửi...' : <><Send size={18} /> Gửi Tin Nhắn</>}
        </button>
      </form>
    </div>
  );
};

export default Contact;