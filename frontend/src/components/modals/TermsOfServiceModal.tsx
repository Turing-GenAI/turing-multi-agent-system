import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Terms of Service</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="prose prose-blue max-w-none">
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-blue-800 mb-2">Clinical Trial Audit Assistant Terms of Service</h3>
              <p className="text-blue-700 italic">Last Updated: March 6, 2025</p>
            </div>
            
            <div className="space-y-6">
              <section>
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">1. Acceptance of Terms</h4>
                <p className="text-gray-700 leading-relaxed">
                  By accessing or using the Clinical Trial Audit Assistant, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our service.
                </p>
              </section>
              
              <section>
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">2. Description of Service</h4>
                <p className="text-gray-700 leading-relaxed">
                  The Clinical Trial Audit Assistant provides AI-powered tools to assist with clinical trial auditing, 
                  compliance review, and data analysis. The service is provided "as is" and may be updated or modified at any time.
                </p>
              </section>
              
              <section>
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">3. User Accounts</h4>
                <p className="text-gray-700 leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities 
                  that occur under your account. You must notify us immediately of any unauthorized use of your account.
                </p>
              </section>
              
              <section>
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">4. Data Usage and Privacy</h4>
                <p className="text-gray-700 leading-relaxed">
                  Your use of the service is also governed by our Privacy Policy. By using the Clinical Trial Audit Assistant, 
                  you consent to the collection and use of information as detailed in our Privacy Policy.
                </p>
              </section>
              
              <section>
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">5. Intellectual Property</h4>
                <p className="text-gray-700 leading-relaxed">
                  All content, features, and functionality of the Clinical Trial Audit Assistant, including but not limited to text, 
                  graphics, logos, and software, are owned by us or our licensors and are protected by copyright, trademark, 
                  and other intellectual property laws.
                </p>
              </section>
              
              <section>
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">6. Limitation of Liability</h4>
                <p className="text-gray-700 leading-relaxed">
                  To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, 
                  consequential, or punitive damages resulting from your use of or inability to use the service.
                </p>
              </section>
              
              <section>
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">7. Changes to Terms</h4>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these Terms of Service at any time. We will provide notice of significant changes 
                  by posting the new Terms on the service. Your continued use of the service after such changes constitutes 
                  your acceptance of the new Terms.
                </p>
              </section>
              
              <section>
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">8. Contact</h4>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms, please contact us at 
                  <a href="mailto:legal@clinicaltrialaudit.com" className="text-blue-600 hover:underline ml-1">
                    legal@clinicaltrialaudit.com
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
