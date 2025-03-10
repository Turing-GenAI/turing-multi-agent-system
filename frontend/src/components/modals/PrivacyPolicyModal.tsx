import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Handle click outside to close modal
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Privacy Policy</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="prose prose-blue max-w-none">
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-blue-800 mb-2">Clinical Trial Audit Assistant Privacy Policy</h3>
              <p className="text-blue-700 italic">Last Updated: March 6, 2025</p>
            </div>
            
            <div className="space-y-6">
              <section>
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">1. Introduction</h4>
                <p className="text-gray-700 leading-relaxed">
                  This Privacy Policy describes how we collect, use, and handle your information when you use our Clinical Trial Audit Assistant application. 
                  We are committed to protecting your privacy and ensuring the security of your data.
                </p>
              </section>
              
              <section>
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">2. Information We Collect</h4>
                <p className="text-gray-700 mb-2">We collect information that you provide directly to us, such as:</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Account information (name, email, organization)</li>
                  <li>Trial information and audit data</li>
                  <li>User queries and interactions with the system</li>
                  <li>System usage statistics and logs</li>
                </ul>
              </section>
              
              <section>
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">3. How We Use Your Information</h4>
                <p className="text-gray-700 mb-2">We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process and complete transactions</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Monitor and analyze trends and usage</li>
                  <li>Enhance the security and safety of our services</li>
                </ul>
              </section>
              
              <section>
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">4. Data Retention</h4>
                <p className="text-gray-700 leading-relaxed">
                  We retain your data for as long as your account is active or as needed to provide you services. 
                  We will retain and use your information as necessary to comply with legal obligations, 
                  resolve disputes, and enforce our agreements.
                </p>
              </section>
              
              <section>
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">5. Contact Us</h4>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at 
                  <a href="mailto:privacy@clinicaltrialaudit.com" className="text-blue-600 hover:underline ml-1">
                    privacy@clinicaltrialaudit.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
