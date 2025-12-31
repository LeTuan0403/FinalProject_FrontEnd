import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Share2, Heart, Ticket, Clock, MapPin, Truck, Info, Map, CheckCircle, AlertCircle, Star, MessageSquare, Trash2, Edit, Reply, Check, X } from 'lucide-react';
import { tourService } from '../../services/tourService';
import { reviewService } from '../../services/reviewService';
import type { Tour, Review } from '../../types';

import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';

const TourDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [openDays, setOpenDays] = useState<number[]>([1]); // Changed to array for multiple open days
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  // Review State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  const fetchReviews = async () => {
    if (!id) return;
    try {
      const res = await reviewService.getByTour(Number(id));
      setReviews(res.data);
    } catch (e) {
      console.error("Error fetching reviews", e);
    }
  }

  // Auto-scroll effect (Fixed placement)
  // We need to track the LAST opened day to scroll to it
  const [lastOpenedDay, setLastOpenedDay] = useState<number | null>(null);

  useEffect(() => {
    if (lastOpenedDay !== null) {
      setTimeout(() => {
        const element = document.getElementById(`day-${lastOpenedDay}`);
        if (element) {
          const yOffset = -100; // Adjust for sticky header
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 300); // Wait for animation
    }
  }, [lastOpenedDay]);

  const toggleDay = (day: number) => {
    if (openDays.includes(day)) {
      setOpenDays(openDays.filter(d => d !== day));
    } else {
      setOpenDays([...openDays, day]);
      setLastOpenedDay(day); // Trigger scroll
      // Reset check to allow scrolling to the same day if re-opened? 
      // Actually useEffect depends on value change. If I close 2 then open 2, it works.
      // But if I open 2, then scroll away, then click 2 again (close), then open 2... works.
    }
  };

  useEffect(() => {
    const fetchTour = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await tourService.getById(Number(id));
        setTour(response.data);
        fetchReviews(); // Fetch reviews immediately

        // Check if favorite
        if (user) {
          try {
            const favRes = await userService.getMyFavorites();
            const favs = favRes.data as Tour[];
            setIsFavorite(favs.some(t => t.tourId === Number(id)));
          } catch (e) {
            console.error("Error checking favorites", e);
          }
        }
      } catch (err) {
        setError('Không thể tải thông tin tour');
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    try {
      await userService.toggleFavorite(Number(id));
      setIsFavorite(!isFavorite);
    } catch (e) {
      alert("Lỗi khi thêm vào yêu thích");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    try {
      setSubmittingReview(true);

      if (editingReviewId) {
        await reviewService.update(editingReviewId, {
          tourId: Number(id),
          userId: user.userId,
          soSao: userRating,
          binhLuan: userComment,
          danhGiaId: editingReviewId
        });
        alert("Cập nhật đánh giá thành công!");
        setEditingReviewId(null);
      } else {
        await reviewService.create({
          tourId: Number(id),
          userId: user.userId,
          soSao: userRating,
          binhLuan: userComment
        });
        alert("Cảm ơn bạn đã đánh giá!");
      }

      setUserComment('');
      setUserRating(5);
      fetchReviews();
    } catch (error) {
      alert("Thao tác thất bại.");
      console.error(error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (rv: Review) => {
    setEditingReviewId(rv.danhGiaId!);
    setUserRating(rv.soSao);
    setUserComment(rv.binhLuan);
    const formElement = document.getElementById('review-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus textarea
      const textarea = formElement.querySelector('textarea');
      if (textarea) textarea.focus();
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    try {
      await reviewService.delete(reviewId);
      setReviews(reviews.filter(r => r.danhGiaId !== reviewId));
      if (editingReviewId === reviewId) {
        setEditingReviewId(null);
        setUserComment('');
        setUserRating(5);
      }
    } catch (e) {
      alert("Không thể xóa đánh giá");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Đang tải thông tin tour...</div>;
  if (error || !tour) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || "Tour không tồn tại"}</div>;

  const tourCode = tour.maTour || `T-${tour.tourId}`;

  // Calculate duration accurately
  const maxDay = (tour.lichTrinh || tour.tourChiTiets)?.length
    ? Math.max(...(tour.lichTrinh || tour.tourChiTiets).map((ct: any) => ct.ngayThu))
    : 1;
  const durationText = tour.thoiGian || `${maxDay} ngày ${maxDay - 1 > 0 ? (maxDay - 1) + ' đêm' : ''}`;

  return (
    <div className="bg-gray-50 pb-20 pt-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Header Title & Image */}
            <div>
              <div className="flex justify-between items-start mb-6">
                <h1 className="text-3xl md:text-4xl font-black text-blue-900 leading-tight flex-1">{tour.tenTour}</h1>
                <div className="flex gap-2 shrink-0 ml-4 relative">

                  {/* Share Toast */}
                  {showShareToast && (
                    <div className="absolute top-12 right-12 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap animate-fade-in z-20">
                      Đã sao chép liên kết!
                    </div>
                  )}

                  <button onClick={handleShare} className="p-2 rounded-full hover:bg-white hover:shadow-md text-gray-500 transition relative">
                    <Share2 size={20} />
                  </button>
                  <button onClick={toggleFavorite} className={`p-2 rounded-full hover:bg-white hover:shadow-md transition ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-400'}`}>
                    <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden shadow-lg group h-[400px]">
                <img src={tour.hinhAnhBia || "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0"} alt={tour.tenTour} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-black/60 text-white px-3 py-1 rounded backdrop-blur-sm text-sm font-bold shadow-sm">
                    {tourCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Itinerary */}
            <div id="section-itinerary" className="scroll-mt-24 space-y-8">

              {/* Introduction */}
              {tour.moTa && (
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 prose text-gray-600 max-w-none">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <Map size={24} className="text-blue-600" />
                    Giới thiệu điểm đến
                  </h3>
                  <p className="leading-relaxed whitespace-pre-line">{tour.moTa}</p>
                </div>
              )}

              {/* Highlights - New Section */}
              {tour.diemNhan && (
                <div className="p-6 bg-blue-50/50 rounded-xl shadow-sm border border-blue-100 prose text-gray-600 max-w-none">
                  <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-200 pb-2">
                    <CheckCircle size={24} className="text-blue-600" />
                    Điểm nhấn hành trình
                  </h3>
                  <p className="leading-relaxed whitespace-pre-line text-blue-900/80">{tour.diemNhan}</p>
                </div>
              )}

              {/* Day-by-Day Itinerary */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
                  Lịch Trình Chi Tiết
                </h2>



                <div className="space-y-4">
                  {/* Adapter: Use lichTrinh if available, mapping diaDiemId to diaDiem for frontend compatibility */}
                  {(tour.lichTrinh || tour.tourChiTiets) && (tour.lichTrinh || tour.tourChiTiets).length > 0 ? (
                    // Group details by day
                    Array.from(new Set((tour.lichTrinh || tour.tourChiTiets).map((ct: any) => ct.ngayThu))).sort((a: any, b: any) => a - b).map((day: any) => {
                      // Map diaDiemId to diaDiem object if necessary (for populated data)
                      const dayItems = (tour.lichTrinh || tour.tourChiTiets)
                        .filter((ct: any) => ct.ngayThu === day)
                        .sort((a: any, b: any) => a.thuTu - b.thuTu)
                        .map((item: any) => ({
                          ...item,
                          diaDiem: item.diaDiemId || item.diaDiem // Handle populated path (diaDiemId becomes the object)
                        }));

                      const isOpen = openDays.includes(day);

                      return (
                        <div id={`day-${day}`} key={day} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300 scroll-mt-24 ${isOpen ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}`}>
                          <button
                            onClick={() => toggleDay(day)}
                            className={`w-full flex items-center justify-between p-5 text-left transition-colors ${isOpen ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                          >
                            <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl font-bold shadow-sm transition-colors ${isOpen ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
                                <span className="text-xs font-normal uppercase opacity-80">Ngày</span>
                                <span className="text-xl">{day}</span>
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800 text-lg">
                                  {Array.from(new Set(dayItems.map(i => i.diaDiem?.tenDiaDiem).filter(Boolean))).join(" - ") || `Khám phá ngày ${day}`}
                                </h3>
                                <p className="text-sm text-gray-500 font-normal mt-1 flex items-center gap-2">
                                  <Clock size={14} /> Lịch trình gồm {dayItems.length} hoạt động
                                </p>
                              </div>
                            </div>
                            {isOpen ? <ChevronUp className="text-blue-600" /> : <ChevronDown className="text-gray-400" />}
                          </button>

                          <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-6 border-t border-gray-100 bg-white space-y-8 relative">
                              {/* Connector Line */}
                              <div className="absolute left-[29px] top-8 bottom-8 w-0.5 bg-gray-200"></div>

                              {dayItems.map((item, idx) => (
                                <div key={idx} className="relative pl-8 sm:pl-10 group pb-8 last:pb-0">
                                  {/* Connector Line (Dynamic Height) */}
                                  <div className="absolute left-[29px] top-2 bottom-0 w-0.5 bg-gray-100 group-last:hidden"></div>

                                  {/* Dot Number */}
                                  <div className="absolute left-[13px] top-2 w-8 h-8 bg-blue-600 text-white rounded-full z-10 shadow-sm flex items-center justify-center font-bold text-sm ring-4 ring-white group-hover:scale-110 transition-transform duration-300">
                                    {idx + 1}
                                  </div>

                                  {/* Card Container */}
                                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 ml-4 relative">
                                    {/* Time Badge (Absolute or Flex) */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 border-b border-gray-50 pb-3">
                                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-sm min-w-[80px]">
                                        {item.thoiGian || `0${8 + idx}:30`}
                                      </span>
                                      <h4 className="font-bold text-gray-800 text-lg flex-1">
                                        {item.tieuDe}
                                      </h4>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-5">
                                      {/* Image - Conditional: Only show if hinhAnh exists and is NOT hidden */}
                                      {item.hinhAnh && item.hinhAnh !== 'HIDDEN' && (
                                        <div className="md:w-1/3 shrink-0">
                                          <div className="aspect-video sm:aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                                            <img
                                              src={item.hinhAnh || item.diaDiem?.hinhAnh || "https://images.unsplash.com/photo-1501785888041-af3ef285b470"}
                                              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                                              alt={item.diaDiem?.tenDiaDiem || item.tieuDe}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Content Description */}
                                      <div className="flex-1">
                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line text-justify">
                                          {item.ghiChu || "Tự do tham quan và khám phá."}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center p-12 bg-white rounded-xl border-2 border-dashed border-gray-300 text-gray-500">
                      <Map size={48} className="mx-auto text-gray-300 mb-3" />
                      <p>Chưa có thông tin lịch trình chi tiết</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Info Sections */}
              <div id="section-services" className="scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-200">
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-6 h-6" /> Dịch vụ bao gồm
                  </h3>
                  <ul className="space-y-3 text-gray-600 bg-green-50/50 p-6 rounded-xl border border-green-100">
                    {(tour.dichVuBaoGom ? tour.dichVuBaoGom.split('\n') : [
                      "Xe tham quan đời mới, máy lạnh.",
                      "Hướng dẫn viên vui vẻ, nhiệt tình.",
                      "Vé tham quan theo chương trình.",
                      "Nước uống, khăn lạnh trên xe.",
                      "Bảo hiểm du lịch trọn tour."
                    ]).map((item, idx) => {
                      const isSubItem = item.trim().startsWith('-') || item.trim().startsWith('+');
                      return (
                        <li key={idx} className={`flex gap-3 items-start ${isSubItem ? 'pl-8 text-sm' : ''}`}>
                          {!isSubItem && <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
                          <span className={`${isSubItem ? 'text-gray-500' : 'text-gray-700'}`}>{item}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-6 h-6" /> Dịch vụ không bao gồm
                  </h3>
                  <ul className="space-y-3 text-gray-600 bg-red-50/50 p-6 rounded-xl border border-red-100">
                    {(tour.dichVuKhongBaoGom ? tour.dichVuKhongBaoGom.split('\n') : [
                      "Thuế VAT (10%).",
                      "Chi phí cá nhân: giặt ủi, điện thoại...",
                      "Ăn uống ngoài chương trình.",
                      "Tiền hưu (tips) cho HDV và tài xế."
                    ]).map((item, idx) => {
                      const isSubItem = item.trim().startsWith('-') || item.trim().startsWith('+');
                      return (
                        <li key={idx} className={`flex gap-3 items-start ${isSubItem ? 'pl-8 text-sm' : ''}`}>
                          {!isSubItem && <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                          <span className={`${isSubItem ? 'text-gray-500' : 'text-gray-700'}`}>{item}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* Notes / Policies */}
              <div id="section-notes" className="scroll-mt-24 bg-yellow-50 p-6 rounded-xl border border-yellow-100">
                <h3 className="text-lg font-bold text-yellow-800 mb-2 flex items-center gap-2">
                  <Info size={20} /> Chính sách & Lưu ý
                </h3>
                <p className="text-yellow-900/80 text-sm leading-relaxed whitespace-pre-line">
                  {tour.chinhSachTour || "Thứ tự các điểm tham quan có thể thay đổi tùy thuộc vào tình hình thực tế (thời tiết, giao thông) nhưng vẫn đảm bảo đầy đủ các điểm trong chương trình. Quý khách vui lòng mang theo giấy tờ tùy thân (CCCD/Hộ chiếu) khi đi tour."}
                </p>
              </div>

              {/* REVIEWS SECTION */}
              <div id="section-reviews" className="scroll-mt-24 pt-8 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Star className="w-6 h-6 text-yellow-500 fill-current" />
                  Đánh giá từ khách hàng ({reviews.length})
                </h3>

                {/* Reviews List */}
                <div className="space-y-6 mb-10">
                  {reviews.length > 0 ? (
                    reviews.map((rv) => (
                      <div key={rv.danhGiaId} className={`bg-white p-5 rounded-xl border shadow-sm transition-all ${editingReviewId === rv.danhGiaId ? 'border-blue-500 ring-1 ring-blue-200 bg-blue-50/20' : 'border-gray-100'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
                              {rv.nguoiDung?.hoTen?.charAt(0) || 'K'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{rv.nguoiDung?.hoTen || 'Khách hàng'}</p>
                              <p className="text-xs text-gray-400">{rv.ngayDanhGia ? new Date(rv.ngayDanhGia).toLocaleDateString('vi-VN') : ''}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={14} className={s <= rv.soSao ? "text-yellow-400 fill-current" : "text-gray-300"} />
                              ))}
                            </div>

                            {user && user.userId === rv.userId && (
                              <div className="flex gap-2 mt-1">
                                <button onClick={() => handleEditReview(rv)} className="text-gray-400 hover:text-blue-600 p-1" title="Sửa"><Edit size={14} /></button>
                                <button onClick={() => handleDeleteReview(rv.danhGiaId!)} className="text-gray-400 hover:text-red-500 p-1" title="Xóa"><Trash2 size={14} /></button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 italic mb-3">"{rv.binhLuan}"</p>

                        {/* Admin Reply Display */}
                        {rv.traLoi && (
                          <div className="ml-10 mt-3 bg-gray-50 border-l-2 border-blue-500 p-3 rounded-r-lg text-sm text-gray-700">
                            <div className="flex items-center gap-2 font-bold text-blue-800 mb-1 text-xs uppercase">
                              <Reply size={12} /> Phản hồi từ Admin
                            </div>
                            <p>{rv.traLoi}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      Chưa có đánh giá nào. Hãy là người đầu tiên!
                    </div>
                  )}
                </div>

                {/* Write Review Form */}
                <div id="review-form" className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <MessageSquare size={20} /> {editingReviewId ? 'Chỉnh sửa đánh giá của bạn' : 'Viết đánh giá của bạn'}
                  </h4>

                  {user ? (
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá chung</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setUserRating(star)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                size={28}
                                className={`${star <= userRating ? "text-yellow-400 fill-current" : "text-gray-300"} transition-colors`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm font-medium text-gray-600 pt-1">
                            {userRating === 5 ? '(Tuyệt vời)' : userRating === 4 ? '(Tốt)' : userRating === 3 ? '(Bình thường)' : userRating === 2 ? '(Tệ)' : '(Rất tệ)'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bình luận chi tiết</label>
                        <textarea
                          value={userComment}
                          onChange={(e) => setUserComment(e.target.value)}
                          placeholder="Chia sẻ trải nghiệm của bạn về chuyến đi..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px]"
                          required
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                        >
                          {submittingReview ? 'Đang xử lý...' : (editingReviewId ? 'Cập Nhật Đánh Giá' : 'Gửi Đánh Giá')}
                        </button>

                        {editingReviewId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingReviewId(null);
                              setUserComment('');
                              setUserRating(5);
                            }}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-2">Vui lòng đăng nhập để viết đánh giá</p>
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Đăng nhập ngay
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">

              {/* Info Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                <div className="p-6 bg-slate-50 border-b border-gray-100 text-center">
                  <p className="text-gray-500 text-sm font-medium mb-1 uppercase tracking-wider">Giá trọn gói</p>
                  <p className="text-4xl font-black text-red-600">{tour.tongGiaDuKien.toLocaleString()} <span className="text-sm text-gray-500 font-normal">₫/khách</span></p>
                </div>

                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Ticket size={20} className="text-blue-500" />
                      <span>Mã Tour</span>
                    </div>
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-sm">{tourCode}</span>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Clock size={20} className="text-blue-500" />
                      <span>Thời gian</span>
                    </div>
                    <span className="font-bold text-gray-900">{durationText}</span>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin size={20} className="text-blue-500" />
                      <span>Khởi hành</span>
                    </div>
                    <span className="font-bold text-gray-900 text-right max-w-[150px] truncate" title={tour.diemKhoiHanh}>{tour.diemKhoiHanh || "Hồ Chí Minh"}</span>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Truck size={20} className="text-blue-500" />
                      <span>Phương tiện</span>
                    </div>
                    <span className="font-bold text-gray-900">{tour.phuongTien || "Xe du lịch"}</span>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Truck size={20} className="text-blue-500" />
                      <span>Bữa ăn</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      {[
                        (tour.anSang ? `${String(tour.anSang).padStart(2, '0')} Bữa sáng` : null),
                        (tour.anTrua ? `${String(tour.anTrua).padStart(2, '0')} Bữa trưa` : null),
                        (tour.anToi ? `${String(tour.anToi).padStart(2, '0')} Bữa tối` : null)
                      ].filter(Boolean).join(' - ') || "Tự túc"}
                    </span>
                  </div>

                  <hr className="border-gray-100" />

                  <button
                    onClick={() => navigate(`/booking/${tour.tourId}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-200 uppercase tracking-wide flex items-center justify-center gap-2 transform active:scale-95 duration-150"
                  >
                    Đặt Tour Ngay <Ticket size={18} />
                  </button>

                  <button className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition text-sm">
                    Tư Vấn Miễn Phí
                  </button>
                </div>
              </div>

              {/* Quick Nav */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hidden lg:block">
                <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Mục lục</h4>
                <div className="flex flex-col gap-2">
                  <a href="#section-itinerary" className="text-gray-600 hover:text-blue-600 text-sm py-1 border-l-2 border-transparent hover:border-blue-500 pl-3 transition-all">Lịch trình chi tiết</a>
                  <a href="#section-services" className="text-gray-600 hover:text-blue-600 text-sm py-1 border-l-2 border-transparent hover:border-blue-500 pl-3 transition-all">Dịch vụ bao gồm</a>
                  <a href="#section-notes" className="text-gray-600 hover:text-blue-600 text-sm py-1 border-l-2 border-transparent hover:border-blue-500 pl-3 transition-all">Lưu ý</a>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TourDetail;