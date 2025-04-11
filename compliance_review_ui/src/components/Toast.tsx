import React, { useEffect, useState } from 'react';
import { FiX, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  onClose, 
  duration = 3000 
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Start exit animation
      setIsExiting(true);
      
      // Allow animation to complete before removing
      setTimeout(() => {
        onClose();
      }, 300); // Match slideOut animation duration
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-500 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-500 text-red-800';
      case 'warning':
        return 'bg-amber-50 border-amber-500 text-amber-800';
      case 'info':
        return 'bg-blue-50 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <FiAlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <FiAlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <FiInfo className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`fixed top-4 right-4 z-50 min-w-[300px] max-w-md flex items-start p-4 mb-4 border-l-4 rounded shadow-lg ${
        isExiting ? 'animate-slide-out' : 'animate-slide-in'
      } ${getTypeStyles()}`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button 
        onClick={handleClose}
        className="ml-3 text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-label="Close"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: ToastType;
  }>;
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-4">
      {toasts.map((toast, index) => (
        <div 
          key={toast.id} 
          style={{ top: `${(index * 4) + 1}rem` }}
          className="relative"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onClose(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}; 