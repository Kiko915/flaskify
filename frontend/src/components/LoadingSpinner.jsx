import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LoadingSpinner = ({ className, size = 'default' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-yellow-500',
        sizeClasses[size],
        className
      )}
    />
  );
};

export default LoadingSpinner; 