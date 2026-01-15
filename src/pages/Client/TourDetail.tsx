import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isFutureDate, formatTimeRange, compareTimeStrings } from '../../utils/dateUtils';
import { ChevronDown, ChevronUp, Share2, Heart, Ticket, Clock, MapPin, Truck, Info, Map, CheckCircle, AlertCircle, Star, MessageSquare, Trash2, Edit, Reply, Check, X, Calendar, UserCheck, Utensils, Image as ImageIcon, ThumbsUp, Camera, Cloud, Bell, BellOff } from 'lucide-react';
import { tourService } from '../../services/tourService';
import { reviewService } from '../../services/reviewService';
import type { Tour, Review } from '../../types';

import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import WeatherWidget from '../../components/common/WeatherWidget';

// Helper to get full media URL
const getMediaUrl = (url: string) => {
  if (!url) { return ''; }
  if (url.startsWith('http') || url.startsWith('blob:')) { return url; }
  return `http://localhost:5000${url}`;
};

// Helper: Parse destinations from Tour Name
const getLocationsFromTourName = (name: string) => {
  if (!name) { return []; }
  // 1. Isolate main part
  let nameToParse = name.split('|')[0];

  // 2. Remove prefixes and noise
  nameToParse = nameToParse
    .replace(/^(Tour\s+)/i, "")
    .replace(/^(Du lịch\s+)/i, "")
    .replace(/^(Khám phá\s+)/i, "")
    .replace(/\(.*\)/g, "")
    .replace(/\d+\s*(Ngày|Ngay|N)(\s*\d+\s*(Đêm|Dem|Đ|D))?/gi, "") // Remove durations
    .trim();

  // 3. Split and Filter
  return nameToParse.split(/[-–,]/)
    .map(s => s.trim())
    .filter(s => {
      if (s.length < 2) { return false; }
      if (/\d+N\d+Đ/i.test(s)) { return false; }
      if (/\d+\s*sao/i.test(s)) { return false; }
      if (/trọn gói/i.test(s)) { return false; }
      if (/khởi hành/i.test(s)) { return false; }
      if (/giá/i.test(s)) { return false; }
      return true;
    })
    .slice(0, 3);
};

