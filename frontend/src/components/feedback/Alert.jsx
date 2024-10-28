import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Info 
} from 'lucide-react';

const Alert = ({ 
  type = 'info', 
  title, 
  message,
  onClose,
  autoClose = false,
  autoCloseTime = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);

  const variants = {
    info: {
      containerClass: 'bg-blue-50 border-blue-200',
      iconClass: 'text-blue-500',
      titleClass: 'text-blue-800',
      messageClass: 'text-blue-700',
      Icon: Info
    },
    success: {
      containerClass: 'bg-green-50 border-green-200',
      iconClass: 'text-green-500',
      titleClass: 'text-green-800',
      messageClass: 'text-green-700',
      Icon: CheckCircle2
    },
    warning: {
      containerClass: 'bg-yellow-50 border-yellow-200',
      iconClass: 'text-yellow-500',
      titleClass: 'text-yellow-800',
      messageClass: 'text-yellow-700',
      Icon: AlertCircle
    },
    error: {
      containerClass: 'bg-red-50 border-red-200',
      iconClass: 'text-red-500',
      titleClass: 'text-red-800',
      messageClass: 'text-red-700',
      Icon: XCircle
    }
  };

  const { 
    containerClass, 
    iconClass, 
    titleClass, 
    messageClass, 
    Icon 
  } = variants[type];

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => handleClose(), autoCloseTime);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, isVisible]);

  const handleClose = () => {
    setIsRemoving(true);
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300); // Match this with CSS transition duration
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        flex items-start p-4 mb-4 border rounded-lg 
        transition-all duration-300 ease-in-out
        ${containerClass}
        ${isRemoving ? 'opacity-0 transform translate-y-full' : 'opacity-100 transform translate-y-0'}
      `}
      role="alert"
    >
      <div className={`flex-shrink-0 ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="ml-3 w-full">
        <div className={`text-sm font-medium ${titleClass}`}>
          {title}
        </div>
        {message && (
          <div className={`mt-1 text-sm ${messageClass}`}>
            {message}
          </div>
        )}
      </div>
      {onClose && (
        <button
          onClick={handleClose}
          className={`
            ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 
            inline-flex items-center justify-center h-8 w-8 
            ${iconClass}
            hover:bg-opacity-20 hover:bg-gray-500 
            transition-colors duration-200
          `}
        >
          <span className="sr-only">Close</span>
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Alert;