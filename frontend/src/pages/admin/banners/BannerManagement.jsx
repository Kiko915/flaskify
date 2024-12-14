import React, { useState, useEffect, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:5555';

export default function BannerManagement() {
  const [banners, setBanners] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_active: true,
    button_text: 'Shop Now',
    button_link: '',
    secondary_button_text: 'Learn More',
    secondary_button_link: '',
    overlay_opacity: 50,
    title_color: '#FFFFFF',
    description_color: '#E5E7EB',
    button_style: 'primary',
    show_secondary_button: true,
    show_special_offer: true,
    special_offer_text: 'Special Offer'
  });

  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    height: 50,
    x: 5,
    y: 5,
    aspect: 16 / 9
  });

  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const inputRef = useRef(null);

  const aspect = 16 / 9;

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
  }, [completedCrop]);

  const fetchBanners = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/banners`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBanners(data);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to fetch banners');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const cropWidth = (90 * width) / 100;
    const cropHeight = (cropWidth * 9) / 16;
    
    setCrop({
      unit: 'px',
      width: cropWidth,
      height: cropHeight,
      x: (width - cropWidth) / 2,
      y: (height - cropHeight) / 2,
      aspect: 16 / 9
    });
  };

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(file);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedImage && !selectedBanner) {
      toast.error('Please select an image');
      return;
    }

    const formDataToSend = new FormData();
    // Convert boolean to '1' or '0' for is_active
    Object.keys(formData).forEach(key => {
      if (key === 'is_active') {
        formDataToSend.append(key, formData[key] ? '1' : '0');
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    if (selectedImage) {
      formDataToSend.append('image', selectedImage);
    }

    try {
      const url = selectedBanner 
        ? `${API_URL}/admin/banners/${selectedBanner.id}`
        : `${API_URL}/admin/banners`;

      const response = await fetch(url, {
        method: selectedBanner ? 'PUT' : 'POST',
        credentials: 'include',
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success(selectedBanner ? 'Banner updated successfully' : 'Banner created successfully');
      setIsModalOpen(false);
      resetForm();
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Failed to save banner');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        const response = await fetch(`${API_URL}/admin/banners/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        toast.success('Banner deleted successfully');
        fetchBanners();
      } catch (error) {
        console.error('Error deleting banner:', error);
        toast.error('Failed to delete banner');
      }
    }
  };

  const handleEdit = (banner) => {
    setSelectedBanner(banner);
    setFormData({
      ...formData,
      title: banner.title,
      description: banner.description,
      is_active: banner.is_active === 1 || banner.is_active === true,  // Handle both number and boolean
      button_text: banner.button_text || 'Shop Now',
      button_link: banner.button_link || '',
      secondary_button_text: banner.secondary_button_text || 'Learn More',
      secondary_button_link: banner.secondary_button_link || '',
      overlay_opacity: banner.overlay_opacity || 50,
      title_color: banner.title_color || '#FFFFFF',
      description_color: banner.description_color || '#E5E7EB',
      button_style: banner.button_style || 'primary',
      show_secondary_button: banner.show_secondary_button ?? true,
      show_special_offer: banner.show_special_offer ?? true,
      special_offer_text: banner.special_offer_text || 'Special Offer'
    });
    setImagePreview(banner.image_url);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      is_active: true,
      button_text: 'Shop Now',
      button_link: '',
      secondary_button_text: 'Learn More',
      secondary_button_link: '',
      overlay_opacity: 50,
      title_color: '#FFFFFF',
      description_color: '#E5E7EB',
      button_style: 'primary',
      show_secondary_button: true,
      show_special_offer: true,
      special_offer_text: 'Special Offer'
    });
    setSelectedBanner(null);
    setCrop({
      unit: '%',
      width: 90,
      height: 50,
      x: 5,
      y: 5,
      aspect: 16 / 9
    });
    setCompletedCrop(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mr-32">Banner Management</h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-400"
        >
          Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{banner.title}</h3>
              <p className="text-gray-600 mb-4">{banner.description}</p>
              <div className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded-full text-sm ${
                  banner.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {banner.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="p-2 text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-4xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
          <div className="relative">
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <DialogTitle className="text-xl font-semibold text-gray-800">
                {selectedBanner ? 'Edit Banner' : 'Create New Banner'}
              </DialogTitle>
              
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Button Settings</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Button Text
                        </label>
                        <input
                          type="text"
                          name="button_text"
                          value={formData.button_text}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Button Link
                        </label>
                        <input
                          type="text"
                          name="button_link"
                          value={formData.button_link}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                        />
                      </div>

                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="show_secondary_button"
                            checked={formData.show_secondary_button}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Show Secondary Button</span>
                        </label>
                      </div>

                      {formData.show_secondary_button && (
                        <div className="space-y-4 pl-6 border-l-2 border-yellow-200">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Secondary Button Text
                            </label>
                            <input
                              type="text"
                              name="secondary_button_text"
                              value={formData.secondary_button_text}
                              onChange={handleInputChange}
                              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Secondary Button Link
                            </label>
                            <input
                              type="text"
                              name="secondary_button_link"
                              value={formData.secondary_button_link}
                              onChange={handleInputChange}
                              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Style Settings</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Button Style
                        </label>
                        <select
                          name="button_style"
                          value={formData.button_style}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                        >
                          <option value="primary">Primary (Yellow)</option>
                          <option value="outline">Outline</option>
                          <option value="minimal">Minimal</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Overlay Opacity (%)
                        </label>
                        <input
                          type="range"
                          name="overlay_opacity"
                          value={formData.overlay_opacity}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          className="w-full accent-yellow-500"
                        />
                        <div className="text-sm text-gray-500 mt-1">
                          {formData.overlay_opacity}%
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title Color
                          </label>
                          <input
                            type="color"
                            name="title_color"
                            value={formData.title_color}
                            onChange={handleInputChange}
                            className="w-full h-10 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description Color
                          </label>
                          <input
                            type="color"
                            name="description_color"
                            value={formData.description_color}
                            onChange={handleInputChange}
                            className="w-full h-10 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Special Offer</h3>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="show_special_offer"
                            checked={formData.show_special_offer}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Show Special Offer Tag</span>
                        </label>
                      </div>

                      {formData.show_special_offer && (
                        <div className="pl-6 border-l-2 border-yellow-200">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Special Offer Text
                          </label>
                          <input
                            type="text"
                            name="special_offer_text"
                            value={formData.special_offer_text}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Image Upload */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Banner Image</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Recommended size: 1920x1080 pixels (16:9 ratio). Maximum size: 5MB.
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        ref={inputRef}
                        className="w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-yellow-50 file:text-yellow-700
                          hover:file:bg-yellow-100
                          cursor-pointer"
                        required={!selectedBanner}
                      />
                    </div>

                    {imagePreview && (
                      <div className="space-y-4">
                        {/* Hero Section Preview */}
                        <div className="border-2 border-gray-100 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hero Section Preview
                          </label>
                          <div className="relative rounded-lg overflow-hidden" style={{ height: '300px' }}>
                            {/* Background Image */}
                            <img
                              src={imagePreview}
                              alt="Banner preview"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            
                            {/* Overlay */}
                            <div 
                              className="absolute inset-0 bg-black" 
                              style={{ opacity: formData.overlay_opacity / 100 }}
                            />

                            {/* Content */}
                            <div className="relative h-full flex flex-col justify-center px-8">
                              <div className="max-w-2xl">
                                <h1 
                                  className="text-4xl font-bold mb-4"
                                  style={{ color: formData.title_color }}
                                >
                                  {formData.title || 'Banner Title'}
                                </h1>
                                
                                <p 
                                  className="text-lg mb-6"
                                  style={{ color: formData.description_color }}
                                >
                                  {formData.description || 'Banner Description'}
                                </p>

                                <div className="flex gap-4">
                                  <button
                                    className={`px-6 py-2 rounded-lg font-medium ${
                                      formData.button_style === 'primary'
                                        ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                                        : formData.button_style === 'outline'
                                        ? 'border-2 border-white text-white hover:bg-white/10'
                                        : 'text-white hover:bg-white/10'
                                    }`}
                                  >
                                    {formData.button_text}
                                  </button>

                                  {formData.show_secondary_button && (
                                    <button
                                      className="px-6 py-2 rounded-lg font-medium border-2 border-white text-white hover:bg-white/10"
                                    >
                                      {formData.secondary_button_text}
                                    </button>
                                  )}
                                </div>

                                {formData.show_special_offer && (
                                  <div className="absolute top-6 left-8">
                                    <span className="bg-yellow-500 text-black px-4 py-1 rounded-full font-medium text-sm">
                                      {formData.special_offer_text}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            This is how your banner will look in the Hero Section
                          </p>
                        </div>

                        {/* Full Image Preview (16:9) */}
                        <div className="border-2 border-gray-100 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Image Preview (1920x1080)
                          </label>
                          <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
                            <img
                              src={imagePreview}
                              alt="Banner preview"
                              className="absolute top-0 left-0 w-full h-full object-cover bg-gray-50"
                            />
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            Make sure your image fills this area properly for the best display
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 -mx-6 px-6 py-4 flex justify-end space-x-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 font-medium"
                  >
                    {selectedBanner ? 'Update Banner' : 'Create Banner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 