
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { contactService } from '../../services/contactService';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ContactForm {
  hoTen: string;
  email: string;
  soDienThoai: string;
  diaChi: string;
  noiDung: string;
}

const Contact = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<ContactForm>();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.hoTen) setValue('hoTen', user.hoTen);
      if (user.email) setValue('email', user.email);
      if (user.soDienThoai) setValue('soDienThoai', user.soDienThoai); // Requires context update
      if (user.diaChi) setValue('diaChi', user.diaChi); // Requires context update
    }
  }, [user, setValue]);

  const onSubmit = async (data: ContactForm) => {
    try {
      setError('');
      // Note: Backend endpoint currently might not accept phone/address if not updated, 
      // but we send it anyway or we can filter it if strictly needed.
      // Assuming contactService.createContact just passes data along.
      await contactService.createContact(data as any);
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-1.5 font-medium text-sm">Họ tên <span className="text-red-500">*</span></label>
            <input
              {...register("hoTen", { required: "Vui lòng nhập họ tên" })}
              type="text"
              className={`w-full border ${errors.hoTen ? 'border-red-300 focus:ring-red-100' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-100'} rounded-lg px-3 py-2 outline-none transition-all focus:ring-2`}
              placeholder="Nguyễn Văn A"
            />
            {errors.hoTen && <p className="text-red-500 text-xs mt-1">{errors.hoTen.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 mb-1.5 font-medium text-sm">Email <span className="text-red-500">*</span></label>
            <input
              {...register("email", {
                required: "Vui lòng nhập email",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email không hợp lệ"
                }
              })}
              type="email"
              className={`w-full border ${errors.email ? 'border-red-300 focus:ring-red-100' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-100'} rounded-lg px-3 py-2 outline-none transition-all focus:ring-2`}
              placeholder="example@mail.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 mb-1.5 font-medium text-sm">Số điện thoại</label>
            <input
              {...register("soDienThoai", {
                pattern: { value: /(84|0[3|5|7|8|9])+([0-9]{8})\b/, message: "SĐT không hợp lệ" }
              })}
              type="text"
              className={`w-full border ${errors.soDienThoai ? 'border-red-300 focus:ring-red-100' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-100'} rounded-lg px-3 py-2 outline-none transition-all focus:ring-2`}
              placeholder="0912..."
            />
            {errors.soDienThoai && <p className="text-red-500 text-xs mt-1">{errors.soDienThoai.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 mb-1.5 font-medium text-sm">Địa chỉ</label>
            <input
              {...register("diaChi")}
              type="text"
              className={`w-full border border-gray-300 focus:border-teal-500 focus:ring-teal-100 rounded-lg px-3 py-2 outline-none transition-all focus:ring-2`}
              placeholder="Hà Nội..."
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-1.5 font-medium text-sm">Nội dung <span className="text-red-500">*</span></label>
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