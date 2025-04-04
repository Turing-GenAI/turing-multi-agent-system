import React, { createContext, useContext, useState } from 'react';

// Toast Types
export type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
};

export type ToastActionElement = React.ReactElement;

export const ToastContext = createContext<{
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, 'id'>) => void;
  removeToast: (id: string) => void;
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { toasts, addToast, removeToast } = context;

  return {
    toasts,
    toast: (props: Omit<ToastProps, 'id'>) => {
      addToast({ ...props });
    },
    dismiss: (id: string) => {
      removeToast(id);
    },
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, ...toast }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex w-80 items-start gap-4 rounded-md border p-4 shadow-md ${
                toast.variant === 'destructive' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="grid gap-1">
                {toast.title && (
                  <div className="text-sm font-semibold">
                    {toast.title}
                  </div>
                )}
                {toast.description && (
                  <div className="text-sm text-gray-500">
                    {toast.description}
                  </div>
                )}
              </div>
              <button
                className="ml-auto text-gray-500 hover:text-gray-900"
                onClick={() => removeToast(toast.id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