// Reusable Media Grid Component
const MediaGrid = ({
  media,
  onRemove,
  size = "md"
}: {
  media: { type: 'image' | 'video', url: string }[],
  onRemove?: (index: number) => void,
  size?: "sm" | "md" | "lg"
}) => {
  if (!media || media.length === 0) { return null; }

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  };

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {media.map((m, idx) => (
        <div key={idx} className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden border border-gray-200 group bg-gray-100`}>
          {m.type === 'image' ? (
            <img src={getMediaUrl(m.url)} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" alt="media" />
          ) : (
            <video src={getMediaUrl(m.url)} className="w-full h-full object-cover" controls />
          )}

          {onRemove && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
              className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500 transition opacity-0 group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// eslint-disable-next-line complexity
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
  const [selectedWeatherDate, setSelectedWeatherDate] = useState<Date | undefined>(undefined); // New State for Weather Date Selection

  // Review State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>('');
  // Removed duplicate userComment

  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  // Reply State
  const [replyingToId, setReplyingToId] = useState<number | null>(null); // Acts as "Show Replies" toggle too
  const [replyContent, setReplyContent] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [replyMediaFiles, setReplyMediaFiles] = useState<File[]>([]);
  const [replyPreviewMedia, setReplyPreviewMedia] = useState<{ type: 'image' | 'video', url: string }[]>([]);

  // Inline Reply State (New)
  const [activeInlineReplyId, setActiveInlineReplyId] = useState<string | null>(null);
  const [inlineReplyContent, setInlineReplyContent] = useState('');
  const [inlineReplyMediaFiles, setInlineReplyMediaFiles] = useState<File[]>([]);
  const [inlineReplyPreviewMedia, setInlineReplyPreviewMedia] = useState<{ type: 'image' | 'video', url: string }[]>([]);

  // Edit Reply State
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyContent, setEditingReplyContent] = useState('');
  const [editingReplyExistingMedia, setEditingReplyExistingMedia] = useState<{ type: 'image' | 'video', url: string }[]>([]);
  const [previewMedia, setPreviewMedia] = useState<{ type: 'image' | 'video', url: string }[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!id) { return; }
    try {
      const res = await reviewService.getByTour(Number(id));
      setReviews(res.data);
    } catch (e) {
      console.error("Error fetching reviews", e);
    }
  }, [id]);

  // Auto-scroll effect (Fixed placement)
  // We need to track the LAST opened day to scroll to it
  const [lastOpenedDay, setLastOpenedDay] = useState<number | null>(null);

  useEffect(() => {
    if (lastOpenedDay !== null) {
      setTimeout(() => {
        const element = document.getElementById(`day - ${lastOpenedDay} `);
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

  // Scroll to top on mount/id change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, fetchReviews]);

  useEffect(() => {
    const fetchTour = async () => {
      if (!id) { return; }
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
  }, [id, user, fetchReviews]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setMediaFiles(prev => [...prev, ...files]);

      // Create previews
      const newPreviews = files.map(file => ({
        type: file.type.startsWith('image') ? 'image' : 'video' as 'image' | 'video',
        url: URL.createObjectURL(file)
      }));
      setPreviewMedia(prev => [...prev, ...newPreviews]);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id) { return; }

    setSubmittingReview(true);
    try {
      let uploadedFiles: { type: 'image' | 'video', url: string }[] = [];

      // 1. Upload Media if any
      if (mediaFiles.length > 0) {
        const formData = new FormData();
        mediaFiles.forEach(file => formData.append('media', file));
        const uploadRes = await reviewService.uploadMedia(formData);
        uploadedFiles = uploadRes.data.files;
      }

      // 2. Prepare Data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reviewData: any = {
        tourId: Number(id),
        userId: user.userId,
        soSao: userRating,
        binhLuan: userComment,
        ngayDanhGia: new Date().toISOString(),
        isAnonymous: isAnonymous,
        media: uploadedFiles.length > 0 ? uploadedFiles : undefined
      };

      if (editingReviewId) {
        // UPDATE Existing Review
        // Merge with existing media if not replacing? Logic here implies clean slate or append
        // For simplicity: If new files uploaded, they replace/append? 
        // Let's assume current implementation adds to existing or user wants to keep current.
        // Complex edit logic: usually retrieve existing, remove deleted, add new. 
        // Current simplified: New Uploads + Keep old?
        // Let's just send what we have. If editing, we need to handle existing media display/remove.
        // Updated logic: We will handle strictly new uploads here. Existing media management is separate task.
        // For now: Overwrite/Add Logic.

        await reviewService.update(editingReviewId, reviewData);
        // Optimistic update
        setReviews(prev => prev.map(rv => rv.danhGiaId === editingReviewId ? { ...rv, ...reviewData } : rv));
        alert("Cập nhật đánh giá thành công!");
        setEditingReviewId(null);
      } else {
        // CREATE New Review
        const res = await reviewService.create(reviewData);
        if (res.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newReview: any = { ...res.data, nguoiDung: { hoTen: user.hoTen } };
          setReviews(prev => [newReview, ...prev]);
          alert("Cảm ơn bạn đã đánh giá!");
        }
      }

      // Reset form
      setUserComment('');
      setUserRating(5);
      setMediaFiles([]);
      setPreviewMedia([]);
    } catch (error) {
      console.error("Failed to submit review", error);
      alert("Thao tác thất bại.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.danhGiaId || null);
    setUserRating(review.soSao || 5);
    setUserComment(review.binhLuan || '');
    setIsAnonymous(review.isAnonymous || false);
    // Scroll to form
    const formElement = document.getElementById('review-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
      // Focus textarea
      const textarea = formElement.querySelector('textarea');
      if (textarea) { textarea.focus(); }
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) {
      try {
        await reviewService.delete(reviewId);
        setReviews(prev => prev.filter(rv => rv.danhGiaId !== reviewId));
        // If deleting the currently edited review, reset form
        if (editingReviewId === reviewId) {
          setEditingReviewId(null);
          setUserComment('');
          setUserRating(5);
        }
      } catch (error) {
        console.error("Failed to delete review", error);
        alert("Xóa đánh giá thất bại!");
      }
    }
  };

  const handleLike = async (reviewId: number) => {
    if (!user) {
      alert("Vui lòng đăng nhập để thích đánh giá!");
      return;
    }
    try {
      const res = await reviewService.like(reviewId);
      // Update local state
      setReviews(prev => prev.map(rv => {
        if (rv.danhGiaId === reviewId) {
          // res.data is array of userIds
          return { ...rv, likes: res.data };
        }
        return rv;
      }));
    } catch (error) {
      console.error("Like failed", error);
    }
  };

  const handleLikeReply = async (reviewId: number, replyId: string) => {
    if (!user) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    try {
      const res = await reviewService.likeReply(reviewId, replyId);
      setReviews(prev => prev.map(rv => {
        if (rv.danhGiaId === reviewId && rv.replies) {
          const updatedReplies = rv.replies.map(r => r._id === replyId ? { ...r, likes: res.data } : r);
          return { ...rv, replies: updatedReplies };
        }
        return rv;
      }));
    } catch (error) {
      console.error("Like reply failed", error);
    }
  }

  const handleToggleSubscription = async (reviewId: number) => {
    if (!user) { return; }
    try {
      const res = await reviewService.toggleSubscription(reviewId);
      setReviews(prev => prev.map(rv => rv.danhGiaId === reviewId ? { ...rv, subscribers: res.data.subscribers } : rv));

      const isNowSubscribed = res.data.subscribers && res.data.subscribers.includes(String(user.userId));
      alert(isNowSubscribed ? "Đã bật thông báo cho luồng thảo luận này" : "Đã tắt thông báo cho luồng thảo luận này");
    } catch (error) {
      console.error("Toggle subscription failed", error);
      alert("Lỗi khi thay đổi trạng thái thông báo");
    }
  };

  const handleReplyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setReplyMediaFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => ({
        type: file.type.startsWith('image') ? 'image' : 'video' as 'image' | 'video',
        url: URL.createObjectURL(file)
      }));
      setReplyPreviewMedia(prev => [...prev, ...newPreviews]);
    }
  };

  const removeReplyMedia = (index: number) => {
    setReplyMediaFiles(prev => prev.filter((_, i) => i !== index));
    setReplyPreviewMedia(prev => prev.filter((_, i) => i !== index));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStartEditReply = (reply: any) => {
    setEditingReplyId(reply._id);
    setEditingReplyContent(reply.content);
    setEditingReplyExistingMedia(reply.media || []);
    // Reset new media inputs so we start fresh for adding *more*
    setReplyMediaFiles([]);
    setReplyPreviewMedia([]);
    // Do NOT close the reply section (setReplyingToId(null)) - we want to edit in place.
  };

  const handleUpdateReply = async (reviewId: number, replyId: string) => {
    try {
      let finalMedia = [...editingReplyExistingMedia];

      // Upload new files if any
      if (replyMediaFiles.length > 0) {
        const formData = new FormData();
        replyMediaFiles.forEach(file => formData.append('media', file));
        const uploadRes = await reviewService.uploadMedia(formData);
        // Combine existing + new
        finalMedia = [...finalMedia, ...uploadRes.data.files];
      }

      const res = await reviewService.updateReply(reviewId, replyId, editingReplyContent, finalMedia);

      setReviews(prev => prev.map(rv => rv.danhGiaId === reviewId ? { ...rv, replies: res.data } : rv));

      // Cleanup
      setEditingReplyId(null);
      setEditingReplyContent('');
      setEditingReplyExistingMedia([]);
      setReplyMediaFiles([]);
      setReplyPreviewMedia([]);
    } catch (error) {
      console.error("Update reply failed", error);
    }
  };

  const handleDeleteReply = async (reviewId: number, replyId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) { return; }
    try {
      const res = await reviewService.deleteReply(reviewId, replyId);
      setReviews(prev => prev.map(rv => rv.danhGiaId === reviewId ? { ...rv, replies: res.data } : rv));
    } catch (error) {
      console.error("Delete reply failed", error);
    }
  };

  const handleReplySubmit = async (reviewId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (editingReplyId) {
      handleUpdateReply(reviewId, editingReplyId);
      return;
    }

    if (!replyContent.trim()) { return; }

    try {
      let uploadedFiles: { type: 'image' | 'video', url: string }[] = [];
      if (replyMediaFiles.length > 0) {
        const formData = new FormData();
        replyMediaFiles.forEach(file => formData.append('media', file));
        const uploadRes = await reviewService.uploadMedia(formData);
        uploadedFiles = uploadRes.data.files;
      }

      const res = await reviewService.comment(reviewId, replyContent, replyAnonymous, uploadedFiles);
      // res.data is updated replies array
      setReviews(prev => prev.map(rv => rv.danhGiaId === reviewId ? { ...rv, replies: res.data } : rv));

      // Reset
      // setReplyingToId(null); // Keep open to see result
      setReplyContent('');
      setReplyAnonymous(false);
      setReplyMediaFiles([]);
      setReplyPreviewMedia([]);
    } catch (error) {
      console.error("Reply failed", error);
    }
  };

  // Inline Reply Handlers
  const handleInlineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setInlineReplyMediaFiles(prev => [...prev, ...files]);

      const newPreviews = files.map(file => ({
        type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
        url: URL.createObjectURL(file)
      }));
      setInlineReplyPreviewMedia(prev => [...prev, ...newPreviews]);
    }
  };

  const removeInlineReplyMedia = (index: number) => {
    setInlineReplyMediaFiles(prev => prev.filter((_, i) => i !== index));
    setInlineReplyPreviewMedia(prev => prev.filter((_, i) => i !== index));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenInlineReply = (reply: any, replyName: string) => {
    setActiveInlineReplyId(reply._id);
    setInlineReplyContent(`@${replyName} `);
    setInlineReplyMediaFiles([]);
    setInlineReplyPreviewMedia([]);
  };

  const handleInlineReplySubmit = async (reviewId: number) => {
    if (!inlineReplyContent.trim() && inlineReplyMediaFiles.length === 0) { return; }
    try {
      let uploadedFiles: { type: 'image' | 'video', url: string }[] = [];
      if (inlineReplyMediaFiles.length > 0) {
        const formData = new FormData();
        inlineReplyMediaFiles.forEach(file => formData.append('media', file));
        const uploadRes = await reviewService.uploadMedia(formData);
        uploadedFiles = uploadRes.data.files;
      }

      await reviewService.comment(reviewId, inlineReplyContent, false, uploadedFiles); // Fixed signature
      setInlineReplyContent('');
      setInlineReplyMediaFiles([]);
      setInlineReplyPreviewMedia([]);
      setActiveInlineReplyId(null);
      fetchReviews();
    } catch (e) {
      console.error("Error submitting inline reply", e);
    }
  };

  if (loading) { return <div className="min-h-screen flex items-center justify-center text-gray-500">Đang tải thông tin tour...</div>; }
  if (error || !tour) { return <div className="min-h-screen flex items-center justify-center text-red-500">{error || "Tour không tồn tại"}</div>; }

  const tourCode = tour.maTour || `T - ${tour.tourId} `;

  // Calculate duration accurately
  const maxDay = (tour.lichTrinh || tour.tourChiTiets)?.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? Math.max(...(tour.lichTrinh || tour.tourChiTiets).map((ct: any) => ct.ngayThu))
    : 1;
  const durationText = tour.thoiGian || `${maxDay} ngày ${maxDay - 1 > 0 ? (maxDay - 1) + ' đêm' : ''} `;

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
                  <button onClick={toggleFavorite} className={`p - 2 rounded - full hover: bg - white hover: shadow - md transition ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-400'} `}>
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

            {/* Weather Widget */}
            {/* Weather Widget */}
            {/* Weather Widget */}
            {(() => {
              // 1. Get All Future Dates
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const allFutureDates = (tour.ngayKhoiHanh || [])
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((d: any) => new Date(d))
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((d: any) => new Date(d).getTime() >= today.getTime())
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .sort((a: any, b: any) => new Date(a).getTime() - new Date(b).getTime());

              // 2. Identify Selected Date (or default to first)
              const displayDate = selectedWeatherDate || (allFutureDates.length > 0 ? allFutureDates[0] : undefined);

              // 3. Check if forecastable (within 7 days)
              const maxForecastDate = new Date(today);
              maxForecastDate.setDate(today.getDate() + 7);
              // If no date (e.g. no schedule), we assume forecastable (current weather)
              // If date exists, check range.
              const isForecastable = !displayDate || displayDate.getTime() <= maxForecastDate.getTime();

              const validLocations = getLocationsFromTourName(tour.tenTour);
              // Fallback to itinerary
              if (validLocations.length === 0) {
                const itineraryObj = tour.lichTrinh?.[0]?.diaDiem || tour.tourChiTiets?.[0]?.diaDiem;
                if (itineraryObj?.tenDiaDiem) { validLocations.push(itineraryObj.tenDiaDiem); }
              }
              // Final fallback
              if (validLocations.length === 0 && tour.diemKhoiHanh) { validLocations.push(tour.diemKhoiHanh); }

              if (validLocations.length === 0) { return null; }

              return (
                <div className="mb-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h3 className="text-base font-bold text-blue-900 uppercase tracking-wide flex items-center gap-2">
                      <Cloud className="text-blue-500" size={20} />
                      Dự báo thời tiết điểm đến
                    </h3>

                    {/* Date Selector */}
                    {allFutureDates.length > 0 && (
                      <div className="relative min-w-[200px]">
                        <select
                          className="w-full appearance-none bg-white border border-blue-200 text-blue-900 text-sm font-bold py-2.5 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-blue-400 transition-colors"
                          value={displayDate?.toISOString() || ''}
                          onChange={(e) => setSelectedWeatherDate(new Date(e.target.value))}
                        >
                          {allFutureDates.map((date, idx) => (
                            <option key={idx} value={date.toISOString()}>
                              Khởi hành: {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" size={18} />
                      </div>
                    )}
                  </div>

                  {isForecastable ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                      {validLocations.map((loc, idx) => (
                        <WeatherWidget
                          key={idx}
                          locationName={loc}
                          departureDate={displayDate}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center bg-white/60 rounded-xl border border-dashed border-gray-300">
                      <div className="bg-gray-100 p-4 rounded-full mb-3">
                        <Cloud size={32} className="text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-bold text-lg">
                        Chưa có dự báo cho ngày {displayDate?.toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-gray-500 mt-1 max-w-md">
                        Hệ thống chỉ cung cấp dự báo thời tiết chính xác trong vòng <span className="font-bold text-blue-600">7 ngày</span> tới. Vui lòng quay lại sau!
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    Array.from(new Set((tour.lichTrinh || tour.tourChiTiets).map((ct: any) => ct.ngayThu))).sort((a: any, b: any) => a - b).map((day: any) => {
                      // Map diaDiemId to diaDiem object if necessary (for populated data)
                      const dayItems = (tour.lichTrinh || tour.tourChiTiets)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .filter((ct: any) => ct.ngayThu === day)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .sort((a: any, b: any) => compareTimeStrings(a.thoiGian, b.thoiGian))
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                                  {Array.from(new Set(dayItems.map(i => i.diaDiem?.tenDiaDiem).filter(Boolean))).join(" - ") || `Khám phá ngày ${day} `}
                                </h3>
                                <p className="text-sm text-gray-500 font-normal mt-1 flex items-center gap-2">
                                  <Clock size={14} /> Lịch trình gồm {dayItems.length} hoạt động
                                </p>
                              </div>
                            </div>
                            {isOpen ? <ChevronUp className="text-blue-600" /> : <ChevronDown className="text-gray-400" />}
                          </button>

                          <div className={`transition - all duration - 300 ease -in -out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} `}>
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
                                        {formatTimeRange(item.thoiGian || `0${8 + idx}: 30`)}
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
                        <li key={idx} className={`flex gap - 3 items - start ${isSubItem ? 'pl-8 text-sm' : ''} `}>
                          {!isSubItem && <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
                          <span className={`${isSubItem ? 'text-gray-500' : 'text-gray-700'} `}>{item}</span>
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
                        <li key={idx} className={`flex gap - 3 items - start ${isSubItem ? 'pl-8 text-sm' : ''} `}>
                          {!isSubItem && <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                          <span className={`${isSubItem ? 'text-gray-500' : 'text-gray-700'} `}>{item}</span>
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
                    // eslint-disable-next-line complexity
                    reviews.map((rv) => {
                      // Helper to get robust user info
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const reviewUser = rv.nguoiDung || (typeof rv.userId === 'object' ? rv.userId as any : null);
                      const reviewUserName = reviewUser?.hoTen || 'Khách hàng';
                      const reviewOwnerId = reviewUser?.userId || (typeof rv.userId !== 'object' ? rv.userId : null);

                      // Robust ownership check (String comparison for ObjectId vs Number/String)
                      const isOwner = user && reviewOwnerId && String(user.userId) === String(reviewOwnerId);
                      const isLiked = user && rv.likes?.includes(String(user.userId));

                      return (
                        <div key={rv.danhGiaId} className={`bg-white p-5 rounded-xl border shadow-sm transition-all ${editingReviewId === rv.danhGiaId ? 'border-blue-500 ring-1 ring-blue-200 bg-blue-50/20' : 'border-gray-100'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
                                {rv.isAnonymous ? <UserCheck size={20} /> : (reviewUserName.charAt(0) || 'K')}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">
                                  {rv.isAnonymous ? 'Người dùng ẩn danh' : reviewUserName}
                                </p>
                                <p className="text-xs text-gray-400">{rv.ngayDanhGia ? new Date(rv.ngayDanhGia).toLocaleDateString('vi-VN') : ''}</p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} size={14} className={s <= rv.soSao ? "text-yellow-400 fill-current" : "text-gray-300"} />
                                ))}
                              </div>

                              {isOwner && (
                                <div className="flex gap-2 mt-1">
                                  <button onClick={() => handleEditReview(rv)} className="text-gray-400 hover:text-blue-600 p-1" title="Sửa"><Edit size={14} /></button>
                                  <button onClick={() => handleDeleteReview(rv.danhGiaId!)} className="text-gray-400 hover:text-red-500 p-1" title="Xóa"><Trash2 size={14} /></button>
                                </div>
                              )}
                            </div>
                          </div>

                          {rv.isAnonymous && (
                            <div className="mb-2">
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                                <UserCheck size={10} /> Đã ẩn danh
                              </span>
                            </div>
                          )}

                          {/* Media Display */}
                          <MediaGrid media={rv.media || []} size="lg" />

                          <p className="text-gray-600 italic mb-3">"{rv.binhLuan}"</p>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => handleLike(rv.danhGiaId!)}
                              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                            >
                              <ThumbsUp size={16} className={isLiked ? 'fill-current' : ''} />
                              <span>Thích ({rv.likes?.length || 0})</span>
                            </button>

                            <button
                              onClick={() => setReplyingToId(replyingToId === rv.danhGiaId ? null : rv.danhGiaId!)}
                              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${replyingToId === rv.danhGiaId ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                            >
                              <MessageSquare size={16} />
                              <span>Phản hồi ({rv.replies?.length || 0})</span>
                            </button>

                            {/* Subscription Toggle for Any User (Thread Subscription) */}
                            {user && (
                              <button
                                onClick={() => handleToggleSubscription(rv.danhGiaId!)}
                                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${user && rv.subscribers?.includes(String(user.userId)) ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
                                title={user && rv.subscribers?.includes(String(user.userId)) ? "Tắt thông báo luồng này" : "Bật thông báo khi có người trả lời"}
                              >
                                {user && rv.subscribers?.includes(String(user.userId)) ? <Bell size={16} className="fill-current" /> : <BellOff size={16} />}
                                <span className="hidden sm:inline">{user && rv.subscribers?.includes(String(user.userId)) ? 'Đang theo dõi' : 'Theo dõi'}</span>
                              </button>
                            )}

                            {isOwner && (
                              <>
                                <button onClick={() => handleEditReview(rv)} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors ml-auto">
                                  <Edit size={16} /> <span className="hidden sm:inline">Sửa</span>
                                </button>
                                <button onClick={() => handleDeleteReview(rv.danhGiaId!)} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors">
                                  <Trash2 size={16} /> <span className="hidden sm:inline">Xóa</span>
                                </button>
                              </>
                            )}
                          </div>
                          {/* Replies Section (Toggleable) */}
                          {replyingToId === rv.danhGiaId && (
                            <div className="ml-12 mt-3 space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                              {/* List Existing Replies */}
                              {/* Official Admin Reply (Legacy field, shown at top) */}
                              {rv.traLoi && (
                                <div className="flex gap-3 items-start text-sm ml-12 mb-4">
                                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold uppercase shrink-0">
                                    <CheckCircle size={14} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 relative">
                                      <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-orange-700 text-xs">Phản hồi từ Admin</span>
                                        {rv.ngayTraLoi && <span className="text-xs text-gray-400">{new Date(rv.ngayTraLoi).toLocaleDateString()}</span>}
                                      </div>
                                      <p className="text-gray-700">{rv.traLoi}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* List Existing Replies */}
                              {/* eslint-disable-next-line complexity */}
                              {rv.replies?.map((reply, rIdx) => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const replyUser = typeof reply.userId === 'object' ? reply.userId as any : null;
                                // Identify Admin Reply
                                const isAdminReply =
                                  replyUser?.role === 1 ||
                                  replyUser?.role === 'admin' ||
                                  replyUser?.isAdmin === 1 ||
                                  replyUser?.isAdmin === true ||
                                  replyUser?.email === 'admin@gmail.com';

                                const replyName = reply.isAnonymous ? 'Người dùng ẩn danh' : (isAdminReply ? 'Phản hồi từ Admin' : (replyUser?.hoTen || 'Khách hàng'));
                                const isReplyLiked = user && reply.likes?.includes(String(user.userId));

                                // Robust check for reply ownership
                                const replyOwnerId = replyUser?.userId || reply.userId;
                                const isReplyOwner = user?.userId && replyOwnerId && String(user.userId) === String(replyOwnerId);
                                const isEditing = editingReplyId === reply._id;

                                const isReplyingToSomeone = reply.content && reply.content.trim().startsWith('@');

                                return (
                                  <div key={rIdx} className={isReplyingToSomeone ? 'ml-12' : ''}>
                                    <div className="flex gap-3 items-start text-sm">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 ${isAdminReply ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {reply.isAnonymous ? <UserCheck size={14} /> : (isAdminReply ? <CheckCircle size={14} /> : replyName.charAt(0))}
                                      </div>
                                      <div className="flex-1">
                                        <div className={`p-3 rounded-lg border relative group ${isAdminReply ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
                                          <div className="flex justify-between items-start mb-1">
                                            <span className={`font-bold text-xs ${isAdminReply ? 'text-orange-700' : 'text-gray-800'}`}>{replyName}</span>
                                            <span className="text-xs text-gray-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                          </div>

                                          {/* Reply Media */}
                                          <MediaGrid media={reply.media || []} size="md" />

                                          {isEditing ? (
                                            <div className="mt-2">
                                              <textarea
                                                value={editingReplyContent}
                                                onChange={(e) => setEditingReplyContent(e.target.value)}
                                                className="w-full p-2 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 text-sm outline-none resize-none"
                                                rows={3}
                                                autoFocus
                                              />

                                              {/* Media Editing Area */}
                                              <div className="mt-2 space-y-2">
                                                {/* Existing Media */}
                                                <MediaGrid
                                                  media={editingReplyExistingMedia}
                                                  onRemove={(idx) => setEditingReplyExistingMedia(prev => prev.filter((_, i) => i !== idx))}
                                                  size="md"
                                                />

                                                {/* New Media Previews */}
                                                <MediaGrid
                                                  media={replyPreviewMedia}
                                                  onRemove={(idx) => removeReplyMedia(idx)}
                                                  size="md"
                                                />

                                                {/* Add Media Button */}
                                                <div className="flex items-center gap-2">
                                                  <label className="cursor-pointer text-gray-500 hover:text-blue-600 flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded transition hover:bg-blue-100">
                                                    <Camera size={16} />
                                                    <span>Thêm ảnh/video</span>
                                                    <input
                                                      type="file"
                                                      multiple
                                                      accept="image/*,video/*"
                                                      className="hidden"
                                                      onChange={handleReplyFileChange}
                                                    />
                                                  </label>
                                                </div>
                                              </div>

                                              <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                  onClick={() => { setEditingReplyId(null); setEditingReplyContent(''); setReplyPreviewMedia([]); setReplyMediaFiles([]); }}
                                                  className="text-xs px-3 py-1 hover:bg-gray-100 rounded"
                                                >
                                                  Hủy
                                                </button>
                                                <button
                                                  onClick={() => handleUpdateReply(rv.danhGiaId!, reply._id!)}
                                                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                                >
                                                  Cập nhật
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="text-gray-700">{reply.content}</p>
                                          )}
                                        </div>

                                        {/* Reply Actions - Only show if NOT editing */}
                                        {!isEditing && (
                                          <div className="flex items-center gap-3 mt-1 ml-1 text-xs text-gray-500">
                                            <button
                                              onClick={() => handleLikeReply(rv.danhGiaId!, reply._id!)}
                                              className={`hover:text-blue-600 flex items-center gap-1 ${isReplyLiked ? 'text-blue-600 font-bold' : ''}`}
                                            >
                                              Like ({reply.likes?.length || 0})
                                            </button>

                                            <button
                                              onClick={() => handleOpenInlineReply(reply, replyName)}
                                              className="hover:text-blue-600"
                                            >
                                              Phản hồi
                                            </button>

                                            {/* Edit/Delete for Owner */}
                                            {isReplyOwner && (
                                              <>
                                                <button onClick={() => { setReplyingToId(rv.danhGiaId!); handleStartEditReply(reply); }} className="hover:text-blue-600">Sửa</button>
                                                <button onClick={() => handleDeleteReply(rv.danhGiaId!, reply._id!)} className="hover:text-red-600">Xóa</button>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Inline Reply Form */}
                                    {activeInlineReplyId === reply._id && (
                                      <div className="ml-12 mt-3 bg-white p-3 rounded-lg border border-blue-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                                        <textarea
                                          value={inlineReplyContent}
                                          onChange={(e) => setInlineReplyContent(e.target.value)}
                                          className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                          rows={2}
                                          autoFocus
                                          placeholder={`Trả lời ${replyName}...`}
                                        />

                                        <MediaGrid
                                          media={inlineReplyPreviewMedia}
                                          onRemove={removeInlineReplyMedia}
                                          size="sm"
                                        />

                                        <div className="flex justify-between items-center mt-2">
                                          <div className="flex items-center gap-2">
                                            <label className="cursor-pointer text-gray-500 hover:text-blue-600 p-1 hover:bg-gray-100 rounded transition" title="Thêm ảnh/video">
                                              <ImageIcon size={18} />
                                              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleInlineFileChange} />
                                            </label>
                                          </div>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => setActiveInlineReplyId(null)}
                                              className="text-xs px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded font-medium"
                                            >
                                              Hủy
                                            </button>
                                            <button
                                              onClick={() => handleInlineReplySubmit(rv.danhGiaId!)}
                                              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50"
                                              disabled={!inlineReplyContent.trim() && inlineReplyMediaFiles.length === 0}
                                            >
                                              Gửi
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}

                              {/* Reply Input Box */}
                              {!editingReplyId && (
                                <div className="flex gap-3 items-start mt-4 pt-4 border-t border-gray-200">
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                    <Reply size={14} className="text-gray-500" />
                                  </div>
                                  <div className="flex-1">
                                    <textarea
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      placeholder="Viết bình luận của bạn..."
                                      className="w-full text-sm p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                      rows={2}
                                    />

                                    {/* Reply Media Previews */}
                                    <MediaGrid
                                      media={replyPreviewMedia}
                                      onRemove={(idx) => removeReplyMedia(idx)}
                                      size="sm"
                                    />

                                    <div className="flex items-center justify-between mt-2">
                                      <div className="flex items-center gap-3">
                                        <label className="cursor-pointer text-gray-500 hover:text-blue-600">
                                          <ImageIcon size={18} />
                                          <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleReplyFileChange} />
                                        </label>
                                        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                                          <input type="checkbox" checked={replyAnonymous} onChange={e => setReplyAnonymous(e.target.checked)} className="rounded text-blue-600 w-3 h-3" />
                                          Ẩn danh
                                        </label>
                                      </div>
                                      <button
                                        onClick={() => handleReplySubmit(rv.danhGiaId!)}
                                        className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-full hover:bg-blue-700 transition font-medium"
                                      >
                                        Gửi bình luận
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                            </div>
                          )
                          }
                        </div>
                      )
                    })
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
                                className={`${star <= userRating ? "text-yellow-400 fill-current" : "text-gray-300"} transition - colors`}
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Thêm hình ảnh / video</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <MediaGrid
                            media={previewMedia}
                            onRemove={(idx) => removeMedia(idx)}
                            size="lg"
                          />
                          <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition text-gray-400 hover:text-blue-500">
                            <ImageIcon size={24} />
                            <span className="text-xs mt-1">Thêm ảnh</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*,video/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isAnonymous"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="isAnonymous" className="text-sm text-gray-700 select-none cursor-pointer flex items-center gap-1">
                          <UserCheck size={16} /> Đánh giá ẩn danh
                        </label>
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
                  <p className="text-4xl font-black text-red-600">
                    {(tour.isTuChon ? Math.round(tour.tongGiaDuKien / (tour.soLuongCho || 1)) : tour.tongGiaDuKien).toLocaleString()}
                    <span className="text-sm text-gray-500 font-normal"> ₫/khách</span>
                  </p>
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
                      <UserCheck size={20} className="text-blue-500" />
                      <span>Số chỗ còn nhận</span>
                    </div>
                    {(() => {
                      // Find next available date's remaining seats
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      // For booking, we usually need at least 1 day in advance
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);

                      let nextRem = 0;
                      let nextDateStr = "";

                      if (tour.availability) {
                        const futureAvails = tour.availability
                          .filter(a => new Date(a.date).getTime() >= tomorrow.getTime() && a.remainingSeats > 0)
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                        if (futureAvails.length > 0) {
                          nextRem = futureAvails[0].remainingSeats;
                          nextDateStr = new Date(futureAvails[0].date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                        }
                      } else {
                        // Fallback if availability not loaded yet or legacy
                        nextRem = tour.soLuongCho ?? 0;
                      }

                      // Determine display
                      return (
                        <div className="text-right">
                          <span className="font-bold text-red-600 text-xl">{nextRem}</span>
                          {nextDateStr && !tour.isTuChon && <span className="text-xs text-gray-500 block">({nextDateStr})</span>}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-start justify-between group">
                    <div className="flex items-center gap-3 text-gray-600 shrink-0">
                      <Calendar size={20} className="text-blue-500" />
                      <span>Ngày đi</span>
                    </div>
                    <div className="text-right">
                      {tour.ngayKhoiHanh && Array.isArray(tour.ngayKhoiHanh) && tour.ngayKhoiHanh.length > 0 ? (
                        <div className="flex flex-col gap-1 items-end">
                          {(() => {
                            const futureDates = tour.ngayKhoiHanh
                              .map(d => new Date(d))
                              .filter(d => {
                                // Robust String Check
                                const dStr = d.toISOString().split('T')[0];
                                if (!isFutureDate(dStr)) { return false; }

                                // Availability check
                                if (tour.availability) {
                                  const dateStr = d.toISOString().split('T')[0];
                                  const avail = tour.availability.find(a => new Date(a.date).toISOString().split('T')[0] === dateStr);
                                  if (avail && avail.remainingSeats <= 0) { return false; }
                                }
                                return true;
                              })
                              .sort((a, b) => a.getTime() - b.getTime());

                            if (futureDates.length === 0) {
                              return <span className="text-gray-500 italic">Đã hết lịch sắp tới</span>;
                            }

                            // Group by Month/Year
                            const grouped = futureDates.reduce((acc, date) => {
                              const key = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                              if (!acc[key]) { acc[key] = []; }
                              acc[key].push(date.getDate().toString().padStart(2, '0'));
                              return acc;
                            }, {} as Record<string, string[]>);

                            return Object.entries(grouped).slice(0, 3).map(([monthYear, days], idx) => (
                              <div key={idx} className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded text-sm text-right">
                                <span className="text-blue-900">{days.join(', ')}</span>
                                <span className="text-gray-400 font-normal mx-1">/</span>
                                <span className="text-blue-600">{monthYear}</span>
                              </div>
                            ));
                          })()}
                          {
                            tour.ngayKhoiHanh.filter(d => new Date(d).getTime() >= new Date().setHours(0, 0, 0, 0)).length > 0 &&
                            Object.keys(tour.ngayKhoiHanh.reduce((acc, d) => {
                              const date = new Date(d);
                              if (date.getTime() < new Date().setHours(0, 0, 0, 0)) { return acc; }
                              const key = `${date.getMonth()}/${date.getFullYear()}`;
                              acc[key] = true;
                              return acc;
                            }, {} as Record<string, boolean>)).length > 3 &&
                            <span className="text-xs text-gray-500 italic">+ các tháng sau</span>
                          }
                        </div >
                      ) : (
                        <span className="text-gray-500 italic">Liên hệ</span>
                      )}
                    </div >
                  </div >

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Truck size={20} className="text-blue-500" />
                      <span>Phương tiện</span>
                    </div>
                    <span className="font-bold text-gray-900">{tour.phuongTien || "Xe du lịch"}</span>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Utensils size={20} className="text-blue-500" />
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

                  <button
                    onClick={() => navigate('/contact')}
                    className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition text-sm flex items-center justify-center gap-2 group"
                  >
                    <span>Liên Hệ Tư Vấn</span>
                    {(() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(0, 0, 0, 0);
                      let nextRem = 0;
                      if (tour.availability) {
                        const futureAvails = tour.availability
                          .filter(a => new Date(a.date).getTime() >= tomorrow.getTime() && a.remainingSeats > 0)
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        if (futureAvails.length > 0) { nextRem = futureAvails[0].remainingSeats; }
                      }

                      if (nextRem > 0 && nextRem <= 5) {
                        return <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full animate-pulse">Còn {nextRem} chỗ!</span>
                      }
                      return null;
                    })()}
                  </button>
                </div >
              </div >

              {/* Quick Nav */}
              < div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hidden lg:block" >
                <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Mục lục</h4>
                <div className="flex flex-col gap-2">
                  <a href="#section-itinerary" className="text-gray-600 hover:text-blue-600 text-sm py-1 border-l-2 border-transparent hover:border-blue-500 pl-3 transition-all">Lịch trình chi tiết</a>
                  <a href="#section-services" className="text-gray-600 hover:text-blue-600 text-sm py-1 border-l-2 border-transparent hover:border-blue-500 pl-3 transition-all">Dịch vụ bao gồm</a>
                  <a href="#section-notes" className="text-gray-600 hover:text-blue-600 text-sm py-1 border-l-2 border-transparent hover:border-blue-500 pl-3 transition-all">Lưu ý</a>
                </div>
              </div >

            </div >
          </div >

        </div >
      </div >
    </div >
  );
};

export default TourDetail;