import React, { useState } from 'react';
import { PrivacyPolicyModal } from './modals/PrivacyPolicyModal';
import { TermsOfServiceModal } from './modals/TermsOfServiceModal';
import { ContactSupportModal } from './modals/ContactSupportModal';

export const Footer: React.FC = () => {
  const [isPrivacyPolicyModalOpen, setIsPrivacyPolicyModalOpen] = useState(false);
  const [isTermsOfServiceModalOpen, setIsTermsOfServiceModalOpen] = useState(false);
  const [isContactSupportModalOpen, setIsContactSupportModalOpen] = useState(false);

  return (
    <>
      <footer className="bg-white border-t border-gray-200 py-4 px-6">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>&copy; 2025 Audit Copilot</div>
          <div className="flex space-x-4">
            <a 
              href="#" 
              className="hover:text-gray-900"
              onClick={(e) => {
                e.preventDefault();
                setIsPrivacyPolicyModalOpen(true);
              }}
            >
              Privacy Policy
            </a>
            <a 
              href="#" 
              className="hover:text-gray-900"
              onClick={(e) => {
                e.preventDefault();
                setIsTermsOfServiceModalOpen(true);
              }}
            >
              Terms of Service
            </a>
            <a 
              href="#" 
              className="hover:text-gray-900"
              onClick={(e) => {
                e.preventDefault();
                setIsContactSupportModalOpen(true);
              }}
            >
              Contact Support
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyModalOpen}
        onClose={() => setIsPrivacyPolicyModalOpen(false)}
      />
      
      <TermsOfServiceModal
        isOpen={isTermsOfServiceModalOpen}
        onClose={() => setIsTermsOfServiceModalOpen(false)}
      />
      
      <ContactSupportModal
        isOpen={isContactSupportModalOpen}
        onClose={() => setIsContactSupportModalOpen(false)}
      />
    </>
  );
};
