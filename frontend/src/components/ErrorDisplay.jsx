import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ErrorDisplay = ({ 
  message = 'Something went wrong', 
  action,
  className 
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-6 text-center',
      className
    )}>
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Oops!
      </h3>
      <p className="text-gray-600 mb-6">
        {message}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay; 