import { useState, useEffect } from 'react';
import UserCard from '../components/user/UserCard';
import UserProfileImage from '../components/user/UserProfileImage';
import { useAuth } from '../utils/AuthContext';
import { Camera, Mail, Phone, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, loading, fetchUser } = useAuth();
  const [profileImage, setProfileImage] = useState(user?.profile_image_url || null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gender: user?.gender || "",
    date_of_birth: user?.date_of_birth || "",
    profileImage: user?.profile_image_url || "",
  });

  // Reset form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "",
        date_of_birth: user.date_of_birth || "",
        profileImage: user.profile_image_url || "",
      });
      setProfileImage(user.profile_image_url || null);
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>No user data found. Please login to access your profile.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key !== 'profileImage') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      if (formData.profileImage instanceof File) {
        formDataToSend.append('profileImage', formData.profileImage);
      }
  
      const response = await fetch('http://localhost:5555/profile', {
        method: 'PUT',
        credentials: 'include',
        body: formDataToSend,
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        toast.error(result.error || 'An error occurred while updating the profile.');
      } else {
        // After successful update, fetch the latest user data
        await fetchUser();
        toast.success(result.message || 'Profile updated successfully.');
        
        // Update local profile image state if there's a new URL
        if (result.url) {
          setProfileImage(result.url);
          setFormData(prev => ({
            ...prev,
            profileImage: result.url
          }));
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      setProfileImage(URL.createObjectURL(file));
      setFormData(prev => ({
        ...prev,
        profileImage: file,
      }));
      toast.success('Image uploaded successfully');
      toast('Save changes to update profile.');
    } else {
      toast.error('Please select an image under 5MB');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const ContactField = ({ 
    label, 
    icon: Icon, 
    isEditing, 
    setIsEditing, 
    name 
  }) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1 flex items-center gap-4">
          {isEditing ? (
            <div className="flex-1">
              <div className="relative">
                <input
                  type={name === 'email' ? 'email' : 'text'}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={`Enter your ${label.toLowerCase()}`}
                />    
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{formData[name]}</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-sm font-medium text-red-500 hover:text-red-600"
              >
                Change
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <UserCard title="My Profile" short_description="Manage your account details.">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Header Section */}
        <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-lg">
          <div className="relative group">
            {profileImage ? (
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center ring-4 ring-white shadow-lg">
                <UserProfileImage size='xl' />
              </div>
            )}
            <button
              type="button"
              onClick={() => document.getElementById('image-upload').click()}
              className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Camera className="w-5 h-5 text-gray-600" />
            </button>
            <input
              id="image-upload"
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{user.username}</h3>
            <p className="text-sm text-gray-500 mt-1">Member since {formatDate(user.date_joined)}</p>
            <div className="text-xs text-gray-500 mt-4">
              <p>Supported formats: .JPEG, .PNG</p>
              <p>Maximum file size: 5 MB</p>
            </div>
          </div>
        </div>

        {/* Main Form Section */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900">Personal Information</h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fname" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="fname"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="lname" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lname"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <div className="mt-2 flex gap-6">
                  {['Male', 'Female', 'Other'].map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value={option.toLowerCase()}
                        checked={formData.gender === option.toLowerCase()}
                        onChange={handleChange}
                        className="w-4 h-4 text-red-500 focus:ring-red-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth || ""}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900">Contact Information</h4>
            
            <div className="space-y-4">
              <ContactField 
                label="Email Address"
                icon={Mail}
                isEditing={isEditingEmail}
                setIsEditing={setIsEditingEmail}
                name="email"
              />

              <ContactField 
                label="Phone Number"
                icon={Phone}
                isEditing={isEditingPhone}
                setIsEditing={setIsEditingPhone}
                name="phone"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 text-white bg-yellow-500 rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </UserCard>
  );
};

export default Profile;
