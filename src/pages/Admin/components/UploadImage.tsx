
import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Loader } from 'lucide-react';

interface UploadImageProps {
    onUpload: (url: string) => void;
    currentImage?: string;
    label?: string;
    className?: string;
}

const UploadImage = ({ onUpload, currentImage, label = "Ảnh bìa", className = "" }: UploadImageProps) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string>(currentImage || '');

    useEffect(() => {
        setPreview(currentImage || '');
    }, [currentImage]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {return;}

        // Basic validation
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh (JPG, PNG, GIF...)');
            return;
        }

        // 5MB limit check (optional but recommended)
        if (file.size > 5 * 1024 * 1024) {
            alert('File ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default'); // User provided: ml_default
        formData.append('cloud_name', 'dlsjil2yo');    // User provided: dlsjil2yo

        try {
            const res = await fetch('https://api.cloudinary.com/v1_1/dlsjil2yo/image/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (data.secure_url) {
                setPreview(data.secure_url);
                onUpload(data.secure_url);
            } else {
                console.error("Cloudinary upload failed", data);
                alert("Upload thất bại: " + (data.error?.message || "Lỗi không xác định"));
            }
        } catch (error) {
            console.error("Upload Error:", error);
            alert("Lỗi khi upload ảnh. Vui lòng thử lại.");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview('');
        onUpload('');
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors text-center">
                {preview ? (
                    <div className="relative inline-block w-full max-w-[200px]">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-auto rounded-lg shadow-sm object-cover max-h-[200px]"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                            title="Xóa ảnh"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                        {uploading ? (
                            <div className="animate-spin text-blue-500 mb-2">
                                <Loader size={24} />
                            </div>
                        ) : (
                            <ImageIcon size={32} className="mb-2" />
                        )}
                        <span className="text-sm">
                            {uploading ? "Đang tải lên..." : "Click để chọn ảnh"}
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploading}
                        />
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-400">
                Hỗ trợ: JPG, PNG, WebP, GIF.
            </p>
        </div>
    );
};

export default UploadImage;
