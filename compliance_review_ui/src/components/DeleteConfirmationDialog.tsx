import React from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | React.ReactNode;
  isDeleting?: boolean;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isDeleting = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white rounded-lg w-full max-w-md flex flex-col shadow-lg animate-in slide-in-from-bottom-10 duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={isDeleting}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="py-2">
            {typeof description === 'string' ? <p>{description}</p> : description}
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
