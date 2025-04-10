import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  className = ''
}) => {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 ${className}`}>
      <FiAlertTriangle className="w-5 h-5 text-red-500" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}; 