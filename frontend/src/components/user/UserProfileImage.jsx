import { useState, useEffect } from "react";
import { useAuth } from "../../utils/AuthContext";

const getInitials = (firstName, lastName) => {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
  return `${firstInitial}${lastInitial}`;
};

const getRandomColor = (name) => {
  if (!name) return "#9E9E9E"; // Default color for empty names
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    "#4285F4", // Blue
    "#DB4437", // Red
    "#F4B400", // Yellow
    "#0F9D58", // Green
    "#AB47BC", // Purple
    "#00ACC1", // Cyan
    "#FF7043", // Deep Orange
    "#9E9E9E", // Grey
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

export default function UserProfileImage({ size = "md" }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Reset states when profile image URL changes
  useEffect(() => {
    setLoading(true);
    setImageError(false);
  }, [user?.profile_image_url]);
  
  useEffect(() => {
    if (!user?.profile_image_url) {
      setLoading(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setImageError(false);
      setLoading(false);
    };
    img.onerror = () => {
      setImageError(true);
      setLoading(false);
    };
    img.src = user.profile_image_url;

    // Cleanup function to handle component unmounting
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [user?.profile_image_url]);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-xl",
    xl: "w-24 h-24 text-3xl",
    xxl: "w-32 h-32 text-4xl"
  };

  if (loading) {
    return (
      <div 
        className={`animate-pulse bg-gray-200 rounded-full ${sizeClasses[size]}`}
        aria-label="Loading profile image"
      />
    );
  }

  if (!user?.profile_image_url || imageError) {
    const initials = getInitials(user?.first_name, user?.last_name);
    const backgroundColor = getRandomColor(user?.first_name + user?.last_name);

    return (
      <div 
        className={`rounded-full flex items-center justify-center font-medium text-white ${sizeClasses[size]}`}
        style={{ backgroundColor }}
        aria-label={`${user?.first_name || ''} ${user?.last_name || ''} initials`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={user.profile_image_url}
      alt={`${user?.first_name || ''} ${user?.last_name || ''}`}
      className={`rounded-full object-cover ${sizeClasses[size]}`}
      onError={() => setImageError(true)}
    />
  );
}