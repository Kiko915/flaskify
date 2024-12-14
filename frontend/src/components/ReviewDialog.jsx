import React, { useState } from 'react';
import { Star, X, Upload, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ReviewDialog({ product, onClose, onReviewSubmitted, maxImages = 5 }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Check if adding new files would exceed the limit
    if (images.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    // Validate each file
    const validFiles = files.filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }

      return true;
    });

    // Create preview URLs for valid files
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    
    setImages(prev => [...prev, ...validFiles]);
    setPreviewImages(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index) => {
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(previewImages[index]);
    
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('comment', comment);
      images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch(`http://localhost:5555/api/products/${product.product_uuid}/reviews`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      toast.success(data.message || 'Review submitted successfully');
      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Write a Review</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Rating Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="focus:outline-none"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      value <= rating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full h-32 p-2 border rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Share your experience with this product..."
              required
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Add Photos ({images.length}/{maxImages})
            </label>
            
            {/* Image Preview Grid */}
            {previewImages.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mb-4">
                {previewImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {images.length < maxImages && (
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">Click to upload images</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={images.length >= maxImages}
                  />
                </label>
              </div>
            )}
            <p className="text-sm text-gray-500">
              You can upload up to {maxImages} images (max 5MB each)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                "px-4 py-2 bg-yellow-500 text-white rounded-md",
                isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-600"
              )}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 